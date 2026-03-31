import { subBusinessDays } from "date-fns";
import {
  menuItems, orders, orderItems, inventoryItems, categories, outlets, business, staff,
  type MenuItem, type InsertMenuItem, type Order, type CreateOrderRequest, type OrderWithItems, type Booking, type InsertBooking, type InventoryItem,
  type MenuItemWithVariations,
  variationGroups,
  variationOptions,
  bookings,
  roles,
  customer,
  modifiers,
  menuItemVariations,
  modifierGroups,
  variationModifierPrices,
  plans, subscriptions, taxes, discounts,
  devices, registerSessions, recipeIngredients, stockTransactions, orderItemModifiers, categoryModifierGroups, printers,
  users, inventoryCategories, tables, invoices
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemWithVariations(): Promise<MenuItemWithVariations[]>;
  getMenuItemById(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;

  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  createOrder(order: CreateOrderRequest): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
  updateOrder(id: string, data: any): Promise<Order>;
  updateOrderWithItems(id: string, data: any, items?: any[]): Promise<Order>;
  getBookings(): Promise<Booking[]>;
  createBooking(booking: any): Promise<Booking>;
  updateBooking(id: number, data: any): Promise<Booking>;
  deleteBooking(id: number): Promise<void>;
  getInventoryItems(): Promise<InventoryItem[]>;
  updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem>;
  createInventoryItem(data: any): Promise<InventoryItem>;
  getTaxes(): Promise<any[]>;
  getDiscounts(): Promise<any[]>;
  getTables(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getMenuItems(): Promise<MenuItem[]> {
    const data = await db.select().from(menuItems);
    return data;
  }

  async getMenuItemWithVariations(): Promise<MenuItemWithVariations[]> {
    const data = await db.query.menuItems.findMany({
      with: {
        category: {
          with: {
            categoryModifierGroups: {
              with: {
                modifierGroup: {
                  with: {
                    modifiers: true
                  }
                },
              },
            },
          },
        },
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
    // Map modifiers to "extras" field for frontend compatibility
    return data.map(item => {
      return {
        ...item,
        categoryName: item.category?.name || "Uncategorized",
        variations: item.menuItemVariations.map(v => ({
          id: v.id,
          groupId: v.specificOption?.parentGroup?.id,
          groupName: v.specificOption?.parentGroup?.name,
          groupDescription: v.specificOption?.parentGroup?.description,
          optionId: v.specificOption?.id,
          optionName: v.specificOption?.name,
          optionPrice: Number(v.price || 0),
        })),
        extras: item.category?.categoryModifierGroups?.map((cmg: any) => ({
          id: cmg.modifierGroup.id,
          groupName: cmg.modifierGroup.name,
          isAvailable: cmg.modifierGroup.available,
          modifiers: cmg.modifierGroup.modifiers.map((m: any) => ({
            id: m.id,
            name: m.name,
            price: Number(m.defaultPrice || 0)
          }))
        })) || [],
      };
    });
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
    const allOrders = await db.query.orders.findMany({
      with: {
        customer: true,
        items: {
          with: {
            menuItem: true,
          },
        },
      },
      orderBy: desc(orders.createdAt),
    });

    return allOrders.map(order => ({
      ...order,
      customerName: order.customer?.name,
      customerPhone: order.customer?.mobile, // Mobile is used for phone in schema
      taxPercentage: order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 5,
    })) as OrderWithItems[];
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        customer: true,
        items: {
          with: {
            menuItem: true,
          },
        },
      },
    });

    if (!order) return undefined;
    return {
      ...order,
      customerName: order.customer?.name,
      customerPhone: order.customer?.mobile,
      taxPercentage: order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 5,
    } as OrderWithItems;
  }

  async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    return await db.transaction(async (tx) => {
      let customerId = orderRequest.customerId;

      // Create or find customer if details provided
      if (orderRequest.customerPhone) {
        const [existingCustomer] = await tx
          .select()
          .from(customer)
          .where(
            and(
              eq(customer.mobile, orderRequest.customerPhone),
              eq(customer.outletId, orderRequest.outletId)
            )
          )
          .limit(1);

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else if (orderRequest.customerName) {
          const [newCustomer] = await tx
            .insert(customer)
            .values({
              name: orderRequest.customerName,
              mobile: orderRequest.customerPhone,
              outletId: orderRequest.outletId,
            })
            .returning();
          customerId = newCustomer.id;
        }
      }

      const [order] = await tx.insert(orders).values({
        outletId: orderRequest.outletId, // Required UUID from schema
        tableId: orderRequest.tableId,
        staffId: orderRequest.staffId,
        deviceId: orderRequest.deviceId,
        customerId: customerId,
        registerSessionId: orderRequest.registerSessionId,
        subtotal: orderRequest.subtotal,
        orderType: orderRequest.orderType,
        taxesApplied: orderRequest.taxesApplied,
        discountsApplied: orderRequest.discountsApplied,
        taxAmount: orderRequest.taxAmount,
        discountAmount: orderRequest.discountAmount,
        grandTotal: orderRequest.grandTotal,
        roundOffAmount: orderRequest.roundOffAmount,
        paymentMethod: orderRequest.paymentMethod,
        paymentStatus: orderRequest.paymentStatus,
        paidAmount: orderRequest.paidAmount,
        dueAmount: orderRequest.dueAmount,
        orderStatus: orderRequest.orderStatus,
        note: orderRequest.note,
      }).returning();

      for (const item of orderRequest.items) {
        await tx.insert(orderItems).values({
          orderId: order.id,
          menuItemId: item.menuItemId,
          variationId: item.variationId,
          variationName: item.variationName,
          name: item.name,
          quantity: item.quantity,
          basePrice: item.basePrice,
          modifiersAmount: item.modifiersAmount,
          finalPrice: item.finalPrice,
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

  async updateOrder(id: string, data: any): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set(data)
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  async updateOrderWithItems(id: string, data: any, items?: any[]): Promise<Order> {
    return await db.transaction(async (tx) => {
      const updateData: any = {};
      if (data.orderStatus !== undefined) updateData.orderStatus = data.orderStatus;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.note !== undefined) updateData.note = data.note;
      if (data.grandTotal !== undefined) updateData.grandTotal = data.grandTotal;
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
            variationId: item.variationId,
            variationName: item.variationName || null,
            name: item.name,
            quantity: item.quantity,
            basePrice: item.basePrice,
            note: item.note || null,
            modifiersAmount: item.modifiersAmount || 0,
            finalPrice: item.finalPrice || 0,
            status: item.status || "pending",
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
    const data = await db.query.inventoryItems.findMany({
      with: {
        category: true,
      },
    });
    return data.map(item => ({
      ...item,
      category: item.category?.name || "Uncategorized",
    })) as InventoryItem[];
  }

  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<InventoryItem> {
    const [item] = await db.update(inventoryItems)
      .set({ ...data })
      .where(eq(inventoryItems.id, id))
      .returning();
    return item;
  }

  async createInventoryItem(data: any): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(data).returning();
    return item;
  }

  async getTaxes(): Promise<any[]> {
    return await db.select().from(taxes).where(eq(taxes.isActive, true));
  }

  async getDiscounts(): Promise<any[]> {
    return await db.select().from(discounts).where(eq(discounts.isActive, true));
  }

  async getTables(): Promise<any[]> {
    return await db.select().from(tables);
  }
}

export const storage = new DatabaseStorage();