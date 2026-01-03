import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { User } from '../types';
import { generateUUID } from '../utils/uuid';
import { X, Smartphone, MessageSquare } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useStore();

  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [profile, setProfile] = useState({ name: '', zip: '' });
  const [loading, setLoading] = useState(false);
  const [showFakeNotification, setShowFakeNotification] = useState(false);

  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phone = value.replace(/[^\d]/g, '');
    const len = phone.length;
    if (len < 4) return phone;
    if (len < 7) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(formatPhoneNumber(e.target.value));
  };

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 10) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      setTimeout(() => setShowFakeNotification(true), 500);
    }, 1500);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setLoading(true);
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
      location: profile.zip,
      isVerifiedParent: true,
      joinDate: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      itemsSold: 0,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name}`
    };

    login(newUser);
    onSuccess?.();
    onClose();
  };

  const handleClose = () => {
    // Reset state when closing
    setStep('phone');
    setPhoneNumber('');
    setOtp('');
    setProfile({ name: '', zip: '' });
    setShowFakeNotification(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Fake SMS Notification */}
      <div
        className={`absolute top-4 left-4 right-4 bg-gray-800/90 backdrop-blur text-white p-4 rounded-2xl shadow-2xl transition-all duration-500 transform z-50 cursor-pointer max-w-md mx-auto ${showFakeNotification ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}`}
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

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-[#F9F6F0] rounded-t-3xl sm:rounded-3xl p-6 pb-8 animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#E3D5CA] text-[#2F3E2E] hover:bg-[#D4C4B5] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2 font-serif text-[#2F3E2E]">Sign in to continue</h2>
            <p className="text-[#5C5C5C] mb-8 text-sm">We'll text you a code to verify your account.</p>

            <div className="relative mb-6">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C68E68]" />
              <input
                autoFocus
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                className="w-full pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-all bg-white border border-[#E3D5CA] text-[#2F3E2E] focus:ring-1 focus:ring-[#C68E68]"
              />
            </div>

            <button
              disabled={loading || phoneNumber.replace(/\D/g, '').length < 10}
              className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 bg-[#2F3E2E] text-white hover:bg-black transition-colors"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold mb-2 font-serif text-[#2F3E2E]">Verify Code</h2>
            <p className="text-[#5C5C5C] mb-8 text-sm">Enter the code we sent to {phoneNumber}</p>

            <input
              autoFocus
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-[1em] py-4 rounded-xl text-2xl font-mono outline-none transition-all mb-6 bg-white border border-[#E3D5CA] text-[#2F3E2E] focus:ring-1 focus:ring-[#C68E68]"
            />

            <button
              disabled={loading || otp.length < 4}
              className="w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 bg-[#2F3E2E] text-white hover:bg-black transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="mt-4 text-sm text-gray-400 hover:text-gray-600 w-full text-center"
            >
              Wrong number?
            </button>
          </form>
        )}

        {step === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="animate-in fade-in duration-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 font-serif text-[#2F3E2E]">Create Profile</h2>
              <p className="text-[#5C5C5C] text-sm">Introduce yourself to other parents.</p>
            </div>

            <div className="space-y-4 mb-8 text-left">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#5C5C5C]">First Name</label>
                <input
                  required
                  autoFocus
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="e.g. Sarah"
                  className="w-full p-4 rounded-xl outline-none bg-white border border-[#E3D5CA] text-[#2F3E2E] focus:ring-1 focus:ring-[#C68E68]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[#5C5C5C]">Zip Code</label>
                <input
                  required
                  type="number"
                  maxLength={5}
                  value={profile.zip}
                  onChange={(e) => setProfile({...profile, zip: e.target.value})}
                  placeholder="e.g. 98001"
                  className="w-full p-4 rounded-xl outline-none bg-white border border-[#E3D5CA] text-[#2F3E2E] focus:ring-1 focus:ring-[#C68E68]"
                />
                <p className="text-xs text-gray-400 mt-2">We use this to find gear near you.</p>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-xl font-bold text-lg shadow-lg bg-[#C68E68] text-white hover:bg-[#B07D5B] transition-colors"
            >
              Finish Setup
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
