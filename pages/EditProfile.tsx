
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Save, Camera, Loader2 } from 'lucide-react';
import { processImage } from '../utils/fileHelpers';
import { uploadToCloudinary } from '../services/cloudinaryService';

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
  });

  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`);
  const [uploading, setUploading] = useState(false);

  if (!currentUser) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const processed = await processImage(e.target.files[0]);
        // Update local preview immediately
        setAvatarUrl(processed.previewUrl);
        
        // Upload to Cloudinary
        const remoteUrl = await uploadToCloudinary(processed.blob);
        setAvatarUrl(remoteUrl);
        showToast("Photo uploaded successfully", "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to upload photo", "error");
        // Revert to old avatar on fail
        setAvatarUrl(currentUser.avatarUrl);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      ...currentUser,
      name: formData.name,
      bio: formData.bio,
      location: formData.location,
      avatarUrl: avatarUrl
    });
    showToast("Profile updated!", "success");
    navigate('/profile');
  };

  return (
    <div className="min-h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="font-bold text-gray-900">Edit Profile</h1>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className={`w-28 h-28 rounded-full object-cover bg-gray-100 border-4 border-white shadow-lg ${uploading ? 'opacity-50' : ''}`}
            />
            
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
              </div>
            )}

            <button 
              type="button"
              className="absolute bottom-0 right-0 bg-brand-600 text-white p-2.5 rounded-full shadow-lg hover:bg-brand-700 transition-colors border-2 border-white"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-gray-400 mt-2">Tap to change photo</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code / Location</label>
            <input
              required
              type="text"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell other parents about yourself (e.g. 'Mom of 2, minimizing our gear!')"
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>

          <button
             type="submit"
             disabled={uploading}
             className="w-full py-4 bg-brand-600 text-white text-lg font-semibold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
           >
             <Save className="w-5 h-5" />
             Save Changes
           </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
