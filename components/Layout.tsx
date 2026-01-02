import React, { useRef, useEffect } from 'react';
import { Home, PlusCircle, User as UserIcon, MessageCircle, MapPin, Scale, Settings, LogOut, ChevronDown } from 'lucide-react';
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
  const [showUserMenu, setShowUserMenu] = React.useState(false);

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

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showUserMenu]);

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

  const getNavBg = () => {
    if (isMidnight) return 'bg-gray-900 border-gray-800';
    if (isRetro) return 'bg-white border-black border-b-2';
    if (isHeirloom) return 'bg-[#F9F6F0] border-[#E3D5CA]';
    return 'bg-white border-gray-200';
  };

  const getNavLinkStyle = (active: boolean) => {
    if (active) {
      if (isMidnight) return 'text-white border-brand-500';
      if (isRetro) return 'text-black border-black';
      if (isHeirloom) return 'text-[#C68E68] border-[#C68E68]';
      return 'text-brand-600 border-brand-600';
    }
    if (isMidnight) return 'text-gray-400 border-transparent hover:text-white';
    if (isHeirloom) return 'text-[#2F3E2E]/60 border-transparent hover:text-[#2F3E2E]';
    return 'text-gray-600 border-transparent hover:text-gray-900';
  };

  const getMobileNavBg = () => {
    if (isMidnight) return 'bg-gray-900 border-gray-800';
    if (isRetro) return 'bg-white border-black border-t-2';
    if (isHeirloom) return 'bg-[#F9F6F0] border-[#E3D5CA]';
    return 'bg-white border-gray-200';
  };

  return (
    <div className={`min-h-screen ${getBgColor()}`}>
      {/* Desktop Top Navigation - Hidden on mobile */}
      {!isListingDetail && (
        <header className={`hidden lg:block sticky top-0 z-50 border-b ${getNavBg()}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3">
                <div className={`w-9 h-9 flex items-center justify-center text-white font-bold text-lg ${isRetro ? 'bg-black rounded-none' : 'rounded-xl bg-brand-500'}`}>
                  C
                </div>
                <div>
                  <h1 className={`font-bold text-lg leading-tight ${isMidnight ? 'text-white' : isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900'}`}>
                    {isHeirloom ? 'Heirloom' : 'Cradle'}
                  </h1>
                </div>
              </Link>

              {/* Center Navigation */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${getNavLinkStyle(isActive(item.path))}`}
                  >
                    <item.icon className={`w-4 h-4 ${item.isAction && !isActive(item.path) ? 'text-brand-500' : ''}`} />
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {item.badge > 9 ? '9+' : item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>

              {/* Right Section - Location & User */}
              <div className="flex items-center gap-4">
                {/* Location */}
                <div className={`flex items-center gap-1.5 text-sm ${isMidnight ? 'text-gray-400' : 'text-gray-500'}`}>
                  <MapPin className="w-4 h-4 text-brand-500" />
                  <span>{getLocationText()}</span>
                </div>

                {/* User Menu */}
                {currentUser && (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                      className={`flex items-center gap-2 p-1.5 rounded-full transition-colors ${isMidnight ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                    >
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <ChevronDown className={`w-4 h-4 ${isMidnight ? 'text-gray-400' : 'text-gray-500'}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border py-1 ${isMidnight ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className={`px-4 py-2 border-b ${isMidnight ? 'border-gray-800' : 'border-gray-100'}`}>
                          <p className={`font-medium text-sm ${isMidnight ? 'text-white' : 'text-gray-900'}`}>{currentUser.name}</p>
                          <p className={`text-xs ${isMidnight ? 'text-gray-500' : 'text-gray-500'}`}>{currentUser.location}</p>
                        </div>
                        <Link
                          to="/settings/dev"
                          className={`flex items-center gap-2 px-4 py-2 text-sm ${isMidnight ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50'}`}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={logout}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${isMidnight ? 'text-red-400 hover:bg-gray-800' : 'text-red-600 hover:bg-red-50'}`}
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

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
