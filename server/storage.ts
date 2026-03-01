import { menuItems, orders, orderItems, type MenuItem, type InsertMenuItem, type Order, type CreateOrderRequest, type OrderWithItems } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: number): Promise<OrderWithItems | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
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
    const [newItem] = await db.insert(menuItems).values(item).returning();
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

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ orderStatus: status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();

// Seed data with variations and extras
async function seed() {
  const existing = await storage.getMenuItems();
  if (existing.length === 0) {
    const items: InsertMenuItem[] = [
      {
        name: "Pizza",
        price: 1000,
        category: "Food",
        description: "Delicious cheesy pizza",
        variations: [
          { name: "Small", price: 800 },
          { name: "Medium", price: 1200 },
          { name: "Large", price: 1600 }
        ],
        extras: [
          { name: "Extra Cheese", price: 200 },
          { name: "Mushrooms", price: 150 }
        ]
      },
      {
        name: "Burger",
        price: 500,
        category: "Food",
        description: "Juicy beef burger",
        extras: [
          { name: "Cheese", price: 100 },
          { name: "Bacon", price: 150 }
        ]
      },
      {
        name: "Cappuccino",
        price: 350,
        category: "Beverages",
        description: "Classic Italian coffee"
      }
    ];
    for (const item of items) {
      await storage.createMenuItem(item);
    }
    console.log("Database seeded with variations and extras!");
  }
}

seed().catch(console.error);
