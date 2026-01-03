# Pipit UI/UX Design System v2.0
## A Warm, Distinctive, World-Class Design System

**Purpose:** This document defines the design system that will make Pipit feel genuinely world-class AND distinctively warm. The goal is for users to feel welcomed, safe, and delighted—like walking into a cozy neighborhood coffee shop, not a sterile tech product.

**Design Philosophy:** Pipit should feel like your favorite local shop run by people who genuinely care. Warm. Trustworthy. Human. Memorable. The kind of place you tell your friends about.

---

# Part 1: Design Philosophy & Principles

## The Feeling We're Creating

When a tired parent opens Pipit, they should feel:
- **Relief** — "Finally, something that doesn't feel like a scam"
- **Welcome** — "This feels like a place for people like me"
- **Trust** — "I can tell real humans built this with care"
- **Calm** — "This is easy. I can do this."

**NOT:**
- "This looks like every other tech app"
- "This feels corporate and cold"
- "This is overwhelming"
- "I don't trust this"

## Core Design Principles

### 1. Warmth Is Non-Negotiable
Every design decision should add warmth. Warm colors. Warm typography. Warm shadows. Warm empty states. If something feels cold or clinical, it's wrong.

### 2. Distinctive Over Generic
We'd rather be memorable and slightly imperfect than forgettable and polished. Pipit should have a recognizable visual voice that you'd know anywhere.

### 3. Cozy Confidence
Like a well-worn leather chair in a beautiful library. Comfortable AND impressive. Approachable AND trustworthy. Never sterile. Never cheap.

### 4. Human-Made Feel
Subtle imperfections are okay. Slight texture. Rounded corners. Hand-drawn illustrations. This should feel like humans made it for humans, not like AI generated it.

### 5. Parents Are Exhausted
Clarity is kindness. One thing per screen. Big touch targets. Obvious next steps. Don't make them think.

---

## Visual References (What We're Aiming For)

| Brand | What to Borrow |
|-------|----------------|
| **Airbnb** | Warm photography, cream backgrounds, friendly typography, trust-building |
| **Mailchimp** | Personality in typography, playful illustrations, warm yellow |
| **Notion** | Off-white backgrounds, subtle warmth, cozy feeling |
| **Calm** | Soothing gradients, breathing room, nurturing feeling |
| **Headspace** | Warm illustrations, friendly personality, approachable design |

**NOT referencing:**
- Stripe (too cold/corporate for our audience)
- Linear (too developer-focused)
- Generic SaaS (forgettable)

---

# Part 2: Typography

## The Soul of Our Design

Typography is the single most important design decision. It sets the emotional tone before users read a single word.

## Font Choices

### Headlines: Recoleta
**Why:** Recoleta is a warm, rounded serif with personality. It feels like a friendly librarian or a cozy bookstore. It's distinctive without being quirky, sophisticated without being cold.

```css
@import url('https://fonts.googleapis.com/css2?family=Recoleta:wght@400;500;600;700&display=swap');
/* Note: Recoleta may require licensing. Alternative: Fraunces (Google Fonts) */

/* If Recoleta unavailable, use Fraunces as backup */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&display=swap');
```

**Character:** Warm, approachable, memorable, sophisticated
**Use for:** Page titles, section headers, marketing headlines, empty state messages

### Body: DM Sans
**Why:** DM Sans has subtle humanist warmth while remaining highly readable. It pairs beautifully with Recoleta—geometric enough to feel modern, but with soft curves that feel friendly.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
```

**Character:** Clean, warm, readable, modern-but-friendly
**Use for:** Body text, UI labels, buttons, form fields, navigation

### Accent: DM Mono (sparingly)
**Why:** For prices, codes, and technical details. Adds subtle variety.

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');
```

**Use for:** Prices, verification codes, timestamps

---

## Typography Scale

### Mobile Type Scale
```css
:root {
  /* Display - Hero headlines */
  --text-display: 2.5rem;      /* 40px */
  --text-display-leading: 1.1;
  --text-display-weight: 700;
  --text-display-font: 'Recoleta', 'Fraunces', Georgia, serif;

  /* Heading 1 - Page titles */
  --text-h1: 2rem;             /* 32px */
  --text-h1-leading: 1.2;
  --text-h1-weight: 600;
  --text-h1-font: 'Recoleta', 'Fraunces', Georgia, serif;

  /* Heading 2 - Section titles */
  --text-h2: 1.5rem;           /* 24px */
  --text-h2-leading: 1.25;
  --text-h2-weight: 600;
  --text-h2-font: 'Recoleta', 'Fraunces', Georgia, serif;

  /* Heading 3 - Card titles, subsections */
  --text-h3: 1.25rem;          /* 20px */
  --text-h3-leading: 1.3;
  --text-h3-weight: 600;
  --text-h3-font: 'DM Sans', system-ui, sans-serif;

  /* Body Large - Emphasized paragraphs */
  --text-lg: 1.125rem;         /* 18px */
  --text-lg-leading: 1.6;
  --text-lg-weight: 400;
  --text-lg-font: 'DM Sans', system-ui, sans-serif;

  /* Body - Default text */
  --text-base: 1rem;           /* 16px */
  --text-base-leading: 1.6;
  --text-base-weight: 400;
  --text-base-font: 'DM Sans', system-ui, sans-serif;

  /* Small - Secondary text, captions */
  --text-sm: 0.875rem;         /* 14px */
  --text-sm-leading: 1.5;
  --text-sm-weight: 400;
  --text-sm-font: 'DM Sans', system-ui, sans-serif;

  /* Tiny - Timestamps, metadata */
  --text-xs: 0.75rem;          /* 12px */
  --text-xs-leading: 1.5;
  --text-xs-weight: 500;
  --text-xs-font: 'DM Sans', system-ui, sans-serif;
}
```

