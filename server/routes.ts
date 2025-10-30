import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertProductSchema, insertInvoiceSchema, insertInvoiceItemSchema, insertLocationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Customer routes
  app.get("/api/customers", async (_req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validated = insertCustomerSchema.parse(req.body);
      
      // Check for duplicate customer
      const duplicate = await storage.findDuplicateCustomer(
        validated.name,
        validated.shopName || null
      );
      
      if (duplicate) {
        return res.status(409).json({ 
          error: "Customer already exists",
          message: "A customer with this shop name already exists" 
        });
      }
      
      const customer = await storage.createCustomer(validated);
      res.status(201).json(customer);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Validation error",
          message: error.errors[0]?.message || "Invalid customer data",
          details: error.errors
        });
      }
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validated = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validated);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Product routes
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validated = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validated);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Validation error",
          message: error.errors[0]?.message || "Invalid product data",
          details: error.errors
        });
      }
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validated = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validated);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (_req, res) => {
    try {
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/drafts/all", async (_req, res) => {
    try {
      const drafts = await storage.getDraftInvoices();
      res.json(drafts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch draft invoices" });
    }
  });

  app.get("/api/invoices/pending/all", async (_req, res) => {
    try {
      const pending = await storage.getPendingPaymentInvoices();
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pending payment invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const { items, ...invoiceData } = req.body;

      // Get next invoice number
      const invoiceNumber = await storage.getNextInvoiceNumber();

      // Validate invoice data
      const validatedInvoice = insertInvoiceSchema.parse({
        ...invoiceData,
        invoiceNumber,
      });

      // Create invoice
      const invoice = await storage.createInvoice(validatedInvoice);

      // Create invoice items
      if (items && Array.isArray(items)) {
        for (const item of items) {
          const validatedItem = insertInvoiceItemSchema.parse({
            ...item,
            invoiceId: invoice.id,
            quantity: item.quantity.toString(),
          });
          await storage.createInvoiceItem(validatedItem);
        }
      }

      // Get complete invoice with items
      const invoiceItems = await storage.getInvoiceItems(invoice.id);

      res.status(201).json({
        invoice,
        items: invoiceItems,
      });
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const { items, ...invoiceData } = req.body;
      const validated = insertInvoiceSchema.partial().parse(invoiceData);
      const invoice = await storage.updateInvoice(req.params.id, validated);
      
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      if (items && Array.isArray(items)) {
        await storage.deleteInvoiceItems(invoice.id);
        for (const item of items) {
          const validatedItem = insertInvoiceItemSchema.parse({
            ...item,
            invoiceId: invoice.id,
            quantity: item.quantity.toString(),
          });
          await storage.createInvoiceItem(validatedItem);
        }
      }

      const invoiceItems = await storage.getInvoiceItems(invoice.id);
      res.json({ invoice, items: invoiceItems });
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(400).json({ error: "Invalid invoice data" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvoice(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  });

  app.get("/api/invoices/filter/date-range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate are required" });
      }

      const invoices = await storage.getInvoicesByDateRange(
        startDate as string,
        endDate as string
      );
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to filter invoices" });
    }
  });

  app.get("/api/invoices/:id/items", async (req, res) => {
    try {
      const items = await storage.getInvoiceItems(req.params.id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoice items" });
    }
  });

  // Location routes
  app.get("/api/locations/:type", async (req, res) => {
    try {
      const type = req.params.type;
      if (type !== "city" && type !== "state" && type !== "lorry_service") {
        return res.status(400).json({ error: "Type must be 'city', 'state', or 'lorry_service'" });
      }
      const locations = await storage.getLocations(type);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validated = insertLocationSchema.parse(req.body);
      const location = await storage.addLocation(validated);
      res.status(201).json(location);
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ 
          error: "Validation error",
          message: error.errors[0]?.message || "Invalid location data",
          details: error.errors
        });
      }
      res.status(400).json({ error: "Invalid location data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
