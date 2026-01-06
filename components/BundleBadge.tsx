import React from 'react';
import { Package } from 'lucide-react';

interface BundleBadgeProps {
  discount?: number;
  compact?: boolean;
}

const BundleBadge: React.FC<BundleBadgeProps> = ({ discount = 10, compact = false }) => {
  if (compact) {
    return (
      <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
        <Package className="w-3 h-3" />
        {discount}% off bundle
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full text-white text-xs font-medium shadow-md">
      <Package className="w-3.5 h-3.5" />
      <span>Bundle & Save {discount}%</span>
    </div>
  );
};

export default BundleBadge;
