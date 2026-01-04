import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service (Sentry, etc.)
    console.error('Error caught by boundary:', error, errorInfo);

    // In production, you'd send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#FFFCF9] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold font-serif text-[#4A3F37] mb-2">
              Oops! Something went wrong
            </h1>
            <p className="text-[#5C5C5C] mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-mono text-red-800 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-white border border-[#E8DDD4] text-[#4A3F37] rounded-xl font-medium flex items-center gap-2 hover:bg-[#F5EDE6] transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
              <button
                onClick={this.handleRefresh}
                className="px-6 py-3 bg-[#2D9B8C] text-white rounded-xl font-medium flex items-center gap-2 hover:bg-[#247A6F] transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>

            {/* Support link */}
            <p className="text-xs text-gray-400 mt-8">
              If this keeps happening, please{' '}
              <a href="mailto:support@pipit.app" className="text-[#2D9B8C] hover:underline">
                contact support
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
