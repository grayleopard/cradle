
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { User } from '../types';
import { generateUUID } from '../utils/uuid';
import { ArrowRight, Smartphone, ShieldCheck, MapPin, MessageSquare, X, Scissors, Leaf } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { login } = useStore();
  const { theme } = useTheme();
  const isHeirloom = theme === 'heirloom';
  
  const [step, setStep] = useState<'intro' | 'phone' | 'otp' | 'profile'>('intro');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState({ name: '', zip: '' });
  const [loading, setLoading] = useState(false);
  const [showFakeNotification, setShowFakeNotification] = useState(false);

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setPhoneNumber(formattedPhoneNumber);
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) return;
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      // Trigger the fake SMS notification
      setTimeout(() => setShowFakeNotification(true), 500);
    }, 1500);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      setStep('profile');
      setShowFakeNotification(false);
    }, 1000);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.zip) return;
    
    const newUser: User = {
      id: generateUUID(),
      name: profile.name,
      location: profile.zip, // Storing Zip as primary display location for now
      isVerifiedParent: true, // Auto-verify for MVP demo
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      itemsSold: 0,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`
    };

    login(newUser);
    navigate('/');
  };

  // --- Dynamic Styles ---
  const bgStyle = isHeirloom ? 'bg-[#F9F6F0]' : 'bg-white';
  const textPrimary = isHeirloom ? 'text-[#2F3E2E]' : 'text-gray-900';
  const textSecondary = isHeirloom ? 'text-[#5C5C5C]' : 'text-gray-500';
  const brandBg = isHeirloom ? 'bg-[#C68E68]' : 'bg-brand-500';
  const brandText = isHeirloom ? 'text-[#C68E68]' : 'text-brand-600';
  const iconBg = isHeirloom ? 'bg-[#F5EBE0]' : 'bg-brand-50';
  const buttonPrimary = isHeirloom ? 'bg-[#C68E68] text-white hover:bg-[#B07D5B]' : 'bg-brand-600 text-white hover:bg-brand-700';
  const buttonSecondary = isHeirloom ? 'bg-[#2F3E2E] text-white hover:bg-black' : 'bg-black text-white';
  const inputStyle = isHeirloom 
    ? 'bg-white border border-[#E3D5CA] text-[#2F3E2E] focus:ring-1 focus:ring-[#C68E68]' 
    : 'bg-gray-50 text-gray-900 focus:ring-2 focus:ring-brand-500 border-transparent focus:bg-white';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto relative overflow-hidden transition-colors ${bgStyle}`}>
      
      {/* Fake SMS Notification */}
      <div 
        className={`absolute top-4 left-4 right-4 bg-gray-800/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl transition-all duration-500 transform z-50 cursor-pointer ${showFakeNotification ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}`}
        onClick={() => setOtp('123456')}
      >
        <div className="flex items-start gap-3 text-left">
           <div className="bg-green-500 p-2 rounded-lg">
             <MessageSquare className="w-5 h-5 text-white" />
           </div>
           <div className="flex-1">
             <h4 className="font-bold text-sm">Messages • Now</h4>
             <p className="text-sm text-gray-200">Your verification code is <span className="font-bold text-white text-lg">123456</span></p>
           </div>
           <button onClick={(e) => { e.stopPropagation(); setShowFakeNotification(false); }}>
             <X className="w-4 h-4 text-gray-400" />
           </button>
        </div>
        <div className="mt-2 text-[10px] text-gray-400 text-center">Tap to auto-fill</div>
      </div>

      {step === 'intro' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center w-full">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold mb-6 shadow-xl ${isHeirloom ? 'bg-[#E3D5CA] text-[#2F3E2E] shadow-[#E3D5CA]/50' : 'bg-brand-500 text-4xl shadow-brand-200'}`}>
            {isHeirloom ? <Scissors className="w-10 h-10" /> : "C"}
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${isHeirloom ? 'font-serif tracking-tight' : ''} ${textPrimary}`}>
            {isHeirloom ? "Heirloom Exchange" : "Cradle"}
          </h1>
          <p className={`text-lg mb-8 ${textSecondary}`}>
            {isHeirloom ? "Curated, pre-loved treasures for your little ones." : "The safest marketplace for baby & kids gear."}
          </p>
          
          <div className="space-y-4 w-full mb-10 text-left px-4">
             <div className="flex items-center gap-4">
               <div className={`${iconBg} p-3 rounded-full`}><ShieldCheck className={`w-6 h-6 ${brandText}`} /></div>
               <div>
                 <h3 className={`font-semibold ${textPrimary}`}>Safety Verified</h3>
                 <p className={`text-sm ${textSecondary}`}>AI checks every item for recalls.</p>
               </div>
             </div>
             <div className="flex items-center gap-4">
               <div className={`${iconBg} p-3 rounded-full`}><MapPin className={`w-6 h-6 ${brandText}`} /></div>
               <div>
                 <h3 className={`font-semibold ${textPrimary}`}>Hyper Local</h3>
                 <p className={`text-sm ${textSecondary}`}>Buy & Sell within your neighborhood.</p>
               </div>
             </div>
             {isHeirloom && (
               <div className="flex items-center gap-4">
                 <div className={`${iconBg} p-3 rounded-full`}><Leaf className={`w-6 h-6 ${brandText}`} /></div>
                 <div>
                   <h3 className={`font-semibold ${textPrimary}`}>Sustainable</h3>
                   <p className={`text-sm ${textSecondary}`}>Give quality gear a second life.</p>
                 </div>
               </div>
             )}
          </div>

          <button 
            onClick={() => setStep('phone')}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${buttonPrimary}`}
          >
            Get Started <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {step === 'phone' && (
        <form onSubmit={handlePhoneSubmit} className="w-full animate-in slide-in-from-right duration-300">
           <h2 className={`text-2xl font-bold mb-2 ${isHeirloom ? 'font-serif' : ''} ${textPrimary}`}>What's your number?</h2>
           <p className={`${textSecondary} mb-8 text-sm`}>We'll text you a code to verify your account.</p>
           
           <div className="relative mb-6">
             <Smartphone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isHeirloom ? 'text-[#C68E68]' : 'text-gray-400'}`} />
             <input
               autoFocus
               type="tel"
               value={phoneNumber}
               onChange={handlePhoneChange}
               placeholder="(555) 555-5555"
               className={`w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-all ${inputStyle}`}
             />
           </div>

           <button 
             disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
             className={`w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 ${buttonSecondary}`}
           >
             {loading ? 'Sending...' : 'Send Code'}
           </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleOtpSubmit} className="w-full animate-in slide-in-from-right duration-300">
           <h2 className={`text-2xl font-bold mb-2 ${isHeirloom ? 'font-serif' : ''} ${textPrimary}`}>Verify Code</h2>
           <p className={`${textSecondary} mb-8 text-sm`}>Enter the code we sent to {phoneNumber}</p>
           
           <input
             autoFocus
             type="text"
             maxLength={6}
             value={otp}
             onChange={(e) => setOtp(e.target.value)}
             placeholder="123456"
             className={`w-full text-center tracking-[1em] py-4 rounded-xl text-2xl font-mono outline-none transition-all mb-6 ${inputStyle}`}
           />

           <button 
             disabled={loading || otp.length < 4}
             className={`w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 ${buttonSecondary}`}
           >
             {loading ? 'Verifying...' : 'Verify'}
           </button>
           <button type="button" onClick={() => setStep('phone')} className="mt-4 text-sm text-gray-400 hover:text-gray-600">Wrong number?</button>
        </form>
      )}

      {step === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="w-full text-left animate-in slide-in-from-right duration-300">
           <div className="text-center mb-8">
              <h2 className={`text-2xl font-bold mb-2 ${isHeirloom ? 'font-serif' : ''} ${textPrimary}`}>Create Profile</h2>
              <p className={`${textSecondary} text-sm`}>Introduce yourself to other parents.</p>
           </div>
           
           <div className="space-y-4 mb-8">
             <div>
               <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>First Name</label>
               <input
                 required
                 autoFocus
                 type="text"
                 value={profile.name}
                 onChange={(e) => setProfile({...profile, name: e.target.value})}
                 placeholder="e.g. Sarah"
                 className={`w-full p-4 rounded-xl outline-none ${inputStyle}`}
               />
             </div>
             <div>
               <label className={`block text-sm font-medium mb-1 ${textSecondary}`}>Zip Code</label>
               <input
                 required
                 type="number"
                 maxLength={5}
                 value={profile.zip}
                 onChange={(e) => setProfile({...profile, zip: e.target.value})}
                 placeholder="e.g. 98001"
                 className={`w-full p-4 rounded-xl outline-none ${inputStyle}`}
               />
               <p className="text-xs text-gray-400 mt-2">We use this to find gear near you.</p>
             </div>
           </div>

           <button 
             className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${buttonPrimary}`}
           >
             Finish Setup
           </button>
        </form>
      )}
    </div>
  );
};

export default Welcome;
