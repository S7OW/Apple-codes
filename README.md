# Apple+ Codes Store - React SPA

A complete e-commerce platform for selling Apple+ digital codes, built with React, TypeScript, Tailwind CSS, Supabase, and Stripe.

## Features

### 🛍️ Customer Features
- **Bilingual Support**: Full English and Arabic support with RTL layout
- **Product Browsing**: Browse and search Apple+ codes
- **Shopping Cart**: Add/remove items, adjust quantities
- **Favorites**: Save products for later
- **Secure Checkout**: Stripe payment integration (supports Mada, Visa, Mastercard)
- **User Dashboard**: View purchased codes, order history,... but it needs a backend to be accessible. same thing for the items/products cards, they'll appear once you add a backend then adding products from the dashboard.
- **Code Management**: Reveal and copy purchased codes
- **Reviews**: Leave reviews after purchase (verified purchases only)
- **Responsive Design**: Works perfectly on all devices

### 🔐 Authentication
- Email/Password authentication
- Google OAuth sign-in
- Secure session management with Supabase Auth

### 💳 Payment
- Stripe Checkout integration
- Mada card support (automatic via Stripe)
- Secure payment processing
- Instant code delivery after payment

### 📱 Pages
- Home page with featured products
- Products listing with search
- Shopping cart
- Checkout
- User dashboard
- My codes (purchased codes)
- Favorites
- Order history
- Guide (how to redeem)
- Contact (social media links)
- About & Terms (editable via admin)

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Routing**: React Router v7
- **State Management**: Zustand
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **Internationalization**: react-i18next
- **Icons**: Remix Icon
- **Build Tool**: Vite

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account
- Stripe account

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
VITE_ADMIN_PASSWORD=your_admin_password
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
4. This will create all necessary tables and RLS policies

### 4. Supabase Edge Functions

Deploy the Edge Functions for Stripe integration:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Deploy functions
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

### 5. Stripe Configuration

1. Go to Stripe Dashboard
2. Enable Mada payment method in Settings → Payment Methods
3. Set up webhook endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Add webhook events: `checkout.session.completed`
5. Copy webhook signing secret to environment variables

### 6. Google OAuth Setup (Optional)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Add authorized redirect URLs

### 7. Install Dependencies

```bash
npm install
```

### 8. Run Development Server

```bash
npm run dev
```

### 9. Build for Production

```bash
npm run build
```

## Database Schema

### Tables
- **profiles**: User profiles
- **products**: Product catalog (with English/Arabic fields)
- **codes**: Digital codes pool
- **orders**: Order records
- **order_items**: Order line items
- **favorites**: User favorites
- **reviews**: Product reviews (verified purchases only)
- **site_content**: Editable content (announcement, guide, about, terms)

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies to ensure data security.

## Admin Panel

To access the admin panel:
1. Navigate to `/admin`
2. Enter the admin password (set in environment variables)
3. Manage products, codes, orders, reviews, and site content

## Payment Flow

1. User adds products to cart
2. User proceeds to checkout
3. Stripe Checkout session is created
4. User completes payment (Mada/Visa/Mastercard)
5. Webhook receives payment confirmation
6. System assigns unused codes to the order
7. Codes are marked as used and linked to user
8. User receives email with codes
9. Codes appear in user dashboard

## Internationalization

The app supports English and Arabic:
- Language switcher in navbar
- RTL layout for Arabic
- All content translated
- Product names and descriptions in both languages

## Responsive Design

- Mobile-first approach
- Hamburger menu on mobile
- Optimized layouts for all screen sizes
- Touch-friendly interactions

## Security Features

- Row Level Security (RLS) on all tables
- Secure authentication with Supabase
- API keys stored in environment variables
- Stripe webhook signature verification
- Input validation and sanitization

## Support

For issues or questions, contact me through:
- Instagram: x0_4u
- Telegram: dj8nm
- TikTok: sn4.f

## License

All right reserved, can't be resold, but it can be reproduced and sold again
