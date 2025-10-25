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
   - Input validation rules:
     - Shop name: letters and numbers only (REQUIRED - only mandatory field)
     - Name: letters only (optional)
     - Phone: exactly 10 digits (optional)
     - GSTIN: letters and numbers only, max 15 characters (optional)
     - City & State: letters only (optional)
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
   - Sticky summary sidebar with real-time updates
   - Responsive design for all screen sizes

## Data Models

### Customer
- id, name, shopName, phone, gstin, address, city, state

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
