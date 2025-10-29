import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customer table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  shopName: text("shop_name"),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ 
  id: true,
  createdAt: true 
}).extend({
  name: z.string()
    .max(50, "Contact name must be maximum 50 characters")
    .optional()
    .refine((val) => {
      if (!val) return true;
      const onlyLettersAndSpaces = /^[a-zA-Z\u0B80-\u0BFF\s]+$/;
      return onlyLettersAndSpaces.test(val);
    }, {
      message: "Contact name can only contain letters and spaces"
    })
    .refine((val) => {
      if (!val) return true;
      return !/\s{2,}/.test(val);
    }, {
      message: "Contact name cannot have consecutive spaces"
    }),
  shopName: z.string()
    .min(1, "Shop name is required")
    .max(50, "Shop name must be maximum 50 characters")
    .refine((val) => {
      const lettersNumbersSpaces = /^[a-zA-Z\u0B80-\u0BFF0-9\s]+$/;
      return lettersNumbersSpaces.test(val);
    }, {
      message: "Shop name can only contain letters, numbers and spaces"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "Shop name cannot have consecutive spaces"
    }),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits"
    }),
  email: z.string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address"
    }),
  gstin: z.string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9]+$/.test(val), {
      message: "GSTIN can only contain letters and numbers (no Tamil characters)"
    })
    .refine((val) => !val || val.length <= 15, {
      message: "GSTIN must be maximum 15 characters"
    }),
  address: z.string()
    .max(200, "Address must be maximum 200 characters")
    .optional()
    .refine((val) => {
      if (!val) return true;
      const allowedChars = /^[a-zA-Z\u0B80-\u0BFF\s()[\]\\/;:\-"'&,.]+$/;
      return allowedChars.test(val);
    }, {
      message: "Address can only contain letters, spaces and these characters: ( ) [ ] \\ / : ; - \" ' & , ."
    })
    .refine((val) => {
      if (!val) return true;
      return !/\s{2,}/.test(val);
    }, {
      message: "Address cannot have consecutive spaces"
    }),
  city: z.string()
    .min(1, "City is required")
    .max(40, "City must be maximum 40 characters")
    .refine((val) => {
      const lettersAndSpaces = /^[a-zA-Z\u0B80-\u0BFF\s]+$/;
      return lettersAndSpaces.test(val);
    }, {
      message: "City can only contain letters and spaces (no numbers or special characters)"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "City cannot have consecutive spaces"
    }),
  state: z.string()
    .min(1, "State is required")
    .max(40, "State must be maximum 40 characters")
    .refine((val) => {
      const lettersAndSpaces = /^[a-zA-Z\u0B80-\u0BFF\s]+$/;
      return lettersAndSpaces.test(val);
    }, {
      message: "State can only contain letters and spaces (no numbers or special characters)"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "State cannot have consecutive spaces"
    }),
  postalCode: z.string()
    .optional()
    .refine((val) => !val || val.length <= 15, {
      message: "Postal code must be maximum 15 characters"
    }),
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export const insertBuyerSchema = createInsertSchema(customers).omit({ 
  id: true,
  createdAt: true 
}).extend({
  name: z.string()
    .max(50, "Buyer name must be maximum 50 characters")
    .optional()
    .refine((val) => {
      if (!val) return true;
      const onlyLettersAndSpaces = /^[a-zA-Z\u0B80-\u0BFF\s]+$/;
      return onlyLettersAndSpaces.test(val);
    }, {
      message: "Buyer name can only contain letters and spaces"
    })
    .refine((val) => {
      if (!val) return true;
      return !/\s{2,}/.test(val);
    }, {
      message: "Buyer name cannot have consecutive spaces"
    }),
  shopName: z.string()
    .max(50, "Shop name must be maximum 50 characters")
    .optional()
    .refine((val) => {
      if (!val) return true;
      const lettersNumbersSpaces = /^[a-zA-Z\u0B80-\u0BFF0-9\s]+$/;
      return lettersNumbersSpaces.test(val);
    }, {
      message: "Shop name can only contain letters, numbers and spaces"
    })
    .refine((val) => {
      if (!val) return true;
      return !/\s{2,}/.test(val);
    }, {
      message: "Shop name cannot have consecutive spaces"
    }),
  phone: z.string()
    .optional()
    .refine((val) => !val || /^\d{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits"
    }),
  email: z.string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address"
    }),
  gstin: z.string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9]+$/.test(val), {
      message: "GSTIN can only contain letters and numbers (no Tamil characters)"
    })
    .refine((val) => !val || val.length <= 15, {
      message: "GSTIN must be maximum 15 characters"
    }),
  address: z.string()
    .max(200, "Address must be maximum 200 characters")
    .optional()
    .refine((val) => {
      if (!val) return true;
      const allowedChars = /^[a-zA-Z\u0B80-\u0BFF\s()[\]\\/;:\-"'&,.]+$/;
      return allowedChars.test(val);
    }, {
      message: "Address can only contain letters, spaces and these characters: ( ) [ ] \\ / : ; - \" ' & , ."
    })
    .refine((val) => {
      if (!val) return true;
      return !/\s{2,}/.test(val);
    }, {
      message: "Address cannot have consecutive spaces"
    }),
  city: z.string()
    .min(1, "City is required")
    .max(40, "City must be maximum 40 characters")
    .refine((val) => {
      const lettersAndSpaces = /^[a-zA-Z\u0B80-\u0BFF\s]+$/;
      return lettersAndSpaces.test(val);
    }, {
      message: "City can only contain letters and spaces (no numbers or special characters)"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "City cannot have consecutive spaces"
    }),
  state: z.string()
    .min(1, "State is required")
    .max(40, "State must be maximum 40 characters")
    .refine((val) => {
      const lettersAndSpaces = /^[a-zA-Z\u0B80-\u0BFF\s]+$/;
      return lettersAndSpaces.test(val);
    }, {
      message: "State can only contain letters and spaces (no numbers or special characters)"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "State cannot have consecutive spaces"
    }),
  postalCode: z.string()
    .optional()
    .refine((val) => !val || val.length <= 15, {
      message: "Postal code must be maximum 15 characters"
    }),
}).refine(
  (data) => {
    return !!(data.name || data.shopName);
  },
  {
    message: "Either buyer name or shop name is required",
    path: ["shopName"],
  }
);
export type InsertBuyer = z.infer<typeof insertBuyerSchema>;

