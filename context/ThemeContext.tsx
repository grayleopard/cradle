import React, { createContext, useContext, ReactNode } from 'react';

// Pipit Design System v2.0 - Warm, Distinctive, Human
// Legacy heirloom theme kept for fallback
export type Theme = 'pipit-v2' | 'heirloom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children?: ReactNode }) => {
  // Use Pipit v2.0 design system
  const theme: Theme = 'pipit-v2';

  // No-op for now - can be expanded later for dark mode or premium themes
  const setTheme = (_newTheme: Theme) => {
    // Theme switching disabled for MVP
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
