# Pipit - MVP Product Specification v3.0
## The Safe, Local Kids Gear Marketplace

**Version:** 3.0 (Name change + charity donations + geo-filtering)  
**Target Launch:** 8 weeks from start  
**Initial Market:** Auburn/Greater Seattle Area (soft geo-filtering, not hard geo-gating)
**Domain:** joinpipit.com

---

## What Changed in v3.0

- **Name:** Pipit (was Cradle) - joinpipit.com confirmed available
- **Charity donations:** Optional donation to local charities at checkout
- **Geo approach:** Soft geo-filtering (users see nearby listings) vs hard geo-gating
- **Light social:** Post-transaction connection prompts, follow system

### Previous Changes (v2.0)
- **Expanded age range:** 0-12 years (was 0-3)
- **New categories:** Bikes, sports equipment, outdoor play, kids furniture
- **Positioning:** "Safe kids gear marketplace" (was "baby gear")
- **Larger market:** ~3x the addressable market

---

## Product Vision

Pipit is a hyper-local marketplace for baby and kids gear (ages 0-12) that solves the trust and safety problems parents face when buying used items. We differentiate through safety verification, parent-only community, transparent pricing, and a give-back model that supports local families in need.

**One-liner:** The safest way to buy and sell kids gear locally.

**Tagline:** Pass it on.

**Core values:**
- **Safety first:** Every listing checked against recalls
- **Community:** Parents helping parents, not anonymous transactions
- **Give back:** Every purchase can help local families in need

**Why 0-12 (not just babies):**
- Parents don't "age out" - they stay for 12+ years
- Higher-value items in older kid categories (bikes, sports)
- More listings = more active marketplace
- Same safety concerns apply (helmets, equipment standards)

---

## Core Features (Must Have for V1 Launch)

### 1. User Authentication & Trust System
- Phone number verification (required for all users)
- ID verification option (Stripe Identity - required for items >$200)
- User profile with:
  - Name, photo, neighborhood (not exact address)
  - "Member since" date
  - Kids' ages (optional but encouraged - helps with matching)
  - Verification badges: "Phone Verified" ✓, "ID Verified" ✓
  - Trust badges: "Smoke-Free Home", "Pet-Free Home"
- Parent verification badge (photo proof or social link)

### 2. Listing Creation (Simplified for Busy Parents)

**Photo upload:** Up to 8 photos per listing

**Categories (UPDATED FOR 0-12):**

**Baby Gear (0-2 years)**
- Strollers & Travel Systems
- Car Seats & Boosters
- Cribs & Bassinets
- High Chairs & Feeding
- Baby Carriers & Wraps
- Play Yards & Pack 'n Plays
- Swings & Bouncers
- Monitors & Safety
- Diaper Bags & Accessories

**Toddler & Preschool (2-5 years)**
- Toddler Beds & Furniture
- Potty Training
- Ride-On Toys
- Outdoor Playsets (small)
- Educational Toys
- Dress-Up & Costumes

**Big Kids (5-12 years)**
- Bikes & Scooters
- Skateboards & Rollerblades
- Sports Equipment (soccer, baseball, basketball, hockey, etc.)
- Outdoor Play (trampolines, swing sets, playhouses)
- Kids Bedroom Furniture (beds, desks, chairs)
- Gaming & Electronics
- Musical Instruments
- School Supplies & Backpacks

**All Ages**
- Toys & Games
- Books (bundles of 5+ only)
- Clothing Bundles (10+ items, sorted by size)
- Seasonal (Halloween costumes, holiday items)
- Other Gear

**Quick-fill brand templates for popular items:**
- Bikes: Strider, Woom, Trek, Specialized, Guardian
- Car Seats: Graco, Chicco, Britax, Nuna, Clek
- Strollers: UppaBaby, Bugaboo, Baby Jogger, BOB, Thule
- Sports: Wilson, Nike, Bauer, Easton, Franklin

**Required fields:**
- Title
- Price
- Category & Subcategory
- Condition (Like New, Gently Used, Well-Loved)
- Brand & Model (if applicable)
- Age Range (dropdown: 0-1, 1-2, 2-3, 3-5, 5-7, 7-10, 10-12, All Ages)
- Size (for bikes, clothing, sports equipment)
- Purchase date (approximate)
- Description
- Available for: "Local Pickup" / "Doorstep Drop-off" / "Both"
- Pickup location (ZIP code or neighborhood)

**Optional fields:**
- Original retail price (for "% off" display)
- Smoke-free home (yes/no)
- Pet-free home (yes/no)

### 3. Safety Features (Our Differentiator)

**Automatic Recall Checker:**
- Query CPSC API when listing is created
- Check brand/model against recall database
- If recalled → Block listing with explanation
- If clear → Show "✓ Safety Verified" badge
- Re-check all active listings weekly

**Car Seat Expiration Checker:**
- Require manufacture date for all car seats
- Auto-calculate expiration (6-10 years by brand)
- If expired → Cannot list
- If within 6 months of expiration → Warning to buyers

**Bike & Helmet Safety (NEW):**
- Helmet listings require certification info (CPSC, ASTM)
- Bike listings prompt for brake condition, tire condition
- Flag helmets older than 5 years (recommended replacement)

**Sports Equipment Standards (NEW):**
- Age-appropriate sizing guidelines shown
- Condition requirements for safety equipment (no cracked helmets, etc.)
- Flag equipment that's been in accidents

**Category-Specific Guidelines:**
- Each category has safety checklist seller must confirm
- Example for bikes: "Brakes work properly", "No frame cracks", "Tires hold air"
- Example for car seats: "Never been in accident", "All straps intact", "No cracks"

### 4. Browse & Discovery

**Filters:**
- Distance (within X miles)
- Category & Subcategory
- Age Range (0-1, 1-2, 2-3, 3-5, 5-7, 7-10, 10-12)
- Price range (slider)
- Condition
- Brand search
- Size (for applicable categories)

**Sort options:**
- Distance (default)
- Price (low to high)
- Price (high to low)
- Recently Listed
- Ending Soon (if we add expiration)

**Display per listing:**
- Primary photo
- Title
- Price (with % off retail if provided)
- Age range badge
- Distance from user
- Condition
- Safety Verified badge
- Verified Parent badge

### 5. Listing Detail View
- Full photo gallery (swipe through)
- All item details
- Safety verification status (prominent, top of page)
- Size/age appropriateness info
- Seller info:
  - Username + photo
  - Verified badges
  - Number of items sold
  - Rating (after Phase 2)
  - "Member since" date
- Suggested safe meetup locations
- "Message Seller" button
- "Buy Now" button (initiates escrow flow)

### 6. Messaging System
- In-app messaging only (no phone numbers initially)
- Quick reply templates:
  - "Is this still available?"
  - "What size is this?"
  - "Can we meet at [location]?"
- Message notifications (push + email)
- Conversation history saved
- Flag for suspicious behavior (Venmo, Zelle mentions)

### 7. Escrow Payment System

