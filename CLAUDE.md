# Pipit (Cradle) - Project Guidelines

## Project Overview

Pipit is a marketplace app for parents to buy and sell pre-loved baby/kids gear. Built with React, TypeScript, Vite, and Tailwind CSS. Uses Supabase for backend and Stripe for payments.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (Heirloom theme - warm, earthy tones)
- **State**: React Context (StoreContext)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe Connect
- **AI**: Google Gemini (safety checks, auto-fill) + Groq (deal analysis)
- **Deployment**: Vercel

## Development Commands

```bash
npm run dev      # Start Vite dev server on port 3000
npm run dev:api  # Start Vercel API server on port 3002
npm run build    # TypeScript check + Vite build
npm run lint     # ESLint check
npm run test     # Run Vitest tests
npm run preview  # Preview production build
```

### Full Dev Setup (with API routes)
To run the app with API routes (deal analysis, etc.), you need TWO terminals:

**Terminal 1 - API server (vercel):**
```bash
GROQ_API_KEY="your-key" npm run dev:api
```
Note: vercel dev doesn't load .env.local properly, so pass GROQ_API_KEY inline.

**Terminal 2 - Frontend (vite):**
```bash
npm run dev
```

Then open http://localhost:3000 - API calls are proxied to port 3002 via vite.config.ts.

## Code Standards

### TypeScript
- Strict mode enabled
- All components must have typed props
- Use interfaces over types for object shapes
- Enums for fixed value sets (see `types.ts`)

### React Patterns
- Functional components only
- Custom hooks in `/context/` for shared state
- Use `useStore()` hook for global state access
- Error boundaries wrap the app (see `index.tsx`)

### Styling (Heirloom Theme)
The app uses a consistent "Heirloom" design system:

```
Primary Colors:
- Background: #F9F6F0 (warm cream)
- Text: #2F3E2E (forest green)
- Accent: #C68E68 (terracotta)
- Secondary: #B07D5B (darker terracotta)
- Border: #E3D5CA (warm gray)
- Card BG: #F5EBE0 (light warm)

Typography:
- Headings: font-serif (Georgia)
- Body: system-ui, sans-serif
- Rounded corners: rounded-xl, rounded-2xl

Components:
- Cards: bg-white rounded-xl border border-[#E3D5CA] shadow-sm
- Buttons: rounded-full or rounded-xl
- Inputs: bg-white rounded-xl border border-[#E3D5CA]
```

### File Organization

```
/
├── App.tsx              # Routes and app shell
├── index.tsx            # Entry point + ErrorBoundary
├── types.ts             # All TypeScript interfaces/enums
├── constants.ts         # Mock data and constants
├── components/          # Reusable UI components
│   ├── Layout.tsx       # Navigation shell
│   ├── ListingCard.tsx  # Product card component
│   └── ...
├── pages/               # Route pages
│   ├── Home.tsx         # Main browse page
│   ├── Profile.tsx      # User profile
│   ├── ListingDetail.tsx
│   └── ...
├── context/             # React contexts
│   ├── StoreContext.tsx # Main app state
│   └── ToastContext.tsx # Notifications
├── services/            # External API integrations
│   ├── supabase.ts      # Supabase client
│   ├── stripeService.ts # Stripe integration
│   └── geminiService.ts # AI features
├── utils/               # Helper functions
└── api/                 # Vercel serverless functions
```

## Key Features

### Current (MVP)
- Browse/search listings with filters
- Category navigation
- User profiles with bio, neighborhood, kid ages
- Follow system (follow parents, see their listings)
- Make offers / negotiation
- Stripe Connect payments with escrow
- In-person meetup coordination
- Smart inspection checklist (AI-generated)
- Post-transaction follow prompts
- Referral program ($5 credit)
- Deal analysis (AI-powered)
- Safety verification for car seats

### Data Flow
1. User actions → StoreContext functions
2. StoreContext → localStorage (fallback) + Supabase (primary)
3. Components read from StoreContext via `useStore()` hook

## Bug Fixing Guidelines

1. **Reproduce first**: Understand the exact steps to trigger the bug
2. **Check console**: Look for errors in browser dev tools
3. **Trace the flow**: Follow data from component → context → service
4. **Minimal fix**: Change only what's necessary
5. **Test thoroughly**: Verify fix doesn't break other features
6. **Run build**: `npm run build` must pass before considering done

## UI/UX Guidelines

1. **Mobile-first**: Design for 375px width, then scale up
2. **Touch targets**: Minimum 44x44px for interactive elements
3. **Loading states**: Show spinners/skeletons during async operations
4. **Empty states**: Helpful messages when no data
5. **Error states**: Clear error messages with recovery actions
6. **Animations**: Use Tailwind's `animate-in` for smooth transitions
7. **Consistency**: Match existing Heirloom theme patterns

## Common Patterns

### Adding a new page
1. Create component in `/pages/`
2. Add route in `App.tsx`
3. Update `Layout.tsx` navigation if needed

### Adding a new feature
1. Define types in `types.ts`
2. Add state/functions to `StoreContext.tsx`
3. Update Supabase sync if persistent
4. Create UI components
5. Test all flows

### Modifying state
1. Add to StoreContext interface
2. Initialize in useState
3. Add to localStorage persistence
4. Add Supabase sync functions
5. Update mapFromDB if reading from DB

## Environment Variables

```
VITE_SUPABASE_URL=       # Supabase project URL
VITE_SUPABASE_ANON_KEY=  # Supabase anon key
VITE_STRIPE_PUBLISHABLE_KEY= # Stripe public key
VITE_GEMINI_API_KEY=     # Google Gemini API key
VITE_CLOUDINARY_URL=     # Cloudinary upload URL

# Server-side only (not VITE_ prefixed)
STRIPE_SECRET_KEY=       # Stripe secret key
```

## Testing Checklist

Before considering a feature complete:
- [ ] Works on mobile (375px)
- [ ] Works on tablet (768px)
- [ ] Works on desktop (1280px+)
- [ ] Loading states shown
- [ ] Error handling works
- [ ] `npm run build` passes
- [ ] No console errors
- [ ] Matches Heirloom theme

## Autonomous Development

Claude can work independently on:
- Bug fixes (with clear reproduction steps)
- UI polish (matching existing patterns)
- Code refactoring (maintaining behavior)
- Adding tests
- Documentation updates

For new features, prefer to discuss approach first.

## Spec Files

Check `.claude/specs/` for:
- `backlog.md` - Prioritized task list
- `known-bugs.md` - Bugs to fix
- `ui-improvements.md` - UI polish items
