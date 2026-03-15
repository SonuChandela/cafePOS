import { menuItems, orders, orderItems, bookings, inventoryItems, type MenuItem, type InsertMenuItem, type Order, type CreateOrderRequest, type OrderWithItems, type Booking, type InsertBooking, type InventoryItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrder(id: number, data: any): Promise<Order>;
  updateOrderWithItems(id: number, data: any, items?: any[]): Promise<Order>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: any): Promise<Booking>;
  updateBooking(id: number, data: any): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  getInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem>;
  createInventoryItem(data: any): Promise<InventoryItem>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems);
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item as any).returning();
    return newItem;
  }

  async getOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const ordersWithItems = await Promise.all(
      allOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );
    return ordersWithItems;
  }

  async getOrder(id: number): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }

  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        customerName: orderRequest.customerName,
        customerPhone: orderRequest.customerPhone,
        totalAmount: orderRequest.totalAmount,
        subtotal: orderRequest.subtotal,
        taxPercentage: orderRequest.taxPercentage,
        taxAmount: orderRequest.taxAmount,
        discountAmount: orderRequest.discountAmount,
        paymentMethod: orderRequest.paymentMethod,
        paymentStatus: orderRequest.paymentStatus,
        orderStatus: orderRequest.orderStatus,
        notes: orderRequest.notes,
      }).returning();

      for (const item of orderRequest.items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          variationName: item.variationName,
          extras: item.extras,
          extrasAmount: item.extrasAmount || 0,
        });
      }

      return order;
    });
  }

  async updateOrder(id: number, data: any): Promise<Order> {
    const [updatedOrder] = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }

  async updateOrderWithItems(id: number, data: any, items?: any[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const updateData: any = {};
      if (data.orderStatus !== undefined) updateData.orderStatus = data.orderStatus;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
      if (data.discountAmount !== undefined) updateData.discountAmount = data.discountAmount;

      const [updatedOrder] = await tx.update(orders).set(updateData).where(eq(orders.id, id)).returning();

      if (items !== undefined) {
        await tx.delete(orderItems).where(eq(orderItems.orderId, id));
        for (const item of items) {
          await tx.insert(orderItems).values({
            orderId: id,
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
            variationName: item.variationName || null,
            extras: item.extras || "",
            extrasAmount: item.extrasAmount || 0,
          });
        }
      }

      return updatedOrder;
    });
  }

  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  }

  async createBooking(booking: any): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, data: any): Promise<Booking> {
    const [updatedBooking] = await db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).orderBy(inventoryItems.category, inventoryItems.name);
  }

  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const [item] = await db.update(inventoryItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return item;
  }

  async createInventoryItem(data: any): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(data).returning();
    return item;
  }
}

export const storage = new DatabaseStorage();

