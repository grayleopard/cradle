import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (!SENTRY_DSN) {
    console.warn('[Sentry] DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay - capture 10% of sessions, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Only send errors in production
    enabled: import.meta.env.PROD,
    // Filter out common non-actionable errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /Loading chunk .* failed/,
      /Network request failed/,
    ],
    beforeSend(event) {
      // Don't send events in development
      if (import.meta.env.DEV) {
        console.log('[Sentry] Would send event:', event);
        return null;
      }
      return event;
    },
  });

  console.log('[Sentry] Initialized');
};

// Set user context after login
export const setSentryUser = (user: { id: string; email?: string; name?: string }) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

// Clear user context on logout
export const clearSentryUser = () => {
  Sentry.setUser(null);
};

// Capture custom error with context
export const captureError = (
  error: Error,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'error'
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    scope.setLevel(level);
    Sentry.captureException(error);
  });
};

// Capture message (non-error events)
export const captureMessage = (
  message: string,
  context?: Record<string, unknown>,
  level: Sentry.SeverityLevel = 'info'
) => {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
};

// Track Stripe webhook failures
export const captureStripeWebhookError = (
  eventType: string,
  error: Error,
  payloadPreview?: string
) => {
  captureError(error, {
    webhookType: eventType,
    payloadPreview: payloadPreview?.substring(0, 500),
  }, 'error');
};

// Track API call failures
export const captureApiError = (
  endpoint: string,
  method: string,
  status: number,
  error: Error
) => {
  captureError(error, {
    endpoint,
    method,
    status,
  }, status >= 500 ? 'error' : 'warning');
};

// Add breadcrumb for debugging
export const addBreadcrumb = (
  message: string,
  category: string,
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
};

// Export Sentry for direct access if needed
export { Sentry };