### Desktop Type Scale (Larger)
```css
@media (min-width: 1024px) {
  :root {
    --text-display: 3.5rem;    /* 56px */
    --text-h1: 2.5rem;         /* 40px */
    --text-h2: 1.875rem;       /* 30px */
    --text-h3: 1.5rem;         /* 24px */
    --text-lg: 1.25rem;        /* 20px */
    --text-base: 1rem;         /* 16px */
    --text-sm: 0.875rem;       /* 14px */
    --text-xs: 0.75rem;        /* 12px */
  }
}
```

### Typography Usage Examples

```css
/* Page title */
.page-title {
  font-family: var(--text-h1-font);
  font-size: var(--text-h1);
  font-weight: var(--text-h1-weight);
  line-height: var(--text-h1-leading);
  color: var(--color-text-primary);
  letter-spacing: -0.02em; /* Slight tightening for headlines */
}

/* Section header */
.section-header {
  font-family: var(--text-h2-font);
  font-size: var(--text-h2);
  font-weight: var(--text-h2-weight);
  line-height: var(--text-h2-leading);
  color: var(--color-text-primary);
}

/* Card title */
.card-title {
  font-family: var(--text-h3-font);
  font-size: var(--text-h3);
  font-weight: var(--text-h3-weight);
  line-height: var(--text-h3-leading);
  color: var(--color-text-primary);
}

/* Body text */
.body-text {
  font-family: var(--text-base-font);
  font-size: var(--text-base);
  font-weight: var(--text-base-weight);
  line-height: var(--text-base-leading);
  color: var(--color-text-secondary);
}

/* Price display */
.price {
  font-family: 'DM Mono', monospace;
  font-size: var(--text-h3);
  font-weight: 600;
  color: var(--color-text-primary);
}
```

---

# Part 3: Color System

## The Warmth Foundation

Our color system is built on WARM foundations. No cold grays. No stark white. Everything has a hint of warmth.

## Complete Color Palette