async function seedInventory() {
  const existing = await storage.getInventoryItems();
  if (existing.length > 0) return;

  const items = [
    { name: "Tomato Sauce", category: "Pizzas", quantity: 18, unit: "kg", minQuantity: 5, usedInItems: "Margherita Pizza, Pepperoni Pizza, Veggie Supreme Pizza, BBQ Chicken Pizza" },
    { name: "Mozzarella Cheese", category: "Pizzas", quantity: 3, unit: "kg", minQuantity: 6, usedInItems: "Margherita Pizza, Pepperoni Pizza, Veggie Supreme Pizza, BBQ Chicken Pizza" },
    { name: "Pizza Dough", category: "Pizzas", quantity: 24, unit: "pcs", minQuantity: 10, usedInItems: "Margherita Pizza, Pepperoni Pizza, Veggie Supreme Pizza, BBQ Chicken Pizza" },
    { name: "Pepperoni Slices", category: "Pizzas", quantity: 2, unit: "kg", minQuantity: 3, usedInItems: "Pepperoni Pizza" },
    { name: "Grilled Chicken", category: "Pizzas", quantity: 5, unit: "kg", minQuantity: 4, usedInItems: "BBQ Chicken Pizza" },
    { name: "BBQ Sauce", category: "Pizzas", quantity: 8, unit: "liters", minQuantity: 3, usedInItems: "BBQ Chicken Pizza" },
    { name: "Mixed Vegetables", category: "Pizzas", quantity: 4, unit: "kg", minQuantity: 5, usedInItems: "Veggie Supreme Pizza" },
    { name: "Olive Oil", category: "Pizzas", quantity: 6, unit: "liters", minQuantity: 2, usedInItems: "Margherita Pizza" },
    { name: "Burger Buns", category: "Burgers", quantity: 8, unit: "pcs", minQuantity: 12, usedInItems: "Classic Burger" },
    { name: "Beef Patty", category: "Burgers", quantity: 4, unit: "pcs", minQuantity: 10, usedInItems: "Classic Burger" },
    { name: "Lettuce", category: "Burgers", quantity: 6, unit: "pcs", minQuantity: 10, usedInItems: "Classic Burger" },
    { name: "Cheese Slices", category: "Burgers", quantity: 20, unit: "pcs", minQuantity: 15, usedInItems: "Classic Burger" },
    { name: "Coffee Beans", category: "Beverages", quantity: 8, unit: "kg", minQuantity: 5, usedInItems: "Cappuccino" },
    { name: "Milk", category: "Beverages", quantity: 4, unit: "liters", minQuantity: 10, usedInItems: "Cappuccino" },
    { name: "Sugar", category: "Beverages", quantity: 12, unit: "kg", minQuantity: 5, usedInItems: "Cappuccino" },
  ];

  for (const item of items) {
    await storage.createInventoryItem(item);
  }
}

async function seed() {
  const existing = await storage.getMenuItems();
  if (existing.length > 0) return;

  const items: InsertMenuItem[] = [
    {
      name: "Margherita Pizza",
      price: 1200,
      category: "Pizzas",
      description: "Classic tomato and mozzarella",
      variations: [
        { name: "SMALL", price: 1000 },
        { name: "MEDIUM", price: 1400 },
        { name: "LARGE", price: 1800 }
      ],
      extras: [
        { name: "Extra Cheese", price: 200 },
        { name: "Olive Oil", price: 50 }
      ]
    },
    {
      name: "Pepperoni Pizza",
      price: 1500,
      category: "Pizzas",
      description: "Spicy pepperoni with double cheese",
      variations: [
        { name: "SMALL", price: 1200 },
        { name: "MEDIUM", price: 1600 },
        { name: "LARGE", price: 2000 }
      ],
      extras: [
        { name: "Extra Pepperoni", price: 300 },
        { name: "Jalapenos", price: 100 }
      ]
    },
    {
      name: "Veggie Supreme Pizza",
      price: 1400,
      category: "Pizzas",
      description: "Mushrooms, onions, peppers, and olives",
      variations: [
        { name: "SMALL", price: 1100 },
        { name: "MEDIUM", price: 1500 },
        { name: "LARGE", price: 1900 }
      ],
      extras: [
        { name: "Extra Veggies", price: 150 },
        { name: "Feta Cheese", price: 250 }
      ]
    },
    {
      name: "BBQ Chicken Pizza",
      price: 1600,
      category: "Pizzas",
      description: "Grilled chicken with BBQ sauce",
      variations: [
        { name: "SMALL", price: 1300 },
        { name: "MEDIUM", price: 1700 },
        { name: "LARGE", price: 2100 }
      ],
      extras: [
        { name: "Red Onions", price: 50 },
        { name: "Sweetcorn", price: 80 }
      ]
    },
    {
      name: "Classic Burger",
      price: 800,
      category: "Burgers",
      description: "Beef patty with lettuce and tomato",
      extras: [
        { name: "Cheese Slice", price: 50 },
        { name: "Beef Bacon", price: 200 }
      ]
    },
    {
      name: "Cappuccino",
      price: 450,
      category: "Beverages",
      description: "Rich espresso with steamed milk"
    }
  ];

  for (const item of items) {
    await storage.createMenuItem(item);
  }
}

seed().catch(console.error);
seedInventory().catch(console.error);
