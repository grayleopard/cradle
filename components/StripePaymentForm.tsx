import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../context/StripeContext';
import { createPaymentIntent } from '../services/stripeService';
import { Loader2, Lock, CreditCard, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  amount: number;
  platformFee: number;
  total: number;
  sellerAccountId: string;
  transactionId: string;
  listingTitle: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

const PaymentFormContent: React.FC<StripePaymentFormProps> = ({
  amount,
  platformFee,
  total,
  sellerAccountId,
  transactionId,
  listingTitle,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href, // Not used with redirect: 'if_required'
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setLoading(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'requires_capture') {
        // Payment authorized but not captured (we capture after inspection)
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment already captured (shouldn't happen with manual capture)
        onSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Price Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Item Price</span>
          <span className="font-medium">${amount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Platform Fee (8%)</span>
          <span className="font-medium">${platformFee}</span>
        </div>
        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>${total}</span>
        </div>
      </div>

      {/* Escrow Notice */}
      <div className="bg-green-50 p-3 rounded-lg flex items-start gap-2 text-xs text-green-800">
        <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
        <span>Funds are held in escrow until you inspect and approve the item in person.</span>
      </div>

      {/* Stripe Payment Element */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Pay ${total}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Wrapper component that fetches the client secret and renders Elements
const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const result = await createPaymentIntent(
          props.total,
          props.sellerAccountId,
          props.transactionId,
          props.listingTitle
        );
        setClientSecret(result.clientSecret);
      } catch (err: any) {
        console.error('Failed to create payment intent:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [props.total, props.sellerAccountId, props.transactionId, props.listingTitle]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <span className="text-sm text-gray-500">Setting up secure payment...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-100 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 text-sm">Payment Setup Failed</h3>
            <p className="text-xs text-red-700 mt-1">{error}</p>
            <button
              onClick={props.onCancel}
              className="mt-3 text-sm text-red-600 font-bold hover:underline"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#C68E68',
            borderRadius: '8px',
          },
        },
      }}
    >
      <PaymentFormContent {...props} />
    </Elements>
  );
};

export default StripePaymentForm;
