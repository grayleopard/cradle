# UI/UX Improvements

Polish tasks for Claude to work on. Prioritized by user impact.

---

## High Impact

### Loading States
- [x] Add skeleton loaders to Home page listing grid
- [x] ListingDetail - data is synchronous from context (no loading needed, improved "not found" state instead)
- [x] Profile page - data is synchronous from context (no loading needed, improved empty states instead)
- [x] Add loading state to search results (skeleton shown during filter/search changes)

### Empty States
- [x] Improve "No listings found" empty state (context-aware messaging)
- [x] Add empty state for Messages page (+ full Heirloom theme update)
- [x] Add empty state for Saved Items
- [x] Add empty state for My Listings
- [x] Improve ListingDetail "not found" state

### Mobile Responsiveness
- [x] Test and fix any overflow issues on 375px (horizontal scroll patterns in place)
- [x] Ensure all modals work on small screens (AuthModal uses responsive bottom sheet)
- [x] Check bottom navigation spacing on iPhone X+ (added `pb-safe` with `env(safe-area-inset-bottom)`)

---

## Medium Impact

### Visual Consistency
- [ ] Audit all pages for Heirloom theme compliance
- [ ] Ensure consistent border radius usage
- [ ] Standardize button sizes
- [ ] Consistent spacing between sections

### Interactions
- [ ] Add hover effects to all clickable cards
- [ ] Add press feedback on mobile
- [ ] Smooth scroll to sections
- [ ] Better focus states for accessibility

### Forms
- [x] Add input validation feedback (CreateListing: title, description, price)
- [x] Character counters for text areas (title 60 chars, description 500 chars)
- [ ] Better date picker styling
- [ ] Consistent form layouts

---

## Low Impact (Nice to Have)

### Animations
- [ ] Page transition animations
- [ ] Card entry animations on scroll
- [ ] Micro-interactions on buttons
- [ ] Celebration animation on purchase

### Polish
- [ ] Add subtle gradients where appropriate
- [ ] Improve shadow depth hierarchy
- [ ] Better image loading (blur-up)
- [ ] Favicon and PWA icons

---

## Completed

- [x] Heirloom theme applied to all pages
- [x] Category filter visual feedback
- [x] Following tab empty state
- [x] Post-transaction follow prompt styling
- [x] New near you section styling

---

## Page-by-Page Audit

### Home.tsx
- [x] Hero section
- [x] Category icons
- [x] Listing grid
- [x] Search bar polish (clear button, search button, clear history)
- [x] Filter modal polish (radius picker with header, "show all" option)

### ListingDetail.tsx
- [ ] Image gallery improvements
- [ ] Seller info section
- [x] Action buttons (desktop side panel)
- [x] "Not found" state
- [ ] Safety badge styling

### Profile.tsx
- [ ] Stats cards
- [ ] Tab navigation
- [ ] Settings section
- [ ] Avatar styling
- [x] Empty states for all tabs (Selling, Buying, Saved, Alerts)

### Transaction.tsx
- [x] Timeline styling
- [x] Receipt card
- [x] Follow prompt
- [ ] Payment modal
- [ ] Inspection UI

### Messages.tsx (Inbox.tsx)
- [x] Conversation list (Heirloom theme)
- [ ] Message bubbles (Chat.tsx)
- [ ] Input area (Chat.tsx)
- [x] Empty state

---

## How to Use This List

1. Claude reads this file
2. Picks a task from highest impact section
3. Follows `.claude/skills/ui-polish/SKILL.md` workflow
4. Marks task as complete `[x]`
5. Runs `npm run build` to verify
6. Documents what changed

---

## Polish Checklist Per Component

When polishing a component, check:

- [ ] Colors match Heirloom palette
- [ ] Typography is correct (serif for headings)
- [ ] Spacing is consistent (p-4, gap-3, etc.)
- [ ] Borders use border-[#E3D5CA]
- [ ] Shadows are subtle (shadow-sm)
- [ ] Rounded corners are consistent (rounded-xl)
- [ ] Hover states exist
- [ ] Loading state exists
- [ ] Error state exists (if applicable)
- [ ] Empty state exists (if applicable)
- [ ] Mobile layout works
- [ ] Touch targets are 44px+
