# Ayesha Coco Pith - Professional Billing System

## Overview
A professional billing system for Ayesha Coco Pith, featuring customer management, product catalog, GST calculations, and PDF invoice generation with a beautiful purple gradient theme.

## Project Architecture

### Frontend
- **React** with TypeScript for type-safe UI components
- **Tailwind CSS** with custom purple gradient theme (#667eea to #764ba2)
- **Shadcn/ui** components for consistent, accessible UI
- **TanStack Query** for efficient data fetching and caching
- **Wouter** for lightweight routing

### Backend
- **Express.js** REST API
- **In-memory storage** (MemStorage) for development
- **Drizzle ORM** for type-safe database schemas
- **Zod** for runtime validation

### Key Features
1. **Multi-step Billing Workflow**
   - Step 1: Configuration (Bill date, GST toggle)
   - Step 2: Customer Information (Select existing or add new)
   - Step 3: Product Selection (Interactive catalog)
   - Step 4: Review & Additional Charges

2. **Customer Management**
   - Save customer details (name, shop, phone, GSTIN, address)
   - Quick selection from existing customers
   - Auto-fill customer information
   - Input validation rules with character limits:
     - Shop name: max 50 chars, letters and numbers only (REQUIRED - only mandatory field)
     - Name: max 50 chars, letters only (optional, auto-filtered)
     - Phone: max 10 chars, numbers only (optional, auto-filtered)
     - GSTIN: max 15 chars, alphanumeric, no spaces (optional, auto-filtered)
     - Address: max 200 chars, textarea (optional)
     - City: max 40 chars, letters only (optional, auto-filtered)
     - State: max 40 chars, letters only (optional, auto-filtered)
     - Postal Code: max 15 chars (optional)
   - Duplicate customer detection (prevents saving customers with same shop name)
   - Comprehensive error messages for validation failures

3. **Shipping Information**
   - Separate billing and shipping addresses
   - Option to use billing address as shipping address
   - Support for selecting existing customers for shipping

4. **Product Catalog**
   - Pre-defined products with HSN codes
   - Default pricing
   - Interactive product cards with hover effects

5. **Invoice Generation**
   - Real-time calculation of subtotals
   - GST (18%) toggle and calculation
   - Additional charges (transport, packaging, other)
   - Lorry/vehicle number tracking
   - PDF export functionality (planned)

6. **Beautiful UI/UX**
   - Purple gradient background (#667eea to #764ba2)
   - Rounded cards with shadows
   - Smooth transitions and hover effects
   - Progress indicators for multi-step process
   - Full-width Current Bill section below main content
   - Fully responsive design optimized for laptops, tablets, and mobiles
   - Single-column vertical layout for consistent experience across all devices

## Data Models

### Customer
- id, name, shopName, phone, gstin, address, city, state, postalCode, createdAt

### Product
- id, name, description, hsn, defaultPrice, unit

### Invoice
- id, invoiceNumber, billDate, customer details, items, charges, totals

### InvoiceItem
- id, invoiceId, productId, productName, hsn, quantity, price, total

## Recent Changes
- [2025-01-24] Initial project setup with schema and frontend components
- [2025-01-24] Implemented multi-step billing workflow
- [2025-01-24] Created beautiful purple gradient theme
- [2025-01-24] Added customer and product management
- [2025-01-24] Implemented complete backend with in-memory storage
- [2025-01-24] Added customer saving and invoice creation
- [2025-01-24] Integrated jsPDF for invoice generation
- [2025-01-24] Fixed customer auto-save and removed emoji usage
- [2025-01-24] MVP completed and architect-approved
- [2025-10-24] Added comprehensive input validation for customer fields
- [2025-10-24] Implemented duplicate customer detection based on shop name only
- [2025-10-24] Enhanced error handling with user-friendly validation messages
- [2025-10-24] Updated shop name validation to allow letters and numbers
- [2025-10-24] Added GSTIN validation (alphanumeric only, max 15 characters)
- [2025-10-25] Changed validation: Shop name is now the only required field in customer information
- [2025-10-25] Made customer name, phone, GSTIN, address, city, and state all optional fields
- [2025-10-25] Updated both billing and shipping customer forms to require only shop name
- [2025-10-25] Updated phone input fields to accept only numeric characters (auto-filters non-digits)
- [2025-10-25] Updated GSTIN input fields to max 15 characters and auto-remove spaces
- [2025-10-25] Added comprehensive field constraints:
  - Shop name: max 50 characters
  - Customer name: max 50 characters, letters only (auto-filtered)
  - Phone: max 10 characters, numbers only (auto-filtered)
  - GSTIN: max 15 characters, no spaces (auto-removed)
  - Address: textarea with max 200 characters
  - City: max 40 characters, letters only (auto-filtered)
  - State: max 40 characters, letters only (auto-filtered)
  - Added Postal Code field: max 15 characters
- [2025-10-25] All constraints apply to both billing and shipping sections
- [2025-10-25] Implemented fully responsive layout for laptops, tablets, and mobiles
- [2025-10-25] Restructured layout from grid to vertical flex for single-column design
- [2025-10-25] Moved Current Bill section from right sidebar to full-width section below main content
- [2025-10-25] All devices now use a consistent vertical layout with the bill summary always visible at the bottom
- [2025-10-25] Optimized mobile touch targets to meet 44px accessibility standard:
  - All interactive buttons (quantity +/-, delete, navigation) now h-11 (44px) on mobile
  - All input fields increased to h-11 on mobile for better usability
  - Navigation buttons stack vertically on mobile with responsive text sizing
  - PDF button text adapts: "Download PDF" on mobile, "Generate & Download PDF" on larger screens
  - Improved spacing and padding for mobile devices
- [2025-10-25] Implemented comprehensive Management Dashboard:
  - Three-tab interface: Customers, Products, and Bills
  - Full CRUD operations for all entities (Create, Read, Update, Delete)
  - Server-side date range filtering for bills
  - Dialog-based forms using shared schemas from @shared/schema.ts
  - Proper cache invalidation for filtered queries
  - Navigation between Billing and Dashboard pages
  - Removed "State" column from customer table display
- [2025-10-25] Added customer filtering and sorting in dashboard:
  - Search by shop name or contact name (combined search field)
  - Search by phone number
  - Filter by city (dropdown with unique cities from customer data)
  - Sort options: A to Z, Z to A, New to Old, Old to New
  - Real-time filtering and sorting with results counter
  - Added createdAt timestamp to customer schema for chronological sorting
  - Clear buttons on search fields for better UX
- [2025-10-26] Fixed critical PDF generation pagination issues:
  - Refactored PDF generator with reusable header functions (drawPageBorder, drawCompanyHeader, drawInvoiceDetails, drawCustomerDetails)
  - Fixed missing headers on overflow pages: All pages now include complete borders, company logo/name, invoice details, and bill-to/ship-to information
  - Optimized space utilization: Changed pagination threshold from pageHeight-80 to pageHeight-25, allowing 18-20 products per page (previously 7-8)
  - Eliminated wasted space at bottom of pages - products now fill available space efficiently
  - Unified page header logic across all pagination scenarios for consistency
  - All PDF pages now maintain professional formatting with complete information

## Development Status
- ✅ Schema and data models defined
- ✅ Frontend components built with beautiful UI
- ✅ Backend API implementation completed
- ✅ Integration and PDF generation completed
- ✅ Customer auto-save on invoice creation
- ✅ All emojis replaced with Lucide icons
- ✅ MVP fully functional and tested

## Technical Highlights
- **Type-safe data flow** - Shared TypeScript types between frontend and backend
- **Real-time calculations** - GST, charges, and totals update instantly
- **Auto-save customer** - Ensures data integrity before invoice creation
- **Professional PDF** - Clean invoice layout with company branding
- **Purple gradient theme** - Beautiful, modern UI with smooth animations
- **Responsive design** - Works perfectly on all screen sizes
- **8 pre-seeded products** - Ready-to-use product catalog
- **Input validation** - Both client and server-side validation for data integrity
- **Duplicate prevention** - Smart duplicate detection to avoid data redundancy
