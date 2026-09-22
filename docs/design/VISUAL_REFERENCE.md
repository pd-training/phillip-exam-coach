# Visual Reference Guide - Phillip Exam Coach Design System

## Color Palette

### Primary Colors

#### Blue-600: #2563eb
Used for: Main buttons, links, accents, primary actions
```
Tailwind: bg-blue-600, text-blue-600, border-blue-600
On Hover: bg-blue-700
```

#### Blue-700: #1d4ed8
Used for: Hover states, active states, darker emphasis
```
Tailwind: bg-blue-700, hover:bg-blue-700
Contrast: High contrast for accessibility
```

#### Blue-50: #eff6ff
Used for: Light backgrounds, card hover backgrounds
```
Tailwind: bg-blue-50, text-blue-50
Use Case: Subtle backgrounds that don't distract
```

---

### Semantic Colors

#### Green-500: #10b981
Used for: Success states, passing exams, positive feedback
```
Tailwind: bg-green-500, text-green-600, border-green-300
Examples: "Pass", "✓ Correct", success badges
```

#### Green-600: #059669
Used for: Hover states for green buttons
```
Tailwind: hover:bg-green-600, hover:text-green-700
```

#### Red-500: #ef4444
Used for: Errors, failing exams, negative feedback
```
Tailwind: bg-red-500, text-red-600, border-red-300
Examples: "Fail", "✗ Incorrect", error messages
```

#### Yellow-500: #f59e0b
Used for: Warnings, alerts, caution
```
Tailwind: bg-yellow-500, text-yellow-600
Examples: Time warnings, important alerts
```

#### Purple-500: #a855f7
Used for: Secondary actions, analytics
```
Tailwind: bg-purple-500, hover:bg-purple-600
```

---

### Neutral Colors

#### Gray-900: #111827
Used for: Primary text, headings, main content
```
Tailwind: text-gray-900, font-bold/semibold
Contrast Ratio: 19:1 on white (AAA)
```

#### Gray-700: #374151
Used for: Secondary headings, important text
```
Tailwind: text-gray-700, font-semibold
```

#### Gray-600: #4b5563
Used for: Secondary text, descriptions
```
Tailwind: text-gray-600
Contrast Ratio: 7:1 on white (AA)
```

#### Gray-500: #6b7280
Used for: Tertiary text, muted content
```
Tailwind: text-gray-500, text-sm
Contrast Ratio: 5.5:1 on white
```

#### Gray-200: #e5e7eb
Used for: Borders, dividers
```
Tailwind: border border-gray-200
Hover: hover:border-blue-300
```

#### Gray-100: #f3f4f6
Used for: Light backgrounds, alternate rows
```
Tailwind: bg-gray-100, hover:bg-gray-50
```

#### Gray-50: #f9fafb
Used for: Very light backgrounds, section backgrounds
```
Tailwind: bg-gray-50
```

#### White: #ffffff
Used for: Card backgrounds, main backgrounds
```
Tailwind: bg-white
```

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 
             "Segoe UI", "Roboto", "Oxygen", 
             "Ubuntu", "Cantarell", sans-serif;
```

Why this stack?
- Apple System: Best on Apple devices (native feel)
- Segoe UI: Best on Windows (native feel)
- Roboto: Fallback for Android
- Oxygen, Ubuntu, Cantarell: Linux alternatives
- sans-serif: Final fallback

---

### Font Sizes & Weights

#### Display Large (48px, Weight 700)
```html
<h1 class="text-5xl font-bold text-gray-900">
  Your Personal AI Study Coach
</h1>
```
Use for: Hero section titles, main page titles
Landing page: "Master Your CMFAS Exam with Confidence"

#### Display (36px, Weight 700)
```html
<h2 class="text-4xl font-bold text-gray-900">
  Powerful Features
</h2>
```
Use for: Major section headings
Dashboard: "AI-Recommended Focus Areas"

#### Heading 1 (32px, Weight 700)
```html
<h1 class="text-3xl font-bold text-gray-900">
  Welcome, Student!
</h1>
```
Use for: Page titles, important sections

#### Heading 2 (24px, Weight 700)
```html
<h2 class="text-2xl font-bold text-gray-900">
  Recent Attempts