```css
:root {
  /* ═══════════════════════════════════════════════════════════
     BACKGROUNDS - The Foundation of Warmth
     These are the MOST IMPORTANT colors. Warm backgrounds make
     everything feel cozy. Cold backgrounds ruin everything.
     ═══════════════════════════════════════════════════════════ */
  
  /* Page backgrounds - warm cream, NOT white */
  --color-bg-base: #FFFCF9;        /* Main page background - warm cream */
  --color-bg-warm: #FFF8F3;        /* Slightly warmer - alternate sections */
  --color-bg-cozy: #FFF5ED;        /* Warmest - hero sections, CTAs */
  
  /* Surface backgrounds - for cards, modals, elevated elements */
  --color-surface: #FFFFFF;        /* Cards float on warm bg */
  --color-surface-warm: #FFFDFB;   /* Warmer surface option */
  --color-surface-hover: #FFF9F5;  /* Surface on hover */
  
  /* ═══════════════════════════════════════════════════════════
     WARM NEUTRALS - Sand & Stone Tones
     These replace cold grays throughout the UI.
     ═══════════════════════════════════════════════════════════ */
  
  --color-sand-50: #FFFCF9;        /* Lightest - same as bg-base */
  --color-sand-100: #FFF8F3;       /* Very light warm */
  --color-sand-200: #F5EDE6;       /* Borders, dividers */
  --color-sand-300: #E8DDD4;       /* Subtle accents, disabled bg */
  --color-sand-400: #D4C4B8;       /* Placeholder text, icons */
  --color-sand-500: #B8A395;       /* Muted text, secondary icons */
  --color-sand-600: #9A8578;       /* Secondary text */
  --color-sand-700: #6B5D52;       /* Body text */
  --color-sand-800: #4A3F37;       /* Headlines, emphasis */
  --color-sand-900: #2D2622;       /* Maximum contrast */
  
  /* ═══════════════════════════════════════════════════════════
     PRIMARY - Warm Teal (Trust & Action)
     Shifted warmer than standard teal. More green, less blue.
     ═══════════════════════════════════════════════════════════ */
  
  --color-primary-50: #F0FAF8;     /* Lightest tint */
  --color-primary-100: #D4F1EC;    /* Light backgrounds */
  --color-primary-200: #A8E4DA;    /* Light accents */
  --color-primary-300: #6FD1C2;    /* Medium accents */
  --color-primary-400: #40BBA9;    /* Hover states */
  --color-primary-500: #2D9B8C;    /* PRIMARY - Main brand color */
  --color-primary-600: #257E72;    /* Pressed states */
  --color-primary-700: #1E6960;    /* Dark accents */
  --color-primary-800: #18544D;    /* Very dark */
  --color-primary-900: #0F3835;    /* Darkest */
  
  /* ═══════════════════════════════════════════════════════════
     SECONDARY - Warm Coral (Energy & Warmth)
     Like a sunset. Inviting, not alarming.
     ═══════════════════════════════════════════════════════════ */
  
  --color-coral-50: #FFF5F2;       /* Lightest tint */
  --color-coral-100: #FFE8E2;      /* Light backgrounds */
  --color-coral-200: #FFCFC3;      /* Light accents */
  --color-coral-300: #FFB09D;      /* Medium accents */
  --color-coral-400: #F28F78;      /* Hover states */
  --color-coral-500: #E8725C;      /* SECONDARY - Main accent */
  --color-coral-600: #D45A44;      /* Pressed states */
  --color-coral-700: #B84535;      /* Dark accents */
  --color-coral-800: #943728;      /* Very dark */
  --color-coral-900: #6E291E;      /* Darkest */
  
  /* ═══════════════════════════════════════════════════════════
     ACCENT - Golden Honey (Highlights & Optimism)
     Warm, sunny, hopeful. Use for badges, highlights, success.
     ═══════════════════════════════════════════════════════════ */
  
  --color-honey-50: #FFFBF0;       /* Lightest tint */
  --color-honey-100: #FFF4D9;      /* Light backgrounds */
  --color-honey-200: #FFE9B3;      /* Light accents */
  --color-honey-300: #FFDB85;      /* Medium accents */
  --color-honey-400: #F5C95C;      /* Hover states */
  --color-honey-500: #E8B44C;      /* ACCENT - Main highlight */
  --color-honey-600: #D49C35;      /* Pressed states */
  --color-honey-700: #B88025;      /* Dark accents */
  --color-honey-800: #946518;      /* Very dark */
  --color-honey-900: #6E4B10;      /* Darkest */
  
  /* ═══════════════════════════════════════════════════════════
     SEMANTIC COLORS - Status & Feedback
     ═══════════════════════════════════════════════════════════ */
  
  /* Success - Warm green */
  --color-success-light: #ECFDF5;
  --color-success: #10B981;
  --color-success-dark: #047857;
  
  /* Warning - Warm amber */
  --color-warning-light: #FFFBEB;
  --color-warning: #F59E0B;
  --color-warning-dark: #B45309;
  
  /* Error - Warm red (not harsh) */
  --color-error-light: #FEF2F2;
  --color-error: #E55B5B;          /* Softer than pure red */
  --color-error-dark: #B91C1C;
  
  /* Info - Warm blue */
  --color-info-light: #EFF6FF;
  --color-info: #4A90D9;           /* Warmer blue */
  --color-info-dark: #1D4ED8;
  
  /* ═══════════════════════════════════════════════════════════
     TEXT COLORS - Readable, Warm
     ═══════════════════════════════════════════════════════════ */
  
  --color-text-primary: var(--color-sand-800);     /* #4A3F37 - Headlines */
  --color-text-secondary: var(--color-sand-700);   /* #6B5D52 - Body */
  --color-text-tertiary: var(--color-sand-500);    /* #B8A395 - Muted */
  --color-text-placeholder: var(--color-sand-400); /* #D4C4B8 - Placeholder */
  --color-text-inverse: #FFFFFF;                    /* On dark backgrounds */
  
  /* ═══════════════════════════════════════════════════════════
     BORDER COLORS
     ═══════════════════════════════════════════════════════════ */
  
  --color-border-light: var(--color-sand-200);     /* #F5EDE6 - Subtle */
  --color-border-default: var(--color-sand-300);   /* #E8DDD4 - Default */
  --color-border-strong: var(--color-sand-400);    /* #D4C4B8 - Emphasis */
}
```

## Gradient System

```css
:root {
  /* Hero gradient - warm and inviting */
  --gradient-hero: linear-gradient(
    180deg,
    var(--color-bg-base) 0%,
    var(--color-bg-cozy) 50%,
    var(--color-bg-base) 100%
  );
  
  /* Warm radial - for hero sections */
  --gradient-radial-warm: radial-gradient(
    ellipse at top center,
    var(--color-bg-cozy) 0%,
    var(--color-bg-base) 70%
  );
  
  /* Sunset gradient - for special moments */
  --gradient-sunset: linear-gradient(
    135deg,
    var(--color-coral-100) 0%,
    var(--color-honey-100) 100%
  );
  
  /* Primary gradient - for CTAs */
  --gradient-primary: linear-gradient(
    135deg,
    var(--color-primary-400) 0%,
    var(--color-primary-600) 100%
  );
  
  /* Card hover gradient - subtle warmth */
  --gradient-card-hover: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-honey-50) 100%
  );
  
  /* Image overlay - for text on photos */
  --gradient-image-overlay: linear-gradient(
    180deg,
    transparent 40%,
    rgba(45, 38, 34, 0.7) 100%
  );
}
```

## Background Texture

Add a subtle paper/grain texture for warmth and depth:

```css
/* Subtle grain texture overlay */
.textured-bg {
  position: relative;
}

.textured-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.02;
  pointer-events: none;
  mix-blend-mode: multiply;
}

/* Alternative: CSS-only subtle texture */
.warm-texture {
  background-color: var(--color-bg-base);
  background-image: 
    radial-gradient(
      circle at 25% 25%,
      var(--color-sand-100) 1px,
      transparent 1px
    ),
    radial-gradient(
      circle at 75% 75%,
      var(--color-sand-100) 1px,
      transparent 1px
    );
  background-size: 50px 50px;
}
```

