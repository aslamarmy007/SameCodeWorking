import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customer table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shopName: text("shop_name"),
  phone: text("phone"),
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
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
  gstin: text("gstin"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
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
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
