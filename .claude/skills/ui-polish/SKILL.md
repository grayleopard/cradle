---
name: ui-polish
description: Improve UI/UX quality, visual consistency, and user experience. Use when polishing interfaces, fixing visual issues, improving responsiveness, or enhancing interactions.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npm run build)
---

# UI/UX Polish Workflow

When improving UI/UX, follow this systematic approach to ensure consistent, high-quality results.

## Heirloom Theme Reference

Always use these design tokens:

### Colors
```
Background:     #F9F6F0  (warm cream)
Card/Surface:   #FFFFFF  (white)
Subtle BG:      #F5EBE0  (light warm)
Border:         #E3D5CA  (warm gray)
Primary Text:   #2F3E2E  (forest green)
Secondary Text: #5C5C5C  (gray)
Muted Text:     #9CA3AF  (light gray)
Accent:         #C68E68  (terracotta)
Accent Dark:    #B07D5B  (darker terracotta)
Success:        #10B981  (green)
Error:          #EF4444  (red)
Warning:        #F59E0B  (amber)
```

### Typography
```
Headings:    font-serif (Georgia) - text-[#2F3E2E]
Body:        system font - text-[#2F3E2E] or text-[#5C5C5C]
Small/Meta:  text-xs or text-sm - text-gray-400 or text-[#5C5C5C]
```

### Spacing & Sizing
```
Border Radius:  rounded-xl (12px), rounded-2xl (16px), rounded-full
Padding:        p-3, p-4, p-6 (consistent increments)
Gaps:           gap-2, gap-3, gap-4
Shadow:         shadow-sm (subtle), shadow-md (elevated)
```

### Components
```
Card:           bg-white rounded-xl border border-[#E3D5CA] shadow-sm
Button Primary: bg-[#C68E68] text-white rounded-full hover:bg-[#B07D5B]
Button Secondary: bg-[#F5EBE0] text-[#2F3E2E] rounded-full
Input:          bg-white rounded-xl border border-[#E3D5CA] focus:ring-[#C68E68]
Badge:          px-2 py-1 rounded-full text-xs font-bold
```

## Polish Categories

### 1. Visual Consistency
- [ ] Colors match Heirloom palette
- [ ] Border radius is consistent (rounded-xl default)
- [ ] Shadows are subtle (shadow-sm)
- [ ] Typography hierarchy is clear
- [ ] Icons are from lucide-react, sized consistently

### 2. Responsive Design
- [ ] Works at 375px (mobile)
- [ ] Works at 768px (tablet)
- [ ] Works at 1280px+ (desktop)
- [ ] Text doesn't overflow
- [ ] Touch targets are 44px minimum
- [ ] Horizontal scroll is intentional (carousels only)

### 3. Interactive States
- [ ] Hover states on clickable elements
- [ ] Focus states for accessibility
- [ ] Active/pressed states
- [ ] Disabled states are visually distinct
- [ ] Loading states (spinners, skeletons)

### 4. Empty & Error States
- [ ] Empty states have helpful messages
- [ ] Error states explain the issue
- [ ] Recovery actions are available
- [ ] States match Heirloom aesthetic

### 5. Animations
- [ ] Use Tailwind's animate-in classes
- [ ] Transitions are smooth (transition-all, transition-colors)
- [ ] Animations are subtle, not distracting
- [ ] Duration is appropriate (150-300ms typical)

## Process

### Step 1: Audit Current State
1. Read the target component/page
2. Identify inconsistencies with Heirloom theme
3. Check responsive behavior
4. Note missing states (loading, empty, error)

### Step 2: Plan Changes
1. List specific improvements
2. Prioritize by impact
3. Consider side effects

### Step 3: Implement
1. Make incremental changes
2. Follow existing patterns in codebase
3. Use Edit tool for targeted changes
4. Don't over-engineer

### Step 4: Verify
1. Run `npm run build` - must pass
2. Mentally test at different breakpoints
3. Ensure changes don't break functionality

## Common Patterns

### Card with Hover
```tsx
<div className="bg-white rounded-xl border border-[#E3D5CA] shadow-sm
               hover:shadow-md hover:border-[#C68E68] transition-all">
```

### Button with States
```tsx
<button className="px-6 py-3 bg-[#C68E68] text-white rounded-full font-medium
                  hover:bg-[#B07D5B] active:scale-95 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed">
```

### Input Field
```tsx
<input className="w-full p-3 bg-white rounded-xl border border-[#E3D5CA]
                 focus:outline-none focus:ring-2 focus:ring-[#C68E68]
                 text-[#2F3E2E] placeholder:text-[#B07D5B]/60" />
```

### Empty State
```tsx
<div className="text-center py-12">
  <div className="bg-[#F5EBE0] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
    <IconName className="w-8 h-8 text-[#C68E68]" />
  </div>
  <h3 className="font-serif text-lg text-[#2F3E2E] mb-2">No Items Yet</h3>
  <p className="text-sm text-[#5C5C5C] max-w-xs mx-auto">
    Helpful message explaining the empty state.
  </p>
</div>
```

### Loading State
```tsx
<div className="animate-pulse">
  <div className="bg-[#E3D5CA] rounded-xl h-40 mb-3" />
  <div className="bg-[#E3D5CA] rounded h-4 w-3/4 mb-2" />
  <div className="bg-[#E3D5CA] rounded h-4 w-1/2" />
</div>
```

## Output Format

After polishing, provide:
1. **Summary**: What was improved
2. **Changes**: Specific files and modifications
3. **Visual impact**: What looks/works better now
4. **Verification**: Build passes