**Payment Flow:**
1. Buyer clicks "Buy Now" → Payment collected via Stripe
2. Funds held in escrow (not released to seller)
3. Meeting/dropoff coordinated in-app
4. At meetup: Buyer opens app, takes photo, completes checklist
5. Buyer clicks "Accept Item" → Funds release to seller
6. If issue → Dispute process, funds frozen

**Fee Structure:**
- Transaction fee: 5-8% (or minimum $5)
- Shown upfront: "Item: $200 + Fee: $12 = Total: $212"
- Seller receives: 92-95% of listing price

**Anti-Circumvention Features:**
- Payment collected before meetup coordination
- In-app inspection with photo + GPS + timestamp required
- Monitor messages for off-platform payment keywords
- Incentives for platform use (ratings, badges, lower fees for power users)

**Auto-release:**
- If buyer doesn't act within 24 hours → Payment releases to seller

### 8. Charity Donation Feature (Community Give-Back)

**Purpose:** Every transaction can support local families in need. This differentiates Pipit from transactional marketplaces and reinforces the community ethos: "Parents helping parents."

**User Experience - Checkout Flow:**
```
Order Summary
─────────────────────────
Graco stroller             $150.00
Platform fee                $9.75
─────────────────────────
Subtotal                   $159.75

🤝 Help local families
[ ] Round up ($0.25)        ← default selected
[ ] Add 2% ($3.00)
[ ] Add 5% ($7.50)
[ ] No thanks

Your donation goes to:
Auburn Food Bank - Kids Backpack Program
─────────────────────────
Total                      $160.00
```

**MVP Implementation (Build Now):**
- Donation options shown at checkout (buyer only)
- Options: Round up to nearest dollar, 2%, 5%, or decline
- Default: "Round up" pre-selected (easy to change)
- Single charity partner displayed (hardcoded for launch)
- Show charity name + one-line description
- Donation amount stored on transaction record
- Running total tracked on user profile ("You've donated $X to local kids")
- Platform absorbs Stripe fees on donation portion (~3%)
- Monthly manual payout to charity partner (simple bank transfer)

**Data Model Additions:**
```sql
-- Add to transactions table:
donation_amount DECIMAL(10, 2) DEFAULT 0
donation_charity_id UUID REFERENCES charities(id)

-- Add to users table:
total_donated DECIMAL(10, 2) DEFAULT 0

-- New charities table (simple for now):
CREATE TABLE charities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  total_received DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP
);
```

