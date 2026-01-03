# Known Bugs

Track bugs here for Claude to fix autonomously. Include reproduction steps.

---

## Critical (Fix Immediately)

_None currently_

---

## High Priority

### [BUG-001] - TEMPLATE
**Status**: Open
**Component**: ComponentName
**Reported**: YYYY-MM-DD

**Description**:
Brief description of the bug.

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Behavior**:
What should happen.

**Actual Behavior**:
What actually happens.

**Error Messages** (if any):
```
Paste error message here
```

**Notes**:
Any additional context.

---

## Medium Priority

_None currently_

---

## Low Priority

_None currently_

---

## Fixed Bugs (Archive)

### [BUG-FIXED-001] Category filter reset on mobile
**Status**: Fixed
**Fixed Date**: 2026-01-02

**Problem**: No way to reset category filter on mobile - home button, logo click, nothing worked.

**Solution**: Added "All" button to category scroll and active filter banner with clear button.

**Files Changed**: `pages/Home.tsx`

---

## How to Report a Bug

Copy this template:

```markdown
### [BUG-XXX] - Title
**Status**: Open
**Component**: ComponentName
**Reported**: YYYY-MM-DD

**Description**:
What's wrong?

**Steps to Reproduce**:
1.
2.
3.

**Expected Behavior**:


**Actual Behavior**:


**Error Messages**:
```
```

**Notes**:

```

---

## Bug Fix Process

1. Claude reads this file
2. Picks highest priority unfixed bug
3. Follows `.claude/skills/bug-fix/SKILL.md` workflow
4. Updates status to "Fixed" with date
5. Moves to Fixed Bugs section
6. Runs `npm run build` to verify
