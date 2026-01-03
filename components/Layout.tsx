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
    { path: '/sell', icon: PlusCircle, label: 'Sell', isAction: true },
    { path: '/messages', icon: MessageCircle, label: 'Messages', badge: unreadCount },
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
        { path: '#signin', icon: UserIcon, label: 'Sign In', isSignIn: true },
      ];

  // Heirloom theme styles
  const getNavLinkStyle = (active: boolean) => {
    if (active) {
      return 'text-[#C68E68] border-[#C68E68]';
    }
    return 'text-[#2F3E2E]/60 border-transparent hover:text-[#2F3E2E]';
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0]">
      {/* Desktop Top Navigation - Hidden on mobile */}
      {!isListingDetail && (
        <header className="hidden lg:block sticky top-0 z-50 border-b bg-[#F9F6F0] border-[#E3D5CA]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center text-white font-bold text-lg rounded-xl bg-[#C68E68]">
                  H
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight text-[#2F3E2E] font-serif">
                    Heirloom
                  </h1>
                </div>
              </Link>

              {/* Center Navigation */}
              <nav className="flex items-center gap-1">
                {desktopNavItems.map((item) => (
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
                <div className="flex items-center gap-1.5 text-sm text-[#5C5C5C]">
                  <MapPin className="w-4 h-4 text-[#C68E68]" />
                  <span>{getLocationText()}</span>
                </div>

                {/* User Menu / Sign In */}
                {currentUser ? (
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu); }}
                      className="flex items-center gap-2 p-1.5 rounded-full transition-colors hover:bg-[#E3D5CA]"
                    >
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <ChevronDown className="w-4 h-4 text-[#5C5C5C]" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg border py-1 bg-white border-[#E3D5CA]">
                        <div className="px-4 py-2 border-b border-[#E3D5CA]">
                          <p className="font-medium text-sm text-[#2F3E2E]">{currentUser.name}</p>
                          <p className="text-xs text-[#5C5C5C]">{currentUser.location}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[#2F3E2E] hover:bg-[#F5EBE0]"
                        >
                          <UserIcon className="w-4 h-4" />
                          Profile
                        </Link>
                        <Link
                          to="/settings/dev"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[#2F3E2E] hover:bg-[#F5EBE0]"
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
                    className="px-4 py-2 rounded-full font-medium text-sm bg-[#C68E68] text-white hover:bg-[#B07D5B] transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Header - Hidden on desktop and listing detail */}
      {!isListingDetail && (
        <header className="lg:hidden sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b backdrop-blur-md bg-[#F9F6F0] border-[#E3D5CA]">
          <div className="flex items-center gap-2">
            {location.pathname !== '/' && (
              <h1 className="font-serif text-xl text-[#2F3E2E]">Heirloom Exchange</h1>
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
            className="fixed bottom-24 lg:bottom-8 right-6 z-40 px-5 py-3 font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform bg-[#2F3E2E] text-white rounded-full"
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
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 px-6 py-3 flex justify-between items-center z-50 border-t bg-[#F9F6F0] border-[#E3D5CA]">
          {mobileNavItems.map((item: any) => {
            // Handle Sign In button
            if (item.isSignIn) {
              return (
                <button
                  key="signin"
                  onClick={() => setShowAuthModal(true)}
                  className="flex flex-col items-center gap-1 transition-colors text-[#C68E68]"
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }

            // Handle auth-required items (like Sell for guests)
            if (item.requiresAuth && !currentUser) {
              return (
                <button
                  key={item.path}
                  onClick={() => setShowAuthModal(true)}
                  className={`flex flex-col items-center gap-1 transition-colors ${item.isAction ? '-mt-6' : ''}`}
                >
                  {item.isAction ? (
                    <div className="w-14 h-14 bg-[#C68E68] text-white rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                      <item.icon className="w-8 h-8" />
                    </div>
                  ) : (
                    <item.icon className="w-6 h-6" />
                  )}
                </button>
              );
            }

            // Regular nav items
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-colors ${item.isAction ? '-mt-6' : ''} ${isActive(item.path) ? 'text-[#C68E68]' : 'text-[#2F3E2E]/50'}`}
              >
                {item.isAction ? (
                  <div className="w-14 h-14 bg-[#C68E68] text-white rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                    <item.icon className="w-8 h-8" />
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