</h2>
```
Use for: Section titles

#### Heading 3 (20px, Weight 600)
```html
<h3 class="text-xl font-semibold text-gray-900">
  Real Exam Practice
</h3>
```
Use for: Subsection titles, feature names

#### Body Large (18px, Weight 400)
```html
<p class="text-lg text-gray-600">
  Designed for every CMFAS exam candidate.
</p>
```
Use for: Important descriptions, large text

#### Body (16px, Weight 400)
```html
<p class="text-base text-gray-600">
  Practice with real questions from official CMFAS papers.
</p>
```
Use for: Regular content, default text

#### Body Small (14px, Weight 400)
```html
<p class="text-sm text-gray-600">
  Across all attempts
</p>
```
Use for: Secondary information, captions

#### Caption (12px, Weight 500)
```html
<span class="text-xs font-medium text-gray-500">
  TRUSTED BY EXAM CANDIDATES
</span>
```
Use for: Labels, very small text, badges

---

## Spacing Scale

### Horizontal/Vertical Padding
```
xs: 4px     → px-1, py-1
sm: 8px     → px-2, py-2
md: 16px    → px-4, py-4
lg: 24px    → px-6, py-6
xl: 32px    → px-8, py-8
2xl: 48px   → px-12, py-12
```

### Gaps (Between elements)
```
gap-1: 4px
gap-2: 8px
gap-3: 12px
gap-4: 16px
gap-6: 24px
gap-8: 32px
gap-12: 48px
```

### Section Spacing
```
py-6:  24px (section padding)
py-12: 48px (major section spacing)
py-20: 80px (hero section)
py-24: 96px (full section padding)
py-32: 128px (large hero sections)
```

---

## Border Radius

### Small Components (8px)
```
rounded-lg
Use for: Buttons, input fields, small cards
```

### Medium Components (12px)
```
rounded-xl
Use for: Cards, modals, larger components
```

### Large Components (16px)
```
rounded-2xl
Use for: Feature cards, large cards
```

### Extra Large (24px)
```
rounded-3xl
Use for: Hero sections, very large cards
```

---

## Shadows & Elevation

### Shadow SM (0 1px 2px)
```
shadow-sm
Use for: Subtle elevation, borders replacement
```

### Shadow MD (0 4px 6px)
```
shadow-md
Use for: Cards, normal elevation
```

### Shadow LG (0 10px 15px)
```
shadow-lg
Use for: Hover states, modals
```

### Shadow XL (0 20px 25px)
```
shadow-xl
Use for: Overlays, prominent modals
```

### Shadow 2XL (0 25px 50px)
```
shadow-2xl
Use for: Max prominence, full-screen overlays
```

---

## Interactive States

### Default State
```
bg-blue-600
border border-gray-200
text-gray-900
cursor-pointer
```

### Hover State
```
bg-blue-700 (primary)
border-blue-300 (cards)
shadow-md
cursor-pointer
transition duration-200
```

### Active/Focus State
```
bg-blue-800 (button)
ring-2 ring-blue-500 (input focus)
outline-2 outline-blue-600 (keyboard focus)
```

### Disabled State
```
bg-gray-200
text-gray-400
cursor-not-allowed
opacity-50
```

---

## Button Styles

### Primary Button
```html
<button class="px-8 py-4 rounded-lg font-semibold 
               bg-blue-600 hover:bg-blue-700 
               text-white text-lg 
               transition duration-200 
               shadow-lg hover:shadow-xl">
  Start Learning Now
</button>
```

### Secondary Button
```html
<button class="px-8 py-4 rounded-lg font-semibold 
               border-2 border-gray-300 
               text-gray-900 hover:bg-gray-50 
               text-lg transition duration-200">
  Sign In
</button>
```

### Icon Button
```html
<button class="w-10 h-10 rounded-lg 
               bg-blue-100 hover:bg-blue-600 
               text-blue-600 hover:text-white 
               flex items-center justify-center 
               transition duration-200">
  <!-- Icon -->
</button>
```

### Small Button
```html
<button class="px-4 py-2 rounded-lg font-medium 
               bg-blue-600 hover:bg-blue-700 
               text-white text-sm 
               transition duration-200">
  Action
