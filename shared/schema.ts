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
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true }).extend({
  name: z.string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z\s]+$/.test(val), {
      message: "Customer name must contain only letters"
    })
    .refine((val) => !val || val.length <= 50, {
      message: "Customer name must be maximum 50 characters"
    }),
  shopName: z.string()
    .min(1, "Shop name is required")
    .max(50, "Shop name must be maximum 50 characters")
    .regex(/^[a-zA-Z0-9\s]+$/, "Shop name can only contain letters and numbers"),
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
      message: "GSTIN can only contain letters and numbers"
    })
    .refine((val) => !val || val.length <= 15, {
      message: "GSTIN must be maximum 15 characters"
    }),
  address: z.string()
    .optional()
    .refine((val) => !val || val.length <= 200, {
      message: "Address must be maximum 200 characters"
    }),
  city: z.string()
    .min(1, "City is required")
    .max(40, "City must be maximum 40 characters")
    .regex(/^[a-zA-Z\s]+$/, "City must contain only letters"),
  state: z.string()
    .min(1, "State is required")
    .max(40, "State must be maximum 40 characters")
    .regex(/^[a-zA-Z\s]+$/, "State must contain only letters"),
  postalCode: z.string()
    .optional()
    .refine((val) => !val || val.length <= 15, {
      message: "Postal code must be maximum 15 characters"
    }),
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Products table (predefined catalog)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  hsn: text("hsn").notNull(),
  defaultPrice: decimal("default_price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  gstRate: decimal("gst_rate", { precision: 5, scale: 2 }).notNull().default("0"),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Invoice table
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ 
  id: true, 
  createdAt: true 
}).extend({
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  shippingCity: z.string().min(1, "Shipping city is required"),
  shippingState: z.string().min(1, "Shipping state is required"),
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
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
