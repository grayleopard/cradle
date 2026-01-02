
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { UserCheck, MapPin, Calendar, Package, Trash2, CheckCircle, LogOut, ShieldAlert, Pencil, Heart, ScanLine, ChevronRight, Crown, BarChart2, Database, Settings, Bell, Search, RefreshCw, ShoppingBag, Clock, TrendingUp, Eye, DollarSign, Palette, Moon, Sun, Layers, Leaf } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';
import { isSupabaseConfigured } from '../services/supabase';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { currentUser, listings, transactions, markAsSold, deleteListing, deleteSavedSearch, resetStore, logout } = useStore();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'selling' | 'buying' | 'saved' | 'alerts'>('selling');
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [newMatches, setNewMatches] = useState<Record<string, number>>({});
  
  if (!currentUser) return null;

  const myListings = listings.filter(l => l.userId === currentUser.id);
  const savedListings = listings.filter(l => currentUser.savedListingIds?.includes(l.id));
  const savedSearches = currentUser.savedSearches || [];
  
  // Sales Calculation
  const completedSales = transactions.filter(t => t.sellerId === currentUser.id && t.status === 'completed');
  const totalRevenue = completedSales.reduce((acc, t) => acc + t.amount, 0) + (currentUser.itemsSold * 45); 
  
  // Buying transactions
  const myPurchases = transactions
    .filter(t => t.buyerId === currentUser.id)
    .map(t => {
       const listing = listings.find(l => l.id === t.listingId);
       return { transaction: t, listing };
    })
    .filter(item => item.listing !== undefined);

  const isMidnight = theme === 'midnight';
  const isHeirloom = theme === 'heirloom';

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    showToast(`Theme: ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)}`);
  };

  return (
    <div className={`min-h-full pb-20 ${isMidnight ? 'bg-black text-white' : isHeirloom ? 'bg-[#F9F6F0]' : 'bg-bg-main'}`}>
      <div className={`p-6 lg:p-8 pb-0 shadow-sm lg:shadow-none ${isHeirloom ? 'rounded-b-[2.5rem] lg:rounded-none bg-white lg:bg-transparent border-b lg:border-0 border-[#E3D5CA]' : isMidnight ? 'rounded-b-[2rem] lg:rounded-none bg-gray-900 lg:bg-transparent border-b lg:border-0 border-gray-800' : 'rounded-b-[2rem] lg:rounded-none bg-bg-card lg:bg-transparent'}`}>
        <div className="flex justify-between items-start mb-6">
          <h1 className={`font-bold ${isHeirloom ? 'font-serif text-3xl text-[#2F3E2E]' : isMidnight ? 'text-xl font-serif text-white' : 'text-xl text-gray-900'}`}>Profile</h1>
          <div className="flex gap-2">
            <Link to="/settings/dev" className={`p-2 rounded-full transition-colors ${isHeirloom ? 'bg-[#F9F6F0] text-[#2F3E2E] hover:bg-[#E3D5CA]' : isMidnight ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`} title="Developer Settings">
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={logout} className={`p-2 rounded-full transition-colors flex items-center gap-1 ${isHeirloom ? 'bg-[#F9F6F0] text-[#2F3E2E] hover:bg-red-50 hover:text-red-500' : isMidnight ? 'bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-400' : 'bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600'}`}>
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-5 mb-6">
          <div className="relative">
            <div className={`rounded-full p-1 ${isHeirloom ? 'bg-[#C68E68]' : ''}`}>
               <img src={currentUser.avatarUrl} alt="Profile" className={`w-20 h-20 rounded-full object-cover shadow-md bg-gray-100 ${isHeirloom ? 'border-2 border-white' : 'border-4 border-white'}`} />
            </div>
            {currentUser.isVerifiedParent && (
              <div className="absolute -bottom-1 -right-1 bg-brand-500 p-1.5 rounded-full border-2 border-white">
                <UserCheck className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
               <h2 className={`font-bold ${isHeirloom ? 'font-serif text-2xl text-[#2F3E2E]' : 'text-xl text-gray-900'}`}>{currentUser.name}</h2>
               {currentUser.isPremium && <Crown className="w-5 h-5 text-yellow-500 fill-current animate-in zoom-in" />}
            </div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${isMidnight ? 'text-gray-400' : 'text-gray-500'}`}><MapPin className="w-3 h-3" />{currentUser.location}</div>
            <div className={`flex items-center gap-1 text-sm mt-0.5 ${isMidnight ? 'text-gray-400' : 'text-gray-500'}`}><Calendar className="w-3 h-3" />Joined {currentUser.joinDate}</div>
          </div>
          <button onClick={() => navigate('/profile/edit')} className={`p-2 rounded-full transition-colors ${isHeirloom ? 'bg-[#F9F6F0] text-[#2F3E2E]' : isMidnight ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Pencil className="w-5 h-5" />
          </button>
        </div>

        {/* Appearance Switcher */}
        <div className="mb-6 overflow-x-auto no-scrollbar py-2">
           <div className="flex gap-2">
              <button 
                onClick={() => handleThemeChange('default')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${theme === 'default' ? 'bg-brand-500 text-white border-brand-500' : isMidnight ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                <Sun className="w-3 h-3" /> Classic
              </button>
              <button 
                onClick={() => handleThemeChange('heirloom')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${theme === 'heirloom' ? 'bg-[#C68E68] text-white border-[#C68E68]' : isMidnight ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                <Leaf className="w-3 h-3" /> Heirloom
              </button>
              <button 
                onClick={() => handleThemeChange('midnight')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${theme === 'midnight' ? 'bg-white text-black border-white' : isMidnight ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                <Moon className="w-3 h-3" /> Midnight
              </button>
              <button 
                onClick={() => handleThemeChange('retro')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${theme === 'retro' ? 'bg-orange-500 text-white border-orange-500' : isMidnight ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                <Layers className="w-3 h-3" /> Retro Pop
              </button>
           </div>
        </div>

        <Link to="/profile/premium" className={`block rounded-xl p-4 mb-4 flex items-center gap-3 transition-all relative overflow-hidden group ${currentUser.isPremium ? 'bg-gray-900 text-white' : 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg'}`}>
          <div className={`p-2 rounded-full ${currentUser.isPremium ? 'bg-white/10' : 'bg-yellow-400/20'}`}><Crown className={`w-5 h-5 ${currentUser.isPremium ? 'text-yellow-400' : 'text-yellow-400'}`} /></div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">{currentUser.isPremium ? 'Cradle+ Member' : 'Upgrade to Cradle+'}</h3>
            <p className="text-xs opacity-80 mt-0.5">{currentUser.isPremium ? 'You have access to premium features.' : 'Get priority listings & more.'}</p>
          </div>
          {!currentUser.isPremium && <ChevronRight className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" />}
        </Link>

        {/* Dashboard Stats */}
        {activeTab === 'selling' && (
           <div className="mb-6 animate-in slide-in-from-bottom-2">
              <div className={`rounded-2xl p-4 ${isHeirloom ? 'bg-[#F9F6F0] border border-[#E3D5CA]' : isMidnight ? 'bg-gray-800' : 'bg-gray-100'}`}>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-bold text-sm flex items-center gap-2 ${isHeirloom ? 'text-[#2F3E2E]' : isMidnight ? 'text-white' : 'text-gray-900'}`}>
                       <BarChart2 className={`w-4 h-4 ${isHeirloom ? 'text-[#C68E68]' : 'text-brand-600'}`} /> Seller Dashboard
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${isHeirloom ? 'bg-white text-[#2F3E2E]' : isMidnight ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-500'}`}>Last 30 Days</span>
                 </div>
                 
                 <div className="flex gap-4">
                    {/* Revenue Card */}
                    <div className={`flex-1 p-3 rounded-xl border shadow-sm ${isHeirloom ? 'bg-white border-[#E3D5CA]' : isMidnight ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                       <div className={`text-xs mb-1 flex items-center gap-1 ${isHeirloom ? 'text-[#B07D5B]' : isMidnight ? 'text-gray-300' : 'text-gray-500'}`}><DollarSign className="w-3 h-3" /> Earnings</div>
                       <div className={`text-xl font-bold ${isHeirloom ? 'text-[#2F3E2E]' : isMidnight ? 'text-white' : 'text-gray-900'}`}>${totalRevenue}</div>
                       <div className="mt-2 flex items-end gap-1 h-8">
                          {[40, 70, 30, 80, 50, 90, 60].map((h, i) => (
                             <div key={i} className={`flex-1 rounded-t-sm relative group ${isHeirloom ? 'bg-[#E3D5CA]' : isMidnight ? 'bg-gray-600' : 'bg-brand-100'}`}>
                                <div className={`absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-500 ${isHeirloom ? 'bg-[#C68E68]' : 'bg-brand-500'}`} style={{ height: `${h}%` }}></div>
                             </div>
                          ))}
                       </div>
                    </div>
                    
                    {/* Stats Grid */}
                    <div className="flex-1 space-y-2">
                       <div className={`p-2.5 rounded-xl border shadow-sm flex justify-between items-center ${isHeirloom ? 'bg-white border-[#E3D5CA]' : isMidnight ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                          <div>
                             <div className={`text-[10px] uppercase font-bold ${isHeirloom ? 'text-gray-400' : isMidnight ? 'text-gray-400' : 'text-gray-500'}`}>Views</div>
                             <div className={`font-bold ${isHeirloom ? 'text-[#2F3E2E]' : isMidnight ? 'text-white' : 'text-gray-900'}`}>{myListings.length * 42}</div>
                          </div>
                          <Eye className="w-4 h-4 text-blue-500 opacity-50" />
                       </div>
                       <div className={`p-2.5 rounded-xl border shadow-sm flex justify-between items-center ${isHeirloom ? 'bg-white border-[#E3D5CA]' : isMidnight ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                          <div>
                             <div className={`text-[10px] uppercase font-bold ${isHeirloom ? 'text-gray-400' : isMidnight ? 'text-gray-400' : 'text-gray-500'}`}>Sold</div>
                             <div className={`font-bold ${isHeirloom ? 'text-[#2F3E2E]' : isMidnight ? 'text-white' : 'text-gray-900'}`}>{currentUser.itemsSold + completedSales.length}</div>
                          </div>
                          <Package className="w-4 h-4 text-green-500 opacity-50" />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}

        <div className={`flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 ${isHeirloom ? '' : 'border-b border-gray-100'}`}>
          <button 
            onClick={() => setActiveTab('selling')} 
            className={`flex-1 min-w-[80px] py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'selling' ? (isHeirloom ? 'bg-[#2F3E2E] text-white' : 'bg-gray-900 text-white') : (isHeirloom ? 'text-[#2F3E2E]/60 hover:bg-[#F9F6F0]' : 'text-gray-500 hover:bg-gray-100')}`}
          >
            <Package className="w-4 h-4" /> Selling
          </button>
          <button 
            onClick={() => setActiveTab('buying')} 
            className={`flex-1 min-w-[80px] py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'buying' ? (isHeirloom ? 'bg-[#2F3E2E] text-white' : 'bg-gray-900 text-white') : (isHeirloom ? 'text-[#2F3E2E]/60 hover:bg-[#F9F6F0]' : 'text-gray-500 hover:bg-gray-100')}`}
          >
            <ShoppingBag className="w-4 h-4" /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('saved')} 
            className={`flex-1 min-w-[80px] py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'saved' ? (isHeirloom ? 'bg-[#2F3E2E] text-white' : 'bg-gray-900 text-white') : (isHeirloom ? 'text-[#2F3E2E]/60 hover:bg-[#F9F6F0]' : 'text-gray-500 hover:bg-gray-100')}`}
          >
            <Heart className="w-4 h-4" /> Saved
          </button>
          <button 
            onClick={() => setActiveTab('alerts')} 
            className={`flex-1 min-w-[80px] py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-full transition-all ${activeTab === 'alerts' ? (isHeirloom ? 'bg-[#2F3E2E] text-white' : 'bg-gray-900 text-white') : (isHeirloom ? 'text-[#2F3E2E]/60 hover:bg-[#F9F6F0]' : 'text-gray-500 hover:bg-gray-100')}`}
          >
            <Bell className="w-4 h-4" /> Alerts
          </button>
        </div>
      </div>

      <div className="p-4 lg:px-8">
        {activeTab === 'selling' && (
          <div className="space-y-3 animate-in fade-in duration-300">
             {myListings.length > 0 ? myListings.map(listing => (
               <div key={listing.id} className={`p-3 flex gap-3 shadow-sm transition-opacity ${listing.isSold ? 'opacity-60 grayscale' : ''} ${isHeirloom ? 'bg-white rounded-[1.5rem] border border-[#E3D5CA]' : isMidnight ? 'bg-gray-900 border border-gray-800 rounded-card' : 'bg-bg-card rounded-card'}`}>
                  <div className="relative">
                    <img src={listing.images[0]} className="w-20 h-20 rounded-2xl object-cover bg-gray-100" alt={listing.title} />
                    {listing.isSold && <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center"><span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">SOLD</span></div>}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                     <Link to={`/listing/${listing.id}`}>
                        <h4 className={`font-medium text-sm line-clamp-1 ${isHeirloom ? 'text-[#2F3E2E]' : isMidnight ? 'text-white' : 'text-gray-900'}`}>{listing.title}</h4>
                        <span className="text-xs text-gray-500">${listing.price}</span>
                     </Link>
                     {!listing.isSold ? (
                       <div className="flex justify-end gap-2">
                          <button onClick={() => deleteListing(listing.id)} className="text-xs bg-red-50 px-3 py-1.5 rounded-full font-medium text-red-600 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                          <button onClick={() => markAsSold(listing.id)} className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${isHeirloom ? 'bg-[#C68E68] text-white' : 'bg-brand-50 text-brand-600'}`}><CheckCircle className="w-3 h-3" /> Mark Sold</button>
                       </div>
                     ) : (
                       <div className="flex justify-end"><span className="text-xs text-gray-500 italic">Transaction Complete</span></div>
                     )}
                  </div>
               </div>
             )) : (
               <div className={`text-center py-8 rounded-card border border-dashed ${isMidnight ? 'bg-gray-900 border-gray-800' : 'bg-bg-card border-gray-300'}`}>
                 <p className="text-gray-500 text-sm mb-3">No active listings</p>
                 <Link to="/sell" className="text-brand-600 font-medium text-sm">List your first item</Link>
               </div>
             )}
          </div>
        )}

        {/* ... (Other tabs logic) ... */}
        {activeTab === 'saved' && (
           <div className="animate-in fade-in duration-300">
              {savedListings.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
                  {savedListings.map(listing => <ListingCard key={listing.id} listing={listing} />)}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400"><Heart className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No saved items yet.</p><Link to="/" className="text-brand-600 font-medium text-sm mt-2 block">Browse items</Link></div>
              )}
           </div>
        )}
        
        {/* Admin Link at bottom */}
        <div className={`mt-8 pt-8 border-t text-center space-y-4 ${isHeirloom ? 'border-[#E3D5CA]' : isMidnight ? 'border-gray-800' : 'border-gray-200'}`}>
            <Link to="/admin" className={`flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full ${isHeirloom ? 'bg-[#F9F6F0] text-[#2F3E2E] hover:bg-[#E3D5CA]' : isMidnight ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              <BarChart2 className="w-4 h-4" /> Admin Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
