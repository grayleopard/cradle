import React from 'react';
import { Check, Shield, ShieldCheck } from 'lucide-react';
import { TrustTier } from '../types';
import { getTrustTierInfo } from '../utils/trustTier';

interface TrustBadgeProps {
  tier: TrustTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({
  tier,
  size = 'md',
  showLabel = true,
  className = ''
}) => {
  // Don't show badge for basic tier
  if (tier === TrustTier.BASIC) return null;

  const info = getTrustTierInfo(tier);

  const sizeClasses = {
    sm: {
      wrapper: 'gap-0.5 text-[10px]',
      icon: 'w-3 h-3'
    },
    md: {
      wrapper: 'gap-1 text-xs',
      icon: 'w-3.5 h-3.5'
    },
    lg: {
      wrapper: 'gap-1.5 text-sm',
      icon: 'w-4 h-4'
    }
  };

  const sizes = sizeClasses[size];

  const Icon = tier === TrustTier.TRUSTED ? ShieldCheck : Check;

  return (
    <span
      className={`inline-flex items-center font-medium ${sizes.wrapper} ${className}`}
      style={{ color: info.color }}
      title={info.description}
    >
      <Icon className={sizes.icon} />
      {showLabel && <span>{info.shortLabel || info.label}</span>}
    </span>
  );
};

export default TrustBadge;

// Larger profile display variant
interface TrustProfileBadgeProps {
  tier: TrustTier;
  idVerified?: boolean;
  socialConnected?: boolean;
  completedTransactions?: number;
  rating?: number;
  reviewCount?: number;
  responseTimeHours?: number;
  isSmokeFree?: boolean;
  isPetFree?: boolean;
}

export const TrustProfileBadge: React.FC<TrustProfileBadgeProps> = ({
  tier,
  idVerified,
  socialConnected,
  completedTransactions = 0,
  rating,
  reviewCount = 0,
  responseTimeHours,
  isSmokeFree,
  isPetFree
}) => {
  const info = getTrustTierInfo(tier);

  const signals: { icon: string; text: string }[] = [];

  if (idVerified) {
    signals.push({ icon: '✓', text: 'ID Verified' });
  }

  if (socialConnected) {
    signals.push({ icon: '✓', text: 'Social Connected' });
  }

  if (completedTransactions > 0) {
    const ratingText = rating ? ` · ⭐ ${rating.toFixed(1)}` : '';
    const reviewText = reviewCount > 0 ? ` (${reviewCount} reviews)` : '';
    signals.push({
      icon: '🛒',
      text: `${completedTransactions} Sales${ratingText}${reviewText}`
    });
  }

  if (responseTimeHours !== undefined && responseTimeHours > 0) {
    const hours = responseTimeHours < 1 ? '<1' : `~${Math.round(responseTimeHours)}`;
    signals.push({ icon: '💬', text: `Responds in ${hours} hours` });
  }

  if (isSmokeFree) {
    signals.push({ icon: '🏠', text: 'Smoke-free' });
  }

  if (isPetFree) {
    signals.push({ icon: '🐾', text: 'Pet-free' });
  }

  return (
    <div className="space-y-2">
      {/* Main badge */}
      {tier !== TrustTier.BASIC && (
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: info.bgColor, color: info.color }}
        >
          {tier === TrustTier.TRUSTED ? (
            <ShieldCheck className="w-4 h-4" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          {info.label}
        </div>
      )}

      {/* Trust signals */}
      {signals.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#6B5D52]">
          {signals.map((signal, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>{signal.icon}</span>
              <span>{signal.text}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Compact badge for listing cards
interface TrustListingBadgeProps {
  tier: TrustTier;
  sellerName: string;
  rating?: number;
  reviewCount?: number;
}

export const TrustListingBadge: React.FC<TrustListingBadgeProps> = ({
  tier,
  sellerName,
  rating,
  reviewCount = 0
}) => {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-[#4A3F37] font-medium truncate">{sellerName}</span>
      <TrustBadge tier={tier} size="sm" showLabel={false} />
      {rating && reviewCount > 0 && (
        <span className="text-[#6B5D52] text-xs">
          ⭐ {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};
