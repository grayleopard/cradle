import React, { createContext, useContext, ReactNode } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeContextType {
  stripePromise: Promise<Stripe | null>;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const StripeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <StripeContext.Provider value={{ stripePromise }}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  );
};

export const useStripeContext = () => {
  const context = useContext(StripeContext);
  if (!context) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
};

export { stripePromise };
