# Sosina Mart - Project Documentation

## Overview

Sosina Mart is a Next.js 14 e-commerce application for an Ethiopian store selling traditional clothes, food items, coffee, and cultural products. The application includes a full admin dashboard, CRM system, AI-powered customer support, and authentication.

**Live URL:** https://sosina-mart.vercel.app

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Radix UI, Lucide Icons |
| Authentication | NextAuth.js (Credentials Provider) |
| Database | Supabase (PostgreSQL) |
| Validation | Zod |
| Testing | Jest, React Testing Library, Playwright |
| Deployment | Vercel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages (login, register, forgot-password)
│   ├── account/             # Customer account pages
│   ├── admin/               # Admin dashboard pages
│   │   ├── analytics/       # Sales analytics
│   │   ├── customers/       # CRM - customer management
│   │   ├── orders/          # Order management
│   │   ├── products/        # Product management
│   │   └── settings/        # Store settings
│   ├── api/                 # API routes
│   │   ├── ai/              # AI chat & recommendations
│   │   ├── auth/            # Auth endpoints
│   │   ├── customers/       # Customer CRUD
│   │   ├── orders/          # Order CRUD
│   │   └── products/        # Product CRUD
│   ├── layout.tsx           # Root layout with providers
│   └── providers.tsx        # Context providers wrapper
├── components/
│   ├── ai/                  # AI chat widget components
│   ├── checkout/            # Checkout modal
│   ├── products/            # Product cards, grid
│   └── ui/                  # Reusable UI components
├── context/
│   ├── AuthContext.tsx      # Authentication state
│   ├── CartContext.tsx      # Shopping cart state
│   ├── ChatContext.tsx      # AI chat state
│   └── ToastContext.tsx     # Toast notifications
├── lib/
│   ├── ai.ts                # AI service integration
│   ├── api-error.ts         # API error handling
│   ├── api-utils.ts         # API utilities & middleware
│   ├── auth.ts              # NextAuth configuration
│   ├── data.ts              # Product data
│   ├── email.ts             # Email service
│   ├── supabase.ts          # Supabase client
│   ├── utils.ts             # Utility functions
│   └── validations.ts       # Zod schemas
├── middleware.ts            # Route protection
└── types/                   # TypeScript types
```

## Key Features

### 1. E-Commerce Store
- Product catalog with categories (food, kitchenware, artifacts, clothes)
- Shopping cart with persistent state
- Checkout flow with form validation
- Order confirmation

### 2. Admin Dashboard (`/admin`)
- **Dashboard:** Overview stats, recent orders, quick actions
- **Orders:** List, filter, search, status updates, order details
- **Customers:** CRM with customer profiles, order history, interactions
- **Products:** Product management with category filtering
- **Analytics:** Revenue charts, order breakdown, top products
- **Settings:** Store configuration, notifications, security

### 3. Customer Account (`/account`)
- Order history
- Order details with status timeline
- Account settings

### 4. Authentication
- Login/Register with email & password
- Password reset flow
- Protected routes via middleware
- Role-based access (customer/admin)

### 5. AI Chat Widget
- Floating chat button (bottom-right)
- Product recommendations
- Customer support assistance
- Context-aware responses

## Environment Variables

Required for full functionality:

```env
# NextAuth
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://sosina-mart.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>

# AI (optional - for chat features)
OPENAI_API_KEY=<openai-api-key>
```

## Database Schema

Located in `supabase/migrations/001_initial_schema.sql`:

- `customers` - Customer profiles
- `orders` - Order records
- `order_items` - Order line items
- `order_status_history` - Status change log
- `customer_interactions` - CRM interaction log
- `customer_segments` - Customer segmentation

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/orders` | List/create orders |
| GET/PATCH/DELETE | `/api/orders/[id]` | Order details |
| PATCH | `/api/orders/[id]/status` | Update order status |
| GET/POST | `/api/customers` | List/create customers |
| GET/PATCH | `/api/customers/[id]` | Customer details |
| POST | `/api/customers/[id]/interactions` | Log interaction |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/search` | Search products |
| POST | `/api/ai/chat` | AI chat endpoint |
| POST | `/api/ai/recommendations` | Product recommendations |

## Testing

```bash
# Run unit & integration tests
npm test

# Run with coverage
npm test -- --coverage

# Run E2E tests (Playwright)
npx playwright test
```

**Test Coverage:**
- 199 tests passing
- Unit tests: utils, validations, api-utils
- Component tests: Button, Badge, Card, Skeleton, Tabs, ProductCard
- Integration tests: Cart operations, Checkout flow
- API tests: Products, Orders

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Deployment

The app auto-deploys to Vercel on push to `main` branch.

1. Push changes to GitHub
2. Vercel automatically builds and deploys
3. Configure environment variables in Vercel dashboard

## Notes for Claude

- **Product data** is in `src/lib/data.ts` - static array, not in database
- **Without Supabase**, the app runs in "mock mode" with limited functionality
- **Admin routes** require `role: 'admin'` in session
- **Toast notifications** use custom context, not external library
- **AI chat** gracefully degrades without API key configured
