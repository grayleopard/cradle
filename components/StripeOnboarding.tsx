import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { createConnectAccount, getAccountStatus, createDashboardLink } from '../services/stripeService';
import { CheckCircle, ExternalLink, Loader2, AlertCircle, CreditCard, Banknote } from 'lucide-react';

interface StripeOnboardingProps {
  // For delayed onboarding: pass pending earnings to show "Get Paid" prompt
  pendingEarnings?: number;
  transactionId?: string;
  onComplete?: () => void;
  compact?: boolean;
}

const StripeOnboarding: React.FC<StripeOnboardingProps> = ({
  pendingEarnings,
  transactionId,
  onComplete,
  compact = false
}) => {
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
      verifyAccountStatus(accountId);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    }
  }, [currentUser]);

  const verifyAccountStatus = async (accountId: string) => {
    if (!currentUser) return;

    setCheckingStatus(true);
    try {
      const status = await getAccountStatus(accountId);

      if (status.chargesEnabled && status.payoutsEnabled) {
        updateUser({
          ...currentUser,
          stripeAccountId: accountId,
          stripeOnboarded: true
        });
        showToast('🎉 You\'re all set to receive payments!', 'success');
        onComplete?.();
      } else if (status.detailsSubmitted) {
        updateUser({
          ...currentUser,
          stripeAccountId: accountId,
          stripeOnboarded: false
        });
        showToast('Your account is pending verification. This usually takes a few minutes.', 'info');
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
      // Use hash-based return URL for React Router
      const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
      const result = await createConnectAccount(
        currentUser.id,
        currentUser.email || `${currentUser.id}@pipit.app`,
        returnUrl
      );

      updateUser({
        ...currentUser,
        stripeAccountId: result.accountId
      });

      window.location.href = result.onboardingUrl;
    } catch (error: any) {
      console.error('Failed to start onboarding:', error);
      showToast(error.message || 'Failed to start payment setup', 'error');
      setLoading(false);
    }
  };

  const handleOpenDashboard = async () => {
    if (!currentUser?.stripeAccountId) return;

    try {
      const { url } = await createDashboardLink(currentUser.stripeAccountId);
      window.open(url, '_blank');
    } catch (error) {
      showToast('Could not open dashboard', 'error');
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#2D9B8C] mr-2" />
        <span className="text-sm text-[#6B5D52]">Verifying payment setup...</span>
      </div>
    );
  }

  // Already fully onboarded - show status badge
  if (currentUser?.stripeOnboarded) {
    if (compact) return null;

    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-bold text-green-900 text-sm">Payments Enabled</h3>
            <p className="text-xs text-green-700">You can receive payouts from sales</p>
          </div>
        </div>
        <button
          onClick={handleOpenDashboard}
          className="text-xs text-green-700 hover:text-green-900 flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Dashboard
        </button>
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
            <h3 className="font-bold text-yellow-900 text-sm">Payment Setup Pending</h3>
            <p className="text-xs text-yellow-700 mt-1 mb-3">
              {pendingEarnings
                ? `You have $${pendingEarnings.toFixed(2)} waiting! Complete setup to get paid.`
                : 'Complete your payment setup to receive money from sales.'}
            </p>
            <button
              onClick={handleStartOnboarding}
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-yellow-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Complete Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // NOT onboarded - only show if there are pending earnings (delayed onboarding)
  if (pendingEarnings && pendingEarnings > 0) {
    // Calculate instant payout option (1% fee)
    const instantPayoutFee = pendingEarnings * 0.01;
    const instantPayout = pendingEarnings - instantPayoutFee;

    return (
      <div className="bg-[#F0FAF8] border border-[#2D9B8C]/20 rounded-2xl p-5">
        <h3 className="font-serif text-lg font-bold text-[#4A3F37] mb-3">
          🎉 Your item sold!
        </h3>

        {/* Payout Breakdown */}
        <div className="bg-white rounded-xl p-4 mb-4 border border-[#E8DDD4]">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-bold text-[#4A3F37]">
              <span>You receive (standard)</span>
              <span className="text-[#2D9B8C]">${pendingEarnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#B8A395]">
              <span>Or with instant payout (-1%)</span>
              <span>${instantPayout.toFixed(2)}</span>
            </div>
          </div>
          <p className="text-[10px] text-[#B8A395] mt-2 pt-2 border-t border-[#E8DDD4]">
            Payment processing (~3%) already deducted
          </p>
        </div>

        <p className="text-sm text-[#6B5D52] mb-4">
          To get your money, we need to verify your identity and know where to send it. Takes about 2 minutes.
        </p>

        <button
          onClick={handleStartOnboarding}
          disabled={loading}
          className="w-full bg-[#2D9B8C] text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#247A6F] transition-colors disabled:opacity-50 shadow-warm-md"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CreditCard className="w-5 h-5" />
          )}
          Get Paid Now
        </button>
        <p className="text-xs text-[#B8A395] mt-3 text-center">
          💳 Use a debit card for instant payouts (arrives in minutes)
        </p>
      </div>
    );
  }

  // No pending earnings and not onboarded - don't show anything
  // (Sellers don't need to set up payments until they make a sale)
  return null;
};

export default StripeOnboarding;
