import { storage } from "./storage";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { outlets, staff, roles } from "@shared/schema";
import { insertMenuItemSchema, createOrderSchema } from "@shared/schema";
import { type Express } from "express";

export async function registerRoutes(httpServer: any, app: Express): Promise<void> {
  app.get("/api/staff", async (req, res) => {
    try {
      const { outletId } = req.query;
      if (!outletId) return res.status(400).json({ message: "Outlet ID required" });

      const allStaff = await db.select({
        id: staff.id,
        name: staff.name,
        status: staff.status,
        role: roles.name,
      })
        .from(staff)
        .leftJoin(roles, eq(staff.roleId, roles.id))
        .where(
          and(
            eq(staff.status, "active"),
            eq(staff.outletId, String(outletId))
          )
        );
      res.json(allStaff);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  app.post("/api/auth/bind-device", async (req, res) => {
    try {
      const { outletId, adminPassword } = req.body;
      if (!outletId || !adminPassword) {
        return res.status(400).json({ message: "Outlet ID and Admin Password required" });
      }

      // Verify outlet exists
      const [outlet] = await db.select().from(outlets).where(eq(outlets.id, outletId));
      if (!outlet) return res.status(404).json({ message: "Outlet not found" });

      // For this prototype, we're accepting 'admin123' as the universal setup password.
      if (adminPassword !== 'admin123') {
        // Alternatively, check if the admin PIN was used
        const [adminStaff] = await db.select().from(staff).where(
          and(
            eq(staff.outletId, outletId),
            eq(staff.pin, adminPassword)
          )
        );
        if (!adminStaff) {
          return res.status(401).json({ message: "Invalid Admin Password or PIN" });
        }
      }

      // Generate a dummy device ID (in a real app, this would be a real UUID stored in DB)
      const deviceId = "device_" + Math.random().toString(36).substring(2, 15);

      res.json({ token: deviceId, outletId: outlet.id, outletName: outlet.name });
    } catch (error) {
      console.error("Binding failed:", error);
      res.status(500).json({ message: "Binding failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { id, pin } = req.body;
      if (!id || !pin) return res.status(400).json({ message: "ID and PIN required" });

      const [user] = await db.select().from(staff).where(eq(staff.id, parseInt(id)));
      if (!user) return res.status(404).json({ message: "Staff not found" });

      if (user.pin !== pin) {
        return res.status(401).json({ message: "Incorrect PIN" });
      }

      if (user.status !== "active") {
        return res.status(403).json({ message: "Staff account is inactive" });
      }

      const { pin: _pin, ...safeUser } = user;
      res.json({ ...safeUser, token: "dummy-jwt-token" });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

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
      const order = await storage.updateOrderStatus(req.params.id, status); // Fixed: order id is UUID
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });
}
