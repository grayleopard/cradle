
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
        <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center', backgroundColor: '#FEF2F2', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: '#991B1B', marginBottom: '10px' }}>Something went wrong.</h1>
          <p style={{ maxWidth: '400px', margin: '0 auto', color: '#7F1D1D', fontSize: '14px' }}>
            {this.state.error?.message || "Unknown error"}
          </p>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#DC2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear Data & Reload App
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
