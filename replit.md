# Makaryo POS

A full-stack Point-of-Sale (POS) web application for restaurants and cafes.

## Architecture

- **Frontend**: React + TypeScript + Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js + TypeScript (tsx)
- **Database**: PostgreSQL via Drizzle ORM
- **State**: TanStack Query for server state, local React state for cart

## Key Features

- **Menu Grid**: Browse and search menu items by category, add to cart
- **Cart Panel**: Slide-in/out from right on all screens, collapsible footer summary, item extras management
- **Floating Cart Button**: Visible on all screens, shows item count badge
- **Checkout**: Customer details, payment method, order placement with receipt
- **Print Invoices**: Thermal-style receipt print for orders (home and order history pages)
- **WhatsApp Share**: Share receipt via WhatsApp
- **Order History**: View/edit past orders, add/remove/modify items, print invoices. Edit disabled for completed orders.
- **Table Bookings**: Reserve tables, manage payments, print booking receipts
- **Notifications**: Bell icon with dropdown — tracks order status changes and new order placements
- **Settings**: Restaurant profile configuration

## Project Structure

```
client/src/
  pages/       - Home, Orders, Bookings, Settings
  components/  - CartPanel, MenuGrid, CheckoutDialog, ReceiptPreview, Sidebar
  hooks/       - use-cart, use-menu, use-orders
  lib/         - queryClient, utils
server/
  routes.ts    - Express API routes
  storage.ts   - Database access layer
  db.ts        - Drizzle connection
shared/
  schema.ts    - Drizzle table definitions + Zod schemas
  routes.ts    - API route type definitions
```

## API Endpoints

- `GET /api/menu` — list menu items
- `POST /api/menu` — create menu item
- `GET /api/orders` — list all orders with items
- `GET /api/orders/:id` — get single order with items
- `POST /api/orders` — create order with items
- `PATCH /api/orders/:id` — update order status/notes and optionally items
- `GET /api/bookings` — list bookings
- `POST /api/bookings` — create booking
- `PATCH /api/bookings/:id` — update booking
- `DELETE /api/bookings/:id` — delete booking

## Mobile Design

The app is mobile-first. Key mobile behaviors:
- Sidebar collapses to icon-only on desktop, drawer on mobile
- Cart opens as full-screen overlay on mobile via floating button
- On desktop, cart is a collapsible right panel toggled by the same floating button
- All tables have horizontal scroll on mobile
- Print uses A5 paper size for thermal-printer compatibility
