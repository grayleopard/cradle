import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { createConnectAccount, getAccountStatus } from '../services/stripeService';
import { CreditCard, CheckCircle, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface StripeOnboardingProps {
  onComplete?: () => void;
  compact?: boolean;
}

const StripeOnboarding: React.FC<StripeOnboardingProps> = ({ onComplete, compact = false }) => {
  const { currentUser, updateUser } = useStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Check if user returned from Stripe onboarding
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const accountId = urlParams.get('account');

    if (success === 'true' && accountId && currentUser) {
      // User completed onboarding, verify account status
      verifyAccountStatus(accountId);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [currentUser]);

  const verifyAccountStatus = async (accountId: string) => {
    if (!currentUser) return;

    setCheckingStatus(true);
    try {
      const status = await getAccountStatus(accountId);

      if (status.chargesEnabled && status.payoutsEnabled) {
        // Fully onboarded
        updateUser({
          ...currentUser,
          stripeAccountId: accountId,
          stripeOnboarded: true
        });
        showToast('Payment setup complete! You can now receive payments.', 'success');
        onComplete?.();
      } else if (status.detailsSubmitted) {
        // Submitted but pending verification
        updateUser({
          ...currentUser,
          stripeAccountId: accountId,
          stripeOnboarded: false
        });
        showToast('Your account is pending verification. You\'ll be able to receive payments once approved.', 'info');
      }
    } catch (error) {
      console.error('Failed to verify account status:', error);
      showToast('Failed to verify payment setup. Please try again.', 'error');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleStartOnboarding = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/#/profile`;
      const result = await createConnectAccount(
        currentUser.id,
        currentUser.email || `${currentUser.id}@cradle.app`,
        returnUrl
      );

      // Save the account ID before redirecting
      updateUser({
        ...currentUser,
        stripeAccountId: result.accountId
      });

      // Redirect to Stripe onboarding
      window.location.href = result.onboardingUrl;
    } catch (error: any) {
      console.error('Failed to start onboarding:', error);
      showToast(error.message || 'Failed to start payment setup', 'error');
      setLoading(false);
    }
  };

  const handleContinueOnboarding = async () => {
    if (!currentUser?.stripeAccountId) return;

    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/#/profile`;
      const result = await createConnectAccount(
        currentUser.id,
        currentUser.email || `${currentUser.id}@cradle.app`,
        returnUrl
      );
      window.location.href = result.onboardingUrl;
    } catch (error: any) {
      console.error('Failed to continue onboarding:', error);
      showToast(error.message || 'Failed to continue payment setup', 'error');
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-brand-600 mr-2" />
        <span className="text-sm text-gray-600">Verifying payment setup...</span>
      </div>
    );
  }

  // Already fully onboarded
  if (currentUser?.stripeOnboarded) {
    if (compact) return null;

    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-green-900 text-sm">Payments Enabled</h3>
          <p className="text-xs text-green-700 mt-1">
            You're all set to receive payments from buyers.
          </p>
        </div>
      </div>
    );
  }

  // Started but not completed onboarding
  if (currentUser?.stripeAccountId && !currentUser?.stripeOnboarded) {
    return (
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 text-sm">Payment Setup Incomplete</h3>
            <p className="text-xs text-yellow-700 mt-1 mb-3">
              Complete your payment setup to receive money from sales.
            </p>
            <button
              onClick={handleContinueOnboarding}
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              Continue Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not started onboarding
  return (
    <div className={`bg-brand-50 border border-brand-100 rounded-xl ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        <CreditCard className={`text-brand-600 flex-shrink-0 ${compact ? 'w-4 h-4 mt-0.5' : 'w-5 h-5 mt-0.5'}`} />
        <div className="flex-1">
          <h3 className={`font-bold text-brand-900 ${compact ? 'text-xs' : 'text-sm'}`}>
            Set Up Payments to Sell
          </h3>
          <p className={`text-brand-700 mt-1 ${compact ? 'text-[10px] mb-2' : 'text-xs mb-3'}`}>
            Connect your bank account to receive payments when you sell items.
          </p>
          <button
            onClick={handleStartOnboarding}
            disabled={loading}
            className={`bg-brand-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50 ${compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Set Up Payments
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeOnboarding;
