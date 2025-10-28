# RoomReserve Design Guidelines

## Design Approach

**System Foundation:** Material Design + Linear-inspired Interface
- Material Design provides excellent patterns for data-dense applications and status indicators
- Linear's clean typography and spatial organization ensures clarity for booking workflows
- Combination creates a professional, efficient experience for academic users

**Design Principles:**
1. **Clarity First:** Room availability must be instantly scannable
2. **Action-Oriented:** Every screen guides users toward reservation completion
3. **Trust & Reliability:** Clear confirmation states and booking status visibility
4. **Mobile-Ready:** Students book on-the-go between classes

## Typography System

**Font Stack:** Inter (via Google Fonts CDN)
- Headings: 600 weight, sizes from text-3xl (dashboard titles) to text-lg (section headers)
- Body Text: 400 weight, text-base for primary content
- Labels/Metadata: 500 weight, text-sm for room numbers, time slots, status labels
- Timestamps: 400 weight, text-xs for booking details and confirmation times

**Hierarchy Application:**
- Page Titles: text-3xl, font-semibold, leading-tight
- Card Headings: text-xl, font-semibold
- Room Names: text-lg, font-medium
- Time Slots: text-sm, font-medium
- Status Labels: text-xs, uppercase, font-semibold, tracking-wide

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 to p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4
- Element margins: mb-2, mb-4, mb-6 for vertical rhythm

**Grid Structure:**
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Room Grid (Desktop): grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
- Dashboard Layout: Two-column (lg:grid-cols-3) with main content span-2
- Booking Form: Single column max-w-2xl for focused completion

**Responsive Breakpoints:**
- Mobile: Single column, full-width cards, stacked navigation
- Tablet (md): 2-column room grid, side-by-side forms
- Desktop (lg+): 3-4 column grids, persistent sidebar navigation

## Component Library

### Navigation
**Top Navigation Bar:**
- Fixed header with h-16, flex justify-between items-center
- Logo/Brand on left (text-xl font-bold)
- User profile dropdown on right with avatar (h-10 w-10 rounded-full)
- Navigation links in center for Desktop (hidden on mobile, hamburger menu instead)

**Sidebar (Desktop Dashboard):**
- Fixed left sidebar w-64, full height
- Navigation items with py-3 px-4 spacing
- Icons from Heroicons (24px outline style) with mr-3 spacing
- Active state indicated with border-l-4 and font-medium

### Room Cards
**Availability Display Card:**
- Rounded-lg with border, p-4 or p-6
- Room number as prominent heading (text-lg font-semibold)
- Building/Floor metadata (text-sm)
- Capacity badge (inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium)
- Status indicator (Available/Reserved/Occupied) with distinct treatments
- Current/Next availability time slot
- "Reserve Now" button for available rooms

**Grid Layout:**
- Desktop: 3-4 columns of cards
- Tablet: 2 columns
- Mobile: Single column, full-width

### Booking Interface
**Time Slot Selector:**
- Grid of time buttons (30-minute increments)
- Each slot as clickable card: px-4 py-3 rounded-md border-2
- Disabled slots with reduced opacity
- Selected slot with prominent border treatment

**Booking Form:**
- Vertical form layout with space-y-4
- Label above each input (text-sm font-medium mb-1)
- Input fields with h-10, px-3, rounded-md border
- Date picker and duration selector (dropdown)
- Purpose/Notes textarea with h-24
- Submit button: w-full py-3 text-base font-medium rounded-md

### Status & Confirmation Components
**Booking Confirmation Card:**
- Prominent check icon (Heroicons check-circle, h-16 w-16)
- Booking details in definition list format (dl, dt, dd structure)
- Countdown timer for check-in (text-2xl font-bold for numbers)
- Action buttons in flex gap-3 layout

**Timer Display:**
- Large number display (text-4xl font-bold)
- Progress ring or linear progress indicator
- Warning states at 5 minutes remaining
- "Confirm Presence" button prominently placed

### Dashboard Components
**My Bookings List:**
- Vertical list of booking cards with divide-y
- Each booking: flex justify-between items-start, p-4
- Left: Room info, time, date (vertical stack)
- Right: Status badge and actions
- Upcoming vs. Past bookings in separate tabs

