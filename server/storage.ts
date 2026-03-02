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
  updateOrder(id: number, data: { orderStatus?: string; paymentStatus?: string }): Promise<Order>;
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

  async updateOrder(id: number, data: { orderStatus?: string; paymentStatus?: string }): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();

async function seed() {
  const existing = await storage.getMenuItems();
  // Clear existing items to re-seed with Pizzas and variations
  if (existing.length > 0) {
    await db.delete(menuItems);
  }

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
  console.log("Database seeded with Pizzas and variations!");
}

seed().catch(console.error);
