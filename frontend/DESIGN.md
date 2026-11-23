# Design System Specification: Simple SIMRS

This document specifies the visual theme, semantic color palette, typography hierarchy, component styling rules, and layout constraints for Simple SIMRS. Follow these specifications to maintain visual consistency, light mode integrity, and accessibility across all hospital management surfaces.

**Project ID:** simple-simrs-frontend

## Visual Theme and Atmosphere

Simple SIMRS delivers an interface for healthcare facilities that emphasizes clinical precision, clarity, and accessibility.

Healthcare practitioners, including physicians, nurses, pharmacists, and administrative personnel, process high volumes of clinical records under strict time constraints. The visual design enforces three guiding principles:

- **Light Mode Only**: Disallow dark mode to guarantee legibility for numerical records, triage alerts, and patient histories under clinical facility lighting.
- **Zero Decorative Clutter**: Remove non-functional gradients, heavy drop shadows, and ornamental borders.
- **High Data Scannability**: Highlight vital fields including Medical Record Numbers, attending physicians, service status, and diagnoses using consistent typographic rhythm and contrast.

## Color Palette and Semantic Tokens

The interface defines colors using semantic CSS custom properties in `src/index.css` alongside Astryx theme tokens. All text and background pairings meet Web Content Accessibility Guidelines (WCAG) 2.2 AA contrast standards, providing at least 4.5:1 contrast for normal text and 3:1 for large text.

| Color Name | Token and Value | Functional Role |
| :--- | :--- | :--- |
| **Slate Command Dark** | `var(--color-text-main)` (`#0f172a`) | Primary headings, table text, and form inputs with 12.6:1 contrast on white |
| **Subdued Muted Slate** | `var(--color-text-secondary)` (`#64748b`) | Secondary descriptions, timestamps, table column headers, and physician titles |
| **Whisper Boundary Gray** | `var(--color-text-muted)` (`#94a3b8`) | Helper annotations, input placeholder strings, and inactive icons |
| **Deep Clinical Teal** | `var(--color-primary)` (`#0d9488`) | Brand accent, primary action buttons, active navigation indicators |
| **Clinical Teal Hover** | `var(--color-primary-hover)` (`#0f766e`) | Hover and active focus states on primary interaction targets |
| **Soft Medical Cyan Wash** | `var(--color-primary-light)` (`#f0fdfa`) | Active sidebar item backgrounds, medical record code tags, selected rows |
| **Cyan Accent Border** | `var(--color-primary-border)` (`#ccfbf1`) | Subtle outlines around medical record tags and active indicator pills |
| **Crisp Sterile White** | `var(--color-surface)` (`#ffffff`) | Card containers, modal sheets, top header bars, and table cell backgrounds |
| **Calm Clinical Canvas** | `var(--color-bg)` (`#f8fafc`) | Main background surface, sidebar container, and breadcrumb bar |
| **Clean Boundary Gray** | `var(--color-border)` (`#e2e8f0`) | Card borders, form dividers, table grid lines, and structural separators |
| **Subdued Header Fill** | `var(--color-surface-hover)` (`#f1f5f9`) | Table sticky headers, card title headers, and row hover highlights |
| **Vitality Emerald** | `var(--color-success)` (`#16a34a`) | Completed discharge status text, success indicators, and online state dots |
| **Soft Emerald Wash** | `var(--color-success-light)` (`#dcfce7`) | Background fill for completed status badges |
| **Urgent Care Amber** | `var(--color-warning)` (`#d97706`) | Inpatient admission status text, triage warning pills, and inventory alerts |
| **Soft Amber Wash** | `var(--color-warning-light)` (`#fef3c7`) | Background fill for inpatient admission status badges |
| **Emergency Ruby** | `var(--color-error)` (`#dc2626`) | Emergency Department (Instalasi Gawat Darurat, or IGD) status, destructive actions, validation errors |
| **Soft Ruby Wash** | `var(--color-error-light)` (`#fee2e2`) | Background fill for emergency status badges and critical alert banners |
| **Diagnostic Sapphire** | `var(--color-info)` (`#2563eb`) | Outpatient ambulatory status text and informational notices |
| **Soft Sapphire Wash** | `var(--color-info-light)` (`#dbeafe`) | Background fill for outpatient status badges |

