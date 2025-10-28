

# Database Migration Guide

## Overview
This application has been migrated from in-memory storage to PostgreSQL using Drizzle ORM.

## Database Schema

### Tables Created:
1. **customers** - Customer information with billing details
2. **products** - Product catalog with HSN codes and pricing
3. **invoices** - Invoice/bill records with customer snapshots
4. **invoice_items** - Line items for each invoice
5. **locations** - City and state location history

## Migration Steps

### 1. Ensure DATABASE_URL is set
Make sure your `.env` file contains:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### 2. Push schema to database
Run the following command to create all tables:
```bash
npm run db:push
```

This will:
- Create all tables with proper schemas
- Set up UUID primary keys with gen_random_uuid()
- Add timestamp columns with automatic defaults
- Configure all foreign key relationships

### 3. Verify migration
The application will automatically:
- Seed default products (8 coco peat products)
- Seed default locations (TAMIL NADU states)
- Start accepting customer and invoice data

## Key Changes

### Storage Implementation
- **Before**: `MemStorage` class using in-memory Maps
- **After**: `DbStorage` class using Drizzle ORM queries
- **Interface**: Same `IStorage` interface - no API changes needed

### Data Persistence
- All data now persists across server restarts
- Automatic UUID generation for all records
- Timestamps track creation times
- Foreign key relationships maintained

### Seed Data
Default data automatically seeded on first run:
- 8 predefined coco peat products
- 2 default state locations (TAMIL NADU in English and Tamil)

## Database Operations

### Customer Operations
- `getAllCustomers()` - Fetch all customers
- `getCustomer(id)` - Get single customer
- `createCustomer(data)` - Add new customer
- `updateCustomer(id, data)` - Update customer
- `deleteCustomer(id)` - Remove customer
- `findDuplicateCustomer(name, shopName)` - Check duplicates

### Product Operations
- `getAllProducts()` - Fetch all products
- `getProduct(id)` - Get single product
- `createProduct(data)` - Add new product
- `updateProduct(id, data)` - Update product
- `deleteProduct(id)` - Remove product

### Invoice Operations
- `getAllInvoices()` - Fetch all invoices
- `getInvoice(id)` - Get single invoice
- `createInvoice(data)` - Create invoice
- `updateInvoice(id, data)` - Update invoice
- `deleteInvoice(id)` - Remove invoice (cascades to items)
- `getInvoicesByDateRange(start, end)` - Filter by date
- `getNextInvoiceNumber()` - Auto-increment invoice numbers

### Invoice Item Operations
- `createInvoiceItem(data)` - Add line item
- `getInvoiceItems(invoiceId)` - Get all items for invoice
- `deleteInvoiceItems(invoiceId)` - Remove all items

### Location Operations
- `getLocations(type)` - Get unique cities or states
- `addLocation(data)` - Add new location (deduped)

## Testing

After migration, verify:
1. Navigate to Create Bill page
2. Create a new customer
3. Select products from catalog
4. Generate an invoice
5. Navigate to Dashboard
6. Verify all data persists after server restart

## Rollback

If needed to rollback to in-memory storage:
1. The old `MemStorage` class is preserved in git history
2. Simply change `export const storage = new DbStorage()` to `export const storage = new MemStorage()` in `server/storage.ts`

## Notes

- All primary keys use UUID (varchar) with gen_random_uuid()
- All timestamps use timestamp with defaultNow().notNull()
- Invoice numbers auto-increment per year (INV-2025-00001)
- Duplicate customer detection by shop name (case-insensitive)
- Location deduplication (case-insensitive)
