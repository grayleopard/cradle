import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Listing } from '../types';
import ListingCard from './ListingCard';

interface RecommendedSectionProps {
  title: string;
  subtitle?: string;
  listings: Listing[];
  showAll?: boolean;
  icon?: React.ReactNode;
  emptyMessage?: string;
  compact?: boolean;
}

const RecommendedSection: React.FC<RecommendedSectionProps> = ({
  title,
  subtitle,
  listings,
  showAll = false,
  icon,
  emptyMessage = 'No recommendations yet',
  compact = false
}) => {
  if (listings.length === 0) {
    return null;
  }

  return (
    <section className={compact ? 'py-4' : 'py-6'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon || <Sparkles className="w-4 h-4 text-[#E8B44C]" />}
          <div>
            <h2 className="font-serif text-lg font-bold text-[#4A3F37]">{title}</h2>
            {subtitle && (
              <p className="text-xs text-[#B8A395]">{subtitle}</p>
            )}
          </div>
        </div>
        {showAll && listings.length > 4 && (
          <Link
            to="/?tab=recommended"
            className="text-xs font-medium text-[#2D9B8C] hover:underline flex items-center gap-1"
          >
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Listings Grid */}
      <div className={`grid gap-4 ${
        compact
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      }`}>
        {listings.slice(0, compact ? 4 : 8).map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </section>
  );
};

export default RecommendedSection;
