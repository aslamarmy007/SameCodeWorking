# Ayesha Coco Pith - Professional Billing System

## Overview
A professional billing system for Ayesha Coco Pith, designed to streamline billing operations. It features comprehensive customer and product management, real-time GST calculations, and the ability to generate professional PDF invoices. The system boasts a modern, responsive user interface with a distinctive purple gradient theme, aiming to enhance efficiency and provide a polished user experience for businesses.

## User Preferences
- All UI/UX decisions should adhere to the established purple gradient theme (#667eea to #764ba2), including rounded cards, shadows, and smooth transitions.
- The system requires a multi-step billing workflow (Configuration, Customer Information, Product Selection, Review & Additional Charges).
- Customer management needs robust input validation, duplicate detection (by shop name), and auto-fill capabilities.
- Shipping information must allow separate addresses with an option to use the billing address.
- The product catalog should be interactive, category-wise, with initial limited display and an expand/collapse feature.
- A comprehensive filter system for products (category, name, HSN, unit type, GST rate, price range) is required, identical to the product management dashboard.
- Invoice generation must include real-time calculations for subtotals, GST, and additional charges, with PDF export capability.
- The design must be fully responsive, optimized for all devices (laptops, tablets, mobiles), featuring a single-column vertical layout for consistency, with the current bill section always visible.
- Mobile accessibility standards (44px touch targets) should be met for all interactive elements.
- The system requires comprehensive Tamil language support, including font rendering in PDFs, conditional translations, and support for Tamil characters in input fields like shop names and categories.
- Location history with combobox UI for city/state fields and deduplication is essential.
- Product categories must be mandatory, support Tamil/English, and have an autocomplete feature.
- Multi-select filters for category, HSN, unit type, and GST rate are needed in both product management and billing.
- The system should maintain a clean, professional PDF invoice layout with company branding.

## System Architecture
The application is built with a client-server architecture. The frontend is developed using **React** with **TypeScript**, styled with **Tailwind CSS** and **Shadcn/ui** components, leveraging **TanStack Query** for data fetching and **Wouter** for routing. The backend is an **Express.js** REST API, utilizing **Drizzle ORM** for database interaction (with in-memory storage for development) and **Zod** for runtime validation.

Key architectural decisions include:
- **UI/UX:** A distinct purple gradient theme (#667eea to #764ba2) is applied across all components, featuring rounded cards, shadows, and smooth animations. The design is fully responsive, adapting to laptops, tablets, and mobiles with a consistent single-column vertical layout where the current bill summary remains visible at the bottom. Mobile-specific optimizations include increased touch target sizes (44px) and adaptive button text.
- **Multi-step Billing Workflow:** Structured into four distinct steps for configuration, customer selection, product selection, and review.
- **Customer Management:** Includes robust client and server-side validation with specific character limits and type constraints (e.g., shop name alphanumeric, phone numeric). Duplicate customer detection is implemented based on the shop name.
- **Product Catalog:** Products are organized by categories, with an initial display of 3 products per category and an expandable "Show All" feature. A comprehensive filtering system (category, name, HSN, unit type, GST rate, price range) is integrated, mirroring the functionality in the product management dashboard.
- **Invoice Generation:** Real-time calculation of subtotals, GST (18% toggle), and additional charges (transport, packaging). PDF export functionality is planned, with professional formatting, proper pagination, and consistent headers across all pages.
- **Data Models:** Core entities include `Customer`, `Product`, `Invoice`, and `InvoiceItem`, with defined fields for comprehensive data management.
- **Internationalization (i18n):** Explicit support for Tamil language, including font rendering in PDFs, conditional translation for "India," and allowing Tamil characters in relevant input fields. Location history is managed with a dedicated schema and combobox UI for city/state fields.
- **Management Dashboard:** A three-tab interface (Customers, Products, Bills) for full CRUD operations, featuring server-side filtering, sorting, and efficient cache invalidation.
- **Type-safe Data Flow:** Achieved by sharing TypeScript types between the frontend and backend, ensuring data integrity.

## External Dependencies
- **React:** Frontend library.
- **TypeScript:** For type-safe development.
- **Tailwind CSS:** For styling and theming.
- **Shadcn/ui:** UI component library.
- **TanStack Query:** For data fetching and caching.
- **Wouter:** For client-side routing.
- **Express.js:** Backend web framework.
- **Drizzle ORM:** For database interaction.
- **Zod:** For schema validation.
- **jsPDF:** For PDF generation (planned).
- **NotoSansTamil font:** For rendering Tamil characters in PDFs.

## Recent Changes
- [2025-10-29] Implemented purchase bill functionality:
  - Added billType field to invoice schema to differentiate between "sale" and "purchase" bills
  - Added shippingToMyself field to conditionally hide shipping section in PDFs
  - Implemented bill type selector in Step 1 (Config) with "Sale Bill" and "Purchase Bill" options
  - Created conditional UI rendering: "Customer" labels for sale bills, "Buyer" labels for purchase bills
  - Updated PDF generator to show "From: Buyer Details" for purchase bills
  - Implemented conditional shipping section in PDFs - hidden when "shipping to myself" is checked
  - Created dedicated Purchase Bills page with filtering by date range
  - Added navigation link for Purchase Bills in main navigation
  - Implemented predicate-based cache invalidation to properly refresh filtered queries after mutations
  
- [2025-10-29] Implemented searchable comboboxes for customer selection in billing workflow:
  - Replaced simple Select dropdowns with searchable Popover/Command/CommandItem components
  - Added searchable customer selection for both "Billing To" and "Shipping To" sections
  - Customers can now be searched by shop name, customer name, or phone number
  - Implemented controlled state management for proper popover open/close behavior
  - Added aria-expanded attribute for accessibility compliance
  - Search functionality concatenates all customer fields for comprehensive matching
  - Popover automatically closes after customer selection
  - Display shows selected customer's shop name with checkmark indicator
  - Both comboboxes follow shadcn/ui best practices with proper UX patterns

- [2025-10-30] Enhanced payment and billing features:
  - **Transport Type Made Mandatory**: Added validation requiring transport type selection before PDF generation, with visual red asterisk indicator
  - **Enhanced Current Bill Display**: Shows individual charge names (Packing Charge, Transport Charge, Other Charges) instead of aggregate "Charges"
  - **Round-Off Functionality**: Automatic round-off to nearest whole number with color-coded display (green for positive, red for negative)
  - **Advanced Payment Methods**: Three payment options - Cash, Online Payment, and Partial Payment (Cash + Online split)
  - **Partial Payment Split**: When Partial Payment method is selected, shows dedicated inputs for cash and online amounts with real-time validation
  - **Balance Credit Display**: Prominently shows balance credit amount in both payment dialog and current bill summary when applicable
  - **Payment Information in Current Bill**: Displays payment method, cash/online split amounts, and balance credit directly in the bill summary
  - **Schema Enhancements**: Added cashAmount, onlineAmount, and roundOff fields to invoices table for comprehensive payment tracking

- [2025-10-30] Implemented multi-level product sorting with independent name and date filters:
  - **Dual Sort Filters**: Two independent sort comboboxes - "Sort by Name" and "Sort by Date" after GST Rate filter
  - **Independent Selection**: Users can select from both name (A to Z / Z to A) and date (New to Old / Old to New) options simultaneously
  - **Multi-level Sorting Logic**: Date sorting applied first as primary sort, name sorting as secondary sort when dates match or if only name sort is selected
  - **State Management**: Separate state variables for name and date sorting (productNameSortOption, productDateSortOption) with individual combo open states
  - **Clear Filters Integration**: Updated "Clear Filters" button clears both sort options along with other filters
  - **UI Consistency**: Both filters follow established Popover/Command combobox pattern with proper accessibility attributes