---

# Part 4: Spacing System

## 8px Base Grid

All spacing uses multiples of 8px for visual harmony.

```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;      /* 4px - Tight, inline */
  --space-2: 0.5rem;       /* 8px - Compact */
  --space-3: 0.75rem;      /* 12px - Small gap */
  --space-4: 1rem;         /* 16px - Default */
  --space-5: 1.25rem;      /* 20px - Medium */
  --space-6: 1.5rem;       /* 24px - Comfortable */
  --space-8: 2rem;         /* 32px - Large */
  --space-10: 2.5rem;      /* 40px - Section */
  --space-12: 3rem;        /* 48px - Big section */
  --space-16: 4rem;        /* 64px - Hero */
  --space-20: 5rem;        /* 80px - Major */
  --space-24: 6rem;        /* 96px - Page-level */
}
```

---

# Part 5: Border Radius & Shadows

## Soft, Rounded Corners

Everything should feel soft and approachable.

```css
:root {
  --radius-sm: 8px;        /* Buttons, inputs, small elements */
  --radius-md: 12px;       /* Cards, dropdowns */
  --radius-lg: 16px;       /* Large cards, images */
  --radius-xl: 24px;       /* Hero elements, modals */
  --radius-2xl: 32px;      /* Feature cards, special elements */
  --radius-full: 9999px;   /* Pills, avatars, circular */
}
```

## Warm Shadows

Shadows should feel soft and warm, not harsh. We use warm-tinted shadows.

```css
:root {
  /* Warm shadow base color */
  --shadow-color: 30, 25, 20; /* RGB values for warm brown */
  
  /* Elevation levels */
  --shadow-xs: 
    0 1px 2px rgba(var(--shadow-color), 0.04);
  
  --shadow-sm: 
    0 1px 3px rgba(var(--shadow-color), 0.06),
    0 1px 2px rgba(var(--shadow-color), 0.04);
  
  --shadow-md: 
    0 4px 6px rgba(var(--shadow-color), 0.05),
    0 2px 4px rgba(var(--shadow-color), 0.03);
  
  --shadow-lg: 
    0 10px 15px rgba(var(--shadow-color), 0.06),
    0 4px 6px rgba(var(--shadow-color), 0.03);
  
  --shadow-xl: 
    0 20px 25px rgba(var(--shadow-color), 0.08),
    0 8px 10px rgba(var(--shadow-color), 0.04);
  
  --shadow-2xl: 
    0 25px 50px rgba(var(--shadow-color), 0.15);
  
  /* Special shadows */
  --shadow-inner: 
    inset 0 2px 4px rgba(var(--shadow-color), 0.04);
  
  --shadow-glow-primary: 
    0 0 0 3px rgba(45, 155, 140, 0.15);
  
  --shadow-glow-error: 
    0 0 0 3px rgba(229, 91, 91, 0.15);
  
  /* Card shadow with warm tint */
  --shadow-card: 
    0 2px 8px rgba(var(--shadow-color), 0.04),
    0 4px 16px rgba(var(--shadow-color), 0.04);
  
  --shadow-card-hover: 
    0 4px 12px rgba(var(--shadow-color), 0.06),
    0 8px 24px rgba(var(--shadow-color), 0.06);
}
```

---

# Part 6: Animation & Motion

## Timing & Easing

Animations should feel natural and organic, not robotic.

```css
:root {
  /* Durations */
  --duration-instant: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 400ms;
  --duration-slowest: 600ms;
  
  /* Easing curves */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## Animation Keyframes

```css
/* Fade in from below */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade in with scale */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Gentle bounce */
@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Success pop */
@keyframes successPop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

/* Heart beat for favoriting */
@keyframes heartBeat {
  0% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Shimmer for loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Checkmark draw */
@keyframes drawCheck {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

/* Pulse glow */
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(45, 155, 140, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(45, 155, 140, 0); }
}

/* Stagger children animation helper */
.stagger-children > * {
  animation: fadeInUp var(--duration-normal) var(--ease-out) forwards;
  opacity: 0;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
```

---

# Part 7: Component Specifications

## Buttons

### Primary Button
```css
.btn-primary {
  font-family: var(--text-base-font);
  font-weight: 600;
  font-size: var(--text-base);
  color: white;
  background: var(--color-primary-500);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  
  /* Subtle inner highlight */
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--color-primary-400);
  transform: translateY(-1px);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    var(--shadow-md),
    0 4px 12px rgba(45, 155, 140, 0.25);
}

.btn-primary:active {
  background: var(--color-primary-600);
  transform: translateY(0);
  box-shadow: var(--shadow-xs);
}

.btn-primary:focus-visible {
  outline: none;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    var(--shadow-sm),
    var(--shadow-glow-primary);
}

/* Mobile: Larger touch target */
@media (max-width: 768px) {
  .btn-primary {
    padding: var(--space-4) var(--space-6);
    min-height: 48px;
    width: 100%;
  }
}
```

### Secondary Button
```css
.btn-secondary {
  font-family: var(--text-base-font);
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-primary-600);
  background: transparent;
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-primary-200);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
}

.btn-secondary:hover {
  background: var(--color-primary-50);
  border-color: var(--color-primary-300);
}

