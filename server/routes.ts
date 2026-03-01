import { storage } from "./storage";
import { insertMenuItemSchema, createOrderSchema } from "@shared/schema";
import { type Express } from "express";

export async function registerRoutes(httpServer: any, app: Express): Promise<void> {
  app.get("/api/menu", async (_req, res) => {
    try {
      const items = await storage.getMenuItems();
      res.json(items);
    } catch (error) {
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
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("Order validation failed:", parsed.error);
      return res.status(400).json({ message: "Invalid order data", details: parsed.error.format() });
    }
    try {
      const order = await storage.createOrder(parsed.data);
      res.status(201).json(order);
    } catch (error) {
      console.error("Order creation failed:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });
    try {
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });
}
