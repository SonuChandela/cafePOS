import { pgTable, text, serial, integer, boolean, timestamp, jsonb, uuid, index, pgEnum, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
// === ENUMS ===
export const orderStatusEnum = pgEnum("order_status", ["draft", "preparing", "ready", "completed", "cancelled"]);
export const orderItemStatusEnum = pgEnum("order_item_status", ["pending", "preparing", "ready", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded", "partially_paid"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "upi", "mixed", "other"]);
export const bookingStatusEnum = pgEnum("booking_status", ["pending", "confirmed", "cancelled", "completed"]);
export const inventoryUnitEnum = pgEnum("inventory_unit", ["kg", "g", "L", "ml", "pcs"]);
export const stockTransactionTypeEnum = pgEnum("stock_transaction_type", ["in", "out", "waste", "order_deduction"]);
// === BUSINESS & PLANS ===
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // in cents/paise
  description: text("description").notNull(),
  features: jsonb("features").notNull(),
  maxDevices: integer("max_devices").notNull().default(1), // Added for device limits
});
export const business = pgTable("business", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  contact: text("mobile").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  logo: text("logo"), // made optional
});
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  planId: integer("plan_id").references(() => plans.id),
  businessId: uuid("business_id").references(() => business.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(), // active, expired, cancelled
}, (t) => [
  index("sub_business_idx").on(t.businessId),
  index("sub_status_idx").on(t.status)
]);
// === OUTLETS ===
export const outlets = pgTable("outlets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  businessId: uuid("business_id").references(() => business.id).notNull(),
  address: text("address").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email").notNull(),
  logo: text("logo"),
  fssaiNumber: text("fssai_number"),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  tanNumber: text("tan_number"),
  msmeNumber: text("msme_number"),
  maxDevices: integer("max_devices").notNull().default(1), // Can override plan mapping
}, (t) => [
  index("outlet_business_idx").on(t.businessId),
]);
// === ROLES & PERMISSIONS ===
// Roles handles dynamic scopes. Using isSystem to lock default roles (admin, cashier, waiter).
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  isSystem: boolean("is_system").default(false), // true for built-in roles
});
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
});
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  roleId: integer("role_id").references(() => roles.id),
  outletId: uuid("outlet_id").references(() => outlets.id),
}, (t) => [
  index("users_outlet_idx").on(t.outletId),
]);
export const userPermissions = pgTable("user_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  permissionId: integer("permission_id").references(() => permissions.id).notNull(),
});
// === STAFF & ATTENDANCE ===
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pin: text("pin").notNull(), // 4-digit passcode for quick login
  mobile: text("mobile").notNull(),
  email: text("email"),
  status: text("status").notNull().default("active"),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  roleId: integer("role_id").references(() => roles.id),
  userId: integer("user_id").references(() => users.id),
}, (t) => [
  index("staff_outlet_idx").on(t.outletId),
]);
export const staffAttendance = pgTable("staff_attendance", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  date: date("date").notNull(),
  inTime: time("in_time").notNull(),
  outTime: time("out_time"), // made optional (null until they check out)
}, (t) => [
  index("attendance_staff_idx").on(t.staffId, t.date),
]);
// === DEVICES ===
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  deviceId: text("device_id").notNull(), // Unique hardware/software ID
  deviceType: text("device_type").notNull(), // POS, KDS, Tablet
  status: text("status").notNull(), // active, inactive
});
// === PRINTERS ===
export const printers = pgTable("printers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Kitchen Thermal", "Receipt Printer"
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  printerType: text("printer_type").notNull(), // 'receipt', 'kitchen'
  connectionType: text("connection_type").notNull(), // 'wifi', 'bluetooth', 'usb'
  status: text("status").notNull().default("active"),
  connectionStatus: text("connection_status").notNull().default("offline"), // 'online', 'offline'
  ipAddress: text("ip_address"), // for network printers
  macAddress: text("mac_address"), // for bluetooth printers
  lastPingAt: timestamp("last_ping_at"),
});
// === MENU MANAGEMENT ===
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  description: text("description"),
  image: text("image"),
  available: boolean("available").default(true).notNull(),
  sequence: integer("sequence").default(0), // Sorting order
});
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // base price in cents
  description: text("description"),
  image: text("image"),
  available: boolean("available").default(true).notNull(),
  isVegetarian: boolean("is_vegetarian").default(true),
}, (t) => [
  index("menu_item_category_idx").on(t.categoryId),
]);
// Variations (E.g., Size, Crust type)
export const variationGroups = pgTable("variation_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Size", "Milk Type"
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  description: text("description"),
  available: boolean("available").default(true).notNull(),
});
export const variationOptions = pgTable("variation_options", {
  id: serial("id").primaryKey(),
  variationGroupId: integer("variation_group_id").references(() => variationGroups.id).notNull(),
  name: text("name").notNull(), // "Small", "Large"
});
export const menuItemVariations = pgTable("menu_item_variations", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  variationOptionId: integer("variation_option_id").references(() => variationOptions.id).notNull(),
  price: integer("price").notNull()
});
// Modifier Groups / Add-ons (e.g., Extras)
export const modifierGroups = pgTable("modifier_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Extra Toppings"
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  categoryId: integer("category_id").references(() => categories.id), // Apply to whole category
  description: text("description"),
  available: boolean("available").default(true).notNull(),
  minSelections: integer("min_selections").default(0),
  maxSelections: integer("max_selections").default(1),
});
export const modifiers = pgTable("modifiers", {
  id: serial("id").primaryKey(),
  modifierGroupId: integer("modifier_group_id").references(() => modifierGroups.id).notNull(),
  name: text("name").notNull(), // "Extra Cheese", "Oat Milk"
  price: integer("price").notNull(), // Price of the extra in cents
});
// === INVENTORY MANAGEMENT ===
export const inventoryCategories = pgTable("inventory_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  description: text("description"),
});
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").references(() => inventoryCategories.id).notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  unit: inventoryUnitEnum("unit").notNull(), // kg, g, L, ml, pcs
  currentStock: integer("current_stock").notNull().default(0), // stored in base unit (e.g., 1000 for 1kg)
  minStockLevel: integer("min_stock_level").notNull().default(0), // trigger alert if stock drops below this
  costPerUnit: integer("cost_per_unit").notNull().default(0), // in cents per base unit
});
// Recipe Mapping: How much inventory is used when a menu item is ordered
export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),
  quantityRequired: integer("quantity_required").notNull(), // amount to deduct in base unit
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
});
// Logs all manual stock additions/removals and automatic order deductions
export const stockTransactions = pgTable("stock_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id).notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  type: stockTransactionTypeEnum("type").notNull(), // 'in', 'out', 'waste', 'order_deduction'
  quantity: integer("quantity").notNull(), // Amount added/removed
  referenceId: text("reference_id"), // E.g., Order ID string to trace deduction
  staffId: integer("staff_id").references(() => staff.id), // Who made the transaction (if manual)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// === TAXES & DISCOUNTS ===
export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "SGST 2.5%" or "VAT"
  type: text("type").notNull().default("percentage"), // 'percentage' or 'flat'
  value: integer("value").notNull(), // 250 for 2.5%
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  isDefault: boolean("is_default").default(false), // automatically applied to new orders
  isActive: boolean("is_active").default(true),
});
export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Staff Discount"
  type: text("type").notNull(), // 'percentage' or 'flat'
  value: integer("value").notNull(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  isActive: boolean("is_active").default(true),
});
// === CUSTOMERS ===
export const customer = pgTable("customer", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  email: text("email"),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  loyaltyPoints: integer("loyalty_points").default(0),
}, (t) => [
  index("customer_mobile_idx").on(t.mobile),
]);
// === TABLES & RESERVATIONS ===
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g. "Table 1" or "Outdoor A"
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  capacity: integer("capacity").notNull(),
  status: text("status").default("available").notNull(), // available, occupied, reserved
});
export const tableBooking = pgTable("table_booking", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerMobile: text("customer_mobile").notNull(),
  customerEmail: text("customer_email"),
  tableId: integer("table_id").references(() => tables.id),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  bookingTime: timestamp("booking_time").notNull(),
  bookingStatus: bookingStatusEnum("booking_status").default("pending"),
  pax: integer("pax").notNull().default(1),
  advanceAmount: integer("advance_amount").default(0).notNull(), // For reservation payments
  notes: text("notes"),
}, (t) => [
  index("booking_time_idx").on(t.bookingTime),
  index("booking_status_idx").on(t.bookingStatus),
]);
// === CASH REGISTERS (SHIFT TRACKING) ===
export const registerSessions = pgTable("register_sessions", {
  id: serial("id").primaryKey(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  staffId: integer("staff_id").references(() => staff.id).notNull(),
  deviceId: integer("device_id").references(() => devices.id),
  openingBalance: integer("opening_balance").notNull().default(0),
  closingBalance: integer("closing_balance"),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
  status: text("status").default("open").notNull(), // open, closed
}, (t) => [
  index("register_staff_idx").on(t.staffId),
  index("register_status_idx").on(t.status),
  index("closed_at_idx").on(t.closedAt),
  index("opened_at_idx").on(t.openedAt),
]);
// === ORDERS & KDS ===
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  tableId: integer("table_id").references(() => tables.id),
  customerId: integer("customer_id").references(() => customer.id),
  registerSessionId: integer("register_session_id").references(() => registerSessions.id),
  subtotal: integer("subtotal").notNull().default(0),

  // Custom taxes & discounts applied to this order (stored as JSON for historical accuracy)
  taxesApplied: jsonb("taxes_applied"), // e.g. [{ name: "SGST", value: 250, amount: 50 }, ...]
  discountsApplied: jsonb("discounts_applied"),
  taxAmount: integer("tax_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0), // Subtotal + Tax - Discount

  paymentMethod: paymentMethodEnum("payment_method"),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  orderStatus: orderStatusEnum("status").default("draft"), // Note: we use "draft" for Cart items
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  note: text("note"),
}, (t) => [
  index("orders_outlet_idx").on(t.outletId),
  index("orders_created_idx").on(t.createdAt),
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id).notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  priceAtTime: integer("price_at_time").notNull(),
  variationName: text("variation_name"),
  note: text("note"),
  modifiers: jsonb("modifiers"),
  modifiersAmount: integer("modifiers_amount").notNull().default(0),
  totalPrice: integer("total_price").notNull(),

  // KDS Support
  status: orderItemStatusEnum("status").default("pending").notNull(), // tracks item state in kitchen
});
// === INVOICES ===
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(), // E.g., INV-001
  orderId: uuid("order_id").references(() => orders.id),
  bookingId: integer("booking_id").references(() => tableBooking.id),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  amount: integer("amount").notNull(),
  pdfUrl: text("pdf_url"), // Hosted PDF receipt path
  status: paymentStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// === OFFLINE SYNC & AUDIT TRAIL ===
