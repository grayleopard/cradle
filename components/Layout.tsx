import React, { useRef, useEffect } from 'react';
import { Home, PlusCircle, User as UserIcon, MessageCircle, MapPin, Scale, Search, Settings, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import Concierge from './Concierge';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { locationStatus, compareIds, messages, currentUser, logout } = useStore();
  const { theme } = useTheme();
  const mainRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;
  const isListingDetail = location.pathname.startsWith('/listing/');

  // Theme checks
  const isMidnight = theme === 'midnight';
  const isRetro = theme === 'retro';
  const isHeirloom = theme === 'heirloom';

  // Calculate unread messages
  const unreadCount = currentUser ? messages.filter(m =>
    m.senderId !== currentUser.id && !m.isRead
  ).length : 0;

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  const getLocationText = () => {
    if (locationStatus === 'locating') return 'Locating...';
    if (locationStatus === 'located') return 'Near You';
    return 'Auburn, WA';
  };

  // Navigation items
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/sell', icon: PlusCircle, label: 'Sell', isAction: true },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  // Theme-aware styles
  const getBgColor = () => {
    if (isMidnight) return 'bg-black';
    if (isHeirloom) return 'bg-[#F9F6F0]';
    return 'bg-gray-50';
  };

  const getSidebarBg = () => {
    if (isMidnight) return 'bg-gray-900 border-gray-800';
    if (isRetro) return 'bg-white border-black border-r-2';
    if (isHeirloom) return 'bg-[#F9F6F0] border-[#E3D5CA]';
    return 'bg-white border-gray-200';
  };

  const getTextColor = (active: boolean) => {
    if (active) {
      if (isMidnight) return 'text-brand-400 bg-gray-800';
      if (isRetro) return 'text-black bg-yellow-300 border-2 border-black';
      if (isHeirloom) return 'text-[#C68E68] bg-[#F5EBE0]';
      return 'text-brand-600 bg-brand-50';
    }
    if (isMidnight) return 'text-gray-400 hover:text-white hover:bg-gray-800';
    if (isHeirloom) return 'text-[#2F3E2E]/60 hover:text-[#2F3E2E] hover:bg-[#F5EBE0]';
    return 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
  };

  const getMobileNavBg = () => {
    if (isMidnight) return 'bg-gray-900 border-gray-800';
    if (isRetro) return 'bg-white border-black border-t-2';
    if (isHeirloom) return 'bg-[#F9F6F0] border-[#E3D5CA]';
    return 'bg-white border-gray-200';
  };

  return (
    <div className={`min-h-screen ${getBgColor()}`}>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r ${getSidebarBg()}`}>
        {/* Logo */}
        <div className={`flex items-center gap-3 px-6 py-5 border-b ${isMidnight ? 'border-gray-800' : isHeirloom ? 'border-[#E3D5CA]' : 'border-gray-200'}`}>
          <div className={`w-10 h-10 flex items-center justify-center text-white font-bold text-xl ${isRetro ? 'bg-black rounded-none' : 'rounded-xl bg-brand-500'}`}>
            C
          </div>
          <div>
            <h1 className={`font-bold text-xl ${isMidnight ? 'text-white' : isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>
              {isHeirloom ? 'Heirloom' : 'Cradle'}
            </h1>
            <p className={`text-xs ${isMidnight ? 'text-gray-500' : 'text-gray-500'}`}>
              {isHeirloom ? 'Exchange' : 'Baby Gear Marketplace'}
            </p>
          </div>
        </div>

        {/* Location */}
        <div className={`px-6 py-3 border-b ${isMidnight ? 'border-gray-800' : isHeirloom ? 'border-[#E3D5CA]' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-2 text-sm ${isMidnight ? 'text-gray-400' : 'text-gray-600'}`}>
            <MapPin className="w-4 h-4 text-brand-500" />
            {getLocationText()}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${getTextColor(isActive(item.path))}`}
            >
              <item.icon className={`w-5 h-5 ${item.isAction && !isActive(item.path) ? 'text-brand-500' : ''}`} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={`px-4 py-4 border-t space-y-2 ${isMidnight ? 'border-gray-800' : isHeirloom ? 'border-[#E3D5CA]' : 'border-gray-200'}`}>
          <Link
            to="/settings/dev"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${getTextColor(isActive('/settings/dev'))}`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          {currentUser && (
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${isMidnight ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' : 'text-gray-600 hover:text-red-600 hover:bg-red-50'}`}
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Mobile Header - Hidden on desktop and listing detail */}
        {!isListingDetail && (
          <header className={`lg:hidden sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md
            ${isMidnight ? 'bg-gray-900/90 border-gray-800 text-white'
              : isRetro ? 'bg-white border-black border-b-2'
              : isHeirloom ? 'bg-[#F9F6F0] border-[#E3D5CA]'
              : 'bg-white/90 border-gray-100'}`}
          >
            <div className="flex items-center gap-2">
              {!isHeirloom && (
                <>
                  <div className={`w-8 h-8 flex items-center justify-center text-white font-bold text-lg ${isRetro ? 'bg-black rounded-none' : 'rounded-lg bg-brand-500'}`}>C</div>
                  <h1 className={`font-bold text-xl tracking-tight ${isMidnight ? 'text-white' : 'text-gray-900'}`}>Cradle</h1>
                </>
              )}
              {isHeirloom && location.pathname !== '/' && (
                <h1 className="font-serif text-xl text-[#2F3E2E]">Heirloom Exchange</h1>
              )}
            </div>
            {!isHeirloom && (
              <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 ${isRetro ? 'bg-yellow-300 border-2 border-black text-black' : isMidnight ? 'bg-gray-800 text-gray-300 rounded-full' : 'bg-gray-100 rounded-full text-gray-500'}`}>
                <MapPin className={`w-3 h-3 ${isRetro ? 'text-black' : 'text-brand-500'}`} />
                {getLocationText()}
              </div>
            )}
          </header>
        )}

        {/* Desktop Header */}
        {!isListingDetail && (
          <header className={`hidden lg:flex sticky top-0 z-40 px-8 py-4 items-center justify-between border-b backdrop-blur-md
            ${isMidnight ? 'bg-black/90 border-gray-800'
              : isHeirloom ? 'bg-[#F9F6F0]/90 border-[#E3D5CA]'
              : 'bg-gray-50/90 border-gray-200'}`}
          >
            <div>
              <h2 className={`text-2xl font-bold ${isMidnight ? 'text-white' : isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>
                {location.pathname === '/' && 'Discover'}
                {location.pathname === '/sell' && 'Create Listing'}
                {location.pathname === '/messages' && 'Messages'}
                {location.pathname === '/profile' && 'Profile'}
                {location.pathname === '/compare' && 'Compare'}
                {location.pathname.startsWith('/chat/') && 'Chat'}
                {location.pathname.startsWith('/user/') && 'Seller Profile'}
                {!['/', '/sell', '/messages', '/profile', '/compare'].includes(location.pathname) &&
                  !location.pathname.startsWith('/chat/') &&
                  !location.pathname.startsWith('/user/') &&
                  !location.pathname.startsWith('/listing/') &&
                  'Cradle'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <div className={`flex items-center gap-3 ${isMidnight ? 'text-gray-300' : 'text-gray-600'}`}>
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
              )}
            </div>
          </header>
        )}

        {/* Main Content */}
        <main
          ref={mainRef}
          className={`min-h-screen pb-24 lg:pb-8 ${isMidnight ? 'bg-black' : ''}`}
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>

          {/* Compare FAB */}
          {compareIds.length > 0 && !location.pathname.includes('/compare') && (
            <button
              onClick={() => navigate('/compare')}
              className={`fixed bottom-24 lg:bottom-8 right-6 z-40 px-5 py-3 font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform ${isRetro ? 'bg-yellow-400 text-black border-2 border-black shadow-retro rounded-none' : 'bg-gray-900 text-white rounded-full'}`}
            >
              <Scale className="w-4 h-4" />
              Compare ({compareIds.length})
            </button>
          )}

          {/* Concierge - Hidden in chat pages */}
          {!location.pathname.includes('/messages') && !location.pathname.includes('/chat') && (
            <Concierge />
          )}
        </main>
      </div>

      {/* Mobile Bottom Nav - Hidden on desktop and listing detail */}
      {!isListingDetail && (
        <nav className={`lg:hidden fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between items-center z-50 border-t ${getMobileNavBg()}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 transition-colors
                ${item.isAction ? '-mt-6' : ''}
                ${isActive(item.path)
                  ? (isMidnight ? 'text-brand-400' : isRetro ? 'text-black font-bold' : isHeirloom ? 'text-[#C68E68]' : 'text-brand-600')
                  : (isMidnight ? 'text-gray-600' : isHeirloom ? 'text-[#2F3E2E]/50' : 'text-gray-400')}`}
            >
              {item.isAction ? (
                <div className={`flex items-center justify-center shadow-lg ${isRetro ? 'w-12 h-12 bg-black text-white border-2 border-white rounded-none shadow-retro' : isMidnight ? 'w-10 h-10 bg-brand-500 text-black rounded-xl' : 'w-14 h-14 bg-brand-500 text-white rounded-full border-4 border-white'}`}>
                  <item.icon className={`${isMidnight ? 'w-6 h-6' : 'w-8 h-8'}`} />
                </div>
              ) : (
                <div className="relative">
                  <item.icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
              )}
              {!isMidnight && !isHeirloom && (
                <span className="text-[10px] font-medium">{item.label}</span>
              )}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
};