## Typography Rules

The typography system pairs geometric sans-serif typefaces for UI text with monospace typefaces for medical data codes.

### Primary and Monospace Fonts

Simple SIMRS uses two dedicated typeface families:

- **Primary Interface Font**: Figtree (`font-family: 'Figtree', sans-serif`), loaded through the `@astryxdesign/theme-neutral` package. Figtree provides geometric clarity across high and low resolution monitors.
- **Medical Code Font**: Monospace (`font-family: monospace`), reserved for Medical Record Numbers (No. RM), International Classification of Diseases, Tenth Revision (ICD-10) diagnosis codes, International Classification of Diseases, Ninth Revision, Clinical Modification (ICD-9-CM) procedure codes, and standardized hospital timestamps. Monospace figures maintain uniform tabular width across lists.

### Typographic Hierarchy

Apply these sizes and weights to text elements:

- **Page Titles**: `20px - 24px`, font weight `700`, letter spacing `-0.02em`, color `var(--color-text-main)` (`#0f172a`)
- **Section and Modal Headings**: `16px - 18px`, font weight `600`, letter spacing `-0.01em`, color `var(--color-text-main)` (`#0f172a`)
- **Table Column Headers**: `12px - 13px`, font weight `600`, letter spacing `0.02em`, color `var(--color-text-secondary)` (`#64748b`)
- **Body Text and Data Cells**: `13px - 14px`, font weight `400` or `500`, line height `1.5`, color `var(--color-text-main)` (`#0f172a`)
- **Metadata, Timestamps, and Breadcrumbs**: `12px - 13px`, font weight `400` or `500`, color `var(--color-text-secondary)` (`#64748b`)

## Component Styling Specifications

UI components adapt official Astryx primitives and enforce consistent geometry, padding, and interactive states.

### Buttons (`@/components/ui/Button`)

Buttons provide clear visual hierarchy across actions:

- **Geometry**: Corners use `border-radius: 8px` (`var(--radius-md)`). The target height measures at least 38px to satisfy touch target guidelines.
- **Primary Variant**: Uses Deep Clinical Teal (`#0d9488`) with solid white text for primary actions like saving records and submitting login forms.
- **Secondary Variant**: Uses Crisp Sterile White background with a 1px Clean Boundary Gray (`#e2e8f0`) border and dark slate text for secondary actions like canceling or closing modals.
- **Ghost Variant**: Uses a transparent background without borders, displaying a subtle hover highlight for sidebar toggles and pagination buttons.
- **Destructive Variant**: Uses Emergency Ruby (`#dc2626`) with solid white text for irreversible actions.
- **Focus Rings**: Display a visible focus outline (`outline: 2px solid var(--color-primary-focus)`) during keyboard navigation.

### Cards and Containers (`@/components/ui/Card`)

Cards organize related form fields and patient summaries into distinct visual blocks:

- **Geometry**: Containers use `border-radius: 12px` (`var(--radius-lg)`).
- **Surfaces**: Crisp Sterile White (`#ffffff`) background paired with a 1px Clean Boundary Gray (`#e2e8f0`) border.
- **Shadow Depth**: Diffused elevation shadow (`var(--shadow-sm)`: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)`). Avoid heavy drop shadows.

### Form Inputs (`@/components/ui/Input`)

Inputs prioritize validation visibility and keyboard navigation:

- **Geometry**: Field height measures 40px with `border-radius: 8px`.
- **Border States**: Uses a 1px Clean Boundary Gray (`#e2e8f0`) outline that transitions to Deep Clinical Teal (`#0d9488`) with an outer glow on focus.
- **Error State**: Outline changes to Emergency Ruby (`#dc2626`) with descriptive error text linked via accessibility attributes.

### Data Tables (`@/components/ui/DataTable`)

