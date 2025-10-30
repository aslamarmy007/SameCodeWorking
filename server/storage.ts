
import {
  type Customer,
  type InsertCustomer,
  type Product,
  type InsertProduct,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type Location,
  type InsertLocation,
  type Supplier,
  type InsertSupplier,
  type PurchaseInvoice,
  type InsertPurchaseInvoice,
  type PurchaseInvoiceItem,
  type InsertPurchaseInvoiceItem,
  customers,
  products,
  invoices,
  invoiceItems,
  locations,
  suppliers,
  purchaseInvoices,
  purchaseInvoiceItems,
} from "@shared/schema";
import { db } from "../db/index";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  findDuplicateCustomer(name: string | undefined, shopName: string | null): Promise<Customer | undefined>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Invoice operations
  getAllInvoices(): Promise<Invoice[]>;
  getDraftInvoices(): Promise<Invoice[]>;
  getPendingPaymentInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getInvoicesByDateRange(startDate: string, endDate: string): Promise<Invoice[]>;
  getNextInvoiceNumber(): Promise<string>;

  // Invoice items operations
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
  deleteInvoiceItems(invoiceId: string): Promise<void>;

  // Location operations
  getLocations(type: "city" | "state"): Promise<string[]>;
  addLocation(location: InsertLocation): Promise<Location>;

  // Supplier operations (for purchase bills)
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  findDuplicateSupplier(name: string | undefined, shopName: string | null): Promise<Supplier | undefined>;

  // Purchase Invoice operations
  getAllPurchaseInvoices(): Promise<PurchaseInvoice[]>;
  getDraftPurchaseInvoices(): Promise<PurchaseInvoice[]>;
  getPendingPaymentPurchaseInvoices(): Promise<PurchaseInvoice[]>;
  getPurchaseInvoice(id: string): Promise<PurchaseInvoice | undefined>;
  createPurchaseInvoice(invoice: InsertPurchaseInvoice): Promise<PurchaseInvoice>;
  updatePurchaseInvoice(id: string, invoice: Partial<InsertPurchaseInvoice>): Promise<PurchaseInvoice | undefined>;
  deletePurchaseInvoice(id: string): Promise<boolean>;
  getPurchaseInvoicesByDateRange(startDate: string, endDate: string): Promise<PurchaseInvoice[]>;
  getNextPurchaseInvoiceNumber(): Promise<string>;

  // Purchase Invoice items operations
  createPurchaseInvoiceItem(item: InsertPurchaseInvoiceItem): Promise<PurchaseInvoiceItem>;
  getPurchaseInvoiceItems(invoiceId: string): Promise<PurchaseInvoiceItem[]>;
  deletePurchaseInvoiceItems(invoiceId: string): Promise<void>;
}

export class DbStorage implements IStorage {
  constructor() {
    this.seedDefaultData();
  }

  private async seedDefaultData() {
    // Seed default products if none exist
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      const defaultProducts = [
        {
          name: "5kg Coco Peat Block",
          description: "Compressed 5kg coco peat block, high quality",
          hsn: "53082010",
          defaultPrice: "450.00",
          unit: "Block",
          gstRate: "5.00",
        },
        {
          name: "Grow Bag - Small",
          description: "Small size grow bag for plants",
          hsn: "53082010",
          defaultPrice: "25.00",
          unit: "Piece",
          gstRate: "5.00",
        },
        {
          name: "Grow Bag - Medium",
          description: "Medium size grow bag for plants",
          hsn: "53082010",
          defaultPrice: "35.00",
          unit: "Piece",
          gstRate: "5.00",
        },
        {
          name: "Grow Bag - Large",
          description: "Large size grow bag for plants",
          hsn: "53082010",
          defaultPrice: "50.00",
          unit: "Piece",
          gstRate: "5.00",
        },
        {
          name: "Coco Peat Powder",
          description: "Fine coco peat powder, 1kg pack",
          hsn: "53082010",
          defaultPrice: "120.00",
          unit: "Kg",
          gstRate: "0.00",
        },
        {
          name: "Coir Disc",
          description: "Compressed coir disc, expands in water",
          hsn: "53082010",
          defaultPrice: "15.00",
          unit: "Piece",
          gstRate: "0.00",
        },
        {
          name: "Coco Chips",
          description: "Premium coco chips for better drainage",
          hsn: "53082010",
          defaultPrice: "180.00",
          unit: "Kg",
          gstRate: "5.00",
        },
        {
          name: "Coir Rope",
          description: "Natural coir rope, 10m length",
          hsn: "56072900",
          defaultPrice: "80.00",
          unit: "Roll",
          gstRate: "5.00",
        },
      ] as const;
      
      await db.insert(products).values(defaultProducts as any);
    }

