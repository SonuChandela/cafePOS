import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { outlets, staff, roles } from "../shared/schema";
import {
  insertMenuItemSchema,
  createOrderSchema,
  insertBookingSchema,
} from "../shared/schema";
import { type Express } from "express";

export async function registerRoutes(httpServer: any, app: Express): Promise<void> {
  app.get("/api/menu", async (_req, res) => {
    try {
      const items = await storage.getMenuItemWithVariations();
      res.json(items);
    } catch (error) {
      console.error("Failed to fetch menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  app.post("/api/menu", async (req, res) => {
    const parsed = insertMenuItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid menu item data" });
    }
    const item = await storage.createMenuItem(parsed.data);
    res.status(201).json(item);
  });

  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id); // Fixed: order id is UUID now, not integer
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.body.outletId) {
      const [defaultOutlet] = await db.select().from(outlets).limit(1);
      req.body.outletId = defaultOutlet?.id;
    }

    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid order data" });
    }
    try {
      const order = await storage.createOrder(parsed.data);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });
    try {
      const order = await storage.updateOrderStatus(req.params.id, status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.get("/api/bookings", async (_req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const booking = await storage.createBooking(req.body);
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(
        parseInt(req.params.id),
        req.body,
      );
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete("/api/bookings/:id", async (req, res) => {
    try {
      await storage.deleteBooking(parseInt(req.params.id));
      res.json({ message: "Booking deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  app.get("/api/inventory", async (_req, res) => {
    try {
      const items = await storage.getInventoryItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.patch("/api/inventory/:id", async (req, res) => {
    try {
      const item = await storage.updateInventoryItem(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const item = await storage.createInventoryItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.get("/api/taxes", async (_req, res) => {
    try {
      const data = await storage.getTaxes();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch taxes" });
    }
  });

  app.get("/api/discounts", async (_req, res) => {
    try {
      const data = await storage.getDiscounts();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch discounts" });
    }
  });

  app.get("/api/tables", async (_req, res) => {
    try {
      const data = await storage.getTables();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });
}
