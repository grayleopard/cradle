# Pipit Design Reference
## The Landing Page is the North Star

**Primary Reference:** `pipit-landing-page.html`

This landing page represents the definitive design standard for Pipit. Every screen in the app should feel exactly like this — same warmth, same polish, same personality. If something in the app doesn't feel as good as the landing page, it's not done.

---

## The Feeling We Nailed

The landing page feels:
- **Warm** — like a hug, not a tech product
- **Friendly** — approachable, not intimidating
- **Playful** — has personality, not corporate
- **Trustworthy** — polished signals quality
- **Human** — feels made by people who care

**This is the bar. Every screen must clear it.**

---

## Typography (Non-Negotiable)

```css
/* Headlines — Warm, distinctive serif */
--font-display: 'Fraunces', Georgia, serif;

/* Body — Clean, friendly sans */
--font-body: 'DM Sans', system-ui, sans-serif;
```

**Usage:**
- **Fraunces:** Page titles, section headers, card titles, empty state messages, anything with personality
- **DM Sans:** Body text, buttons, labels, form inputs, navigation

**Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap" rel="stylesheet">
```

---

## Color Palette (Exact Values)

```css
/* Warm Backgrounds — NOT white */
--bg-base: #FFFCF9;      /* Main page background */
--bg-warm: #FFF8F3;      /* Alternate sections */
--bg-cozy: #FFF5ED;      /* Hero areas, special callouts */
--surface: #FFFFFF;      /* Cards, inputs (float on warm bg) */

/* Primary — Warm Teal */
--primary-500: #2D9B8C;  /* Main actions */
--primary-400: #40BBA9;  /* Hover */
--primary-600: #257E72;  /* Pressed */
--primary-50: #F0FAF8;   /* Light tint backgrounds */

/* Secondary — Warm Coral */
--coral-500: #E8725C;
--coral-50: #FFF5F2;

/* Accent — Golden Honey */
--honey-500: #E8B44C;
--honey-400: #F5C95C;
--honey-50: #FFFBF0;

/* Warm Neutrals — NOT cold grays */
--sand-200: #F5EDE6;     /* Borders, dividers */
--sand-300: #E8DDD4;     /* Subtle backgrounds */
--sand-400: #D4C4B8;     /* Placeholder text */
--sand-500: #B8A395;     /* Muted text */
--sand-600: #9A8578;     /* Secondary text */
--sand-700: #6B5D52;     /* Body text */
--sand-800: #4A3F37;     /* Headlines, primary text */
```

---

## Emoji & Icon System (The Personality Layer)

**This is what gives Pipit its cheeky, fun, family flair.**

### Core Brand Emoji
| Emoji | Usage |
|-------|-------|
| 🐦 | Logo, brand moments |
| 💛 | Community, love, charity |
| 🔒 | Security, trust |
| 🛡️ | Safety verification |
| 📍 | Location, local |
| ✨ | Delight moments, new |

### Feature Emojis
| Emoji | Usage |
|-------|-------|
| 🎉 | Success states, celebrations |
| 👋 | Welcome, onboarding |
| 💬 | Messaging, chat |
| 📸 | Photos, camera |
| ⭐ | Ratings, favorites |
| ✓ / ✅ | Verification, complete |
| 🏠 | Home, navigation |
| 👤 | Profile |
| ➕ | Add, create |

### Category/Item Emojis (Examples)
| Emoji | Category |
|-------|----------|
| 🚼 | Baby gear |
| 🧸 | Toys |
| 👕 | Clothing |
| 🚲 | Bikes, outdoor |
| 📚 | Books |
| 🍼 | Feeding |
| 🛏️ | Sleep, nursery |
| 🚗 | Car seats, travel |

### When to Use Emojis
- **Section headers** — One emoji to add warmth
- **Empty states** — Friendly illustration + emoji
- **Success messages** — 🎉 "You're on the list!"
- **Trust badges** — 🛡️ Safety Verified, 🔒 Secure Payment
- **Navigation icons** — Can be emoji on mobile for playfulness
- **Tooltips & helpers** — Add friendliness to guidance

### When NOT to Use Emojis
- Dense data tables
- Error messages (keep those clear and calm)
- Legal text
- Prices
- Don't overdo it — 1-2 per section max

---

## Background Treatment

The landing page uses a layered warm background:

```css
/* Base warm cream */
body {
  background: #FFFCF9;
}

/* Subtle radial gradient from top */
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100vh;
  background: radial-gradient(ellipse at 50% 0%, #FFF5ED 0%, transparent 60%);
  pointer-events: none;
  z-index: -1;
}

