
import React, { useRef, useEffect } from 'react';
import { Home, PlusCircle, User as UserIcon, MessageCircle, MapPin, Scale, Search, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import Concierge from './Concierge';

export const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { locationStatus, compareIds, messages, currentUser } = useStore();
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
    m.senderId !== currentUser.id && // Message is not from me
    !m.isRead // Message is not read
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

  const getHeaderStyles = () => {
    if (isMidnight) return 'bg-gray-900/90 border-gray-800 backdrop-blur-md text-white';
    if (isRetro) return 'bg-white border-b-2 border-black';
    if (isHeirloom) return 'bg-[#F9F6F0] border-b border-[#E3D5CA] text-[#2F3E2E]';
    return 'bg-white/90 backdrop-blur-md border-b border-gray-100';
  };

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x ${isMidnight ? 'bg-black border-gray-800' : isHeirloom ? 'bg-[#F9F6F0] border-[#E3D5CA]' : 'bg-gray-50 border-gray-200'}`}>
      
      {!isListingDetail && (
        <header className={`sticky top-0 z-50 px-4 py-3 flex items-center justify-between transition-all ${getHeaderStyles()}`}>
          <div className="flex items-center gap-2">
             {/* Heirloom logo is handled inside Home component for specific layout, or general here for other pages */}
             {!isHeirloom && (
                <>
                    <div className={`w-8 h-8 flex items-center justify-center text-white font-bold text-lg ${isRetro ? 'bg-black rounded-none border-2 border-white shadow-[2px_2px_0px_white]' : 'rounded-lg bg-brand-500'}`}>C</div>
                    <h1 className={`font-bold text-xl tracking-tight ${isMidnight ? 'text-white' : 'text-gray-900'}`}>Cradle</h1>
                </>
             )}
             {isHeirloom && (
                 // Only show generic header on non-home pages for Heirloom, since Home has custom hero
                 location.pathname !== '/' && <h1 className="font-serif text-xl text-[#2F3E2E]">Heirloom Exchange</h1>
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

      <main ref={mainRef} className={`flex-1 overflow-y-auto pb-20 no-scrollbar relative ${isMidnight ? 'bg-black' : ''}`}>
        {children}
        
        {compareIds.length > 0 && !location.pathname.includes('/compare') && (
          <button 
            onClick={() => navigate('/compare')}
            className={`absolute bottom-6 right-6 z-40 px-5 py-3 font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform animate-in slide-in-from-bottom-5 ${isRetro ? 'bg-yellow-400 text-black border-2 border-black shadow-retro rounded-none' : 'bg-gray-900 text-white rounded-full'}`}
          >
            <Scale className="w-4 h-4" />
            Compare ({compareIds.length})
          </button>
        )}

        {!location.pathname.includes('/messages') && !location.pathname.includes('/chat') && (
           <Concierge />
        )}
      </main>

      {/* Mobile Bottom Nav - Hidden on Listing Detail */}
      {!isListingDetail && (
        <nav className={`absolute bottom-0 left-0 right-0 px-6 flex justify-between items-center z-50 transition-all 
            ${isMidnight ? 'bg-gray-900 border-t border-gray-800 py-4' 
              : isRetro ? 'bg-white border-t-2 border-black py-4' 
              : isHeirloom ? 'bg-[#F9F6F0] border-t border-[#E3D5CA] py-4'
              : 'bg-white border-t border-gray-200 py-3'}`}>
          
          <Link to="/" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/') ? (isMidnight ? 'text-brand-400' : isRetro ? 'text-black font-bold' : isHeirloom ? 'text-[#C68E68]' : 'text-brand-600') : (isMidnight ? 'text-gray-600' : isHeirloom ? 'text-[#2F3E2E]/50' : 'text-gray-400')}`}>
            <Home className="w-6 h-6" />
            {!isMidnight && !isHeirloom && <span className="text-[10px] font-medium">Home</span>}
          </Link>
          
          {isHeirloom && (
              <button className="text-[#2F3E2E]/50">
                  <Search className="w-6 h-6" />
              </button>
          )}

          <Link to="/sell" className={`flex flex-col items-center gap-1 ${isMidnight || isHeirloom ? '' : '-mt-8'}`}>
            {isHeirloom ? (
                <span className={`text-sm font-medium ${isActive('/sell') ? 'text-[#C68E68]' : 'text-[#2F3E2E]/50'}`}>Sell</span>
            ) : (
              <>
                  <div className={`flex items-center justify-center shadow-lg hover:opacity-90 transition-all ${isRetro ? 'w-12 h-12 bg-black text-white border-2 border-white rounded-none shadow-retro transform -translate-y-2' : isMidnight ? 'w-10 h-10 bg-brand-500 text-black rounded-xl' : 'w-14 h-14 bg-brand-500 text-white rounded-full border-4 border-gray-50'}`}>
                      <PlusCircle className={`${isMidnight ? 'w-6 h-6' : 'w-8 h-8'}`} />
                  </div>
                  {!isMidnight && <span className={`text-[10px] font-medium ${isRetro ? 'text-black' : 'text-gray-600'}`}>Sell</span>}
              </>
            )}
          </Link>

          <Link to="/messages" className={`flex flex-col items-center gap-1 relative transition-colors ${isActive('/messages') ? (isMidnight ? 'text-brand-400' : isRetro ? 'text-black font-bold' : isHeirloom ? 'text-[#C68E68]' : 'text-brand-600') : (isMidnight ? 'text-gray-600' : isHeirloom ? 'text-[#2F3E2E]/50' : 'text-gray-400')}`}>
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            {!isMidnight && !isHeirloom && <span className="text-[10px] font-medium">Chat</span>}
          </Link>

          <Link to="/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/profile') ? (isMidnight ? 'text-brand-400' : isRetro ? 'text-black font-bold' : isHeirloom ? 'text-[#C68E68]' : 'text-brand-600') : (isMidnight ? 'text-gray-600' : isHeirloom ? 'text-[#2F3E2E]/50' : 'text-gray-400')}`}>
            <UserIcon className="w-6 h-6" />
            {!isMidnight && !isHeirloom && <span className="text-[10px] font-medium">Profile</span>}
          </Link>
        </nav>
      )}
    </div>
  );
};
