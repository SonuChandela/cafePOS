import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // === API Routes ===

  // Menu
  app.get(api.menu.list.path, async (req, res) => {
    const items = await storage.getMenuItems();
    res.json(items);
  });

  app.post(api.menu.create.path, async (req, res) => {
    try {
      const input = api.menu.create.input.parse(req.body);
      const item = await storage.createMenuItem(input);
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Orders
  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      const order = await storage.createOrder(input);
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  });

  // === Seed Data (Auto-run on start if empty) ===
  seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const items = await storage.getMenuItems();
    if (items.length === 0) {
      console.log("Seeding database with menu items...");
      const seedItems = [
        { name: "Cappuccino", price: 450, category: "Beverages", description: "Rich espresso with steamed milk foam" },
        { name: "Latte", price: 400, category: "Beverages", description: "Espresso with steamed milk" },
        { name: "Iced Americano", price: 350, category: "Beverages", description: "Chilled espresso with water" },
        { name: "Croissant", price: 300, category: "Food", description: "Buttery flaky pastry" },
        { name: "Club Sandwich", price: 850, category: "Food", description: "Chicken, bacon, lettuce, tomato" },
        { name: "Chocolate Cake", price: 500, category: "Dessert", description: "Rich dark chocolate layer cake" },
        { name: "Green Tea", price: 250, category: "Beverages", description: "Organic japanese sencha" },
        { name: "Burger", price: 900, category: "Food", description: "Beef patty with cheese and veggies" },
      ];

      for (const item of seedItems) {
        await storage.createMenuItem(item);
      }
      console.log("Seeding complete!");
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}