**Admin Panel (Additional):**
- Statistics cards in grid-cols-1 md:grid-cols-3 gap-6
- Data table for all reservations (responsive, scrollable on mobile)
- Filter controls in flex flex-wrap gap-2

### Forms & Inputs
**Input Fields:**
- Height: h-10 for text inputs, h-12 for touch targets
- Padding: px-3 for inputs, px-4 py-2 for buttons
- Border radius: rounded-md for inputs, rounded-lg for buttons
- Focus states: ring-2 ring-offset-2

**Buttons:**
- Primary: px-6 py-2.5, rounded-md, text-sm font-medium
- Secondary: Same sizing with border-2
- Icon buttons: h-10 w-10, rounded-full for circular, rounded-md for square
- Ghost/Text buttons: px-4 py-2, no background

### Modals & Overlays
**Confirmation Dialogs:**
- Fixed overlay with backdrop blur
- Modal card: max-w-md mx-auto, rounded-lg, p-6
- Icon at top (h-12 w-12 mx-auto)
- Title (text-lg font-medium), message (text-sm), actions in flex gap-3

**Toast Notifications:**
- Fixed positioning (top-4 right-4)
- Slide-in from right
- Icon + message + dismiss button in flex items-start
- Auto-dismiss after 5 seconds

## Page-Specific Layouts

### Landing/Login Page
**Hero Section:**
- Full viewport height (min-h-screen) with flex items-center
- Two-column layout (lg:grid-cols-2)
- Left: Value proposition text (max-w-xl)
  - Large heading (text-4xl lg:text-5xl font-bold)
  - Subtitle (text-xl)
  - Google Sign-In button (prominent, px-8 py-4)
- Right: Hero image showing students in classroom or app screenshot
- Background: Subtle pattern or gradient overlay

### Dashboard/Home
- Sidebar + Main content layout
- Top stats row: 3-4 metric cards (grid-cols-2 lg:grid-cols-4 gap-4)
- Room availability grid below
- Quick filters/search bar (sticky at top of main content)

### Room Details/Booking Page
- Breadcrumb navigation (mb-6)
- Room image gallery (if available) or placeholder (aspect-w-16 aspect-h-9)
- Two-column layout (lg:grid-cols-3):
  - Left (col-span-2): Room details, amenities list, availability calendar
  - Right (col-span-1): Sticky booking card with time selector and form

### My Bookings Page
- Tab navigation (Upcoming, Past, Cancelled)
- List view with booking cards
- Empty state with illustration and CTA for no bookings

## Images

**Hero Image:**
- Location: Landing page right column
- Description: High-quality photograph of JGSOM classroom or students collaborating in modern study space, natural lighting, professional but relatable
- Aspect ratio: 4:3 or 16:9
- Treatment: Slight overlay to ensure text readability if overlapped

**Room Images (Dashboard/Cards):**
- Location: Top of each room detail page
- Description: Clean classroom photos showing layout, seating capacity, amenities
- Aspect ratio: 16:9
- Treatment: Rounded corners (rounded-t-lg on cards)

**Empty State Illustrations:**
- Location: Empty bookings page, error states
- Description: Friendly, minimal line illustrations of calendar/room icons
- Style: Simple, professional, matches overall clean aesthetic

## Accessibility & Interaction

- All interactive elements have min-height of h-10 (40px) for touch targets
- Form labels always visible (not placeholder-only)
- Status indicators use both color AND text/icons
- Focus states clearly visible with ring utilities
- Skip navigation link for keyboard users
- ARIA labels on icon-only buttons
- Semantic HTML throughout (nav, main, article, section)

## Animation Guidelines

**Minimal Motion:**
- Page transitions: None (instant navigation)
- Hover states: Simple opacity changes (hover:opacity-80)
- Modal/Toast entrance: Slide or fade (duration-200)
- Loading states: Spinner or skeleton screens (no complex animations)
- Timer countdown: Smooth number transitions only

**Prohibited:**
- Background parallax effects
- Scroll-triggered animations
- Decorative motion graphics
- Auto-playing videos or carousels