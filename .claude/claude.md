# Sosina Mart - Project Documentation

## Overview

Sosina Mart is a Next.js 14 e-commerce application for an Ethiopian store selling traditional clothes, food items, coffee, and cultural products. The application includes a full admin dashboard, CRM system, AI-powered customer support (Kidist - the shopping assistant with voice chat), and authentication.

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
| AI | Google Gemini 2.0 Flash + Gemini Live API (Voice) |
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
│   │   ├── ChatWidget.tsx   # Main chat UI with Kidist persona + voice
│   │   └── LanguageSelector.tsx # Multilingual dropdown
│   ├── checkout/            # Checkout modal
│   ├── products/            # Product cards, grid
│   └── ui/                  # Reusable UI components
├── context/
│   ├── AuthContext.tsx      # Authentication state
│   ├── CartContext.tsx      # Shopping cart state
│   ├── ChatContext.tsx      # AI chat state
│   └── ToastContext.tsx     # Toast notifications
├── lib/
│   ├── constants.ts         # System prompts, knowledge base, language labels
│   ├── gemini.ts            # Gemini AI service (text + voice)
│   ├── rag.ts               # RAG service for knowledge retrieval
│   ├── api-error.ts         # API error handling
│   ├── api-utils.ts         # API utilities & middleware
│   ├── auth.ts              # NextAuth configuration
│   ├── data.ts              # Product data (45 items)
│   ├── email.ts             # Email service
│   ├── supabase.ts          # Supabase client
│   ├── utils.ts             # Utility functions
│   └── validations.ts       # Zod schemas
├── middleware.ts            # Route protection
└── types/
    ├── index.ts             # Main TypeScript types
    └── chat.ts              # Chat types (Language enum, Message, CartItem)
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

### 5. AI Chat Widget (Kidist)
- **Kidist Persona**: Friendly Ethiopian shopping concierge & support agent
- **Multilingual Support**: English, Amharic (አማርኛ), Tigrigna (ትግርኛ), Spanish (Español)
- **Voice Chat**: Real-time voice conversation using Gemini Live API
- **Elegant UI Design**:
  - Bouncing cloud bubble with "Ask Kidist: Your Support & Concierge"
  - Circular Ethiopian flag button with waving animation (green/yellow/red)
  - Amber-themed chat panel with Kidist avatar
- **Voice Button States**: Green (ready to call) → Red (active/hang up)
- **Cart Integration**: AI can add items to cart via function calls
- **RAG Knowledge Base**: Context-aware responses using product catalog
- **Cultural Knowledge**: Information about Ethiopian traditions and products

## Environment Variables

Required for full functionality:

```env
# NextAuth
NEXTAUTH_SECRET=<random-32-char-string>
NEXTAUTH_URL=https://sosina-mart.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>

# AI - Gemini (REQUIRED for chat and voice)
NEXT_PUBLIC_GEMINI_API_KEY=<google-gemini-api-key>
```

**Important:** The `NEXT_PUBLIC_GEMINI_API_KEY` is required for:
- Text chat with Kidist
- Voice chat functionality (uses Gemini Live API client-side)
- Function calling (add to cart, checkout)

## Database Schema

Located in `supabase/migrations/001_initial_schema.sql`:

- `customers` - Customer profiles
- `orders` - Order records
- `order_items` - Order line items
- `order_status_history` - Status change log
- `customer_interactions` - CRM interaction log
- `customer_segments` - Customer segmentation
- `chat_sessions` - AI chat sessions
- `chat_messages` - Chat message history

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
| GET/POST | `/api/ai/chat` | AI chat endpoint (server fallback) |
| GET/POST | `/api/ai/recommendations` | Product recommendations |

## AI Architecture

### Gemini Integration (`src/lib/gemini.ts`)
- **Text Chat**: Uses `gemini-2.0-flash` model via `@google/genai` SDK
- **Voice Chat**: Uses `gemini-2.0-flash-live-001` with Gemini Live API
- Kidist persona system prompt with multilingual support
- Function declarations for `add_to_cart` and `start_checkout`
- Audio encoding/decoding utilities for voice streaming

### Constants (`src/lib/constants.ts`)
- `SYSTEM_PROMPT`: Kidist's personality and capabilities
- `KNOWLEDGE_BASE`: Store info, products, shipping, cultural info
- `LANGUAGE_LABELS`: Display names for supported languages

### RAG Service (`src/lib/rag.ts`)
- Simple keyword-based knowledge search
- Returns relevant context for AI prompts

### Function Calls
The AI can trigger cart operations:
```javascript
// Add to cart
{ name: 'add_to_cart', args: { items: [{ name, quantity, unit, price }] } }

// Start checkout
{ name: 'start_checkout', args: {} }
```

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
- 180 tests passing
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
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_GEMINI_API_KEY` - **Required** for AI chat & voice
   - `NEXTAUTH_SECRET` - For authentication
   - Supabase credentials - For database

**After adding/changing environment variables:** Redeploy without build cache for changes to take effect.

## Notes for Claude

- **Product data** is in `src/lib/data.ts` - static array with 45 products
- **Without Supabase**, the app runs in "mock mode" with limited functionality
- **Admin routes** require `role: 'admin'` in session
- **Toast notifications** use custom context, not external library
- **AI chat runs client-side** for voice support - needs `NEXT_PUBLIC_GEMINI_API_KEY`
- **Languages**: English (en), Amharic (am), Tigrigna (ti), Spanish (es)
- **Voice chat** requires microphone permissions and modern browser with WebAudio API
- **Debug logs** available in browser console with `[ChatWidget]` and `[GeminiService]` prefixes
