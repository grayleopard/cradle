import React from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface SafetyBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SafetyBadge: React.FC<SafetyBadgeProps> = ({ isVerified, size = 'md', showLabel = true }) => {
  if (isVerified) {
    return (
      <div className={`inline-flex items-center gap-1.5 ${size === 'lg' ? 'px-3 py-1.5 rounded-full bg-[#F0FAF8] border border-[#2D9B8C]/20' : ''}`}>
        <ShieldCheck 
          className={`text-[#2D9B8C] ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'}`} 
        />
        {showLabel && (
          <span className={`font-medium text-[#247A6F] ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
            Safety Verified
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${size === 'lg' ? 'px-3 py-1.5 rounded-full bg-orange-50 border border-orange-100' : ''}`}>
      <ShieldAlert 
        className={`text-orange-500 ${size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'}`} 
      />
      {showLabel && (
        <span className={`font-medium text-orange-700 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
          Pending Check
        </span>
      )}
    </div>
  );
};

export default SafetyBadge;
