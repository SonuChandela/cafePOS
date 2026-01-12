import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { 
  menuItems, orders, orderItems, 
  type MenuItem, type InsertMenuItem, 
  type Order, type InsertOrder, 
  type OrderItem, type InsertOrderItem,
  type CreateOrderRequest
} from "@shared/schema";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  getOrders(): Promise<Order[]>;
  createOrder(orderRequest: CreateOrderRequest): Promise<Order>;
  getOrder(id: number): Promise<(Order & { items: OrderItem[] }) | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    return await db.select().from(menuItems).orderBy(menuItems.category, menuItems.name);
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [newItem] = await db.insert(menuItems).values(item).returning();
    return newItem;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // 1. Insert the order
      const [newOrder] = await tx.insert(orders).values({
        customerName: orderRequest.customerName,
        customerPhone: orderRequest.customerPhone,
        totalAmount: orderRequest.totalAmount,
        paymentMethod: orderRequest.paymentMethod,
        paymentStatus: 'paid', // Assuming POS orders are paid immediately usually, or pending
      }).returning();

      // 2. Insert items
      if (orderRequest.items.length > 0) {
        await tx.insert(orderItems).values(
          orderRequest.items.map(item => ({
            orderId: newOrder.id,
            menuItemId: item.menuItemId,
            name: item.name,
            quantity: item.quantity,
            priceAtTime: item.priceAtTime,
            extras: item.extras,
          }))
        );
      }

      return newOrder;
    });
  }

  async getOrder(id: number): Promise<(Order & { items: OrderItem[] }) | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true,
      },
    });

    return order;
  }
}

export const storage = new DatabaseStorage();
