---
name: feature-dev
description: Implement new features following project patterns. Use when building new functionality, adding capabilities, or extending the app.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash(npm run build), Bash(npm run test)
---

# Feature Development Workflow

When implementing new features, follow this structured approach to ensure consistency and quality.

## Pre-Implementation

### 1. Understand Requirements
- Read the feature spec in `.claude/specs/`
- Identify all user stories/acceptance criteria
- Note any edge cases or constraints

### 2. Research Existing Patterns
- Search for similar features in codebase
- Understand current data flow
- Identify reusable components

### 3. Plan the Implementation
- List files to create/modify
- Define new types needed
- Identify state changes
- Consider Supabase schema changes

## Implementation Order

### Step 1: Types First
Update `types.ts` with new interfaces/enums:
```typescript
// Add new interface
export interface NewFeature {
  id: string;
  // ... fields
}

// Add to existing interface if extending
export interface User {
  // ... existing fields
  newField?: string;  // New optional field
}
```

### Step 2: State Management
Update `context/StoreContext.tsx`:
1. Add to StoreContextType interface
2. Add useState for new state
3. Add localStorage persistence if needed
4. Add Supabase sync functions
5. Update mapFromDB if reading from DB
6. Add to Provider value

### Step 3: UI Components
Create/update components following patterns:
1. Use Heirloom theme colors
2. Handle loading/error/empty states
3. Mobile-first responsive design
4. Use existing component patterns

### Step 4: Pages
Create/update pages:
1. Add route in App.tsx if new page
2. Use Layout wrapper if needed
3. Connect to StoreContext
4. Handle all states

### Step 5: Integration
Wire everything together:
1. Connect components to state
2. Add navigation if needed
3. Update related features

## Quality Checks

### Before Considering Complete
- [ ] `npm run build` passes
- [ ] All acceptance criteria met
- [ ] Works on mobile (375px)
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Empty states handled
- [ ] Matches Heirloom theme
- [ ] No console errors

### Code Quality
- [ ] TypeScript strict mode satisfied
- [ ] No any types (use proper typing)
- [ ] Consistent naming conventions
- [ ] No dead code
- [ ] Minimal, focused changes

## Common Patterns

### Adding to StoreContext
```typescript
// 1. Interface
interface StoreContextType {
  // ...existing
  newFeatureData: NewFeature[];
  addNewFeature: (data: NewFeature) => void;
}

// 2. State
const [newFeatureData, setNewFeatureData] = useState<NewFeature[]>([]);

// 3. Persistence
useEffect(() => {
  localStorage.setItem('key', JSON.stringify(newFeatureData));
}, [newFeatureData]);

// 4. Function
const addNewFeature = async (data: NewFeature) => {
  setNewFeatureData(prev => [...prev, data]);
  if (supabase) {
    await supabase.from('table').insert({...});
  }
};

// 5. Provider value
<StoreContext.Provider value={{
  // ...existing
  newFeatureData,
  addNewFeature,
}}>
```

### New Component Pattern
```tsx
import React from 'react';
import { useStore } from '../context/StoreContext';
import { IconName } from 'lucide-react';

interface Props {
  data: DataType;
  onAction?: () => void;
}

const NewComponent = ({ data, onAction }: Props) => {
  const { relevantState } = useStore();

  return (
    <div className="bg-white rounded-xl border border-[#E3D5CA] p-4">
      {/* Component content */}
    </div>
  );
};

export default NewComponent;
```

### New Page Pattern
```tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft } from 'lucide-react';

const NewPage = () => {
  const navigate = useNavigate();
  const { relevantData } = useStore();
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-full bg-[#F9F6F0]">
      {/* Header */}
      <div className="bg-white p-4 border-b border-[#E3D5CA] flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5EBE0] rounded-full">
          <ChevronLeft className="w-5 h-5 text-[#2F3E2E]" />
        </button>
        <h1 className="font-bold font-serif text-[#2F3E2E]">Page Title</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Page content */}
      </div>
    </div>
  );
};

export default NewPage;
```

## Output Format

After implementing, provide:
1. **Summary**: What was built
2. **Files changed**: List of modifications
3. **How to use**: Brief usage instructions
4. **Verification**: Build passes, feature works
