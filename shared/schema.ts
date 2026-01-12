import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // stored in cents/paise
  category: text("category").notNull(), // e.g., "Beverages", "Snacks"
  description: text("description"),
  image: text("image"),
  available: boolean("available").default(true).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // 'cash', 'card', 'upi', 'other'
  paymentStatus: text("payment_status").default('pending').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  name: text("name").notNull(), // Snapshot of name at time of order
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(),
  extras: text("extras"), // Special instructions
});

// === RELATIONS ===
export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

// === SCHEMAS ===
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

// === EXPLICIT API TYPES ===
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;

// Composite type for creating an order with items
export const createOrderSchema = insertOrderSchema.extend({
  items: z.array(z.object({
    menuItemId: z.number(),
    name: z.string(),
    quantity: z.number().min(1),
    priceAtTime: z.number(),
    extras: z.string().optional(),
  })),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

export type OrderWithItems = Order & { items: OrderItem[] };
