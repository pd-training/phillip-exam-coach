# Phillip Exam Coach - Professional Design System

## Color Palette

### Primary Colors
- **Blue-600**: `#2563eb` - Primary action, brand color
- **Blue-700**: `#1d4ed8` - Hover states, darker emphasis
- **Blue-50**: `#eff6ff` - Light backgrounds, hover states

### Semantic Colors
- **Green-500**: `#10b981` - Success, pass states, positive actions
- **Red-500**: `#ef4444` - Errors, fail states, warnings
- **Yellow-500**: `#f59e0b` - Warnings, alerts
- **Gray-100**: `#f3f4f6` - Light backgrounds
- **Gray-900**: `#111827` - Text, primary content

### Text Colors
- **Primary Text**: `#111827` (Gray-900)
- **Secondary Text**: `#6b7280` (Gray-500)
- **Tertiary Text**: `#9ca3af` (Gray-400)

## Typography

### Font Stack
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", sans-serif;
```

### Font Sizes & Weights
- **Display Large**: 48px | Font-weight: 700
- **Display**: 36px | Font-weight: 700
- **Heading 1**: 32px | Font-weight: 700
- **Heading 2**: 24px | Font-weight: 700
- **Heading 3**: 20px | Font-weight: 600
- **Body Large**: 18px | Font-weight: 400
- **Body**: 16px | Font-weight: 400
- **Body Small**: 14px | Font-weight: 400
- **Caption**: 12px | Font-weight: 500

## Spacing Scale

```
xs:   4px  (0.25rem)
sm:   8px  (0.5rem)
md:   16px (1rem)
lg:   24px (1.5rem)
xl:   32px (2rem)
2xl:  48px (3rem)
```

## Border Radius

```
sm:   4px  (0.25rem)   - Input fields, small components
md:   8px  (0.5rem)    - Cards, modals, buttons
lg:   12px (0.75rem)   - Large components
xl:   16px (1rem)      - Hero sections
2xl:  24px (1.5rem)    - Extra large components
```

## Shadows

### Shadow Elevation
```
sm:   0 1px 2px 0 rgba(0,0,0,0.05)
md:   0 4px 6px -1px rgba(0,0,0,0.1)
lg:   0 10px 15px -3px rgba(0,0,0,0.1)
xl:   0 20px 25px -5px rgba(0,0,0,0.1)
2xl:  0 25px 50px -12px rgba(0,0,0,0.25)
```

## Component Specifications

### Buttons

#### Primary Button
- **Background**: Blue-600
- **Hover**: Blue-700
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Font Weight**: 600
- **Font Size**: 14px-16px
- **Transition**: 200ms ease

#### Secondary Button
- **Background**: Transparent
- **Border**: 2px solid Gray-300
- **Text Color**: Gray-900
- **Hover**: Gray-50 background
- **Padding**: 12px 24px
- **Border Radius**: 8px

#### Icon Button
- **Size**: 40px × 40px
- **Background**: Transparent or Gray-100
- **Hover**: Gray-200
- **Border Radius**: 8px

### Input Fields
- **Height**: 40px
- **Padding**: 10px 12px
- **Border**: 1px solid Gray-300
- **Border Radius**: 8px
- **Font Size**: 14px
- **Focus**: Blue-500 outline, Blue-50 background
- **Disabled**: Gray-100 background, Gray-400 text

### Cards
- **Background**: White
- **Border**: 1px solid Gray-200
- **Padding**: 24px
- **Border Radius**: 12px
- **Shadow**: sm (hover: md)
- **Transition**: 200ms ease

### Modals
- **Background**: White
- **Border Radius**: 12px
- **Shadow**: 2xl
- **Max Width**: 500px (small), 700px (medium), 900px (large)
- **Padding**: 32px

## Navigation

### Sidebar
- **Width**: 240px (desktop), hidden (mobile)
- **Background**: White
- **Border Right**: 1px solid Gray-200
- **Padding**: 24px 16px

### Header/Nav Bar
- **Height**: 64px
- **Background**: White
- **Border Bottom**: 1px solid Gray-200
- **Padding**: 0 24px
- **Sticky**: Yes, z-index: 50

## Admin Portal Styling

### Dashboard Layout
```
├── Header (64px)
├── Sidebar (240px) + Main Content
│   ├── Page Title & Breadcrumb
│   ├── Stat Cards (3 columns)
│   ├── Data Tables
│   └── Charts/Widgets
```

### Stat Cards
- **Grid**: 3 columns on desktop, 1 on mobile
- **Gap**: 24px
- **Card Style**: White bg, Gray-200 border, 12px radius
- **Stat Value**: 32px, Blue-600, font-weight: 700
- **Stat Label**: 14px, Gray-600

### Tables
- **Header**: Gray-50 background, Gray-900 font-weight: 600
- **Rows**: White, alternate Gray-50
- **Borders**: 1px solid Gray-200
- **Padding**: 16px
- **Hover Row**: Gray-50 background

## Student Portal Styling

### Dashboard
- **Hero Section**: Gradient background, 24px padding
- **Content Grid**: Max-width 1100px, centered
- **Card Spacing**: 24px between sections

### Practice Cards
- **Layout**: Grid (2-3 columns)
- **Card**: White bg, Gray-200 border, 12px radius
- **Title**: 18px, font-weight: 600
- **Button**: Primary style, full-width or 100px
- **Hover**: Border to Blue-300, shadow md

## Accessibility

### Focus States
- **Outline**: 2px solid Blue-600
- **Outline Offset**: 2px
- **Skip Transitions**: Visible for keyboard navigation

### Contrast Ratios
- **Text**: Minimum 4.5:1 (normal text)
- **Large Text**: Minimum 3:1
- **UI Components**: Minimum 3:1

## Responsive Breakpoints

```
Mobile:   < 640px
Tablet:   640px - 1024px
Desktop:  > 1024px
```

## Transitions & Animations

- **Default Duration**: 200ms
- **Easing Function**: cubic-bezier(0.4, 0, 0.2, 1)
- **Avoid**: Animations > 300ms unless critical
- **Respect**: prefers-reduced-motion media query

## Dark Mode (Future)

When implementing dark mode:
- **Background**: Gray-950
- **Card**: Gray-900
- **Text**: Gray-50
- **Borders**: Gray-800
- **Accents**: Blue-400 (lighter)
