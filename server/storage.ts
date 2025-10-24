import {
  type Customer,
  type InsertCustomer,
  type Product,
  type InsertProduct,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  findDuplicateCustomer(name: string, shopName: string | null): Promise<Customer | undefined>;

  // Product operations
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Invoice operations
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getNextInvoiceNumber(): Promise<string>;

  // Invoice items operations
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]>;
}

export class MemStorage implements IStorage {
  private customers: Map<string, Customer>;
  private products: Map<string, Product>;
  private invoices: Map<string, Invoice>;
  private invoiceItems: Map<string, InvoiceItem>;
  private invoiceCounter: number;

  constructor() {
    this.customers = new Map();
    this.products = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.invoiceCounter = 1;

    this.seedProducts();
  }

  private seedProducts() {
    const defaultProducts = [
      {
        name: "5kg Coco Peat Block",
        description: "Compressed 5kg coco peat block, high quality" as string | null,
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
    ];

    defaultProducts.forEach((product) => {
      const id = randomUUID();
      const productWithId: Product = { 
        ...product,
        id,
        description: product.description || null
      };
      this.products.set(id, productWithId);
    });
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      id,
      name: insertCustomer.name,
      shopName: insertCustomer.shopName || null,
      phone: insertCustomer.phone || null,
      gstin: insertCustomer.gstin || null,
      address: insertCustomer.address || null,
      city: insertCustomer.city || null,
      state: insertCustomer.state || null,
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(
    id: string,
    updates: Partial<InsertCustomer>
  ): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;

    const updated = { ...customer, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async findDuplicateCustomer(name: string, shopName: string | null): Promise<Customer | undefined> {
    if (!shopName || !shopName.trim()) {
      return undefined;
    }
    
    const normalizedShopName = shopName.trim().toLowerCase();
    
    return Array.from(this.customers.values()).find(customer => {
      const customerShopName = customer.shopName?.trim().toLowerCase() || null;
      
      return customerShopName === normalizedShopName;
    });
  }

  // Product operations
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      id,
      name: insertProduct.name,
      description: insertProduct.description || null,
      hsn: insertProduct.hsn,
      defaultPrice: insertProduct.defaultPrice,
      unit: insertProduct.unit,
      gstRate: insertProduct.gstRate || "0",
    };
    this.products.set(id, product);
    return product;
  }

  // Invoice operations
  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      id,
      invoiceNumber: insertInvoice.invoiceNumber,
      billDate: insertInvoice.billDate,
      customerId: insertInvoice.customerId,
      customerName: insertInvoice.customerName,
      shopName: insertInvoice.shopName || null,
      phone: insertInvoice.phone || null,
      gstin: insertInvoice.gstin || null,
      address: insertInvoice.address || null,
      city: insertInvoice.city || null,
      state: insertInvoice.state || null,
      shippingName: insertInvoice.shippingName || null,
      shippingShopName: insertInvoice.shippingShopName || null,
      shippingPhone: insertInvoice.shippingPhone || null,
      shippingGstin: insertInvoice.shippingGstin || null,
      shippingAddress: insertInvoice.shippingAddress || null,
      shippingCity: insertInvoice.shippingCity || null,
      shippingState: insertInvoice.shippingState || null,
      subtotal: insertInvoice.subtotal,
      transport: insertInvoice.transport || "0",
      packaging: insertInvoice.packaging || "0",
      otherCharges: insertInvoice.otherCharges || "0",
      gstEnabled: insertInvoice.gstEnabled ?? true,
      gstAmount: insertInvoice.gstAmount || "0",
      grandTotal: insertInvoice.grandTotal,
      lorryNumber: insertInvoice.lorryNumber || null,
      createdAt: new Date(),
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async getNextInvoiceNumber(): Promise<string> {
    const number = this.invoiceCounter++;
    const year = new Date().getFullYear();
    return `INV-${year}-${String(number).padStart(5, "0")}`;
  }

  // Invoice items operations
  async createInvoiceItem(insertItem: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = randomUUID();
    const item: InvoiceItem = { 
      ...insertItem, 
      id,
      gstRate: insertItem.gstRate || "0",
      gstAmount: insertItem.gstAmount || "0",
    };
    this.invoiceItems.set(id, item);
    return item;
  }

  async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(
      (item) => item.invoiceId === invoiceId
    );
  }
}

export const storage = new MemStorage();