// Products table (predefined catalog)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  hsn: text("hsn").notNull(),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  stock: decimal("stock", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true }).extend({
  name: z.string()
    .min(1, "Product name is required")
    .max(30, "Product name must be maximum 30 characters")
    .refine((val) => {
      const allowedChars = /^[a-zA-Z\u0B80-\u0BFF0-9X\/+\-\\%&*#@.,;:"'\]\[\(\)_=$!|\s]+$/;
      return allowedChars.test(val);
    }, {
      message: "Product name can only contain letters, Tamil letters, numbers and these special characters: X / + - \\ % & * # @ . , : ; \" ' ] [ ( ) _ = $ ! |"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "Product name cannot have consecutive spaces"
    }),
  hsn: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^\d{0,8}$/.test(val);
    }, {
      message: "HSN code must be only numbers, maximum 8 digits, no spaces"
    }),
  defaultPrice: z.string()
    .min(1, "Price is required")
    .refine((val) => {
      return /^\d{1,10}(\.\d{1,2})?$/.test(val);
    }, {
      message: "Price must be a valid number with maximum 10 digits"
    }),
  unit: z.string()
    .min(1, "Unit is required")
    .refine((val) => {
      const allowedChars = /^[a-zA-Z\u0B80-\u0BFF0-9X\/+\-\\%&*#@.,;:"'\]\[\(\)_=$!|\s]+$/;
      return allowedChars.test(val);
    }, {
      message: "Unit can only contain letters, Tamil letters, numbers and these special characters: X / + - \\ % & * # @ . , : ; \" ' ] [ ( ) _ = $ ! |"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "Unit cannot have consecutive spaces"
    }),
  gstRate: z.string()
    .min(1, "GST rate is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, {
      message: "GST rate must be between 0 and 100"
    }),
  stock: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^\d{1,10}(\.\d{1,2})?$/.test(val);
    }, {
      message: "Stock must be a valid number with maximum 10 digits"
    }),
  description: z.string()
    .max(50, "Description must be maximum 50 characters")
    .optional()
    .refine((val) => {
      if (!val) return true;
      const allowedChars = /^[a-zA-Z\u0B80-\u0BFF0-9X\/+\-\\%&*#@.,;:"'\]\[\(\)_=$!|\s]+$/;
      return allowedChars.test(val);
    }, {
      message: "Description can only contain letters, Tamil letters, numbers and these special characters: X / + - \\ % & * # @ . , : ; \" ' ] [ ( ) _ = $ ! |"
    })
    .refine((val) => {
      if (!val) return true;
      return !/\s{2,}/.test(val);
    }, {
      message: "Description cannot have consecutive spaces"
    }),
  category: z.string()
    .min(1, "Category is required")
    .max(30, "Category must be maximum 30 characters")
    .refine((val) => {
      const allowedChars = /^[a-zA-Z\u0B80-\u0BFF0-9\-_\/\\$%&*();:'".,!@#\s]+$/;
      return allowedChars.test(val);
    }, {
      message: "Category can only contain letters, Tamil letters, numbers and these special characters: - _ / \\ $ % & * ( ) ; : ' \" . , ! @ #"
    })
    .refine((val) => {
      return !/\s{2,}/.test(val);
    }, {
      message: "Category cannot have consecutive spaces"
    }),
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Invoice table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull(),
  billType: text("bill_type").notNull().default("sale"),
  billDate: text("bill_date").notNull(),
  customerId: varchar("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  shopName: text("shop_name"),
  phone: text("phone"),
  email: text("email"),
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  shippingToMyself: boolean("shipping_to_myself").default(false),
  shippingName: text("shipping_name"),
  shippingShopName: text("shipping_shop_name"),
  shippingPhone: text("shipping_phone"),
  shippingEmail: text("shipping_email"),
  shippingGstin: text("shipping_gstin"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostalCode: text("shipping_postal_code"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  transport: decimal("transport", { precision: 10, scale: 2 }).default("0"),
  packaging: decimal("packaging", { precision: 10, scale: 2 }).default("0"),
  otherCharges: decimal("other_charges", { precision: 10, scale: 2 }).default("0"),
  gstEnabled: boolean("gst_enabled").notNull().default(true),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).default("0"),
  grandTotal: decimal("grand_total", { precision: 10, scale: 2 }).notNull(),
  lorryNumber: text("lorry_number"),
  isDraft: boolean("is_draft").notNull().default(false),
  paymentStatus: text("payment_status"),
  paymentMethod: text("payment_method"),
  paymentDate: text("payment_date"),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  balanceAmount: decimal("balance_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  billType: z.enum(["sale", "purchase"]).default("sale"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  shippingToMyself: z.boolean().default(false),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice line items table
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  hsn: text("hsn").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// Locations table for city and state history
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // "city" or "state"
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({ 
  id: true,
  createdAt: true 
}).extend({
  type: z.enum(["city", "state"]),
  value: z.string().min(1).max(40),
});
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
