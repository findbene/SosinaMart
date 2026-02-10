import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  image?: string;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutRequest = await request.json();
    const { items, customerInfo } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      // Fallback: save order to database without payment
      await db.createOrder({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        items: JSON.stringify(items),
        total,
        notes: customerInfo.notes,
      });

      return NextResponse.json({ fallback: true });
    }

    // Dynamic import to avoid errors when stripe is not needed
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeSecretKey);

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
          ...(item.image ? { images: [`${origin}${item.image}`] } : {}),
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: origin,
      customer_email: customerInfo.email,
      metadata: {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_address: customerInfo.address,
        customer_notes: customerInfo.notes || "",
      },
    });

    // Save order to database
    await db.createOrder({
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      items: JSON.stringify(items),
      total,
      notes: customerInfo.notes,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
