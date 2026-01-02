import React from 'react';
import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from './ToastContext';
import ToastContainer from '../components/ToastContainer';

// Wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add a toast and display it', () => {
    render(
      <ToastProvider>
        <TestComponent message="Hello World" />
        <ToastContainer />
      </ToastProvider>
    );

    const button = screen.getByText('Trigger');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should auto-remove toast after 3 seconds', () => {
    render(
      <ToastProvider>
        <TestComponent message="Disappearing Msg" />
        <ToastContainer />
      </ToastProvider>
    );

    const button = screen.getByText('Trigger');
    act(() => {
      button.click();
    });

    expect(screen.getByText('Disappearing Msg')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Disappearing Msg')).not.toBeInTheDocument();
  });
});

// Helper component to trigger toast hooks
const TestComponent = ({ message }: { message: string }) => {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message)}>Trigger</button>;
};