export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  deviceId: integer("device_id").references(() => devices.id), // Which device was offline?
  entityType: text("entity_type").notNull(), // e.g., 'orders', 'customers'
  entityId: text("entity_id").notNull(), // ID of the entity that changed
  action: text("action").notNull(), // 'insert', 'update', 'delete'
  changes: jsonb("changes").notNull(), // Payload of what to sync
  status: text("status").default("pending").notNull(), // 'pending', 'synced', 'failed'
  error: text("error"),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  outletId: uuid("outlet_id").references(() => outlets.id).notNull(),
  staffId: integer("staff_id").references(() => staff.id),
  action: text("action").notNull(), // e.g., 'VOID_ORDER', 'LOGIN', 'CASH_DROP'
  description: text("description").notNull(),
  entityType: text("entity_type"), // 'order', 'table' etc
  entityId: text("entity_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// === RELATIONS ===
export const categoryRelations = relations(categories, ({ many, one }) => ({
  menuItems: many(menuItems),
  outlet: one(outlets, { fields: [categories.outletId], references: [outlets.id] }),
}));
export const menuItemRelations = relations(menuItems, ({ many, one }) => ({
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
  menuItemVariations: many(menuItemVariations),
}));
export const menuItemVariationsRelations = relations(menuItemVariations, ({ many, one }) => ({
  menuItem: one(menuItems, { fields: [menuItemVariations.menuItemId], references: [menuItems.id] }),
  specificOption: one(variationOptions, { fields: [menuItemVariations.variationOptionId], references: [variationOptions.id] }),
}));
export const variationGroupsRelations = relations(variationGroups, ({ many, one }) => ({
  groupOptions: many(variationOptions),
  outlet: one(outlets, { fields: [variationGroups.outletId], references: [outlets.id] }),
}));
export const variationOptionsRelations = relations(variationOptions, ({ many, one }) => ({
  parentGroup: one(variationGroups, { fields: [variationOptions.variationGroupId], references: [variationGroups.id] }),
}));
export const ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  outlet: one(outlets, { fields: [orders.outletId], references: [outlets.id] }),
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  customer: one(customer, { fields: [orders.customerId], references: [customer.id] }),
  session: one(registerSessions, { fields: [orders.registerSessionId], references: [registerSessions.id] }),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] })
}));
export const registerSessionsRelations = relations(registerSessions, ({ many, one }) => ({
  orders: many(orders),
  staff: one(staff, { fields: [registerSessions.staffId], references: [staff.id] }),
}));
export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
  booking: one(tableBooking, { fields: [invoices.bookingId], references: [tableBooking.id] }),
}));
export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  category: one(inventoryCategories, { fields: [inventoryItems.categoryId], references: [inventoryCategories.id] }),
  recipes: many(recipeIngredients),
  transactions: many(stockTransactions),
}));
export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  menuItem: one(menuItems, { fields: [recipeIngredients.menuItemId], references: [menuItems.id] }),
  inventoryItem: one(inventoryItems, { fields: [recipeIngredients.inventoryItemId], references: [inventoryItems.id] }),
}));
export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [stockTransactions.inventoryItemId], references: [inventoryItems.id] }),
  staff: one(staff, { fields: [stockTransactions.staffId], references: [staff.id] }),
}));
// === SCHEMAS ===
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertVariationGroupSchema = createInsertSchema(variationGroups).omit({ id: true });
export const insertVariationOptionSchema = createInsertSchema(variationOptions).omit({ id: true });
export const insertMenuItemVariationSchema = createInsertSchema(menuItemVariations).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({ id: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });
export const insertPrinterSchema = createInsertSchema(printers).omit({ id: true });
// === EXPLICIT API TYPES ===
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type InsertVariationGroup = z.infer<typeof insertVariationGroupSchema>;
export type InsertVariationOption = z.infer<typeof insertVariationOptionSchema>;
export type InsertMenuItemVariation = z.infer<typeof insertMenuItemVariationSchema>;
export type Category = typeof categories.$inferSelect;
export type VariationGroup = typeof variationGroups.$inferSelect;
export type VariationOption = typeof variationOptions.$inferSelect;
export type MenuItemVariation = typeof menuItemVariations.$inferSelect;
export type MenuItemWithCategory = MenuItem & { category: Category | null };
export type MenuItemWithVariations = MenuItem & {
  category: Category | null;
  menuItemVariations: (MenuItemVariation & {
    specificOption: VariationOption & {
      parentGroup: VariationGroup & {
        groupOptions: VariationOption[];
      };
    };
  })[];
};
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
// Composite type for creating an order from API
export const createOrderSchema = insertOrderSchema.extend({
  items: z.array(z.object({
    menuItemId: z.number(),
    name: z.string(),
    quantity: z.number().min(1),
    priceAtTime: z.number(),
    variationName: z.string().optional(),
    modifiers: z.any().optional(),
    modifiersAmount: z.number().default(0),
    totalPrice: z.number(),
    note: z.string().optional(), // Adding note support for order items
    status: z.string().optional() // for KDS
  })),
});
export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
export type OrderWithItems = Order & { items: OrderItem[] };