</button>
```

---

## Input Fields

### Default Input
```html
<input class="w-full px-4 py-3 
              border border-gray-300 rounded-lg 
              text-gray-900 placeholder-gray-500 
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              focus:border-transparent 
              transition duration-200"
       placeholder="Enter text..." />
```

### Input Label
```html
<label class="block text-sm font-medium 
              text-gray-700 mb-2">
  Email
</label>
```

---

## Cards

### Standard Card
```html
<div class="bg-white rounded-2xl p-6 
            border border-gray-200 
            hover:border-blue-300 
            hover:shadow-lg 
            transition duration-300">
  <!-- Card content -->
</div>
```

### Stat Card
```html
<div class="bg-white rounded-2xl p-8 
            border border-gray-200 
            hover:border-blue-300 
            transition">
  <div class="flex items-start justify-between">
    <div>
      <p class="text-gray-600 text-sm font-medium mb-2">Label</p>
      <p class="text-4xl font-bold text-gray-900">123</p>
    </div>
    <div class="w-12 h-12 bg-blue-100 rounded-lg 
                flex items-center justify-center">
      <!-- Icon -->
    </div>
  </div>
</div>
```

---

## Layout Patterns

### Max Width Container
```html
<div class="max-w-7xl mx-auto px-6">
  <!-- Content -->
</div>
```

### Horizontal Spacing
- **Mobile:** px-4 (16px)
- **Tablet:** px-6 (24px)
- **Desktop:** px-6 (24px)

### Grid Patterns
```
Mobile:  1 column
Tablet:  2 columns (md:grid-cols-2)
Desktop: 3 columns (lg:grid-cols-3)
```

---

## Transitions

### Standard Transition
```html
class="transition duration-200"
```

### Smooth Hover
```html
class="hover:border-blue-300 
       hover:shadow-lg 
       transition duration-300"
```

### Quick Transition
```html
class="transition duration-150"
```

---

## Common Component Combinations

### Hero Section with CTA
```html
<div class="bg-gradient-to-r from-blue-600 to-blue-700 
            text-white py-24">
  <div class="max-w-7xl mx-auto px-6 text-center">
    <h1 class="text-5xl font-bold mb-6">Title</h1>
    <p class="text-xl text-blue-100 mb-10">Subtitle</p>
    <div class="flex gap-4 justify-center">
      <button class="px-8 py-4 bg-white text-blue-600 
                     rounded-lg font-semibold 
                     hover:bg-gray-50 transition">
        Primary Action
      </button>
      <button class="px-8 py-4 border-2 border-white 
                     text-white rounded-lg font-semibold 
                     hover:bg-blue-700 transition">
        Secondary Action
      </button>
    </div>
  </div>
</div>
```

### Feature Card Grid
```html
<div class="grid md:grid-cols-3 gap-8">
  <div class="bg-white rounded-2xl p-8 
              border border-gray-200 
              hover:border-blue-300 
              hover:shadow-lg 
              transition duration-300 group">
    <div class="w-14 h-14 bg-blue-100 rounded-lg 
                flex items-center justify-center mb-6 
                group-hover:bg-blue-600 transition">
      <!-- Icon -->
    </div>
    <h3 class="font-bold text-lg text-gray-900 mb-3">
      Feature Title
    </h3>
    <p class="text-gray-600">
      Feature description
    </p>
  </div>
</div>
```

---

## Accessibility Checklist

- [ ] Text contrast ratio ≥ 4.5:1 for normal text
- [ ] Text contrast ratio ≥ 3:1 for large text
- [ ] Focus states visible (ring or outline)
- [ ] Interactive elements ≥ 44px × 44px
- [ ] Color not sole means of communication
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Form labels properly associated
- [ ] Alt text for images
- [ ] Keyboard navigation functional
- [ ] Screen reader friendly

---

## Dark Mode Future Reference

When implementing dark mode, map these colors:
```
Light → Dark
White → Gray-950
Gray-900 → Gray-50
Gray-600 → Gray-400
Blue-600 → Blue-400
Blue-700 → Blue-300
Borders: Gray-800
Backgrounds: Gray-900
```

---

This visual reference is your quick guide for implementing the professional design consistently across all pages and components.
