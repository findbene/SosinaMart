-- Health Score columns for customers table
-- Part of Phase 3: Customer Health Scoring & Segmentation
-- Idempotent: safe to re-run

-- Add health score columns to customers table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'health_score') THEN
        ALTER TABLE customers ADD COLUMN health_score INTEGER DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'health_label') THEN
        ALTER TABLE customers ADD COLUMN health_label VARCHAR(20) DEFAULT 'Promising';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'churn_risk') THEN
        ALTER TABLE customers ADD COLUMN churn_risk DECIMAL(3,2) DEFAULT 0.50;
    END IF;
END $$;

-- Add index for filtering/sorting by health score
CREATE INDEX IF NOT EXISTS idx_customers_health_score ON customers(health_score DESC);
CREATE INDEX IF NOT EXISTS idx_customers_health_label ON customers(health_label);

-- Function to calculate RFM-based health score
CREATE OR REPLACE FUNCTION calculate_customer_health_score(p_customer_id UUID)
RETURNS TABLE(score INTEGER, label VARCHAR, churn DECIMAL) AS $$
DECLARE
    v_total_orders INTEGER;
    v_total_spent DECIMAL;
    v_days_since_last_order INTEGER;
    v_months_as_customer DECIMAL;
    v_recency INTEGER;
    v_frequency INTEGER;
    v_monetary INTEGER;
    v_score INTEGER;
    v_label VARCHAR(20);
    v_churn DECIMAL(3,2);
    v_avg_gap_days DECIMAL;
    v_gap_ratio DECIMAL;
    v_orders_per_month DECIMAL;
BEGIN
    -- Get customer stats
    SELECT
        c.total_orders,
        c.total_spent,
        CASE WHEN c.last_order_at IS NOT NULL
             THEN EXTRACT(DAY FROM NOW() - c.last_order_at)::INTEGER
             ELSE NULL END,
        GREATEST(0.5, EXTRACT(EPOCH FROM NOW() - c.customer_since) / (60*60*24*30))
    INTO v_total_orders, v_total_spent, v_days_since_last_order, v_months_as_customer
    FROM customers c
    WHERE c.id = p_customer_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Recency score (0-33)
    IF v_days_since_last_order IS NULL THEN v_recency := 0;
    ELSIF v_days_since_last_order <= 7 THEN v_recency := 33;
    ELSIF v_days_since_last_order <= 14 THEN v_recency := 28;
    ELSIF v_days_since_last_order <= 30 THEN v_recency := 25;
    ELSIF v_days_since_last_order <= 60 THEN v_recency := 15;
    ELSIF v_days_since_last_order <= 90 THEN v_recency := 8;
    ELSE v_recency := 0;
    END IF;

    -- Frequency score (0-33)
    IF v_months_as_customer <= 0 OR v_total_orders = 0 THEN
        v_frequency := 0;
    ELSE
        v_orders_per_month := v_total_orders / v_months_as_customer;
        -- Average benchmark: 1.5 orders/month
        IF v_orders_per_month / 1.5 >= 2.0 THEN v_frequency := 33;
        ELSIF v_orders_per_month / 1.5 >= 1.5 THEN v_frequency := 28;
        ELSIF v_orders_per_month / 1.5 >= 1.0 THEN v_frequency := 22;
        ELSIF v_orders_per_month / 1.5 >= 0.5 THEN v_frequency := 15;
        ELSIF v_orders_per_month / 1.5 >= 0.25 THEN v_frequency := 8;
        ELSE v_frequency := 3;
        END IF;
    END IF;

    -- Monetary score (0-34)
    -- Average benchmark: $300 total spend
    IF v_total_spent / 300 >= 3.0 THEN v_monetary := 34;
    ELSIF v_total_spent / 300 >= 2.0 THEN v_monetary := 28;
    ELSIF v_total_spent / 300 >= 1.5 THEN v_monetary := 22;
    ELSIF v_total_spent / 300 >= 1.0 THEN v_monetary := 17;
    ELSIF v_total_spent / 300 >= 0.5 THEN v_monetary := 10;
    ELSIF v_total_spent > 0 THEN v_monetary := 5;
    ELSE v_monetary := 0;
    END IF;

    -- Total score
    v_score := LEAST(100, v_recency + v_frequency + v_monetary);

    -- Label
    IF v_score >= 80 THEN v_label := 'Champion';
    ELSIF v_score >= 60 THEN v_label := 'Loyal';
    ELSIF v_score >= 40 THEN v_label := 'Promising';
    ELSIF v_score >= 20 THEN v_label := 'At Risk';
    ELSE v_label := 'Lost';
    END IF;

    -- Churn risk
    IF v_total_orders = 0 OR v_days_since_last_order IS NULL THEN
        v_churn := 0.90;
    ELSE
        v_avg_gap_days := CASE WHEN v_months_as_customer > 0
            THEN (v_months_as_customer * 30) / v_total_orders
            ELSE 30 END;
        v_gap_ratio := v_days_since_last_order / GREATEST(1, v_avg_gap_days);

        IF v_gap_ratio <= 1.0 THEN v_churn := 0.05;
        ELSIF v_gap_ratio <= 1.5 THEN v_churn := 0.15;
        ELSIF v_gap_ratio <= 2.0 THEN v_churn := 0.35;
        ELSIF v_gap_ratio <= 3.0 THEN v_churn := 0.55;
        ELSIF v_gap_ratio <= 5.0 THEN v_churn := 0.75;
        ELSE v_churn := 0.90;
        END IF;
    END IF;

    score := v_score;
    label := v_label;
    churn := v_churn;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh all customer health scores
CREATE OR REPLACE FUNCTION refresh_all_health_scores()
RETURNS void AS $$
DECLARE
    cust RECORD;
    result RECORD;
BEGIN
    FOR cust IN SELECT id FROM customers LOOP
        SELECT * INTO result FROM calculate_customer_health_score(cust.id);
        IF result IS NOT NULL THEN
            UPDATE customers
            SET health_score = result.score,
                health_label = result.label,
                churn_risk = result.churn
            WHERE id = cust.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function: recalculate health score when order status changes
CREATE OR REPLACE FUNCTION trigger_update_customer_health()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id UUID;
    result RECORD;
BEGIN
    v_customer_id := COALESCE(NEW.customer_id, OLD.customer_id);
    IF v_customer_id IS NOT NULL THEN
        SELECT * INTO result FROM calculate_customer_health_score(v_customer_id);
        IF result IS NOT NULL THEN
            UPDATE customers
            SET health_score = result.score,
                health_label = result.label,
                churn_risk = result.churn
            WHERE id = v_customer_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trg_update_health_on_order ON orders;
CREATE TRIGGER trg_update_health_on_order
    AFTER INSERT OR UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_customer_health();

-- Initial population: calculate scores for all existing customers
SELECT refresh_all_health_scores();
