import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import {
  ChevronLeft,
  Package,
  Search,
  Filter,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  MoreVertical,
  Plus,
  Archive,
  RefreshCw,
  Tag,
  AlertCircle,
  ArrowUpDown,
  Grid,
  List,
  Sparkles
} from 'lucide-react';
import { Category, Condition } from '../types';

type ListingStatus = 'active' | 'sold' | 'all';
type SortOption = 'newest' | 'oldest' | 'price_high' | 'price_low' | 'views';
type ViewMode = 'grid' | 'list';

const InventoryManagement = () => {
  const navigate = useNavigate();
  const { currentUser, listings, markAsSold, deleteListing, updateListing } = useStore();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ListingStatus>('active');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  if (!currentUser) {
    navigate('/');
    return null;
  }

  // Get user's listings
  const myListings = useMemo(() => {
    return listings.filter(l => l.userId === currentUser.id);
  }, [listings, currentUser.id]);

  // Apply filters and sorting
  const filteredListings = useMemo(() => {
    let result = myListings;

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(l => !l.isSold);
    } else if (statusFilter === 'sold') {
      result = result.filter(l => l.isSold);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(l => l.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        (l.brand && l.brand.toLowerCase().includes(query))
      );
    }

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price_high':
          return b.price - a.price;
        case 'price_low':
          return a.price - b.price;
        case 'views':
          return (b.distanceMiles || 0) - (a.distanceMiles || 0); // Mock views
        default:
          return 0;
      }
    });

    return result;
  }, [myListings, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const active = myListings.filter(l => !l.isSold);
    const sold = myListings.filter(l => l.isSold);
    const totalValue = active.reduce((sum, l) => sum + l.price, 0);
    const avgPrice = active.length > 0 ? totalValue / active.length : 0;

    return {
      activeCount: active.length,
      soldCount: sold.length,
      totalValue,
      avgPrice
    };
  }, [myListings]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredListings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredListings.map(l => l.id));
    }
  };

  // Bulk actions
  const handleBulkMarkSold = () => {
    selectedIds.forEach(id => markAsSold(id));
    showToast(`${selectedIds.length} items marked as sold`, 'success');
    setSelectedIds([]);
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedIds.length} listings? This cannot be undone.`)) {
      selectedIds.forEach(id => deleteListing(id));
      showToast(`${selectedIds.length} listings deleted`, 'success');
      setSelectedIds([]);
      setShowBulkActions(false);
    }
  };

  // Get unique categories in user's listings
  const availableCategories = useMemo(() => {
    const cats = new Set(myListings.map(l => l.category));
    return Array.from(cats);
  }, [myListings]);

  return (
    <div className="min-h-full pb-24 bg-[#FFFCF9]">
      {/* Header */}
      <div className="bg-white border-b border-[#E8DDD4] sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#F5EDE6] rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold font-serif text-xl text-[#4A3F37]">Inventory 📦</h1>
            <p className="text-xs text-[#B8A395]">Manage your listings</p>
          </div>
          <Link
            to="/sell/bulk"
            className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> Bulk
          </Link>
          <Link
            to="/sell"
            className="p-2 bg-[#2D9B8C] rounded-full text-white hover:bg-[#247A6F] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          <div className="flex-shrink-0 bg-[#F5EDE6] rounded-xl px-3 py-2 min-w-[80px]">
            <div className="text-lg font-bold text-[#4A3F37]">{stats.activeCount}</div>
            <div className="text-[10px] text-[#B8A395] uppercase">Active</div>
          </div>
          <div className="flex-shrink-0 bg-[#F0FAF8] rounded-xl px-3 py-2 min-w-[80px]">
            <div className="text-lg font-bold text-[#2D9B8C]">{stats.soldCount}</div>
            <div className="text-[10px] text-[#247A6F] uppercase">Sold</div>
          </div>
          <div className="flex-shrink-0 bg-white rounded-xl px-3 py-2 border border-[#E8DDD4] min-w-[100px]">
            <div className="text-lg font-bold text-[#4A3F37]">${stats.totalValue}</div>
            <div className="text-[10px] text-[#B8A395] uppercase">Active Value</div>
          </div>
          <div className="flex-shrink-0 bg-white rounded-xl px-3 py-2 border border-[#E8DDD4] min-w-[80px]">
            <div className="text-lg font-bold text-[#4A3F37]">${stats.avgPrice.toFixed(0)}</div>
            <div className="text-[10px] text-[#B8A395] uppercase">Avg Price</div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="px-4 pb-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8A395]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your listings..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5EDE6] rounded-xl text-sm border-none focus:outline-none focus:ring-2 focus:ring-[#2D9B8C]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* Status Filter */}
            <div className="flex bg-[#F5EDE6] rounded-lg p-0.5">
              {(['active', 'sold', 'all'] as ListingStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-[#4A3F37] shadow-sm'
                      : 'text-[#6B5D52]'
                  }`}
                >
                  {status === 'active' ? 'Active' : status === 'sold' ? 'Sold' : 'All'}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
              className="text-xs bg-white border border-[#E8DDD4] rounded-lg px-2 py-1.5 text-[#6B5D52] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-white border border-[#E8DDD4] rounded-lg px-2 py-1.5 text-[#6B5D52] focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_high">Price: High</option>
              <option value="price_low">Price: Low</option>
            </select>

            {/* View Toggle */}
            <div className="flex bg-white border border-[#E8DDD4] rounded-lg ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 ${viewMode === 'list' ? 'text-[#2D9B8C]' : 'text-[#B8A395]'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'text-[#2D9B8C]' : 'text-[#B8A395]'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-[180px] z-10 bg-[#4A3F37] text-white px-4 py-2 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-xs hover:underline"
            >
              Clear
            </button>
            <span className="text-sm font-medium">{selectedIds.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkSold}
              className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30"
            >
              Mark Sold
            </button>
            <button
              onClick={handleBulkDelete}
              className="text-xs bg-red-500 px-3 py-1 rounded-full hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#E8DDD4]">
            <Package className="w-12 h-12 text-[#E8DDD4] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-semibold text-[#4A3F37] mb-1">
              {myListings.length === 0 ? 'No listings yet' : 'No matches found'}
            </h3>
            <p className="text-[#9A8578] text-sm mb-4">
              {myListings.length === 0
                ? 'Start selling by creating your first listing'
                : 'Try adjusting your filters'}
            </p>
            {myListings.length === 0 && (
              <Link
                to="/sell"
                className="inline-flex items-center gap-2 bg-[#2D9B8C] text-white font-semibold px-5 py-2.5 rounded-full hover:bg-[#247A6F] transition-colors"
              >
                <Plus className="w-4 h-4" /> Create Listing
              </Link>
            )}
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-2">
            {/* Select All Row */}
            <div className="flex items-center gap-3 px-3 py-2 bg-[#F5EDE6] rounded-lg text-xs text-[#6B5D52]">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredListings.length && filteredListings.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded text-[#2D9B8C]"
              />
              <span>Select all ({filteredListings.length})</span>
            </div>

            {filteredListings.map(listing => (
              <div
                key={listing.id}
                className={`bg-white rounded-xl border p-3 transition-colors ${
                  selectedIds.includes(listing.id)
                    ? 'border-[#2D9B8C] bg-[#F0FAF8]'
                    : listing.isSold
                      ? 'border-[#E8DDD4] opacity-60'
                      : 'border-[#E8DDD4]'
                }`}
              >
                <div className="flex gap-3">
                  {/* Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(listing.id)}
                      onChange={() => toggleSelect(listing.id)}
                      className="w-4 h-4 rounded text-[#2D9B8C]"
                    />
                  </div>

                  {/* Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-16 h-16 rounded-lg object-cover bg-[#F5EDE6]"
                    />
                    {listing.isSold && (
                      <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">SOLD</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/listing/${listing.id}`} className="hover:underline">
                      <h3 className="font-medium text-sm text-[#4A3F37] line-clamp-1">{listing.title}</h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-[#2D9B8C]">${listing.price}</span>
                      <span className="text-[10px] text-[#B8A395] px-1.5 py-0.5 bg-[#F5EDE6] rounded">
                        {listing.condition}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#B8A395] mt-1">{listing.createdAt}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/edit/${listing.id}`}
                      className="p-2 hover:bg-[#F5EDE6] rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-[#6B5D52]" />
                    </Link>
                    {!listing.isSold && (
                      <button
                        onClick={() => {
                          markAsSold(listing.id);
                          showToast('Marked as sold!', 'success');
                        }}
                        className="p-2 hover:bg-[#F0FAF8] rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 text-[#2D9B8C]" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this listing?')) {
                          deleteListing(listing.id);
                          showToast('Listing deleted', 'success');
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Grid View */
          <div className="grid grid-cols-2 gap-3">
            {filteredListings.map(listing => (
              <div
                key={listing.id}
                className={`bg-white rounded-xl border overflow-hidden ${
                  selectedIds.includes(listing.id)
                    ? 'border-[#2D9B8C] ring-2 ring-[#2D9B8C]/20'
                    : listing.isSold
                      ? 'border-[#E8DDD4] opacity-60'
                      : 'border-[#E8DDD4]'
                }`}
              >
                {/* Image with Checkbox */}
                <div className="relative aspect-square">
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(listing.id)}
                      onChange={() => toggleSelect(listing.id)}
                      className="w-5 h-5 rounded text-[#2D9B8C] bg-white/80"
                    />
                  </div>
                  {listing.isSold && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-white text-[#4A3F37] text-xs font-bold px-3 py-1 rounded-full">
                        SOLD
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-2">
                  <Link to={`/listing/${listing.id}`}>
                    <h3 className="font-medium text-xs text-[#4A3F37] line-clamp-1">{listing.title}</h3>
                  </Link>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-[#2D9B8C]">${listing.price}</span>
                    <div className="flex gap-1">
                      <Link
                        to={`/edit/${listing.id}`}
                        className="p-1 hover:bg-[#F5EDE6] rounded transition-colors"
                      >
                        <Pencil className="w-3 h-3 text-[#6B5D52]" />
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete?')) {
                            deleteListing(listing.id);
                            showToast('Deleted', 'success');
                          }
                        }}
                        className="p-1 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
