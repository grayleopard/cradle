
import React, { Component, ErrorInfo, ReactNode, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Explicit interfaces for ErrorBoundary props and state
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Fixed class component with explicit generics and proper constructor to resolve 'props' inference issues
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Initialize state in constructor for explicit type association
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          backgroundColor: '#FFFCF9',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#FEE2E2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <h1 style={{
            color: '#4A3F37',
            marginBottom: '8px',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'Fraunces, Georgia, serif'
          }}>
            Oops! Something went wrong
          </h1>
          <p style={{
            maxWidth: '400px',
            margin: '0 auto 24px',
            color: '#5C5C5C',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>
            We're sorry, but something unexpected happened. Please try refreshing the page.
          </p>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                color: '#4A3F37',
                border: '1px solid #E8DDD4',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Go Home
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2D9B8C',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px'
              }}
            >
              Refresh Page
            </button>
          </div>

          {/* Clear data link */}
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#9CA3AF',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            Clear local data & reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