.btn-secondary:active {
  background: var(--color-primary-100);
}
```

### Warm Button (for special CTAs)
```css
.btn-warm {
  font-family: var(--text-base-font);
  font-weight: 600;
  font-size: var(--text-base);
  color: var(--color-sand-900);
  background: var(--gradient-sunset);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-default);
  box-shadow: var(--shadow-sm);
}

.btn-warm:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

---

## Cards

### Listing Card
```css
.listing-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border-light);
  transition: all var(--duration-normal) var(--ease-default);
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--color-border-default);
}

/* Mobile: No hover transform, use active state */
@media (max-width: 768px) {
  .listing-card:hover {
    transform: none;
  }
  
  .listing-card:active {
    transform: scale(0.98);
    transition-duration: var(--duration-fast);
  }
}

.card-image {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  background: var(--color-sand-100);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--duration-slow) var(--ease-default);
}

.listing-card:hover .card-image img {
  transform: scale(1.03);
}

.card-content {
  padding: var(--space-4);
}

.card-title {
  font-family: var(--text-h3-font);
  font-size: var(--text-h3);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-1);
}

.card-price {
  font-family: 'DM Mono', monospace;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.card-meta {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  margin-top: var(--space-2);
}
```

### Price Badge (on image)
```css
.price-badge {
  position: absolute;
  bottom: var(--space-3);
  left: var(--space-3);
  background: var(--color-surface);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-family: 'DM Mono', monospace;
  font-weight: 600;
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-md);
}
```

### Safety Badge
```css
.safety-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  background: var(--color-success-light);
  color: var(--color-success-dark);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
}

.safety-badge-icon {
  width: 14px;
  height: 14px;
}

/* Gentle pulse on first appear */
.safety-badge.animate {
  animation: pulseGlow 2s ease-out 1;
}
```

---

## Form Inputs

```css
.input {
  width: 100%;
  font-family: var(--text-base-font);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-surface);
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-border-default);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast) var(--ease-default);
}

.input::placeholder {
  color: var(--color-text-placeholder);
}

.input:hover {
  border-color: var(--color-border-strong);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-400);
  box-shadow: var(--shadow-glow-primary);
}

.input-error {
  border-color: var(--color-error);
}

.input-error:focus {
  box-shadow: var(--shadow-glow-error);
}

/* Mobile: Larger, prevents iOS zoom */
@media (max-width: 768px) {
  .input {
    font-size: 1rem; /* 16px minimum to prevent zoom */
    padding: var(--space-4);
    min-height: 48px;
  }
}

/* Label */
.label {
  display: block;
  font-family: var(--text-base-font);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-2);
}

/* Helper text */
.helper-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

.error-text {
  font-size: var(--text-xs);
  color: var(--color-error);
  margin-top: var(--space-1);
}
```

---

## Loading States

### Skeleton
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-sand-100) 0%,
    var(--color-sand-50) 40%,
    var(--color-sand-50) 60%,
    var(--color-sand-100) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

.skeleton-text {
  height: 1em;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.skeleton-text:last-child {
  width: 70%;
}

.skeleton-image {
  aspect-ratio: 4/3;
  border-radius: var(--radius-lg);
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
}
```

---

# Part 8: Mobile-Specific Guidelines

## Navigation

```
┌────────────────────────────────────┐
│  🐦 pipit              🔍  💬  👤  │  ← Minimal header
├────────────────────────────────────┤
│                                    │
│         Scrollable content         │
│                                    │
│                                    │
├────────────────────────────────────┤
│  🏠    📦    ➕    💬    👤       │  ← Bottom nav
│  Home  Browse Sell  Chat  Profile  │
└────────────────────────────────────┘
```

```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-light);
  padding: var(--space-2) var(--space-4);
  padding-bottom: calc(var(--space-2) + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  color: var(--color-text-tertiary);
  text-decoration: none;
  transition: color var(--duration-fast);
  min-width: 64px;
  min-height: 44px;
}

.nav-item.active {
  color: var(--color-primary-500);
}

.nav-item-icon {
  width: 24px;
  height: 24px;
}

.nav-item-label {
  font-size: var(--text-xs);
  font-weight: 500;
}

/* Center sell button - special treatment */
.nav-item-sell {
  background: var(--color-primary-500);
  color: white;
  border-radius: var(--radius-full);
  padding: var(--space-3);
  margin-top: calc(-1 * var(--space-4));
  box-shadow: var(--shadow-md);
}
```

## Touch Targets

```css
/* Minimum 44x44px for all interactive elements */
button, a, .touchable {
  min-height: 44px;
  min-width: 44px;
}

/* Icon buttons with invisible touch expansion */
.icon-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  transition: background var(--duration-fast);
}

.icon-button:active {
  background: var(--color-sand-100);
}

.icon-button svg {
  width: 24px;
  height: 24px;
}
```

## Bottom Sheet

```css
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(45, 38, 34, 0.4);
  backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-normal);
  z-index: 200;
}

.bottom-sheet-overlay.open {
  opacity: 1;
  visibility: visible;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-surface);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: var(--space-6);
  padding-bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform var(--duration-slow) var(--ease-out);
  z-index: 201;
  max-height: 90vh;
  overflow-y: auto;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--color-sand-300);
  border-radius: var(--radius-full);
  margin: 0 auto var(--space-4);
}
```

## Sticky CTA

```css
.sticky-cta {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    180deg,
    transparent 0%,
    var(--color-bg-base) 30%
  );
  padding: var(--space-6) var(--space-4) var(--space-4);
  padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
  z-index: 50;
}

