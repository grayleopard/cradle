
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { ChevronLeft, ShieldCheck, Upload, CheckCircle, Loader2, Fingerprint } from 'lucide-react';

const ParentVerification = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useStore();
  
  const [step, setStep] = useState<'intro' | 'upload' | 'processing' | 'success'>('intro');
  const [showConfetti, setShowConfetti] = useState(false);

  if (!currentUser) return null;

  useEffect(() => {
    if (step === 'success') {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [step]);

  const handleUpload = () => {
    setStep('processing');
    // Simulate verification delay
    setTimeout(() => {
      updateUser({ ...currentUser, isVerifiedParent: true });
      setStep('success');
    }, 2500);
  };

  return (
    <div className="min-h-full bg-white flex flex-col relative overflow-hidden">
      
      {/* CSS Confetti Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
           {[...Array(50)].map((_, i) => (
             <div 
                key={i} 
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                   left: `${Math.random() * 100}%`,
                   top: `-10px`,
                   backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'][Math.floor(Math.random() * 4)],
                   animationDelay: `${Math.random() * 2}s`,
                   animationDuration: `${2 + Math.random() * 3}s`
                }}
             />
           ))}
           <style>{`
             @keyframes confetti {
               0% { transform: translateY(0) rotate(0deg); opacity: 1; }
               100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
             }
             .animate-confetti {
               animation-name: confetti;
               animation-timing-function: linear;
               animation-fill-mode: forwards;
             }
           `}</style>
        </div>
      )}

      <div className="p-4 flex items-center gap-3 relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="font-bold text-gray-900">Parent Verification</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative z-10">
        
        {step === 'intro' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Build Trust</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">
              Verified parents get 3x more responses. Verify your identity to show you're a real person in the community.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-xl text-left mb-8 space-y-3">
               <div className="flex gap-3">
                 <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                 <span className="text-sm text-gray-700">Get a "Verified Parent" badge</span>
               </div>
               <div className="flex gap-3">
                 <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                 <span className="text-sm text-gray-700">Access exclusive deals</span>
               </div>
               <div className="flex gap-3">
                 <Fingerprint className="w-5 h-5 text-green-500 flex-shrink-0" />
                 <span className="text-sm text-gray-700">Secure & Private</span>
               </div>
            </div>

            <button 
              onClick={() => setStep('upload')}
              className="w-full py-4 bg-[#2D9B8C] text-white font-bold rounded-xl shadow-lg hover:bg-[#247A6F] transition-all"
            >
              Start Verification
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="w-full animate-in slide-in-from-right duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload ID</h2>
            <p className="text-sm text-gray-500 mb-8">Please upload a photo of your driver's license or ID card. We do not store this image.</p>
            
            <div 
              onClick={handleUpload}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-[#2D9B8C]/50 transition-all mb-8"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-[#2D9B8C] font-medium">Tap to Upload</span>
            </div>

            <p className="text-xs text-gray-400">By continuing, you agree to our Terms of Service.</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-[#2D9B8C] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Verifying...</h2>
            <p className="text-gray-500">This will just take a moment.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">You're Verified!</h2>
            <p className="text-gray-500 mb-8">
              Thank you for helping keep Pipit safe. Your profile has been updated.
            </p>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all"
            >
              Back to Profile
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ParentVerification;