    // Seed default locations if none exist
    const existingLocations = await db.select().from(locations).limit(1);
    if (existingLocations.length === 0) {
      const defaultLocations = [
        { type: "state" as const, value: "TAMIL NADU" },
        { type: "state" as const, value: "தமிழ்நாடு" },
      ];
      
      await db.insert(locations).values(defaultLocations);
    }
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(insertCustomer).returning();
    return result[0];
  }

  async updateCustomer(
    id: string,
    updates: Partial<InsertCustomer>
  ): Promise<Customer | undefined> {
    const result = await db
      .update(customers)
      .set(updates)
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id)).returning();
    return result.length > 0;
  }

  async findDuplicateCustomer(name: string | undefined, shopName: string | null): Promise<Customer | undefined> {
    if (!shopName || !shopName.trim()) {
      return undefined;
    }
    
    const normalizedShopName = shopName.trim().toLowerCase();
    
    const allCustomers = await db.select().from(customers);
    return allCustomers.find(customer => {
      const customerShopName = customer.shopName?.trim().toLowerCase() || null;
      return customerShopName === normalizedShopName;
    });
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct as any).returning();
    return result[0];
  }

  async updateProduct(
    id: string,
    updates: Partial<InsertProduct>
  ): Promise<Product | undefined> {
    const result = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // Invoice operations
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.isDraft, false));
  }

  async getDraftInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.isDraft, true));
  }

  async getPendingPaymentInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).where(
      and(
        eq(invoices.isDraft, false),
        sql`${invoices.paymentStatus} IN ('full_credit', 'partial_paid')`
      )
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return result[0];
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values(insertInvoice).returning();
    return result[0];
  }

  async updateInvoice(
    id: string,
    updates: Partial<InsertInvoice>
  ): Promise<Invoice | undefined> {
    const result = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoice(id: string): Promise<boolean> {
    await this.deleteInvoiceItems(id);
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }

  async getInvoicesByDateRange(startDate: string, endDate: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(
        and(
          gte(invoices.billDate, startDate),
          lte(invoices.billDate, endDate)
        )
      );
  }

  async getNextInvoiceNumber(): Promise<string> {
    // Get the latest invoice to determine the next number
    const latestInvoice = await db
      .select()
      .from(invoices)
      .orderBy(sql`${invoices.createdAt} DESC`)
      .limit(1);
    
    const year = new Date().getFullYear();
    
    if (latestInvoice.length === 0) {
      return `INV-${year}-00001`;
    }
    
    // Extract the number from the latest invoice number
    const latestNumber = latestInvoice[0].invoiceNumber;
    const match = latestNumber.match(/INV-\d{4}-(\d+)$/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `INV-${year}-${String(nextNumber).padStart(5, "0")}`;
    }
    
    return `INV-${year}-00001`;
  }

  // Invoice items operations
  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(insertItem).returning();
    return result[0];
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async deleteInvoiceItems(invoiceId: string): Promise<void> {
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  // Location operations
  async getLocations(type: "city" | "state"): Promise<string[]> {
    const result = await db
      .select({ value: locations.value })
      .from(locations)
      .where(eq(locations.type, type));
    
    const uniqueValues = Array.from(new Set(result.map(r => r.value)));
    return uniqueValues;
  }

  async addLocation(insertLocation: InsertLocation): Promise<Location> {
    // Check if location already exists (case-insensitive)
    const allLocations = await db
      .select()
      .from(locations)
      .where(eq(locations.type, insertLocation.type));
    
    const existing = allLocations.find(
      loc => loc.value.toLowerCase() === insertLocation.value.toLowerCase()
    );
    
    if (existing) {
      return existing;
    }

    const result = await db.insert(locations).values(insertLocation).returning();
    return result[0];
  }

  // Supplier operations
  async getAllSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return result[0];
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const result = await db.insert(suppliers).values(insertSupplier).returning();
    return result[0];
  }

  async updateSupplier(
    id: string,
    updates: Partial<InsertSupplier>
  ): Promise<Supplier | undefined> {
    const result = await db
      .update(suppliers)
      .set(updates)
      .where(eq(suppliers.id, id))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return result.length > 0;
  }

  async findDuplicateSupplier(name: string | undefined, shopName: string | null): Promise<Supplier | undefined> {
    if (!shopName || !shopName.trim()) {
      return undefined;
    }
    
    const normalizedShopName = shopName.trim().toLowerCase();
    
    const allSuppliers = await db.select().from(suppliers);
    return allSuppliers.find(supplier => {
      const supplierShopName = supplier.shopName?.trim().toLowerCase() || null;
      return supplierShopName === normalizedShopName;
    });
  }

  // Purchase Invoice operations
  async getAllPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    return await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.isDraft, false));
  }

  async getDraftPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    return await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.isDraft, true));
  }

  async getPendingPaymentPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    return await db.select().from(purchaseInvoices).where(
      and(
        eq(purchaseInvoices.isDraft, false),
        sql`${purchaseInvoices.paymentStatus} IN ('full_credit', 'partial_paid')`
      )
    );
  }

  async getPurchaseInvoice(id: string): Promise<PurchaseInvoice | undefined> {
    const result = await db.select().from(purchaseInvoices).where(eq(purchaseInvoices.id, id)).limit(1);
    return result[0];
  }

  async createPurchaseInvoice(insertInvoice: InsertPurchaseInvoice): Promise<PurchaseInvoice> {
    const result = await db.insert(purchaseInvoices).values(insertInvoice).returning();
    return result[0];
  }

  async updatePurchaseInvoice(
    id: string,
    updates: Partial<InsertPurchaseInvoice>
  ): Promise<PurchaseInvoice | undefined> {
    const result = await db
      .update(purchaseInvoices)
      .set(updates)
      .where(eq(purchaseInvoices.id, id))
      .returning();
    return result[0];
  }

  async deletePurchaseInvoice(id: string): Promise<boolean> {
    await this.deletePurchaseInvoiceItems(id);
    const result = await db.delete(purchaseInvoices).where(eq(purchaseInvoices.id, id)).returning();
    return result.length > 0;
  }

  async getPurchaseInvoicesByDateRange(startDate: string, endDate: string): Promise<PurchaseInvoice[]> {
    return await db
      .select()
      .from(purchaseInvoices)
      .where(
        and(
          gte(purchaseInvoices.billDate, startDate),
          lte(purchaseInvoices.billDate, endDate)
        )
      );
  }

  async getNextPurchaseInvoiceNumber(): Promise<string> {
    // Get the latest purchase invoice to determine the next number
    const latestInvoice = await db
      .select()
      .from(purchaseInvoices)
      .orderBy(sql`${purchaseInvoices.createdAt} DESC`)
      .limit(1);
    
    const year = new Date().getFullYear();
    
    if (latestInvoice.length === 0) {
      return `PUR-${year}-00001`;
    }
    
    // Extract the number from the latest invoice number
    const latestNumber = latestInvoice[0].invoiceNumber;
    const match = latestNumber.match(/PUR-\d{4}-(\d+)$/);
    
    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `PUR-${year}-${String(nextNumber).padStart(5, "0")}`;
    }
    
    return `PUR-${year}-00001`;
  }

  // Purchase Invoice items operations
  async createPurchaseInvoiceItem(insertItem: InsertPurchaseInvoiceItem): Promise<PurchaseInvoiceItem> {
    const result = await db.insert(purchaseInvoiceItems).values(insertItem).returning();
    return result[0];
  }

  async getPurchaseInvoiceItems(invoiceId: string): Promise<PurchaseInvoiceItem[]> {
    return await db
      .select()
      .from(purchaseInvoiceItems)
      .where(eq(purchaseInvoiceItems.invoiceId, invoiceId));
  }

  async deletePurchaseInvoiceItems(invoiceId: string): Promise<void> {
    await db.delete(purchaseInvoiceItems).where(eq(purchaseInvoiceItems.invoiceId, invoiceId));
  }
}

export const storage = new DbStorage();
