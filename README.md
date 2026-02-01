# Sosina Mart - Ethiopian Ecommerce Store

A modern, responsive ecommerce website for Sosina Mart, an Ethiopian store based in Atlanta, Georgia. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Product Catalog**: Ethiopian food, traditional clothes, and cultural artifacts
- **Shopping Cart**: Full-featured cart with quantity management
- **Checkout System**: Complete checkout flow with order confirmation
- **Supabase Integration**: Database-ready for products and orders
- **Self-Checking System**: Built-in validation for project integrity

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Database**: Supabase (optional)
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project folder:
   ```bash
   cd SosinaMartFinal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up Supabase:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase credentials

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run validate` | Run lint, test, and build |
| `npm run check` | Run self-checking system |

## Project Structure

```
SosinaMartFinal/
├── public/
│   └── images/           # Static images
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/
│   │   ├── checkout/     # Checkout components
│   │   ├── layout/       # Layout components (Navbar, Footer, etc.)
│   │   ├── products/     # Product-related components
│   │   ├── sections/     # Page sections (Hero, Carousel, etc.)
│   │   └── ui/           # Reusable UI components
│   ├── context/          # React Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and data
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── __tests__/            # Test files
├── scripts/              # Utility scripts
└── ...config files
```

## Supabase Setup (Optional)

The app works without Supabase (uses localStorage for cart). To enable database:

1. Create a Supabase project at [supabase.com](https://supabase.com)

2. Create the following tables:

   **products**
   ```sql
   create table products (
     id uuid default gen_random_uuid() primary key,
     name text not null,
     description text,
     price decimal(10,2) not null,
     category text not null,
     image text,
     in_stock boolean default true,
     featured boolean default false,
     created_at timestamp with time zone default now()
   );
   ```

   **orders**
   ```sql
   create table orders (
     id uuid default gen_random_uuid() primary key,
     customer_name text not null,
     customer_email text not null,
     customer_phone text not null,
     customer_address text not null,
     items jsonb not null,
     total decimal(10,2) not null,
     notes text,
     status text default 'pending',
     created_at timestamp with time zone default now()
   );
   ```

3. Add your credentials to `.env.local`

## Self-Checking System

Run the self-check to validate project integrity:

```bash
npm run check
```

This validates:
- Project structure
- Required files
- Dependencies
- Configuration
- Assets

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Store Information

- **Name**: Sosina Mart
- **Address**: 6330 Lawrenceville Hwy, Tucker, GA 30084
- **Phone**: 470-359-7924
- **Email**: info@sosinamart.com
- **Website**: www.sosinamart.com

## License

Private - All rights reserved.
