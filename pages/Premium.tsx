import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, CheckCircle, Crown, Rocket, Star } from 'lucide-react';

const Premium = () => {
  const navigate = useNavigate();
  const { currentUser, upgradeToPremium } = useStore();
  const { showToast } = useToast();

  const handleUpgrade = () => {
    upgradeToPremium();
    showToast("Welcome to Pipit+!", "success");
    setTimeout(() => navigate('/profile'), 1000);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-full bg-gray-900 text-white flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 -ml-20 -mb-20"></div>

      <div className="p-4 flex items-center gap-3 relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full text-white">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-bold tracking-wide">Pipit+</span>
      </div>

      <div className="flex-1 p-8 flex flex-col items-center relative z-10">
        <div className="w-24 h-24 bg-gradient-to-tr from-brand-400 to-purple-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-brand-900/50 rotate-3">
          <Crown className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">Sell Faster with<br/>Pipit+</h1>
        <p className="text-gray-400 text-center mb-10 text-sm max-w-xs leading-relaxed">
          Unlock premium tools to boost your listings and build trust instantly.
        </p>

        <div className="w-full space-y-4 mb-10">
           <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl flex items-center gap-4 border border-white/5">
              <div className="bg-brand-500/20 p-2 rounded-lg">
                <Rocket className="w-6 h-6 text-brand-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Priority Listings</h3>
                <p className="text-xs text-gray-400">Your items appear first in search.</p>
              </div>
           </div>

           <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl flex items-center gap-4 border border-white/5">
              <div className="bg-yellow-500/20 p-2 rounded-lg">
                <Crown className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Premium Badge</h3>
                <p className="text-xs text-gray-400">Stand out on your profile.</p>
              </div>
           </div>

           <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl flex items-center gap-4 border border-white/5">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Star className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Unlimited Highlights</h3>
                <p className="text-xs text-gray-400">Highlight 5 listings per week.</p>
              </div>
           </div>
        </div>

        <div className="mt-auto w-full">
          {currentUser.isPremium ? (
             <div className="bg-green-500/20 border border-green-500/50 p-4 rounded-xl text-center text-green-400 font-bold mb-4">
                You are a Pipit+ Member
             </div>
          ) : (
            <button 
              onClick={handleUpgrade}
              className="w-full py-4 bg-white text-black rounded-xl font-bold text-lg shadow-xl hover:scale-[1.02] transition-transform flex flex-col items-center"
            >
              <span>Upgrade for $12.99/mo</span>
            </button>
          )}
          <p className="text-xs text-gray-500 text-center mt-4">Cancel anytime. Terms apply.</p>
        </div>
      </div>
    </div>
  );
};

export default Premium;