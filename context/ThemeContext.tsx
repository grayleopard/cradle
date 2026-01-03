import React, { createContext, useContext, ReactNode } from 'react';

// Simplified theme - always heirloom
// Other themes can be added back later as a premium feature
export type Theme = 'heirloom';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children?: ReactNode }) => {
  // Always use heirloom theme
  const theme: Theme = 'heirloom';

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