**Charity Selection (MVP):**
- Start with ONE local charity partner (Auburn Food Bank or similar)
- Curated by Pipit - we vet and select partners
- Focus on organizations that directly help local kids/families
- Simple partnership agreement (we send monthly check, they're featured in app)

**Display in App:**
- Checkout: Donation options + charity info
- User profile: "You've donated $47 to local families this year"
- App footer or About page: "Pipit community has donated $X to Auburn families"
- Post-transaction receipt: "Thank you! Your $3 donation helps feed local kids."

**What NOT to Build for MVP:**
- ❌ Multiple charity selection
- ❌ Seller donations from payout
- ❌ Tax receipt generation
- ❌ Impact dashboard with detailed stats
- ❌ Charity application/onboarding flow
- ❌ Real-time donation tracking/thermometer

**Future Enhancements (Post-MVP):**
- Multiple charity partners (user can choose)
- Seller option to donate portion of sale
- Seasonal charity campaigns ("Back to school drive")
- Impact reports ("Your donations provided 50 backpacks")
- Tax receipt integration (charity issues directly)
- Corporate matching programs

**Financial Impact:**
- Donations are pass-through (not Pipit revenue)
- Cost: ~3% Stripe fee on donations (~$0.09 per $3 donation)
- Benefit: Higher conversion, PR value, community loyalty, differentiation

**Charity Partner Criteria:**
- Hyper-local (Auburn/South King County to start)
- Directly serves children or families
- Established 501(c)(3) with good standing
- Can receive and acknowledge donations
- Willing to cross-promote Pipit to families they serve

**Potential Launch Partners:**
1. Auburn Food Bank (kids backpack program)
2. Mary's Place Seattle (family shelter)
3. Treehouse (foster kids)
4. Local school district foundation

### 9. User Profiles & Light Social Features
- View own profile and edit
- View other users' profiles
- Display:
  - Username + photo
  - Verified badges
  - Kids' ages (if shared)
  - Neighborhood
  - Bio (short text about family)
  - Parenting interest tags (optional: "Montessori", "Outdoorsy", "Sports family")
  - Active listings
  - Items sold count
  - "Member since" date
  - Total donated to local families (if > $0)
- Follow other users
- Activity feed showing:
  - "New near you" - recent listings from nearby parents
  - "From parents you follow" - listings from followed users

**Post-Transaction Connection (MVP):**
After successful transaction, prompt both parties:
```
Transaction complete! 🎉

You and Sarah both have toddlers in Auburn.
Want to stay connected?

[Follow Sarah]  [Maybe Later]
```
- One-tap to follow
- Creates organic relationships from transactions
- Surfaces in "From parents you follow" feed

### 10. Soft Geo-Filtering (Location Strategy)

**Approach:** Users see listings filtered by distance, but there's no hard geo-gate preventing signups from any location. The app feels hyper-local through the UX, not through artificial restrictions.

**How it works:**
- All listings have location (ZIP or lat/lon)
- Default browse view: listings within 15-20 miles of user
- Distance shown on every listing card ("2.3 mi away")
- User can adjust radius: 5 / 15 / 25 / 50 miles
- Sort by distance (default) or other criteria

**Empty state handling:**
If user is in area with few/no listings:
```
No listings nearby yet!

Be the first parent in [City] to list gear.
We'll notify you when neighbors join.

[Create a Listing]  [Expand Search Radius]
```

**Benefits of soft geo-filtering:**
- Zero friction for organic growth anywhere
- Network effects can spark in unexpected places
- Simpler product (no geo-gates to build)
- Word of mouth crosses city boundaries naturally
- Marketing can focus on target area while product works everywhere

**MVP implementation:**
- Location auto-detected on signup (with permission) or entered manually
- Default radius: 20 miles (adjustable)
- All listing cards show distance
- Browse defaults to "Nearest first" sort
- Good empty state for sparse areas

### 11. First-Time User Onboarding Flow

New users see this flow once on first app launch. Goal: explain value, build trust, personalize experience.

#### Screen 1: Welcome
- Warm illustration of pipit bird
- Headline: "Welcome to Pipit"
- Subhead: "The safe way to buy and sell kids gear"
- [Get Started] button

#### Screen 2: How It Works (3 swipeable cards on mobile, horizontal on desktop)
Card 1: "Every item checked for recalls" + shield icon
Card 2: "Payment held safely until you're happy" + lock icon
Card 3: "Connect with parents in your neighborhood" + map pin icon

#### Screen 3: Quick Personalization (Optional)
- "What ages are your kids?"
- Multi-select chips: 0-1, 1-2, 2-4, 4-7, 7-12, "Just browsing"
- Helper text: "We'll show you relevant gear first"
- [Skip] and [Continue] buttons

#### Screen 4: Location
- "Where are you?"
- Auto-detect location button OR manual zip entry
- Helper text: "We'll show listings nearby"
- [Start Browsing] button

#### Technical Notes:
- Store onboarding_completed: boolean on user record
- Store kid_age_ranges: array on user profile
- Location already captured, but this is a friendly way to request permission
- Flow is skippable at any point
- Show progress dots at bottom of each screen

### 12. Social Proof Elements

Add these trust and urgency signals throughout the app:

#### On Listing Cards (Browse View)
- "♥ 8 saved" (if saved by 3+ users)
- Show seller rating stars inline

#### On Listing Detail Page
- "X people viewing this" (if 2+ concurrent viewers, real-time)
- "Similar items sell in ~3 days" (based on category average)
- "Last one at this price sold 2 days ago" (if relevant data exists)
- Seller stats: "Sarah has sold 12 items · Joined 3 months ago"

#### On Search Results
- "47 results near you" count
- "New today" badge on listings < 24 hours old

#### Database Additions
- Track view_count on listings
- Track saves_count on listings
- Calculate avg_days_to_sell by category
- Track concurrent_viewers (can be approximated or real-time via websocket)

#### Implementation Notes
- Social proof should feel helpful, not pushy
- Only show "X viewing" if actually true (no fake urgency)
- Numbers should be real — trust is everything

---

## Nice to Have (V1.1 - After Launch)

### Community Features (Phase 2: Months 3-6)
- Neighborhood Groups (discussion feeds by ZIP/area)
- Parent Q&A section
- Gear reviews by parents
- Event listings (swap meets, playdates)
- Parent matching ("Meet parents like you")

### Enhanced Social (Builds on MVP foundation)
- Following feed enhancements
- Milestone sharing ("First bike ride!")
- Expert AMAs (pediatricians, sleep consultants)

### Charity Expansion
- Multiple charity partner selection
- Seller donations from payout
- Seasonal giving campaigns
- Impact dashboard
- Tax receipt integration

### Enhanced Marketplace
- Ratings & reviews (post-transaction)
- Saved searches with notifications
- Favorite/watchlist
- Price drop alerts
- Bundle creation (sell multiple items together)
- "Make an Offer" feature

### Premium Features (Monetization)
- Featured listings ($5 for 7 days)
- Bump to top ($2 per bump)
- Pipit+ subscription ($4.99/mo - zero fees)
- Power Seller tier (lower fees after 10 transactions)

---

## Explicit Non-Goals (NOT Building in MVP)

- ❌ Shipping/delivery coordination
- ❌ Native mobile apps (React Native) - web first, mobile responsive
- ❌ Multi-state expansion
- ❌ Adult items or non-kid categories
- ❌ Auction/bidding
- ❌ Background checks beyond ID verification
- ❌ Integration with other platforms

**Note:** The other chat mentioned React Native. For MVP speed, I'd recommend mobile-responsive web first, then native apps in Phase 2. Discuss with Claude Code which approach they're taking.

---

## UI/UX Excellence Standards

**📖 COMPANION DOCUMENT:** `pipit-ui-ux-design-system.md` (v2) contains the complete warm, distinctive design system with:
- Warm typography: Recoleta (headlines) + DM Sans (body) - NOT generic Inter/Roboto
- Warm backgrounds: Cream (#FFFCF9), NOT stark white
- Sand/stone neutrals: Warm grays, NOT cold blue-grays
- Complete CSS custom properties (copy-paste ready)
- Screen-by-screen wireframes for mobile AND desktop
- Animation keyframes and micro-interaction code

**CRITICAL DESIGN PHILOSOPHY:** Pipit should feel like a cozy neighborhood coffee shop, NOT a tech product. Every design decision adds warmth.

**Use both documents:** This section provides principles. The companion document provides implementation-ready code.

### Design Philosophy

Pipit should feel like it was designed by a team that obsesses over every pixel. The goal is not just "good enough" - it's to make users feel the care and craft in every interaction. When someone opens Pipit, they should think: "Wow, this feels premium. This feels trustworthy. This feels like someone really thought about me."

**Reference apps for quality bar:**
- **Stripe:** Clean, confident, sophisticated micro-interactions
- **Linear:** Fast, fluid, keyboard-friendly, beautiful transitions
- **Airbnb:** Warm, photography-forward, trust-building, delightful details
- **Notion:** Elegant simplicity, great empty states, intuitive gestures
- **Cash App:** Bold, playful, incredibly intuitive mobile experience

**Core principles:**
1. **Clarity over cleverness** - Users should never wonder what to do next
2. **Speed is a feature** - Perceived and actual performance matter equally
3. **Delight in details** - The difference between good and great is 100 small things
4. **Trust through craft** - Polish signals competence and safety
5. **Reduce cognitive load** - Every screen should have one clear purpose

---

### Design System Foundation

#### Spacing System (8px Grid)
All spacing should use multiples of 8px for visual harmony:
```
--space-1: 4px   (tight, inline elements)
--space-2: 8px   (compact spacing)
--space-3: 12px  (default small gap)
--space-4: 16px  (standard spacing)
--space-5: 24px  (section spacing)
--space-6: 32px  (large gaps)
--space-7: 48px  (section breaks)
--space-8: 64px  (major sections)
--space-9: 96px  (hero/page-level)
```

#### Typography Scale
Clear hierarchy, never more than 3-4 sizes per screen:
```
--text-xs: 12px / 16px line-height  (captions, metadata)
--text-sm: 14px / 20px line-height  (secondary text, labels)
--text-base: 16px / 24px line-height (body text - mobile default)
--text-lg: 18px / 28px line-height  (body text - desktop)
--text-xl: 20px / 28px line-height  (subheadings)
--text-2xl: 24px / 32px line-height (section headings)
--text-3xl: 30px / 36px line-height (page titles)
--text-4xl: 36px / 40px line-height (hero headlines)
--text-5xl: 48px / 48px line-height (display - desktop only)
```

**Font weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
**Font families:** 
- Headlines: Recoleta (warm serif) or Fraunces (Google Fonts fallback)
- Body: DM Sans (warm humanist sans)
- Prices/codes: DM Mono
- NEVER: Inter, Roboto, Arial - these are generic and forgettable

#### Color Palette (WARM - Critical)

**THE MOST IMPORTANT COLORS ARE THE BACKGROUNDS AND NEUTRALS.**
Warm backgrounds make everything feel cozy. Cold backgrounds ruin everything.

```
/* BACKGROUNDS - NOT WHITE */
--bg-base: #FFFCF9      /* Main page - warm cream */
--bg-warm: #FFF8F3      /* Alternate sections - warmer */
--bg-cozy: #FFF5ED      /* Hero areas - warmest */
--surface: #FFFFFF      /* Cards float on warm bg */

/* PRIMARY - Warm Teal */
--primary-500: #2D9B8C  /* Main brand color */
--primary-400: #40BBA9  /* Hover */
--primary-600: #257E72  /* Pressed */
--primary-50: #F0FAF8   /* Light tint */

/* SECONDARY - Warm Coral */
--coral-500: #E8725C    /* Accent */
--coral-400: #F28F78    /* Hover */
--coral-600: #D45A44    /* Pressed */
--coral-50: #FFF5F2     /* Light tint */

/* ACCENT - Golden Honey */
--honey-500: #E8B44C    /* Highlights */
--honey-400: #F5C95C    /* Hover */
--honey-50: #FFFBF0     /* Light tint */

/* NEUTRALS - Sand/Stone (NOT cold grays) */
--sand-50: #FFFCF9      /* Lightest */
--sand-100: #FFF8F3     /* Very light */
--sand-200: #F5EDE6     /* Borders, dividers */
--sand-300: #E8DDD4     /* Disabled bg */
--sand-400: #D4C4B8     /* Placeholder text */
--sand-500: #B8A395     /* Muted text */
--sand-600: #9A8578     /* Secondary text */
--sand-700: #6B5D52     /* Body text */
--sand-800: #4A3F37     /* Headlines */
--sand-900: #2D2622     /* Maximum contrast */

/* Semantic */
--success: #10B981
--warning: #F59E0B
--error: #E55B5B        /* Softer red */
--info: #4A90D9         /* Warmer blue */
```

#### Shadows (Warm Tinted - NOT Black)
Use warm brown (30, 25, 20) instead of pure black for shadows:
```
--shadow-xs: 0 1px 2px rgba(30,25,20,0.04)
--shadow-sm: 0 1px 3px rgba(30,25,20,0.06), 0 1px 2px rgba(30,25,20,0.04)
--shadow-md: 0 4px 6px rgba(30,25,20,0.05), 0 2px 4px rgba(30,25,20,0.03)
--shadow-lg: 0 10px 15px rgba(30,25,20,0.06), 0 4px 6px rgba(30,25,20,0.03)
--shadow-xl: 0 20px 25px rgba(30,25,20,0.08), 0 8px 10px rgba(30,25,20,0.04)
--shadow-glow: 0 0 0 3px rgba(45,155,140,0.15)  /* Focus rings */
```

#### Border Radius (Consistent Curves)
```
--radius-sm: 6px    (buttons, inputs, small cards)
--radius-md: 8px    (cards, modals)
--radius-lg: 12px   (large cards, images)
--radius-xl: 16px   (hero sections, feature cards)
--radius-full: 9999px (pills, avatars)
```

#### Transitions (Smooth, Not Slow)
```
--ease-default: cubic-bezier(0.4, 0, 0.2, 1)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)

--duration-fast: 100ms    (micro-interactions)
--duration-base: 150ms    (most transitions)
--duration-slow: 200ms    (modals, page transitions)
--duration-slower: 300ms  (complex animations)
```

---

### Desktop-Specific UI/UX (≥1024px)

Desktop users expect efficiency, information density, and keyboard support. Optimize for productivity.

#### Layout Principles
- **Max content width:** 1280px for main content, centered with generous margins
- **Multi-column layouts:** Use 2-3 column grids where appropriate
- **Persistent navigation:** Left sidebar (collapsible) + top header
- **Generous whitespace:** Let content breathe - don't fill every pixel

#### Navigation (Desktop)
```
┌────────────────────────────────────────────────────────────────┐
│  🐦 Pipit          Search...              [+ List Item]  (Avatar) │
├──────────┬─────────────────────────────────────────────────────┤
│          │                                                      │
│  Home    │   Main Content Area                                  │
│  Browse  │   - Max width 1280px                                 │
│  Messages│   - Cards in 2-3 column grid                         │
│  My Items│   - Generous padding (32-48px)                       │
│          │                                                      │
│  ─────── │                                                      │
│  Settings│                                                      │
│  Help    │                                                      │
│          │                                                      │
└──────────┴─────────────────────────────────────────────────────┘
```

#### Hover States (Critical for Desktop)
Every interactive element MUST have a hover state:
- **Buttons:** Background color shift + subtle lift (translateY -1px + shadow increase)
- **Cards:** Subtle shadow increase + border color change
- **Links:** Color change + optional underline
- **Icons:** Color change + optional scale (1.05)
- **Table rows:** Background highlight

#### Keyboard Support
- **Tab navigation:** Logical tab order, visible focus rings
- **Enter/Space:** Activate buttons and links
- **Escape:** Close modals, cancel actions
- **Shortcuts:** Consider cmd+K for search, cmd+N for new listing

#### Desktop-Specific Patterns
- **Modals:** Centered, max-width 600px, backdrop blur
- **Dropdown menus:** Appear on click, not hover (more accessible)
- **Tooltips:** On hover for icon-only buttons, 300ms delay
- **Side panels:** For detailed views (slide in from right)
- **Tables:** For data-heavy views (My Transactions, Admin)

#### Desktop Cards (Listings)
```
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │                         │    │  - 3-4 cards per row
│  │     Product Image       │    │  - 280-320px wide
│  │     (4:3 or 1:1)        │    │  - Hover: shadow + slight lift
│  │                         │    │  - Image: subtle zoom on hover
│  └─────────────────────────┘    │
│                                 │
│  UppaBaby Vista Stroller        │  - Title: 1-2 lines, truncate
│  $275  ·  Like New              │  - Price prominent, condition subtle
│                                 │
│  ✓ Safety Verified  ·  2.1 mi   │  - Badges inline
│                                 │
└─────────────────────────────────┘
```

#### Form Design (Desktop)
- **Label position:** Above input (not inline)
- **Input height:** 44px minimum
- **Input width:** Max 400px for single fields, use grid for related fields
- **Error states:** Red border + error message below + icon
- **Success states:** Green checkmark for validated fields
- **Helper text:** Gray, below input, before error message

---

### Mobile-Specific UI/UX (<768px)

Mobile users expect speed, thumb-friendliness, and gesture support. Optimize for one-handed use.

#### Layout Principles
- **Single column:** Always, no exceptions
- **Full-width elements:** Buttons, cards, inputs stretch edge-to-edge
- **Bottom-focused interactions:** Key actions within thumb reach
- **Minimal typing:** Use pickers, toggles, suggestions

#### Navigation (Mobile)
```
┌────────────────────────────────────┐
│  ☰  Pipit                    🔍 ✉️  │  ← Compact header
├────────────────────────────────────┤
│                                    │
│  Main Content Area                 │
│  - Full width                      │
│  - Cards stack vertically          │
│  - Pull to refresh                 │
│                                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│  🏠    📦    ➕    💬    👤       │  ← Bottom tab bar
│  Home  Browse  Sell  Chat  Profile │  ← Always visible
└────────────────────────────────────┘
```

**Bottom Tab Bar Rules:**
- Fixed to bottom, always visible (except keyboard open)
- 5 items maximum
- Active state: filled icon + color + label
- Inactive: outline icon + gray
- Height: 56-64px + safe area inset
- Center item (Sell) can be emphasized (FAB style)

#### Touch Targets
- **Minimum size:** 44x44px (Apple HIG) / 48x48dp (Material)
- **Spacing between targets:** Minimum 8px
- **Buttons:** Full width on mobile, minimum height 48px
- **List items:** Minimum height 56px

#### Mobile Gestures
- **Pull to refresh:** On all list views
- **Swipe to go back:** Support native gesture
- **Swipe actions on list items:** Delete, archive (use sparingly)
- **Long press:** Secondary actions (share, save)
- **Pinch to zoom:** On images only

#### Mobile-Specific Patterns
- **Bottom sheets:** Instead of modals (slide up, can drag to dismiss)
- **Full-screen modals:** For complex flows (listing creation)
- **Action sheets:** For contextual menus (iOS style)
- **Inline expansion:** Instead of navigation when possible
- **Sticky headers:** For context while scrolling

#### Mobile Cards (Listings)
```
┌────────────────────────────────────┐
│ ┌──────────┐                       │
│ │          │  UppaBaby Vista       │  - Horizontal layout
│ │  Image   │  $275 · Like New      │  - Image: 100x100px
│ │  1:1     │  ✓ Safe · 2.1 mi      │  - Tap entire card
│ └──────────┘  Sarah M. ★ 4.9       │  - Subtle separator
├────────────────────────────────────┤
│ ┌──────────┐                       │
│ │          │  Woom Bike Size 3     │
│ │  Image   │  $199 · Gently Used   │
│ │          │  ✓ Safe · 0.8 mi      │
│ └──────────┘  Mike T. ★ 5.0        │
└────────────────────────────────────┘
```

Alternative: Full-width vertical cards for fewer, larger items:
```
┌────────────────────────────────────┐
│  ┌────────────────────────────┐    │
│  │                            │    │
│  │      Full-width Image      │    │  - Image: 16:9 or 4:3
│  │         (16:9)             │    │  - Swipeable gallery dots
│  │                            │    │
│  └────────────────────────────┘    │
│                                    │
│  UppaBaby Vista V2 Stroller        │  - Title: full, wrap if needed
│  $275                              │  - Price: large, prominent
│  Like New · ✓ Safety Verified      │
│  📍 2.1 miles · Auburn, WA         │
│                                    │
└────────────────────────────────────┘
```

#### Form Design (Mobile)
- **One field visible at a time** for complex forms (wizard pattern)
- **Large inputs:** 48-56px height
- **Appropriate keyboards:** email, tel, number types
- **Auto-capitalize:** Sentence for messages, none for email
- **Floating labels:** Save vertical space
- **Inline validation:** Check as user leaves field
- **Sticky submit button:** Fixed to bottom

#### Photo Upload (Mobile-Optimized)
```
┌────────────────────────────────────┐
│  Photos (3/8)                      │
│                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │  ✓  │ │  ✓  │ │  ✓  │ │  +  │  │  - Grid of squares
│  │ img1│ │ img2│ │ img3│ │ Add │  │  - Drag to reorder
│  └─────┘ └─────┘ └─────┘ └─────┘  │  - Tap to preview/delete
│                                    │  - First image = cover
│  Drag to reorder · Tap to edit     │
└────────────────────────────────────┘
```

---

### Micro-Interactions & Animations

These small details separate good from great. Every interaction should feel responsive and alive.

#### Button Press Feedback
```css
button:active {
  transform: scale(0.98);
  transition: transform 100ms ease;
}
```

#### Successful Action
- Brief color flash (green pulse on save button)
- Checkmark animation (draw-in effect)
- Optional: confetti or particles for major actions (first sale!)

#### Loading States
**Never show blank screens.** Options:
1. **Skeleton screens:** Gray placeholder shapes matching content layout
2. **Shimmer effect:** Subtle left-to-right gradient animation on skeletons
3. **Spinner:** Only for quick actions (<2 seconds expected)
4. **Progress bar:** For uploads, multi-step processes

```
Skeleton Example (Listing Card):
┌─────────────────────────────────┐
│  ┌─────────────────────────┐    │
│  │  ░░░░░░░░░░░░░░░░░░░░░  │    │  - Rounded rectangles
│  │  ░░░░░░░░░░░░░░░░░░░░░  │    │  - Match real content size
│  │  ░░░░░░░░░░░░░░░░░░░░░  │    │  - Subtle shimmer animation
│  └─────────────────────────┘    │
│                                 │
│  ░░░░░░░░░░░░░░░░░░             │
│  ░░░░░░░░░░  ░░░░░              │
│  ░░░░░░░░░░░░░░░                │
└─────────────────────────────────┘
```

#### Page Transitions
- **Mobile:** Slide left/right for navigation hierarchy
- **Desktop:** Subtle fade (150ms) or no transition (instant)
- **Modals:** Fade backdrop + slide up content (200ms)
- **Bottom sheets:** Spring physics for natural feel

#### Scroll Behaviors
- **Sticky headers:** Shrink/simplify on scroll (header becomes compact)
- **Parallax:** Subtle on hero images (optional, performance-aware)
- **Infinite scroll:** Load more indicator, "Back to top" button after scroll
- **Pull to refresh:** Custom animation with Pipit bird icon

#### Input Interactions
- **Focus:** Border color change + subtle glow shadow
- **Typing:** No animation (don't distract)
- **Validation success:** Green checkmark fades in
- **Validation error:** Shake animation (subtle) + red border + error message

#### Notification/Toast Animations
- **Enter:** Slide in from top (desktop) or bottom (mobile) + fade
- **Exit:** Slide out + fade after 4-5 seconds
- **Stack:** New toasts push older ones

---

### Empty States & Error Handling

Empty states are opportunities to guide, delight, and build trust.

#### Empty State Formula
```
┌────────────────────────────────────┐
│                                    │
│           [Illustration]           │  - Custom illustration
│              🐦 📭                  │  - Or icon + subtle animation
│                                    │
│      No messages yet               │  - Clear headline
│                                    │
│  When you buy or sell, your        │  - Helpful explanation
│  conversations will appear here.   │
│                                    │
│      [ Browse Listings ]           │  - Single clear action
│                                    │
└────────────────────────────────────┘
```

#### Specific Empty States
- **No listings nearby:** "Be the first parent in [City]!" + Create Listing CTA
- **No messages:** "Start a conversation" + Browse CTA
- **No favorites:** "Save items you love" + Browse CTA
- **Search no results:** "No matches for [query]" + suggestions + clear filters
- **First-time user:** Onboarding cards explaining key features

#### Error States
- **Form errors:** Inline, specific, actionable ("Password must be 8+ characters")
- **Page errors:** Friendly message + illustration + Retry button
- **Network errors:** "You're offline" banner (dismissible when back online)
- **500 errors:** "Something went wrong on our end. We're looking into it."

#### Error Message Tone
❌ "Error 404: Resource not found"  
✅ "Hmm, we can't find that page. It might have been removed or the link is incorrect."

❌ "Invalid input"  
✅ "Please enter a valid email address"

❌ "Transaction failed"  
✅ "Payment didn't go through. Please check your card details and try again."

---

### Listing Detail Page (World-Class Polish)

This is the most important page - where trust is built and purchases happen.

#### Desktop Layout
```
┌────────────────────────────────────────────────────────────────────┐
│  ← Back to Browse                                     ♡ Save  ⋮   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────────────────────────┐  ┌───────────────────────┐│
│  │                                    │  │                       ││
│  │                                    │  │  UppaBaby Vista V2    ││
│  │         Large Main Image           │  │  Stroller - 2022      ││
│  │           (Zoomable)               │  │                       ││
│  │                                    │  │  $275                 ││
│  │                                    │  │  $450 retail (39% off)││
│  │                                    │  │                       ││
│  └────────────────────────────────────┘  │  ✓ Safety Verified    ││
│                                          │  ✓ No Recalls Found   ││
│  [img1] [img2] [img3] [img4] [img5]      │  ✓ Smoke-Free Home    ││
│                                          │                       ││
│  ──────────────────────────────          │  [ Buy Now - $284.25 ]││
│                                          │  (includes fee)       ││
│  ## Description                          │                       ││
│  Like new condition Vista V2...          │  [ Message Seller ]   ││
│                                          │                       ││
│  ## Details                              │  ────────────────     ││
│  • Condition: Like New                   │                       ││
│  • Age range: 0-3 years                  │  👤 Sarah M.          ││
│  • Purchased: March 2022                 │  ★ 4.9 · 23 sold      ││
│  • Located: Auburn, WA                   │  Member since 2024    ││
│                                          │  ID Verified ✓        ││
│  ## Safety Checklist                     │                       ││
│  ✓ All parts present...                  │  [ View Profile ]     ││
│                                          │                       ││
│                                          └───────────────────────┘│
└────────────────────────────────────────────────────────────────────┘
```

#### Mobile Layout
```
┌────────────────────────────────────┐
│  ←                        ♡    ⋮   │
├────────────────────────────────────┤
│  ┌────────────────────────────┐    │
│  │                            │    │  - Full-width image
│  │      Image Gallery         │    │  - Swipe for more
│  │      (swipeable)           │    │  - Dots indicator
│  │                            │    │
│  │              ●  ○  ○  ○    │    │
│  └────────────────────────────┘    │
│                                    │
│  UppaBaby Vista V2 Stroller        │
│  $275  ($450 retail · 39% off)     │
│                                    │
│  ┌─────────────────────────────┐   │
│  │ ✓ Safety Verified           │   │  - Trust badges prominent
│  │ ✓ No Recalls · Smoke-Free   │   │
│  └─────────────────────────────┘   │
│                                    │
│  Condition    Like New             │
│  Age Range    0-3 years            │
│  Location     Auburn, WA · 2.1 mi  │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  Description                       │
│  Like new condition. Used for...   │
│  [Read more]                       │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  👤 Sarah M.  ★ 4.9 (23 sold)      │
│  ID Verified · Member since 2024   │
│  [View Profile]                    │
│                                    │
│                                    │
├────────────────────────────────────┤
│  [ Message ]     [ Buy · $284 ]    │  ← Sticky bottom bar
└────────────────────────────────────┘
```

---

### Checkout Flow (Stripe-Level Polish)

#### Design Principles
- **Single column, focused:** No distractions
- **Progress indicator:** Show steps clearly
- **Instant validation:** Check fields on blur
- **Trust signals:** Security badges, guarantees visible
- **Summary always visible:** What they're buying, total cost

#### Checkout Layout
```
┌────────────────────────────────────┐
│  ← Back              Step 2 of 3   │
│  ━━━━━━━━━━━━━━━━━━●━━━━━━━━━━━   │
├────────────────────────────────────┤
│                                    │
│  Payment                           │
│                                    │
│  ┌────────────────────────────┐    │
│  │ 💳  Card number            │    │  - Auto-format as typing
│  │     4242 4242 4242 4242    │    │  - Show card brand icon
│  └────────────────────────────┘    │
│                                    │
│  ┌─────────────┐ ┌────────────┐    │
│  │ MM/YY       │ │ CVC        │    │
│  │ 12/26       │ │ 123        │    │
│  └─────────────┘ └────────────┘    │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  🤝 Help local families            │
│                                    │
│  ○ Round up ($0.25)  ← default     │
│  ○ Add 2% ($3.00)                  │
│  ○ Add 5% ($7.50)                  │
│  ○ No thanks                       │
│                                    │
│  Your donation goes to:            │
│  Auburn Food Bank                  │
│  Kids Backpack Program             │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  Order Summary                     │
│  UppaBaby Vista V2         $275.00 │
│  Platform fee               $17.88 │
│  Donation (Round up)         $0.25 │
│  ─────────────────────────────     │
│  Total                     $293.13 │
│                                    │
│  🔒 Secure checkout by Stripe      │
│                                    │
│  [ Complete Purchase ]             │
│                                    │
│  Your payment is held safely until │
│  you inspect and accept the item.  │
│                                    │
└────────────────────────────────────┘
```

#### Donation Selection Micro-interaction
When user selects a donation option:
- Radio fills with spring animation
- Total updates with number counting up
- Brief green highlight on charity name
- Small "Thank you" or heart animation (subtle)

---

### Accessibility Requirements

Accessibility is not optional. It's part of world-class design.

#### Visual
- **Color contrast:** WCAG AA minimum (4.5:1 for text)
- **Don't rely on color alone:** Use icons, text, patterns
- **Focus indicators:** Visible, high-contrast focus rings
- **Text scaling:** Support up to 200% without breaking layout
- **Motion:** Respect `prefers-reduced-motion`

#### Interactive
- **Keyboard navigation:** All functions accessible via keyboard
- **Screen readers:** Proper ARIA labels, roles, and live regions
- **Touch targets:** 44x44px minimum
- **Form labels:** Always visible, associated with inputs

#### Content
- **Alt text:** Descriptive for all images
- **Heading hierarchy:** Logical H1 → H2 → H3
- **Link text:** Descriptive ("View listing" not "Click here")
- **Error messages:** Associated with form fields

---

### Performance as UX

Speed is the most important feature. Users should never wait.

#### Targets
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s
- **Largest Contentful Paint:** <2.5s
- **Cumulative Layout Shift:** <0.1

#### Techniques
- **Optimistic UI:** Show success immediately, sync in background
- **Image optimization:** WebP, lazy loading, srcset for responsive
- **Code splitting:** Load only what's needed for each page
- **Skeleton screens:** Never show blank loading states
- **Prefetching:** Anticipate next actions, preload data

---

### Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm: 640px   /* Large phones, small tablets */
--breakpoint-md: 768px   /* Tablets */
--breakpoint-lg: 1024px  /* Laptops, small desktops */
--breakpoint-xl: 1280px  /* Desktops */
--breakpoint-2xl: 1536px /* Large desktops */
```

**Key layout shifts:**
- **<768px:** Single column, bottom nav, full-width elements
- **768-1023px:** Two-column where appropriate, still bottom nav
- **≥1024px:** Side nav, multi-column, hover states, keyboard support

---

## Technical Requirements

### Frontend
- React 18+ with Vite (or Next.js)
- Tailwind CSS
- Mobile-first responsive design
- PWA capabilities (installable, push notifications)

### Backend
- Node.js + Express
- PostgreSQL database
- JWT authentication
- RESTful API (or GraphQL if preferred)

### External Services
- **Stripe Connect:** Marketplace payments, escrow, seller payouts
- **Stripe Identity:** ID verification
- **Twilio:** SMS verification
- **Cloudinary:** Image upload and optimization
- **CPSC API:** Recall database
- **Google Maps API:** Distance calculation, meetup location suggestions

### Infrastructure
- Railway, Render, or Vercel (simple deployment)
- Managed PostgreSQL
- Redis for session/caching (optional for MVP)
- SSL required

---

## Database Schema (Core Tables)

### users
```sql
id UUID PRIMARY KEY
phone_number VARCHAR(20) UNIQUE NOT NULL
email VARCHAR(255)
username VARCHAR(50) UNIQUE NOT NULL
display_name VARCHAR(100)
bio TEXT
profile_photo_url VARCHAR(500)
location_zip VARCHAR(10)
location_city VARCHAR(100)
location_lat DECIMAL(10, 8)
location_lon DECIMAL(11, 8)
kids_ages JSONB -- e.g., [2, 5, 8]
parenting_tags JSONB -- e.g., ["Montessori", "Outdoorsy", "Sports family"]
is_phone_verified BOOLEAN DEFAULT FALSE
is_id_verified BOOLEAN DEFAULT FALSE
is_parent_verified BOOLEAN DEFAULT FALSE
is_smoke_free_home BOOLEAN
is_pet_free_home BOOLEAN
stripe_connect_account_id VARCHAR(255)
total_donated DECIMAL(10, 2) DEFAULT 0 -- running sum of charity donations
created_at TIMESTAMP
updated_at TIMESTAMP
```

### listings
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
title VARCHAR(100) NOT NULL
description TEXT
price DECIMAL(10, 2) NOT NULL
original_price DECIMAL(10, 2)
category VARCHAR(50) NOT NULL
subcategory VARCHAR(50)
condition VARCHAR(20) NOT NULL -- 'like_new', 'gently_used', 'well_loved'
brand VARCHAR(100)
model VARCHAR(100)
age_range VARCHAR(20) -- '0-1', '1-2', '2-3', '3-5', '5-7', '7-10', '10-12', 'all'
size VARCHAR(50) -- for bikes, clothing, etc.
purchase_date DATE
location_zip VARCHAR(10)
location_city VARCHAR(100)
location_lat DECIMAL(10, 8)
location_lon DECIMAL(11, 8)
available_for VARCHAR(20) -- 'pickup', 'dropoff', 'both'
is_smoke_free BOOLEAN
is_pet_free BOOLEAN
safety_checked BOOLEAN DEFAULT FALSE
safety_check_date TIMESTAMP
has_recalls BOOLEAN DEFAULT FALSE
recall_details JSONB
is_active BOOLEAN DEFAULT TRUE
is_sold BOOLEAN DEFAULT FALSE
view_count INTEGER DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

### listing_images
```sql
id UUID PRIMARY KEY
listing_id UUID REFERENCES listings(id)
image_url VARCHAR(500) NOT NULL
display_order INTEGER DEFAULT 0
created_at TIMESTAMP
```

### conversations
```sql
id UUID PRIMARY KEY
listing_id UUID REFERENCES listings(id)
buyer_id UUID REFERENCES users(id)
seller_id UUID REFERENCES users(id)
last_message_at TIMESTAMP
created_at TIMESTAMP
```

### messages
```sql
id UUID PRIMARY KEY
conversation_id UUID REFERENCES conversations(id)
sender_id UUID REFERENCES users(id)
message_text TEXT NOT NULL
is_read BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
```

### transactions
```sql
id UUID PRIMARY KEY
listing_id UUID REFERENCES listings(id)
buyer_id UUID REFERENCES users(id)
seller_id UUID REFERENCES users(id)
item_price DECIMAL(10, 2) NOT NULL
platform_fee DECIMAL(10, 2) NOT NULL
donation_amount DECIMAL(10, 2) DEFAULT 0 -- charity donation
donation_charity_id UUID REFERENCES charities(id)
total_amount DECIMAL(10, 2) NOT NULL -- item + fee + donation
status VARCHAR(20) -- 'initiated', 'held', 'released', 'refunded', 'disputed'
stripe_payment_intent_id VARCHAR(255)
stripe_transfer_id VARCHAR(255)
meeting_type VARCHAR(20) -- 'local_pickup', 'doorstep_dropoff'
meeting_location TEXT
meeting_time TIMESTAMP
inspection_photo_url VARCHAR(500)
inspection_timestamp TIMESTAMP
inspection_gps_lat DECIMAL(10, 8)
inspection_gps_lon DECIMAL(11, 8)
inspection_checklist JSONB
buyer_accepted BOOLEAN
dispute_reason TEXT
dispute_status VARCHAR(20)
auto_release_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

### follows
```sql
id UUID PRIMARY KEY
follower_id UUID REFERENCES users(id)
following_id UUID REFERENCES users(id)
created_at TIMESTAMP
UNIQUE(follower_id, following_id)
```

### charities
```sql
id UUID PRIMARY KEY
name VARCHAR(255) NOT NULL
short_description VARCHAR(255) -- one-liner for checkout display
full_description TEXT
website_url VARCHAR(500)
logo_url VARCHAR(500)
location_city VARCHAR(100)
location_state VARCHAR(50)
is_active BOOLEAN DEFAULT TRUE
total_received DECIMAL(10, 2) DEFAULT 0 -- running total for reporting
created_at TIMESTAMP
updated_at TIMESTAMP
```

### donation_payouts (for tracking monthly disbursements)
```sql
id UUID PRIMARY KEY
charity_id UUID REFERENCES charities(id)
amount DECIMAL(10, 2) NOT NULL
period_start DATE NOT NULL
period_end DATE NOT NULL
transaction_count INTEGER -- how many transactions contributed
payout_date DATE
payout_method VARCHAR(50) -- 'bank_transfer', 'check'
payout_reference VARCHAR(255) -- check number or transfer ID
notes TEXT
created_at TIMESTAMP
```

---

## Safety Checks by Category

### Car Seats & Boosters
- Check against CPSC recalls
- Require manufacture date → Calculate expiration
- Block if expired or within 30 days of expiration
- Seller confirms: "Never in accident", "All straps intact", "No cracks"

### Bikes & Scooters
- Check against CPSC recalls
- Require size (wheel diameter or frame size)
- Seller confirms: "Brakes work", "No frame damage", "Tires hold air"

### Helmets (Bike, Sports, etc.)
- Check against CPSC recalls
- Require manufacture date
- Warn if older than 5 years (replacement recommended)
- Seller confirms: "No cracks", "Never in crash", "All padding intact"

### Cribs & Bassinets
- Check against CPSC recalls (critical - many recalls)
- Block drop-side cribs (banned since 2011)
- Seller confirms: "All hardware present", "No broken slats", "Meets current standards"

### High Chairs
- Check against CPSC recalls
- Seller confirms: "Straps work", "No cracks", "Stable base"

### Strollers
- Check against CPSC recalls
- Seller confirms: "Brakes work", "Frame intact", "Harness works"

### Toys
- Check against CPSC recalls
- Flag if age recommendation doesn't match listing
- Seller confirms: "No small parts missing", "No sharp edges"

### Sports Equipment
- Check against recalls where applicable
- Seller confirms condition appropriate for use
- Size/age appropriateness shown

---

## Success Metrics (First 90 Days)

### Usage
- 100+ active listings
- 300+ registered users
- 30+ completed transactions
- 50%+ users return after first transaction

### Quality
- 95%+ listings pass safety verification
- <5% spam/inappropriate listings
- <24 hour average response time in messages
- <5% transactions disputed

### Business
- $5,000+ GMV
- $300+ platform revenue
- CAC <$5 (organic growth)
- NPS >50

---

## Development Priority

**Week 1-2:** Auth, profiles (with parenting tags), listing creation with all categories
**Week 2-3:** Browse, search, filters, geo-filtering, messaging
**Week 3-4:** Stripe Connect setup, basic escrow flow
**Week 4-5:** Escrow inspection flow, anti-circumvention, charity donation at checkout
**Week 5:** Safety features (CPSC integration, expiration checks)
**Week 6:** Follow system, post-transaction connection prompt, activity feed
**Week 7:** Polish, testing, admin basics, charity partner setup
**Week 8:** Bug fixes, soft launch prep

---

## Open Questions

1. **React Native vs. Web First?** - Need to confirm with Claude Code
2. **ID verification threshold:** $200+ items only, or all items?
3. **Bike sizing:** Use wheel diameter, rider height, or both?
4. **Sports equipment:** How granular on categories? (Per sport or grouped?)
5. **Brand database:** Build our own or use existing product database API?

---

## Instructions for Claude Code

### Context
Pipit is a hyper-local kids gear marketplace (ages 0-12) with safety verification, escrow payments, and a community focus. We're building more than a transactional platform - we want to help parents connect and give back to local families in need.

### What to Build Now (MVP)

**Core Marketplace:**
- User auth with phone verification
- Rich profiles: bio, neighborhood, kids' ages, parenting tags (optional array like ["Montessori", "Outdoorsy"])
- Listing creation with all categories (baby through big kids)
- Browse with soft geo-filtering (default 20mi radius, user-adjustable)
- Distance shown on every listing card
- In-app messaging with quick replies
- Escrow payment via Stripe Connect
- Inspection flow with photo/GPS/timestamp

**Safety Features:**
- CPSC recall checker on listing creation
- Car seat expiration validation
- Category-specific safety checklists

**Charity Donation (New):**
- At checkout, show donation options after order subtotal
- Options: "Round up" (to nearest dollar, default selected), "2%", "5%", "No thanks"
- Display single hardcoded charity: name + one-line description
- Collect donation as part of total charge
- Store `donation_amount` and `donation_charity_id` on transaction
- Update user's `total_donated` running sum after successful transaction
- Show "You've donated $X to local families" on user profile (if > $0)
- Platform absorbs Stripe fee on donation portion
- See database schema for `charities` and `donation_payouts` tables

**Light Social Features:**
- Follow system (users can follow other users)
- Post-transaction connection prompt: "You and [Name] both have toddlers in [Area]. Want to stay connected?" with one-tap follow
- Activity feed with two sections:
  - "New near you" - recent listings within user's radius
  - "From parents you follow" - listings from followed users

### Architecture Notes (Build for Future)

Design the data model to support these future features without building them now:

**Future Social (Phase 2, Months 3-6):**
- Neighborhood groups (group discussions by location)
- User profiles already capture location + kids' ages + parenting tags - this enables future parent matching
- Messaging system should be extensible to group conversations

**Future Charity (Post-MVP):**
- Multiple charity selection (charities table supports this)
- Seller donations from payout
- Impact dashboard

### Explicitly Do NOT Build Yet

- ❌ Multiple charity selection UI (just hardcode one)
- ❌ Seller donation option (buyer only for now)
- ❌ Tax receipt generation
- ❌ Charity impact dashboard
- ❌ Neighborhood group discussions
- ❌ Parent matching algorithm
- ❌ Lend/borrow system
- ❌ Milestone sharing
- ❌ Expert AMAs
- ❌ Native mobile apps (web-first, mobile responsive)
- ❌ Shipping/delivery

### Key Technical Decisions

- **Geo approach:** Soft filtering, not hard gating. Anyone can sign up, they just see listings near them.
- **Charity payouts:** Manual monthly process for now. We'll write a check. No automation needed.
- **Default radius:** 20 miles, user-adjustable (5 / 15 / 25 / 50)
- **Follow system:** Simple - just follower_id, following_id, created_at. No "pending" or "approval" state.

### Brand Details

- **Name:** Pipit
- **Domain:** joinpipit.com
- **Tagline:** "Pass it on"

**Typography (Distinctive, NOT Generic):**
- **Headlines:** Recoleta (warm rounded serif) or Fraunces as fallback
- **Body:** DM Sans (warm humanist sans)
- **Prices/Codes:** DM Mono
- **NEVER USE:** Inter, Roboto, Arial, system fonts - these are forgettable

**Colors (Warm Foundation):**
- **Background:** #FFFCF9 (warm cream) - NOT white
- **Primary:** #2D9B8C (warm teal)
- **Secondary:** #E8725C (warm coral)
- **Accent:** #E8B44C (golden honey)
- **Text:** #4A3F37 (warm brown-black)
- **Neutrals:** Sand/stone tones (#F5EDE6, #E8DDD4, #6B5D52) - NOT cold grays

**Vibe:** Like a cozy neighborhood coffee shop run by people who genuinely care. Warm. Trustworthy. Human. Memorable. NOT cold, corporate, or generic tech.

### UI/UX Excellence (Critical)

**This is not optional.** The app must feel world-class. 

**Two reference documents:**
1. **MVP Spec (this doc)** - "UI/UX Excellence Standards" section above for principles and summary
2. **`pipit-ui-ux-design-system.md`** - Full 1700+ line design system with copy-paste ready CSS, detailed wireframes, animation code, and screen-by-screen specifications

**Key requirements:**
1. **Design system:** Use the exact spacing (8px grid), typography, colors, shadows, and radius tokens defined
2. **Desktop vs Mobile:** These are separate experiences. Implement both fully:
   - Desktop: Side nav, hover states, multi-column, keyboard support, modals
   - Mobile: Bottom nav, touch targets 44px+, gestures, bottom sheets, sticky CTAs
3. **Micro-interactions:** Every button, card, and input needs feedback. Use the transition timing defined.
4. **Loading states:** Skeleton screens everywhere. Never show blank loading states.
5. **Empty states:** Custom messaging + illustration + clear CTA for every empty view
6. **Accessibility:** WCAG AA contrast, keyboard nav, screen reader support, focus rings

**Polish checklist (every screen must pass):**
- [ ] Consistent spacing using 8px grid
- [ ] Clear visual hierarchy (one primary action per screen)
- [ ] All interactive elements have hover/active/focus states
- [ ] Loading state exists (skeleton preferred)
- [ ] Empty state exists with helpful guidance
- [ ] Error states are friendly and actionable
- [ ] Mobile and desktop layouts both implemented and tested
- [ ] Animations are smooth (60fps) and purposeful
- [ ] Accessibility basics covered (contrast, labels, keyboard)

**Reference quality:** Airbnb (warmth), Mailchimp (personality), Notion (cozy), Headspace (approachable). If it feels cold like a fintech app, it's wrong.
