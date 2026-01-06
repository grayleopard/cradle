import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Eye,
  Clock,
  Star,
  Calendar,
  BarChart2,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus,
  ShoppingBag,
  Users,
  MessageSquare,
  Tag,
  Zap
} from 'lucide-react';
import { TransactionStatus, Category, OfferStatus } from '../types';

type TimePeriod = '7d' | '30d' | '90d' | 'all';

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const { currentUser, listings, transactions, offers, reviews, getReviewsByUserId } = useStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');

  if (!currentUser) {
    navigate('/');
    return null;
  }

  // Get date range based on time period
  const getDateThreshold = (period: TimePeriod): Date => {
    const now = new Date();
    switch (period) {
      case '7d': return new Date(now.setDate(now.getDate() - 7));
      case '30d': return new Date(now.setDate(now.getDate() - 30));
      case '90d': return new Date(now.setDate(now.getDate() - 90));
      case 'all': return new Date(0);
    }
  };

  const dateThreshold = getDateThreshold(timePeriod);

  // Filter data by time period
  const myListings = useMemo(() =>
    listings.filter(l => l.userId === currentUser.id),
    [listings, currentUser.id]
  );

  const myTransactions = useMemo(() =>
    transactions.filter(t =>
      t.sellerId === currentUser.id &&
      new Date(t.createdAt) >= dateThreshold
    ),
    [transactions, currentUser.id, dateThreshold]
  );

  const myOffers = useMemo(() =>
    offers.filter(o =>
      o.sellerId === currentUser.id &&
      new Date(o.createdAt) >= dateThreshold
    ),
    [offers, currentUser.id, dateThreshold]
  );

  const myReviews = getReviewsByUserId(currentUser.id);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const completedTx = myTransactions.filter(t => t.status === TransactionStatus.COMPLETED);
    const totalRevenue = completedTx.reduce((acc, t) => acc + t.amount, 0);
    const totalFees = completedTx.reduce((acc, t) => acc + t.platformFee, 0);
    const netEarnings = totalRevenue - totalFees;

    const activeListings = myListings.filter(l => !l.isSold);
    const soldListings = myListings.filter(l => l.isSold);

    // Average selling price
    const avgSellingPrice = completedTx.length > 0
      ? totalRevenue / completedTx.length
      : 0;

    // Offer acceptance rate
    const acceptedOffers = myOffers.filter(o => o.status === OfferStatus.ACCEPTED);
    const declinedOffers = myOffers.filter(o => o.status === OfferStatus.DECLINED);
    const offerAcceptanceRate = myOffers.length > 0
      ? (acceptedOffers.length / myOffers.length) * 100
      : 0;

    // Average discount given (negotiated vs listed price)
    const negotiatedSales = completedTx.filter(t => t.originalListingPrice && t.originalListingPrice > t.amount);
    const avgDiscount = negotiatedSales.length > 0
      ? negotiatedSales.reduce((acc, t) => acc + ((t.originalListingPrice! - t.amount) / t.originalListingPrice!) * 100, 0) / negotiatedSales.length
      : 0;

    // Response time (mock - would need real message timestamps)
    const avgResponseTime = currentUser.responseTimeHours || 2;

    // Rating
    const avgRating = myReviews.length > 0
      ? myReviews.reduce((acc, r) => acc + r.rating, 0) / myReviews.length
      : currentUser.rating || 0;

    // Conversion rate (views to sales) - mock views calculation
    const totalViews = activeListings.length * 42 + soldListings.length * 85;
    const conversionRate = totalViews > 0 ? (completedTx.length / totalViews) * 100 : 0;

    return {
      totalRevenue,
      netEarnings,
      totalFees,
      completedSales: completedTx.length,
      activeListings: activeListings.length,
      soldListings: soldListings.length,
      avgSellingPrice,
      offerAcceptanceRate,
      avgDiscount,
      avgResponseTime,
      avgRating,
      reviewCount: myReviews.length,
      totalViews,
      conversionRate,
      pendingOffers: myOffers.filter(o => o.status === OfferStatus.PENDING).length,
    };
  }, [myListings, myTransactions, myOffers, myReviews, currentUser]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const completedTx = myTransactions.filter(t => t.status === TransactionStatus.COMPLETED);
    const breakdown: Record<string, { count: number; revenue: number }> = {};

    completedTx.forEach(tx => {
      const listing = listings.find(l => l.id === tx.listingId);
      if (listing) {
        const cat = listing.category;
        if (!breakdown[cat]) breakdown[cat] = { count: 0, revenue: 0 };
        breakdown[cat].count++;
        breakdown[cat].revenue += tx.amount;
      }
    });

    return Object.entries(breakdown)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);
  }, [myTransactions, listings]);

  // Recent sales for chart
  const recentSales = useMemo(() => {
    const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 12;
    const data: { label: string; value: number }[] = [];

    if (timePeriod === '90d' || timePeriod === 'all') {
      // Monthly for 90d/all
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const monthTx = myTransactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate.getMonth() === date.getMonth() &&
                 txDate.getFullYear() === date.getFullYear() &&
                 t.status === TransactionStatus.COMPLETED;
        });
        data.push({
          label: month,
          value: monthTx.reduce((acc, t) => acc + t.amount, 0)
        });
      }
    } else {
      // Daily for 7d/30d
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayLabel = timePeriod === '7d'
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : date.getDate().toString();
        const dayTx = myTransactions.filter(t => {
          const txDate = new Date(t.createdAt);
          return txDate.toDateString() === date.toDateString() &&
                 t.status === TransactionStatus.COMPLETED;
        });
        data.push({
          label: dayLabel,
          value: dayTx.reduce((acc, t) => acc + t.amount, 0)
        });
      }
    }

    return data;
  }, [myTransactions, timePeriod]);

  const maxSaleValue = Math.max(...recentSales.map(d => d.value), 1);

  // Trend indicator component
  const TrendBadge = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    if (value === 0) return (
      <span className="flex items-center gap-0.5 text-xs text-[#B8A395]">
        <Minus className="w-3 h-3" /> 0{suffix}
      </span>
    );
    return value > 0 ? (
      <span className="flex items-center gap-0.5 text-xs text-green-600">
        <ArrowUp className="w-3 h-3" /> +{value.toFixed(1)}{suffix}
      </span>
    ) : (
      <span className="flex items-center gap-0.5 text-xs text-red-500">
        <ArrowDown className="w-3 h-3" /> {value.toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <div className="min-h-full pb-24 bg-[#FFFCF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8DDD4] sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#F5EDE6] rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold font-serif text-xl text-[#4A3F37]">Sales Analytics 📊</h1>
            <p className="text-xs text-[#B8A395]">Track your seller performance</p>
          </div>
        </div>

        {/* Time Period Tabs */}
        <div className="px-4 pb-3 flex gap-2">
          {(['7d', '30d', '90d', 'all'] as TimePeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                timePeriod === period
                  ? 'bg-[#2D9B8C] text-white'
                  : 'bg-[#F5EDE6] text-[#6B5D52] hover:bg-[#E8DDD4]'
              }`}
            >
              {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Revenue Overview */}
        <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-[#2D9B8C]/10">
              <DollarSign className="w-4 h-4 text-[#2D9B8C]" />
            </div>
            <h2 className="font-bold text-[#4A3F37]">Revenue Overview</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[#F5EDE6] rounded-xl p-3 text-center">
              <div className="text-xs text-[#6B5D52] mb-1">Total Revenue</div>
              <div className="text-xl font-bold text-[#4A3F37]">${metrics.totalRevenue.toFixed(0)}</div>
            </div>
            <div className="bg-[#F0FAF8] rounded-xl p-3 text-center">
              <div className="text-xs text-[#247A6F] mb-1">Net Earnings</div>
              <div className="text-xl font-bold text-[#2D9B8C]">${metrics.netEarnings.toFixed(0)}</div>
            </div>
            <div className="bg-[#FEF3E7] rounded-xl p-3 text-center">
              <div className="text-xs text-[#9A7B4F] mb-1">Platform Fees</div>
              <div className="text-xl font-bold text-[#C68E68]">${metrics.totalFees.toFixed(0)}</div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#B8A395]">Revenue Trend</span>
              <span className="text-xs text-[#6B5D52]">{timePeriod === '7d' ? 'Daily' : timePeriod === '30d' ? 'Daily' : 'Monthly'}</span>
            </div>
            <div className="flex items-end gap-1 h-24">
              {recentSales.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="w-full relative">
                    <div
                      className="w-full bg-[#2D9B8C] rounded-t transition-all group-hover:bg-[#247A6F]"
                      style={{ height: `${(day.value / maxSaleValue) * 80}px`, minHeight: day.value > 0 ? '4px' : '0' }}
                    />
                    {day.value > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#4A3F37] text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ${day.value}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-[#B8A395] mt-1">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sales Count */}
          <div className="bg-white rounded-xl border border-[#E8DDD4] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-[#2D9B8C]" />
              <span className="text-xs text-[#6B5D52]">Items Sold</span>
            </div>
            <div className="text-2xl font-bold text-[#4A3F37]">{metrics.completedSales}</div>
            <div className="text-[10px] text-[#B8A395] mt-1">
              {metrics.activeListings} active • {metrics.soldListings} total sold
            </div>
          </div>

          {/* Avg Selling Price */}
          <div className="bg-white rounded-xl border border-[#E8DDD4] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-[#C68E68]" />
              <span className="text-xs text-[#6B5D52]">Avg Sale Price</span>
            </div>
            <div className="text-2xl font-bold text-[#4A3F37]">${metrics.avgSellingPrice.toFixed(0)}</div>
            <div className="text-[10px] text-[#B8A395] mt-1">
              Per completed sale
            </div>
          </div>

          {/* Views */}
          <div className="bg-white rounded-xl border border-[#E8DDD4] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-[#6B5D52]">Total Views</span>
            </div>
            <div className="text-2xl font-bold text-[#4A3F37]">{metrics.totalViews}</div>
            <div className="text-[10px] text-[#B8A395] mt-1">
              {metrics.conversionRate.toFixed(1)}% conversion rate
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-xl border border-[#E8DDD4] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-[#6B5D52]">Response Time</span>
            </div>
            <div className="text-2xl font-bold text-[#4A3F37]">{metrics.avgResponseTime}h</div>
            <div className="text-[10px] text-[#B8A395] mt-1">
              Average reply time
            </div>
          </div>
        </div>

        {/* Offer Analytics */}
        <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-[#FEF3E7]">
              <MessageSquare className="w-4 h-4 text-[#C68E68]" />
            </div>
            <h2 className="font-bold text-[#4A3F37]">Offer Insights</h2>
            {metrics.pendingOffers > 0 && (
              <span className="ml-auto bg-[#2D9B8C] text-white text-xs px-2 py-0.5 rounded-full">
                {metrics.pendingOffers} pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5EDE6] rounded-xl p-3">
              <div className="text-xs text-[#6B5D52] mb-1">Acceptance Rate</div>
              <div className="text-xl font-bold text-[#4A3F37]">{metrics.offerAcceptanceRate.toFixed(0)}%</div>
              <div className="mt-2 h-2 bg-[#E8DDD4] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2D9B8C] rounded-full transition-all"
                  style={{ width: `${metrics.offerAcceptanceRate}%` }}
                />
              </div>
            </div>

            <div className="bg-[#F5EDE6] rounded-xl p-3">
              <div className="text-xs text-[#6B5D52] mb-1">Avg Discount Given</div>
              <div className="text-xl font-bold text-[#4A3F37]">{metrics.avgDiscount.toFixed(1)}%</div>
              <div className="text-[10px] text-[#B8A395] mt-2">
                From original price
              </div>
            </div>
          </div>
        </div>

        {/* Rating & Reviews */}
        <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-full bg-yellow-50">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
            <h2 className="font-bold text-[#4A3F37]">Seller Rating</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#4A3F37]">{metrics.avgRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(metrics.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <div className="text-xs text-[#B8A395] mt-1">{metrics.reviewCount} reviews</div>
            </div>

            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = myReviews.filter(r => r.rating === star).length;
                const pct = metrics.reviewCount > 0 ? (count / metrics.reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-[#6B5D52] w-3">{star}</span>
                    <div className="flex-1 h-2 bg-[#F5EDE6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#B8A395] w-6">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E8DDD4] p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-purple-50">
                <PieChart className="w-4 h-4 text-purple-500" />
              </div>
              <h2 className="font-bold text-[#4A3F37]">Top Categories</h2>
            </div>

            <div className="space-y-3">
              {categoryBreakdown.map(([category, data], idx) => {
                const maxRevenue = categoryBreakdown[0][1].revenue;
                const pct = (data.revenue / maxRevenue) * 100;
                const colors = ['bg-[#2D9B8C]', 'bg-[#C68E68]', 'bg-purple-500', 'bg-blue-500', 'bg-yellow-500'];
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-[#4A3F37] truncate flex-1">{category}</span>
                      <span className="text-xs text-[#6B5D52]">{data.count} sales • ${data.revenue}</span>
                    </div>
                    <div className="h-2 bg-[#F5EDE6] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[idx]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-gradient-to-br from-[#2D9B8C]/10 to-[#F5EDE6] rounded-2xl border border-[#E8DDD4] p-4">
          <h3 className="font-bold text-[#4A3F37] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2D9B8C]" /> Tips to Boost Sales
          </h3>
          <div className="space-y-2 text-sm text-[#6B5D52]">
            {metrics.avgResponseTime > 4 && (
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Respond to messages faster! Buyers love quick replies.</span>
              </div>
            )}
            {metrics.activeListings < 3 && (
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-[#2D9B8C] mt-0.5 flex-shrink-0" />
                <span>List more items to increase your visibility and sales.</span>
              </div>
            )}
            {metrics.offerAcceptanceRate < 50 && metrics.offerAcceptanceRate > 0 && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-[#C68E68] mt-0.5 flex-shrink-0" />
                <span>Consider accepting more offers or sending counter-offers.</span>
              </div>
            )}
            {metrics.avgRating < 4 && metrics.reviewCount > 0 && (
              <div className="flex items-start gap-2">
                <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Focus on quick shipping and item accuracy to boost ratings.</span>
              </div>
            )}
            {metrics.activeListings >= 3 && metrics.avgResponseTime <= 4 && metrics.avgRating >= 4 && (
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-[#2D9B8C] mt-0.5 flex-shrink-0" />
                <span>You're doing great! Keep up the excellent seller practices.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
