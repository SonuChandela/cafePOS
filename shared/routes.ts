import { z } from 'zod';
import {
  insertMenuItemSchema, createOrderSchema, insertPrinterSchema,
  insertInventoryItemSchema, insertInvoiceSchema, menuItems, orders, printers, inventoryItems, invoices, staff, syncLogs,
  type MenuItemWithVariations, type OrderWithItems
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  menu: {
    list: {
      method: 'GET' as const,
      path: '/api/menu',
      responses: {
        200: z.array(z.custom<MenuItemWithVariations>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/menu',
      input: insertMenuItemSchema,
      responses: {
        201: z.custom<typeof menuItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  orders: {
    list: {
      method: 'GET' as const,
      path: '/api/orders',
      responses: {
        200: z.array(z.custom<OrderWithItems>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: createOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(), // Returns the order ID usually
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: {
        200: z.custom<OrderWithItems>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/orders/:id/status',
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    }
  },
  printers: {
    list: {
      method: 'GET' as const,
      path: '/api/printers',
      responses: {
        200: z.array(z.custom<typeof printers.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/printers',
      input: insertPrinterSchema,
      responses: {
        201: z.custom<typeof printers.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  inventory: {
    list: {
      method: 'GET' as const,
      path: '/api/inventory',
      responses: {
        200: z.array(z.custom<typeof inventoryItems.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/inventory',
      input: insertInventoryItemSchema,
      responses: {
        201: z.custom<typeof inventoryItems.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  invoices: {
    list: {
      method: 'GET' as const,
      path: '/api/invoices',
      responses: {
        200: z.array(z.custom<typeof invoices.$inferSelect>()),
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/invoices',
      input: insertInvoiceSchema,
      responses: {
        201: z.custom<typeof invoices.$inferSelect>(),
        400: errorSchemas.validation,
      }
    }
  },
  sync: {
    push: {
      method: 'POST' as const,
      path: '/api/sync/push',
      input: z.array(z.custom<typeof syncLogs.$inferSelect>()), // array of offline changes
      responses: {
        200: z.object({ success: z.boolean(), processed: z.number() }),
        400: errorSchemas.validation,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
