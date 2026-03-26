import {
  menuItems, orders, orderItems, categories, outlets, business, staff,
  type MenuItem, type InsertMenuItem, type Order, type CreateOrderRequest, type OrderWithItems,
  type MenuItemWithVariations,
  variationGroups,
  variationOptions
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemWithVariations(): Promise<MenuItemWithVariations[]>;
  getMenuItemById(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;

  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    const data = await db.select().from(menuItems);
    return data;
  }

  async getMenuItemWithVariations(): Promise<MenuItemWithVariations[]> {
    const data = await db.query.menuItems.findMany({
      with: {
        category: true,
        menuItemVariations: {
          with: {
            specificOption: {
              with: {
                parentGroup: {
                  with: {
                    groupOptions: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    return data;
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    try {
      const [newItem] = await db.insert(menuItems).values(item as any).returning();
      return newItem;
    } catch (error) {
      console.error("Error creating menu item:", error);
      throw error;
    }
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

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }

  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    return await db.transaction(async (tx) => {
      const [order] = await tx.insert(orders).values({
        outletId: orderRequest.outletId, // Required UUID from schema
        tableId: orderRequest.tableId,
        customerId: orderRequest.customerId,
        registerSessionId: orderRequest.registerSessionId,
        subtotal: orderRequest.subtotal,
        taxAmount: orderRequest.taxAmount,
        discountAmount: orderRequest.discountAmount,
        totalAmount: orderRequest.totalAmount,
        paymentMethod: orderRequest.paymentMethod,
        paymentStatus: orderRequest.paymentStatus,
        orderStatus: orderRequest.orderStatus,
        note: orderRequest.note,
        taxesApplied: orderRequest.taxesApplied,
        discountsApplied: orderRequest.discountsApplied,
      }).returning();

      for (const item of orderRequest.items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          priceAtTime: item.priceAtTime,
          variationName: item.variationName,
          modifiers: item.modifiers,
          modifiersAmount: item.modifiersAmount,
          totalPrice: item.totalPrice,
          status: item.status as any,
          note: item.note,
        });
      }

      return order;
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ orderStatus: status as any })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }
}

export const storage = new DatabaseStorage();

// Robust Seed script that handles relational constraints!
async function seed() {
  try {
    const businesses = await db.select().from(business);
    if (businesses.length === 0) {
      console.log("Seeding initial database state...");
      const [newBusiness] = await db.insert(business).values({
        name: "Demo Cafe",
        contact: "1234567890",
        email: "demo@cafe.com",
        address: "123 Coffee Street",
      }).returning();

      const [newOutlet] = await db.insert(outlets).values({
        name: "Main Branch",
        businessId: newBusiness.id,
        address: "123 Coffee Street",
        mobile: "1234567890",
        email: "main@cafe.com",
        fssaiNumber: "FSSAI123",
      }).returning();

      const [foodCat] = await db.insert(categories).values({
        name: "Food",
        outletId: newOutlet.id,
      }).returning();

      const [bevCat] = await db.insert(categories).values({
        name: "Beverages",
        outletId: newOutlet.id,
      }).returning();

      const items: InsertMenuItem[] = [
        {
          name: "Pizza",
          price: 1000,
          categoryId: foodCat.id,
          description: "Delicious cheesy pizza",
        },
        {
          name: "Burger",
          price: 500,
          categoryId: foodCat.id,
          description: "Juicy beef burger",
        },
        {
          name: "Cappuccino",
          price: 350,
          categoryId: bevCat.id,
          description: "Classic Italian coffee"
        }
      ];

      for (const item of items) {
        await storage.createMenuItem(item);
      }

      // Seed a default staff login (Admin PIN 1234)
      await db.insert(staff).values({
        name: "Admin User",
        pin: "1234",
        mobile: "0000000000",
        outletId: newOutlet.id,
      });

      console.log("Database seeded successfully with schema constraints met!");

    }
  }
  catch (err) {
    console.error("Seed failed (might be already seeded or schema mismatch):", err);
  }
}

seed().catch(console.error);