The data table component provides fluid scrolling across high-density clinical datasets:

- **Sticky Header**: Pins to `top: 0` with `z-index: 10` using Subdued Header Fill (`#f1f5f9`).
- **Sticky Right Action Column**: Pins to `right: 0` with `z-index: 5` using solid white background and an elevation shadow (`box-shadow: -4px 0 8px -2px rgba(15, 23, 42, 0.06)`).
- **Intersection Anchor**: Pins the top-right header cell to `top: 0` and `right: 0` with `z-index: 20` to prevent visual collision during diagonal scrolling.
- **Padding and Rhythm**: Cells use `12px 16px` padding with vertical alignment centered.
- **Hover Highlights**: Rows switch to Soft Medical Cyan Wash (`#f0fdfa`) on cursor hover for immediate visual feedback.

### Status Badges (`@/components/ui/Badge`)

Badges communicate triage urgency and patient workflow states:

- **Pill Shape**: Uses full circular pill geometry (`border-radius: 9999px`) with `2px 10px` padding and `12px` font size.
- **Inpatient Status**: Urgent Care Amber (`#d97706`) on Soft Amber Wash (`#fef3c7`).
- **Outpatient Status**: Diagnostic Sapphire (`#2563eb`) on Soft Sapphire Wash (`#dbeafe`).
- **Emergency Department (IGD) Status**: Emergency Ruby (`#dc2626`) on Soft Ruby Wash (`#fee2e2`).
- **Completed Status**: Vitality Emerald (`#16a34a`) on Soft Emerald Wash (`#dcfce7`).

### Navigation and Shell Structure

The layout provides clear structural boundaries between navigation and active work surfaces:

- **Sidebar**: Desktop width measures 260px with a Calm Clinical Canvas (`#f8fafc`) background and a 1px right border (`#e2e8f0`). Active menu items display Soft Medical Cyan Wash (`#f0fdfa`) with Deep Clinical Teal text and matching icons.
- **Top Header**: Height measures 64px at `sticky top: 0`, using Crisp Sterile White (`#ffffff`) background, 1px bottom border (`#e2e8f0`), and subtle elevation.
- **Breadcrumb Navigation**: Renders inside `<nav aria-label="Breadcrumb">` using chevron separators. The final item represents the active page as unclickable text.

## Layout Principles and Spacing Strategy

All layout spacing follows a four-pixel base increment to preserve alignment across resolutions.

### Spacing Scale

Apply standardized spacing variables for all margins, paddings, and flex gaps:

- `var(--space-1)` (`4px`): Micro offsets, icon-to-label spacing, and badge inner padding
- `var(--space-2)` (`8px`): Form label margins and badge separation
- `var(--space-3)` (`12px`): Table cell vertical padding and button gaps
- `var(--space-4)` (`16px`): Table cell horizontal padding and standard form gaps
- `var(--space-5)` (`20px`): Spacing between card sections
- `var(--space-6)` (`24px`): Main dashboard canvas padding
- `var(--space-8)` (`32px`): Spacing between large card blocks

### Responsive Breakpoints

The layout responds to three viewport tiers:

- **Desktop (Width >= 1024px)**: Fixed 260px sidebar navigation, full data table width with active dual sticky scroll features, and `24px` canvas padding.
- **Tablet (Width 768px to 1023px)**: Collapsible sidebar navigation, smooth horizontal scroll container for data tables, and `20px` canvas padding.
- **Mobile (Width < 768px)**: Slide-over drawer sidebar with dark backdrop dismiss (`rgba(15, 23, 42, 0.4)`), topbar hamburger button, vertically stacked search and filter controls, and `16px` canvas padding.

### Global Styling Integrity Rules

Adhere to these non-negotiable styling boundaries:

- **Single Global Stylesheet**: All application styling originates from `src/index.css`. Never generate supplemental CSS files.
- **Pure Light Mode**: Never add dark mode media queries (`@media (prefers-color-scheme: dark)`) or dark mode toggles that could disrupt clinical contrast standards.
