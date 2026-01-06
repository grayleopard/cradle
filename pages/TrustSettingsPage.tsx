import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import TrustSettings from '../components/TrustSettings';
import { User } from '../types';

const TrustSettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useStore();

  if (!currentUser) return null;

  const handleUpdateUser = (updates: Partial<User>) => {
    updateUser({ ...currentUser, ...updates });
  };

  return (
    <div className="min-h-full pb-20 bg-[#FFFCF9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8DDD4] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[#F5EDE6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">Trust & Verification</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <TrustSettings user={currentUser} onUpdateUser={handleUpdateUser} />
      </div>
    </div>
  );
};

export default TrustSettingsPage;