/* Account for sticky CTA in page content */
.has-sticky-cta {
  padding-bottom: 100px;
}
```

---

# Part 9: Desktop-Specific Guidelines

## Navigation

```css
.desktop-nav {
  position: sticky;
  top: 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--space-4) var(--space-8);
  z-index: 100;
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  font-family: var(--text-h1-font);
  font-size: var(--text-h3);
  font-weight: 700;
  color: var(--color-primary-500);
  text-decoration: none;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nav-link {
  font-family: var(--text-base-font);
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
}

.nav-link:hover {
  color: var(--color-text-primary);
  background: var(--color-sand-50);
}

.nav-link.active {
  color: var(--color-primary-600);
  background: var(--color-primary-50);
}
```

## Hover States (Critical!)

Every interactive element MUST have a hover state on desktop.

```css
/* Card hover - lift and glow */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
}

/* Button hover - see button section */

/* Link hover */
.link {
  color: var(--color-primary-600);
  text-decoration: none;
  transition: color var(--duration-fast);
}

.link:hover {
  color: var(--color-primary-500);
  text-decoration: underline;
}

/* Icon button hover */
.icon-button:hover {
  background: var(--color-sand-100);
}

/* Table row hover */
.table-row:hover {
  background: var(--color-sand-50);
}

/* List item hover */
.list-item:hover {
  background: var(--color-sand-50);
}
```

## Focus States

```css
/* Focus visible - keyboard only */
:focus-visible {
  outline: 2px solid var(--color-primary-400);
  outline-offset: 2px;
}

/* Remove outline on mouse click */
:focus:not(:focus-visible) {
  outline: none;
}

/* Skip link for accessibility */
.skip-link {
  position: absolute;
  top: -100%;
  left: var(--space-4);
  background: var(--color-primary-500);
  color: white;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  z-index: 1000;
  text-decoration: none;
}

.skip-link:focus {
  top: var(--space-4);
}
```

## Grid Layout

```css
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 1024px) {
  .container {
    padding: 0 var(--space-8);
  }
}

.listing-grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .listing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .listing-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .listing-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## Modal

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(45, 38, 34, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all var(--duration-normal);
  z-index: 200;
}

.modal-overlay.open {
  opacity: 1;
  visibility: visible;
}

.modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-2xl);
  max-width: 560px;
  width: calc(100% - var(--space-8));
  max-height: calc(100vh - var(--space-16));
  overflow: auto;
  transform: scale(0.95) translateY(10px);
  transition: transform var(--duration-slow) var(--ease-spring);
}

.modal-overlay.open .modal {
  transform: scale(1) translateY(0);
}

