# Design Guidelines: Ayesha Coco Pith Billing System

## Design Approach
**Reference-Based Approach**: Modern SaaS billing systems (inspired by Stripe Dashboard, QuickBooks Online, FreshBooks) with emphasis on professional credibility, workflow efficiency, and data clarity. The multi-step checkout pattern draws from e-commerce leaders while maintaining B2B professional aesthetics.

## Core Design Principles
1. **Progressive Disclosure**: Multi-step workflow reduces cognitive load
2. **Visual Feedback**: Clear state changes, hover effects, and progress tracking
3. **Professional Trust**: Polished gradients, shadows, and animations convey reliability
4. **Data Clarity**: Clean tables, obvious hierarchies, easy-to-scan summaries

---

## Typography System

**Font Family**: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif (system fonts for reliability)

**Hierarchy**:
- **Page Title (H1)**: 2.5rem (40px), bold, used in header
- **Section Headers (H2)**: 2rem (32px), bold, card titles
- **Subsection Headers (H3)**: 1.3rem (21px), bold, form sections
- **Body Text**: 1rem (16px), normal weight
- **Labels**: 1rem, 600 weight, #374151
- **Emphasized Text**: 1.1rem, 600 weight for key information

---

## Layout System

**Spacing Primitives**: Tailwind units of 4, 8, 12, 16, 20, 24, 32
- Card padding: 2rem (32px)
- Section margins: 1.5rem-2rem between major sections
- Input/button padding: 0.75rem-1rem vertical, 2rem horizontal
- Grid gaps: 1rem standard, 2rem for major separations

**Container Structure**:
- Maximum width: 1400px centered
- Two-column layout: 2fr (main content) + 1fr (summary sidebar)
- Cards use full width within their column
- Mobile: Single column stack

**Breakpoint**: 768px for mobile-to-desktop transition

---

## Color Palette

**Primary Gradient**: Linear gradient 135deg from #667eea (purple-blue) to #764ba2 (deep purple)
- Applied to: Header, buttons, step indicators, table headers, toggle active state

