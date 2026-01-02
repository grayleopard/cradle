import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn()
    .mockImplementationOnce((success) => Promise.resolve(success({
      coords: {
        latitude: 47.3073,
        longitude: -122.2284
      }
    })))
};
// Use Object.defineProperty to handle read-only property on window.navigator
Object.defineProperty(window.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock LocalStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock ResizeObserver (needed for some UI libraries)
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};