.modal-header {
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
```

---

# Part 10: Page Templates

## Home / Browse Page

### Mobile
```
┌────────────────────────────────────┐
│  🐦 pipit              🔍  💬  👤  │
├────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ 
│ ░░ 📍 Auburn, WA           [Edit] ░░│ ← Warm gradient bg
│ ░░                               ░░│
│ ░░   Find trusted gear           ░░│ ← Recoleta headline
│ ░░   for your family 💛          ░░│
│ ░░                               ░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├────────────────────────────────────┤
│ ┌───────┐┌───────┐┌───────┐┌─────→│ ← Category pills
│ │Stroll-││Car    ││Bikes  ││ ... │ │   horizontal scroll
│ │ers    ││Seats  ││       ││     │ │
│ └───────┘└───────┘└───────┘└──────┘│
├────────────────────────────────────┤
│  Near you                       See all →│
│ ┌───────────┬───────────┐          │
│ │ [image]   │ [image]   │          │ ← 2-col grid
│ │ $175      │ $89       │          │   cards on cream bg
│ │ Stroller  │ Carrier   │          │
│ │ ✓ Safe    │ ✓ Safe    │          │
│ ├───────────┼───────────┤          │
│ │ [image]   │ [image]   │          │
│ │ $225      │ $65       │          │
│ │ Woom Bike │ High Chair│          │
│ │ ✓ Safe    │ ✓ Safe    │          │
│ └───────────┴───────────┘          │
│                                    │
│        ∞ load more...              │
├────────────────────────────────────┤
│  🏠    📦    ➕    💬    👤       │
└────────────────────────────────────┘

Background: var(--color-bg-base) - warm cream
Cards: var(--color-surface) - white, "floating"
Hero: var(--gradient-radial-warm) - subtle warmth
```

### Desktop
```
┌──────────────────────────────────────────────────────────────────┐
│  🐦 pipit       Browse   Sell   Messages    [Search...]   (👤)   │
├──────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░░                                                             ░░│
│ ░░        Find trusted gear for your growing family 💛         ░░│
│ ░░                                                             ░░│
│ ░░               [    Search your neighborhood...    ]         ░░│
│ ░░                                                             ░░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │   FILTERS    │  │  📍 Near Auburn, WA  ·  47 listings      │ │
│  │              │  ├──────────────────────────────────────────┤ │
│  │  Categories  │  │                                          │ │
│  │  ☑ Strollers │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │ │
│  │  ☐ Car Seats │  │  │      │ │      │ │      │ │      │   │ │
│  │  ☐ Bikes     │  │  │ Card │ │ Card │ │ Card │ │ Card │   │ │
│  │              │  │  │      │ │      │ │      │ │      │   │ │
│  │  Price       │  │  └──────┘ └──────┘ └──────┘ └──────┘   │ │
│  │  [--●----]   │  │                                          │ │
│  │  $0 - $300   │  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │ │
│  │              │  │  │      │ │      │ │      │ │      │   │ │
│  │  Distance    │  │  │ Card │ │ Card │ │ Card │ │ Card │   │ │
│  │  ○ 5 mi      │  │  │      │ │      │ │      │ │      │   │ │
│  │  ● 15 mi     │  │  └──────┘ └──────┘ └──────┘ └──────┘   │ │
│  │  ○ 25 mi     │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

- Sidebar: sticky, white surface
- Grid: 4 columns on cream background
- Cards: hover lift effect
```

## Checkout Page

### With Charity Donation
```
┌────────────────────────────────────┐
│  ←  Checkout                       │
├────────────────────────────────────┤
│                                    │
│  ┌────────────────────────────────┐│
│  │ [img] UppaBaby Vista          ││
│  │       $175.00                 ││
│  │       from Sarah M.           ││
│  └────────────────────────────────┘│
│                                    │
│  ────────────────────────────────  │
│                                    │
│  Payment Method                    │
│  ┌────────────────────────────────┐│
│  │     [  Apple Pay  ]           ││
│  └────────────────────────────────┘│
│                                    │
│  ──────── or pay with card ─────── │
│                                    │
│  Card number                       │
│  ┌────────────────────────────────┐│
│  │ 4242 4242 4242 4242           ││
│  └────────────────────────────────┘│
│                                    │
│  ┌──────────────┐ ┌───────────────┐│
│  │ MM / YY      │ │ CVC           ││
│  └──────────────┘ └───────────────┘│
│                                    │
│  ────────────────────────────────  │
│                                    │
│  ╭────────────────────────────────╮│
│  │ 💛 Help local families         ││ ← Warm honey bg
│  │                                ││
│  │ ○ Round up ($0.62)             ││
│  │ ● Add 2% ($3.50)        ← selected
│  │ ○ Add 5% ($8.75)               ││
│  │ ○ No thanks                    ││
│  │                                ││
│  │ Your donation goes to:         ││
│  │ Auburn Food Bank               ││
│  │ Kids Backpack Program 🎒       ││
│  ╰────────────────────────────────╯│
│                                    │
│  ────────────────────────────────  │
│                                    │
│  Item                      $175.00 │
│  Platform fee               $9.75  │
│  Donation                   $3.50  │
│  ─────────────────────────────────│
│  Total                    $188.25  │
│                                    │
├────────────────────────────────────┤
│  [   Complete Purchase   ]         │ ← Primary btn
│                                    │
│  🔒 Secured by Stripe              │
└────────────────────────────────────┘
```

---

# Part 11: Empty States & Illustrations

## Design Style for Illustrations

**Style:** Warm, hand-drawn feel. Simple shapes. Soft colors from our palette. Friendly faces where appropriate. Think Headspace or Mailchimp illustrations—approachable and human.

**NOT:** 3D renders, generic stock illustrations, complex detailed drawings.

## Empty State Pattern

```css
.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-6);
  max-width: 400px;
  margin: 0 auto;
}

.empty-state-illustration {
  width: 200px;
  height: 200px;
  margin: 0 auto var(--space-6);
}

.empty-state-title {
  font-family: var(--text-h2-font);
  font-size: var(--text-h2);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-3);
}

.empty-state-description {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
  line-height: 1.6;
}
```

## Example Empty States

**No listings nearby:**
```
     🐦
    /  \
   ( °° )  ← Cute pipit bird looking around
    \__/
     ||

"No listings nearby yet!"

Be the first parent in Auburn to list.
We'll let you know when neighbors join.

[Create a Listing]  [Expand Search]
```

**No messages:**
```
    💬 ✨

"All caught up!"

When you message sellers or buyers
reply, you'll see them here.

[Browse Listings]
```

**No favorites:**
```
    💛
   /  \

"Nothing saved yet"

Tap the heart on listings you love
to save them for later.

[Start Browsing]
```

---

# Part 12: Accessibility

## Color Contrast Requirements

All text must meet WCAG 2.1 AA standards:
- Normal text (< 18px): 4.5:1 minimum
- Large text (≥ 18px bold or ≥ 24px): 3:1 minimum

Our palette passes:
- `--color-text-primary` (#4A3F37) on `--color-bg-base` (#FFFCF9): **12:1** ✓
- `--color-text-secondary` (#6B5D52) on `--color-bg-base`: **7.5:1** ✓
- `--color-primary-500` (#2D9B8C) on white: **4.6:1** ✓

## Focus States

```css
:focus-visible {
  outline: 2px solid var(--color-primary-400);
  outline-offset: 2px;
}
```

## Screen Reader Support

```html
<!-- Announce dynamic content -->
<div role="status" aria-live="polite" class="sr-only">
  Your listing has been published
</div>

<!-- Label icon-only buttons -->
<button aria-label="Save to favorites">
  <HeartIcon aria-hidden="true" />
