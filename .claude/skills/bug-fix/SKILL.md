---
name: bug-fix
description: Autonomously identify, analyze, and fix bugs in the Pipit codebase. Use when fixing bugs, addressing errors, resolving issues, or when the user reports something is broken.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npm run build), Bash(npm run test), Bash(npm run lint)
---

# Autonomous Bug Fix Workflow

When fixing bugs, follow this structured approach to ensure thorough, safe fixes.

## Phase 1: Understand the Bug

1. **Gather context**
   - Read the bug description or error message carefully
   - Identify affected components/pages
   - Note any reproduction steps provided

2. **Locate the source**
   - Use `Grep` to search for error messages or relevant code
   - Use `Glob` to find related files
   - Read the suspected files with `Read`

3. **Trace the data flow**
   - For state bugs: trace from component → StoreContext → service
   - For UI bugs: check component props and conditional rendering
   - For API bugs: check service functions and error handling

## Phase 2: Diagnose

1. **Identify root cause**
   - Is it a logic error?
   - Is it a type mismatch?
   - Is it a missing null check?
   - Is it a race condition?
   - Is it incorrect state management?

2. **Check for related issues**
   - Search for similar patterns that might have the same bug
   - Check if the bug exists in multiple places

## Phase 3: Fix

1. **Make minimal changes**
   - Fix only what's necessary
   - Don't refactor unrelated code
   - Preserve existing behavior for working cases

2. **Follow project patterns**
   - Match the existing code style
   - Use Heirloom theme colors if UI-related
   - Follow TypeScript strict mode requirements

3. **Add defensive checks if appropriate**
   - Optional chaining for potentially null values
   - Default values for undefined props
   - Error boundaries for component crashes

## Phase 4: Verify

1. **Build check**
   ```bash
   npm run build
   ```
   Must pass with no TypeScript errors.

2. **Test the fix**
   - Mentally trace through the fixed code path
   - Consider edge cases
   - Verify the original bug is resolved

3. **Check for regressions**
   - Ensure related features still work
   - Run `npm run test` if tests exist

## Common Bug Patterns in Pipit

### State Not Updating
- Check if `useState` setter is being called
- Verify StoreContext function is updating state correctly
- Check localStorage persistence in useEffect

### UI Not Rendering
- Check conditional rendering logic
- Verify data is available before rendering
- Check for null/undefined in map() calls

### Supabase Sync Issues
- Check if supabase client exists before calling
- Verify table/column names match schema
- Check for async/await usage

### Type Errors
- Ensure interfaces in types.ts are updated
- Check for missing optional chaining (?.)
- Verify enum values match usage

## Output Format

After fixing, provide:
1. **Summary**: One-line description of the fix
2. **Root cause**: What was actually wrong
3. **Changes made**: Files and specific changes
4. **Verification**: Confirm build passes

## Example

**Bug**: "Category filter doesn't reset when clicking logo"

**Process**:
1. Search for logo click handler in Layout.tsx
2. Find it navigates to "/" but doesn't reset filter state
3. Check Home.tsx for selectedCategory state
4. Add useEffect to reset category when location changes
5. Run `npm run build` to verify

**Fix Summary**: Added useEffect in Home.tsx to reset selectedCategory to 'All' when navigating to home page.
