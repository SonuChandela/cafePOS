import "./config/env";
import {
  menuItems, orders, orderItems, inventoryItems, categories, outlets, business, staff,
  type InsertMenuItem,
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
import { storage } from "./storage";

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
      }).onConflictDoNothing().returning();

      const [newOutlet] = await db.insert(outlets).values({
        name: "Main Branch",
        businessId: newBusiness.id,
        address: "123 Coffee Street",
        mobile: "1234567890",
        email: "main@cafe.com",
        fssaiNumber: "FSSAI123",
      }).onConflictDoNothing().returning();

      const [pizzaCat] = await db.insert(categories).values({
        name: "Pizza",
        outletId: newOutlet.id,
      }).onConflictDoNothing().returning();

      const [burgerCat] = await db.insert(categories).values({
        name: "Burger",
        outletId: newOutlet.id,
      }).returning();

      const [sandwichCat] = await db.insert(categories).values({
        name: "Sandwich",
        outletId: newOutlet.id,
      }).returning();

      const [frenchfriesCat] = await db.insert(categories).values({
        name: "FrenchFries",
        outletId: newOutlet.id,
      }).returning();

      const [bevCat] = await db.insert(categories).values({
        name: "Beverages",
        outletId: newOutlet.id,
      }).onConflictDoNothing().returning();

      // Link Modifier Group to Category
      const [toppings] = await db.insert(modifierGroups).values({
        name: "Toppings",
        outletId: newOutlet.id,
      }).returning();

      await db.insert(categoryModifierGroups).values({
        categoryId: pizzaCat.id,
        modifierGroupId: toppings.id,
      });

      const [cornPizza] = await db.insert(menuItems).values({
        name: "Corn Pizza",
        price: 80,
        categoryId: pizzaCat.id,
        description: "Delicious Corn pizza",
      }).returning();

      const [paneerPizza] = await db.insert(menuItems).values({
        name: "paneer Pizza",
        price: 80,
        categoryId: pizzaCat.id,
        description: "Delicious paneer pizza",
      }).returning();

      const [burger] = await db.insert(menuItems).values({
        name: "burger",
        price: 40,
        categoryId: burgerCat.id,
        description: "Delicious burger",
      }).returning();

      const items: InsertMenuItem[] = [
        {
          name: "margreta Pizza",
          price: 80,
          categoryId: pizzaCat.id,
          description: "Delicious cheesy pizza",
        },
        {
          name: "Tikki Burger",
          price: 40,
          categoryId: burgerCat.id,
          description: "veggie burger",
        },
        {
          name: "Panner Burger",
          price: 50,
          categoryId: burgerCat.id,
          description: "Paneer burger",
        },
        {
          name: "Cheese Burger",
          price: 60,
          categoryId: burgerCat.id,
          description: "Cheese burger",
        },
        {
          name: "Veg Pizza Sandwich",
          price: 90,
          categoryId: sandwichCat.id,
          description: "Veg Sandwich",
        },
        {
          name: "Grill Sandwich",
          price: 60,
          categoryId: sandwichCat.id,
          description: "Veg Sandwich",
        },
        {
          name: "Veg Paneer Pizza Sandwich",
          price: 120,
          categoryId: sandwichCat.id,
          description: "Veg Sandwich",
        },
        {
          name: "Simple French Fries",
          price: 50,
          categoryId: frenchfriesCat.id,
          description: "French Fries",
        },
        {
          name: "with cream French Fries",
          price: 60,
          categoryId: frenchfriesCat.id,
          description: "French Fries",
        },
        {
          name: "Cappuccino",
          price: 350,
          categoryId: bevCat.id,
          description: "Classic Italian coffee"
        },
        {
          name: "cold coffee",
          price: 60,
          categoryId: bevCat.id,
          description: "Classic Italian coffee"
        },
        {
          name: "Hot Coffee",
          price: 80,
          categoryId: bevCat.id,
          description: "Classic Italian coffee"
        }
      ];

      for (const item of items) {
        await storage.createMenuItem(item);
      }

      // variation group
      const [sizeGroup] = await db.insert(variationGroups).values({
        name: "size",
        outletId: newOutlet.id,
      }).returning();

      // variation options 
      const [small] = await db.insert(variationOptions).values({
        name: "small",
        variationGroupId: sizeGroup.id,
      }).returning();

      const [medium] = await db.insert(variationOptions).values({
        name: "medium",
        variationGroupId: sizeGroup.id,
      }).returning();

      const [large] = await db.insert(variationOptions).values({
        name: "large",
        variationGroupId: sizeGroup.id,
      }).returning();

      // 💰 Variants (IMPORTANT FIX)
      await db.insert(menuItemVariations).values([
        {
          menuItemId: cornPizza.id,
          variationOptionId: small.id,
          price: 80,
        },
        {
          menuItemId: cornPizza.id,
          variationOptionId: medium.id,
          price: 140,
        },
        {
          menuItemId: cornPizza.id,
          variationOptionId: large.id,
          price: 200,
        },
      ]).returning();

      const [smallPaneerVariation] = await db.insert(menuItemVariations).values(
        {
          menuItemId: paneerPizza.id,
          variationOptionId: small.id,
          price: 100,
        }).returning();

      const [mediumPaneerVariation] = await db.insert(menuItemVariations).values(
        {
          menuItemId: paneerPizza.id,
          variationOptionId: medium.id,
          price: 100,
        }).returning();

      const [largePaneerVariation] = await db.insert(menuItemVariations).values(
        {
          menuItemId: paneerPizza.id,
          variationOptionId: large.id,
          price: 100,
        }).returning();

      // 🧀 Modifier Group already defined as 'toppings' above
      // 🧀 Modifiers
      const [extraCheese] = await db.insert(modifiers).values(
        {
          name: "Extra Cheese",
          modifierGroupId: toppings.id,
          defaultPrice: 20,
        }).returning();

      const [olives] = await db.insert(modifiers).values(
        {
          name: "Olives",
          modifierGroupId: toppings.id,
          defaultPrice: 15,
        }).returning();

      // Variation Modifiers
      const [smallPaneerMod] = await db.insert(variationModifierPrices).values(
        {
          menuItemVariationId: smallPaneerVariation.id,
          modifierId: extraCheese.id,
          price: 10,
        }).returning();
      const [mediumPaneerMod] = await db.insert(variationModifierPrices).values(
        {
          menuItemVariationId: mediumPaneerVariation.id,
          modifierId: extraCheese.id,
          price: 20,
        }).returning();
      const [largePaneerMod] = await db.insert(variationModifierPrices).values(
        {
          menuItemVariationId: largePaneerVariation.id,
          modifierId: extraCheese.id,
          price: 30,
        }).returning();

      const [smallOlivesMod] = await db.insert(variationModifierPrices).values(
        {
          menuItemVariationId: smallPaneerVariation.id,
          modifierId: olives.id,
          price: 40,
        }).returning();

      // Seed a default staff login (Admin PIN 1234)
      const [adminStaff] = await db.insert(staff).values({
        name: "Admin User",
        pin: "1234",
        mobile: "0000000000",
        outletId: newOutlet.id,
      }).returning();

      // Add roles
      const [adminRole] = await db.insert(roles).values({
        name: "Admin",
        description: "Administrator",
        isSystem: true,
      }).returning();

      const [cashierRole] = await db.insert(roles).values({
        name: "Cashier",
        description: "Front desk cashier",
        isSystem: true,
      }).returning();

      const [waiterRole] = await db.insert(roles).values({
        name: "Waiter",
        description: "Floor staff",
        isSystem: true,
      }).returning();

      // Add more staff
      const [cashierStaff] = await db.insert(staff).values({
        name: "Jane Cashier",
        pin: "2222",
        mobile: "9998887776",
        outletId: newOutlet.id,
        roleId: cashierRole.id,
      }).returning();

      // Add users
      const [adminUser] = await db.insert(users).values({
        name: "Admin User",
        email: "admin@cafe.com",
        password: "password123", // dummy mapping
        roleId: adminRole.id,
        outletId: newOutlet.id,
      }).returning();

      // Add Devices
      const [posDevice] = await db.insert(devices).values({
        name: "Main POS Terminal",
        outletId: newOutlet.id,
        deviceId: "POS-001",
        deviceType: "POS",
        status: "active",
      }).returning();

      // Add Printer
      await db.insert(printers).values({
        name: "Kitchen Printer",
        outletId: newOutlet.id,
        printerType: "kitchen",
        connectionType: "wifi",
        ipAddress: "192.168.1.50",
        status: "active",
      });

      // Add Register Session
      await db.insert(registerSessions).values({
        outletId: newOutlet.id,
        staffId: adminStaff.id,
        deviceId: posDevice.id,
        openingBalance: 5000,
        status: "open",
      });

      // Add customer
      const [johnDoe] = await db.insert(customer).values({
        name: "John Doe",
        mobile: "9876543210",
        email: "john@doe.com",
        outletId: newOutlet.id,
        loyaltyPoints: 100
      }).returning();

      // Add inventory category & items
      const [invCat] = await db.insert(inventoryCategories).values({
        name: "Raw Materials",
        outletId: newOutlet.id,
      }).returning();

      const [flour] = await db.insert(inventoryItems).values({
        name: "Flour",
        categoryId: invCat.id,
        outletId: newOutlet.id,
        unit: "kg",
        currentStock: 50000, // 50kg in grams
        minStockLevel: 10000,
        costPerUnit: 5, // 0.05 per gram
      }).returning();

      // Add Stock Transaction
      await db.insert(stockTransactions).values({
        inventoryItemId: flour.id,
        outletId: newOutlet.id,
        type: "in",
        quantity: 50000,
        notes: "Initial inventory load",
      });

      // Add Recipe
      await db.insert(recipeIngredients).values({
        menuItemId: cornPizza.id,
        inventoryItemId: flour.id,
        quantityRequired: 200, // 200g per pizza
        outletId: newOutlet.id,
      });

      // Add tables
      const [tbl1] = await db.insert(tables).values({
        name: "Table 1",
        outletId: newOutlet.id,
        capacity: 4,
      }).returning();

      const [tbl2] = await db.insert(tables).values({
        name: "Table 2",
        outletId: newOutlet.id,
        capacity: 2,
      }).returning();

      // Add Table Booking
      const [booking] = await db.insert(bookings).values({
        customerName: "Alice Smith",
        customerMobile: "8888888888",
        tableId: tbl1.id,
        outletId: newOutlet.id,
        bookingTime: new Date(Date.now() + 86400000), // tomorrow
        pax: 3,
      }).returning();

      // Add dummy order (completed)
      const [order] = await db.insert(orders).values({
        outletId: newOutlet.id,
        tableId: tbl1.id,
        staffId: adminStaff.id,
        customerId: johnDoe.id,
        subtotal: 160,
        taxAmount: 8,
        grandTotal: 168,
        orderType: "dine-in",
        orderStatus: "completed",
        paymentStatus: "paid",
        paymentMethod: "card",
      }).returning();

      const [oi1] = await db.insert(orderItems).values({
        orderId: order.id,
        menuItemId: cornPizza.id,
        name: "Corn Pizza",
        quantity: 2,
        basePrice: 80,
        finalPrice: 160,
        status: "ready",
      }).returning();

      // Add Order Item Modifier
      await db.insert(orderItemModifiers).values({
        orderItemId: oi1.id,
        modifierName: "Extra Cheese",
        modifierPrice: 20,
      });

      // Add another order (preparing)
      const [order2] = await db.insert(orders).values({
        outletId: newOutlet.id,
        tableId: tbl2.id,
        staffId: cashierStaff.id,
        subtotal: 80,
        taxAmount: 4,
        grandTotal: 84,
        orderType: "takeaway",
        orderStatus: "preparing",
        paymentStatus: "pending",
      }).returning();

      await db.insert(orderItems).values({
        orderId: order2.id,
        menuItemId: paneerPizza.id,
        name: "Paneer Pizza",
        quantity: 1,
        basePrice: 100,
        finalPrice: 100,
        status: "preparing",
      });

      // Add invoice
      await db.insert(invoices).values({
        invoiceNumber: "INV-001",
        orderId: order.id,
        outletId: newOutlet.id,
        amount: 168,
        status: "paid"
      });

      // Add subscription and plan
      const [basicPlan] = await db.insert(plans).values({
        name: "Basic Plan",
        price: 2900,
        description: "Standard plan for small cafes",
        features: JSON.stringify(["POS", "Inventory", "Basic Reports"]),
        maxDevices: 2,
      }).returning();

      await db.insert(subscriptions).values({
        planId: basicPlan.id,
        businessId: newBusiness.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000), // 30 days
        status: "active",
      });

      // Add taxes
      await db.insert(taxes).values({
        name: "GST 5%",
        type: "percentage",
        value: 500, // 5%
        outletId: newOutlet.id,
        isDefault: true,
      });

      // Add discounts
      await db.insert(discounts).values({
        name: "Staff Discount 10%",
        type: "percentage",
        value: 1000, // 10%
        outletId: newOutlet.id,
      });

      console.log("Database seeded successfully with all tables populated!");

    }
  }
  catch (err) {
    console.error("Seed failed (might be already seeded or schema mismatch):", err);
  } finally {
      process.exit(0);
  }
}

seed().catch(console.error);