/* Subtle grain texture overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.015;
  pointer-events: none;
  z-index: -1;
}
```

**Apply this to the main app shell.** Cards and surfaces are white (#FFFFFF) and "float" on this warm background.

---

## Shadow System (Warm Tinted)

```css
/* Use warm brown (30,25,20) not black */
--shadow-sm: 0 1px 3px rgba(30,25,20,0.06), 0 1px 2px rgba(30,25,20,0.04);
--shadow-md: 0 4px 6px rgba(30,25,20,0.05), 0 2px 4px rgba(30,25,20,0.03);
--shadow-lg: 0 10px 25px rgba(30,25,20,0.08), 0 4px 10px rgba(30,25,20,0.04);
--shadow-xl: 0 20px 40px rgba(30,25,20,0.1), 0 8px 16px rgba(30,25,20,0.05);
```

---

## Border Radius (Soft, Friendly)

```css
--radius-sm: 8px;        /* Buttons, inputs */
--radius-md: 12px;       /* Small cards */
--radius-lg: 16px;       /* Cards */
--radius-xl: 20px;       /* Large cards */
--radius-2xl: 24px;      /* Hero cards, modals */
--radius-full: 100px;    /* Pills, badges, avatar */
```

**Note:** The landing page uses generous radius. The email form is `border-radius: 100px` (pill shaped). Cards are `border-radius: 20px`. Nothing has sharp corners.

---

## Animation Style

### Entrance Animation
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate {
  animation: fadeInUp 0.8s cubic-bezier(0, 0, 0.2, 1) forwards;
}
```

### Stagger Pattern
Elements should animate in sequence, not all at once:
```css
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }
```

### Hover States
```css
/* Cards lift on hover */
.card {
  transition: all 0.3s cubic-bezier(0, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Buttons have subtle lift + glow */
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 155, 140, 0.3);
}
```

### Subtle Motion
```css
/* Floating animation (used on logo bird) */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* Pulse for attention (used on badge dot) */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
```

---

## Spacing (Generous)

The landing page breathes. Nothing is cramped.

```css
/* Section padding */
section {
  padding: 60px 0 80px;
}

@media (min-width: 768px) {
  section {
    padding: 80px 0 120px;
  }
}

/* Card padding */
.card {
  padding: 32px;
}

/* Element spacing */
margin-bottom: 16px;  /* Tight */
margin-bottom: 24px;  /* Normal */
margin-bottom: 32px;  /* Comfortable */
margin-bottom: 48px;  /* Section gap */
```

---

## Component Patterns from Landing Page

### Badge/Pill
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--honey-50);
  border: 1px solid var(--honey-400);
  color: var(--sand-800);
  padding: 8px 16px;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
}
```

### Card
```css
.card {
  background: var(--surface);
  border: 1px solid var(--sand-200);
  border-radius: 20px;
  padding: 32px;
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--sand-300);
}
```

### Primary Button
```css
.btn-primary {
  background: var(--primary-500);
  color: white;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  padding: 16px 32px;
  border-radius: 100px;  /* Pill shape */
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--primary-400);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(45, 155, 140, 0.3);
}
```

### Input
```css
.input {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--sand-800);
  padding: 16px 24px;
  border: 1px solid var(--sand-200);
  border-radius: 12px;
  background: var(--surface);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(45, 155, 140, 0.15);
}

.input::placeholder {
  color: var(--sand-400);
}
```

---

## Quick Checklist for Every Screen

Before marking any screen "done," verify:

- [ ] Uses Fraunces for headlines, DM Sans for body
- [ ] Background is warm cream (#FFFCF9), not white
- [ ] Cards are white and "float" on warm background
- [ ] Shadows are warm-tinted (brown, not black)
- [ ] Border radius is generous (nothing sharp)
- [ ] Has at least one emoji for personality
- [ ] Spacing is generous (nothing cramped)
- [ ] Animations stagger in sequence
- [ ] Hover states on all interactive elements
- [ ] Feels as polished as the landing page

---

## Examples of Emoji Usage in App

### Navigation (Mobile)
```
🏠 Home    🔍 Browse    ➕ Sell    💬 Chat    👤 Profile
```

### Empty States
```
🔍
No listings found nearby
Try expanding your search radius

[Expand Search]
```

```
💬
All caught up!
Your messages will appear here

[Browse Listings]
```

```
💛
Nothing saved yet
Tap the heart on items you love

[Start Browsing]
```

### Success Messages
```
🎉 Listing published!
Parents nearby can now see your item.
```

```
✅ Payment received
Funds will be released when the buyer confirms.
```

### Trust Badges on Listings
```
🛡️ Safety Verified
🔒 Secure Payment
📍 2.3 miles away
```

### Section Headers
```
📍 Near You
🔥 Just Listed
💛 Your Saved Items
```

---

## Final Word

**The landing page is proof we can do this.**

It's warm. It's polished. It has personality. It makes you want to use Pipit.

Now make every screen in the app feel the same way.

When in doubt, open `pipit-landing-page.html` and ask: "Does my screen feel this good?"

If not, keep going.