**Backgrounds**:
- Body: Primary gradient
- Cards: White (#ffffff)
- Hover states: #f9fafb (light gray)
- Information boxes: #f0f9ff (light blue)
- Inactive elements: #e5e7eb (medium gray)

**Text Colors**:
- Primary: #1f2937 (dark gray for headers)
- Secondary: #374151 (medium dark for labels)
- Inactive: #9ca3af (gray for disabled states)

**Accent Colors**:
- Success: Linear gradient #10b981 to #059669 (green)
- Danger: #ef4444 to #dc2626 (red for delete buttons)

**Borders**: #e5e7eb standard, #667eea for focus states

---

## Component Library

### 1. Cards (`.card`)
- Background: White
- Border radius: 20px
- Box shadow: 0 10px 30px rgba(0,0,0,0.1)
- Padding: 2rem all sides
- Margin bottom: 2rem for stacking

### 2. Buttons

**Primary Button** (`.btn-primary`):
- Gradient background (primary gradient)
- White text, 600 weight
- Padding: 1rem vertical, 2rem horizontal
- Border radius: 10px
- Hover: translateY(-2px), shadow 0 5px 20px rgba(102, 126, 234, 0.4)
- Full width by default

**Secondary Button** (`.btn-secondary`):
- Background: #f3f4f6, hover: #e5e7eb
- Text: #374151
- Same padding and radius as primary

**Success Button** (`.btn-success`):
- Green gradient background
- Same structure as primary with green shadow on hover

**Delete Button** (`.delete-btn`):
- Red background (#ef4444), hover: #dc2626
- Smaller padding: 0.5rem vertical, 1rem horizontal
- Border radius: 5px

### 3. Form Elements

**Inputs & Selects**:
- Width: 100% of container
- Padding: 0.75rem
- Border: 2px solid #e5e7eb
- Border radius: 8px
- Font size: 1rem
- Focus state: Border #667eea, shadow 0 0 0 3px rgba(102, 126, 234, 0.1)

**Labels**:
- Display: block
- Font weight: 600
- Margin bottom: 0.5rem
- Color: #374151

### 4. Step Indicators
- Size: 50px × 50px circles
- Active: Gradient background, white text, shadow 0 4px 15px rgba(102, 126, 234, 0.4)
- Inactive: #e5e7eb background, #9ca3af text
- Connected by 50px × 3px lines (rgba(255,255,255,0.3))
- Horizontal layout with 1rem gaps

### 5. Toggle Switch
- Width: 60px, height: 34px
- Slider: Border radius 34px (pill shape)
- Button: 26px × 26px circle, 4px offset from edges
- Inactive: #ccc background
- Active: Primary gradient, button translates 26px right

### 6. Product Cards (`.product-card`)
- White background
- Border radius: 15px
- Padding: 1.5rem
- Box shadow: 0 4px 15px rgba(0,0,0,0.1)
- Border: 2px transparent, changes to #667eea on hover
- Hover: translateY(-5px), enhanced shadow

### 7. Tables
- Full width, collapsed borders
- Header: Primary gradient background, white text
- Cell padding: 0.75rem
- Row borders: 1px solid #e5e7eb between rows
- Hover: #f9fafb background

### 8. Summary Box (Sticky Sidebar)
- White background
- Border radius: 20px
- Padding: 1.5rem
- Box shadow: 0 10px 30px rgba(0,0,0,0.1)
- Position: sticky, top: 20px

### 9. Modal Dialogs
- Overlay: rgba(0,0,0,0.5) full viewport
- Content: White, 2rem padding, 20px border radius
- Max width: 500px
- Centered with flexbox
- Animation: slideIn (translateY from -50px, fade in)

### 10. Header Component
- Primary gradient background
- White text
- Padding: 2rem
- Border radius: 0 0 30px 30px (rounded bottom corners)
- Box shadow: 0 5px 20px rgba(0,0,0,0.1)
- Centered text
- Company icon: 🥥 emoji

---

## Animations & Transitions

**Standard Transition**: `all 0.3s ease` for most interactive elements

**Button Hovers**: Subtle lift (translateY -2px) + shadow enhancement

**Card Hovers**: translateY -5px for product cards

**Modal Entry**: slideIn animation (0.3s ease)

**Loading Spinner**: 1s linear infinite rotation, purple top border

**Toggle Switch**: 0.4s transition for background and slider movement

**Minimize Usage**: Animations used purposefully for feedback, not decoration

---

## Grid Layouts

**Two-Column Grid** (`.grid-2`):
- Desktop: 2 equal columns (repeat(2, 1fr))
- Gap: 1rem
- Mobile: Single column stack

**Main Layout Grid**:
- Desktop: 2fr main content + 1fr sidebar
- Gap: 2rem
- Mobile: Single column stack

---

## Workflow UX Pattern

**Multi-Step Process**:
1. **Configuration**: Bill date, GST toggle
2. **Customer**: Select existing or add new customer details
3. **Products**: Browse catalog, add items with quantities
4. **Review**: Summary table, totals, PDF generation

**Navigation**:
- Forward: "Next: [Step Name] →" buttons
- Backward: "← Back to [Previous Step]" links
- Progress: Visual step indicators always visible
- No skipping steps (enforced linear flow)

**State Management**:
- Active step displayed, others hidden
- Progress indicators update (active/inactive classes)
- Summary sidebar shows real-time totals
- Form validation before advancing steps

---

## Data Display Patterns

**Summary Information**:
- Large, bold numbers for totals
- Clear labels with adequate spacing
- Hierarchical presentation (subtotal → GST → grand total)
- Currency formatting with ₹ symbol

**Product Listings**:
- Tabular format for added items
- Icons for product types
- Inline quantity/price editing
- Delete action per row

**Customer Information**:
- Dropdown for existing customers (auto-fill on selection)
- Clear separation between "select existing" and "add new"
- Optional fields clearly marked

---

## Accessibility & Usability

- Focus states with visible outlines and shadows
- Sufficient color contrast on all text
- Clear active/inactive states
- Descriptive labels on all inputs
- Responsive touch targets (minimum 44px for buttons)
- Keyboard navigation supported through native elements
- Loading states with spinner for async operations

---

## Images
This application does not use imagery. It's a data-driven business tool focused on forms, tables, and calculations. Visual interest comes from gradients, shadows, and polish rather than photography.