</button>

<!-- Describe images -->
<img 
  src="stroller.jpg" 
  alt="UppaBaby Vista stroller in navy blue, front view"
/>
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

# Part 13: Implementation Checklist

## For Claude Code

### Phase 1: Foundation
- [ ] Import fonts: Recoleta (or Fraunces), DM Sans, DM Mono
- [ ] Set up CSS custom properties (all tokens from this doc)
- [ ] Create base component library
- [ ] Set up warm background colors (NOT white)

### Phase 2: Core Components
- [ ] Buttons (primary, secondary, warm)
- [ ] Cards with warm shadows
- [ ] Form inputs with warm focus states
- [ ] Loading skeletons with warm colors

### Phase 3: Mobile
- [ ] Bottom navigation
- [ ] Bottom sheets
- [ ] Sticky CTAs
- [ ] Touch targets (44px+)

### Phase 4: Desktop
- [ ] Top navigation
- [ ] Hover states on EVERYTHING
- [ ] Focus states for keyboard nav
- [ ] Modal component

### Phase 5: Polish
- [ ] All micro-interactions
- [ ] Empty states with illustrations
- [ ] Success celebrations
- [ ] Error states

---

# Part 14: Photography & Imagery Guidelines

## Photography Direction

The photos throughout Pipit should feel warm, authentic, and real—not sterile stock photography.

### Hero & Marketing Images
- **Warm, natural lighting:** Golden hour feel, soft shadows
- **Real families:** Diverse, authentic parents and kids (not models)
- **Lifestyle context:** Gear being used, not just product shots
- **Imperfect is okay:** Authenticity matters more than perfection
- **Emotion:** Joy, connection, trust, community

### Color Grading
Apply consistent warm color grading to all platform imagery:
- Slight orange/yellow shift in highlights
- Lifted shadows (not crushed blacks)
- Warm white balance (not cool/blue)
- Soft contrast (not harsh)

### User-Generated Listing Photos
We can't control these, but we can:
- Provide photo tips during listing creation
- Show example "good" photos
- Use warm background color (#FFFCF9) behind photos so even imperfect images feel cohesive

### Photo Tips for Sellers (Show in Create Listing Flow)
```
Tips for great photos:
• Use natural light (near a window)
• Show the item from multiple angles
• Include any wear or damage
• Keep background simple
• Show scale (next to common object)
```

### Empty State Illustrations
Style: Hand-drawn feel, warm colors from our palette, friendly and approachable
- Simple shapes and lines
- Characters have warmth (round, friendly faces if shown)
- Use coral, honey, and teal accent colors
- NOT: 3D renders, generic stock illustrations, cold/corporate style

### Hero Image Suggestions
For launch, source or commission images showing:
- Parent and child at a local meetup exchanging item (trust + community)
- Happy toddler in a stroller at a park (lifestyle)
- Parent browsing phone with kid playing nearby (real use case)
- Pile of quality kids gear with warm lighting (abundance)

---

# Part 15: Onboarding Visual Specifications

## Visual Style for Onboarding Screens

The onboarding flow should feel warm, simple, and quick. Not corporate. Not tutorial-heavy.

### Layout
- Centered content
- Generous whitespace
- Large, friendly illustrations
- Big tap targets for mobile

### Illustrations
Each screen has a simple, warm illustration:
- Screen 1: Pipit bird waving or welcoming
- Screen 2: Three simple icons (shield, lock, map pin) or one illustration showing all three concepts
- Screen 3: Simple icons for age ranges (baby, toddler, kid silhouettes)
- Screen 4: Friendly map/location illustration

Style: Match empty state illustration style—hand-drawn feel, warm palette, approachable.

### Progress Indicator
- Small dots at bottom of screen
- Current screen = filled dot (--color-primary-500)
- Other screens = outline dot (--color-sand-300)
- Subtle fade transition between screens

### Animations
- Screens slide left-to-right (or swipeable on mobile)
- Illustrations have subtle entrance animation (fadeInUp, 300ms)
- Buttons have standard hover/press states

### Skip Option
- Small "Skip" link in top right corner on screens 2-4
- Not prominent, but accessible
- Skipping goes straight to home/browse

### Mobile Specifics
- Full-screen flow (no nav bars visible)
- Swipe to advance between screens
- Large touch targets (48px minimum)
- Bottom button placement (thumb zone)

### Desktop Specifics
- Centered card (max-width: 500px) on warm gradient background
- Arrow keys can navigate between screens
- Enter key advances

---

# Summary: Key Differences from Generic Design

| Element | Generic (Wrong) | Pipit (Right) |
|---------|-----------------|---------------|
| **Background** | #FFFFFF (cold white) | #FFFCF9 (warm cream) |
| **Headline font** | Inter, Roboto | Recoleta (warm serif) |
| **Body font** | Inter | DM Sans (warm sans) |
| **Gray tones** | Blue-gray | Sand/stone (warm) |
| **Shadows** | Black-based | Brown-tinted (warm) |
| **Empty states** | Text only | Illustrated, friendly |
| **Overall feeling** | Tech product | Cozy neighborhood shop |

---

**Document Version:** 2.0  
**Philosophy:** Warm, distinctive, human, memorable  
**Goal:** Make tired parents feel welcomed and safe
