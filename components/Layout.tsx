import React, { useRef, useEffect, useState } from 'react';
import { Home, PlusCircle, User as UserIcon, MessageCircle, MapPin, Scale, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Concierge from './Concierge';
import AuthModal from './AuthModal';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { locationStatus, compareIds, messages, currentUser, logout } = useStore();
  const mainRef = useRef<HTMLDivElement>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isListingDetail = location.pathname.startsWith('/listing/');

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

  // Desktop nav items (Profile in user dropdown)
  const desktopNavItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/sell', icon: PlusCircle, label: 'Sell', isAction: true, requiresAuth: true },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount, requiresAuth: true },
  ];

  // Mobile nav items - different for logged in vs guest
  const mobileNavItems = currentUser
    ? [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/sell', icon: PlusCircle, label: 'Sell', isAction: true },
        { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount },
        { path: '/profile', icon: UserIcon, label: 'Profile' },
      ]
    : [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/sell', icon: PlusCircle, label: 'Sell', isAction: true, requiresAuth: true },
        { path: '#signin', icon: UserIcon, label: 'Sign Up', isSignIn: true },
      ];

  // Pipit v2.0 theme styles
  const getNavLinkStyle = (active: boolean) => {
    if (active) {
      return 'text-[#2D9B8C] border-[#2D9B8C]';
    }
    return 'text-[#4A3F37]/60 border-transparent hover:text-[#4A3F37]';
  };

  return (
    <div className="min-h-screen bg-[#FFFCF9]">
      {/* Desktop Top Navigation - Hidden on mobile */}
      {!isListingDetail && (
        <header className="hidden lg:block sticky top-0 z-50 border-b bg-[#FFFCF9] border-[#E8DDD4]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center text-white font-bold text-lg rounded-xl bg-[#2D9B8C]">
                  P
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight text-[#4A3F37] font-serif">
                    Pipit
                  </h1>
                </div>
              </Link>

              {/* Center Navigation */}
              <nav className="flex items-center gap-1">
                {desktopNavItems.map((item: any) => {
                  // Handle auth-required items for guests
                  if (item.requiresAuth && !currentUser) {
                    return (
                      <button
                        key={item.path}
                        onClick={() => setShowAuthModal(true)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${getNavLinkStyle(false)}`}
                      >
                        <item.icon className={`w-4 h-4 ${item.isAction ? 'text-[#2D9B8C]' : ''}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  }

                  return (
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
                  );
                })}
              </nav>

              {/* Right Section - Location & User */}
              <div className="flex items-center gap-4">
                {/* Location */}
                <div className="flex items-center gap-1.5 text-sm text-[#6B5D52]">
                  <MapPin className="w-4 h-4 text-[#2D9B8C]" />
                  <span>{getLocationText()}</span>
                </div>

                {/* User Menu / Sign In */}
                {currentUser ? (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                      className="flex items-center gap-2 p-1.5 rounded-full transition-colors hover:bg-[#E8DDD4]"
                    >
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <ChevronDown className="w-4 h-4 text-[#6B5D52]" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-warm-lg border py-1 bg-white border-[#E8DDD4]">
                        <div className="px-4 py-2 border-b border-[#E8DDD4]">
                          <p className="font-medium text-sm text-[#4A3F37]">{currentUser.name}</p>
                          <p className="text-xs text-[#6B5D52]">{currentUser.location}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[#4A3F37] hover:bg-[#F5EDE6]"
                        >
                          <UserIcon className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/settings/dev"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[#4A3F37] hover:bg-[#F5EDE6]"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 rounded-full font-medium text-sm bg-[#2D9B8C] text-white hover:bg-[#247A6F] transition-colors"
                  >
                    Sign In / Sign Up
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Header - Hidden on desktop and listing detail */}
      {!isListingDetail && (
        <header className="lg:hidden sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md bg-[#FFFCF9] border-[#E8DDD4]">
          <div className="flex items-center gap-2">
            {location.pathname !== '/' && (
              <h1 className="font-serif text-xl text-[#4A3F37]">Pipit</h1>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        ref={mainRef}
        className="min-h-screen pb-24 lg:pb-8"
      >
        <div className="max-w-7xl mx-auto">
          {children}
        </div>

        {/* Compare FAB */}
        {compareIds.length > 0 && !location.pathname.includes('/compare') && (
          <button
            onClick={() => navigate('/compare')}
            className="fixed bottom-24 lg:bottom-8 right-6 z-40 px-5 py-3 font-bold shadow-warm-xl flex items-center gap-2 hover:scale-105 transition-transform bg-[#4A3F37] text-white rounded-full"
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 px-6 py-2 flex justify-around items-center z-50 border-t bg-white border-[#F5EDE6]">
          {mobileNavItems.map((item: any) => {
            // Handle Sign In button
            if (item.isSignIn) {
              return (
                <button
                  key="signin"
                  onClick={() => setShowAuthModal(true)}
                  className="flex flex-col items-center gap-0.5 py-2"
                >
                  <item.icon className="w-6 h-6 text-[#2D9B8C]" />
                  <span className="text-[10px] font-medium text-[#2D9B8C]">{item.label}</span>
                </button>
              );
            }

            // Handle auth-required items (like Sell for guests)
            if (item.requiresAuth && !currentUser) {
              return (
                <button
                  key={item.path}
                  onClick={() => setShowAuthModal(true)}
                  className="flex flex-col items-center gap-0.5 py-2"
                >
                  {item.isAction ? (
                    <div className="w-12 h-12 -mt-6 bg-[#2D9B8C] text-white rounded-full flex items-center justify-center shadow-lg">
                      <item.icon className="w-6 h-6" />
                    </div>
                  ) : (
                    <>
                      <item.icon className="w-6 h-6 text-[#B8A395]" />
                      <span className="text-[10px] text-[#B8A395]">{item.label}</span>
                    </>
                  )}
                </button>
              );
            }

            // Regular nav items
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-0.5 py-2"
              >
                {item.isAction ? (
                  <div className="w-12 h-12 -mt-6 bg-[#2D9B8C] text-white rounded-full flex items-center justify-center shadow-lg">
                    <item.icon className="w-6 h-6" />
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <item.icon
                        className="w-6 h-6"
                        style={{ color: active ? '#2D9B8C' : '#B8A395' }}
                      />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[10px]"
                      style={{
                        color: active ? '#2D9B8C' : '#B8A395',
                        fontWeight: active ? 500 : 400
                      }}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
