
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Save, Camera, Loader2, Plus, X, Baby, MapPin, Tag } from 'lucide-react';
import { processImage } from '../utils/fileHelpers';
import { uploadToCloudinary } from '../services/cloudinaryService';

// Suggested parenting tags for easy selection
const SUGGESTED_TAGS = [
  'Outdoor Activities',
  'Arts & Crafts',
  'Music & Dance',
  'Sports',
  'Reading & Books',
  'Science & STEM',
  'Cooking Together',
  'Hiking & Nature',
  'Swimming',
  'Playdates',
  'Homeschool',
  'Montessori'
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useStore();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    location: currentUser?.location || '',
    neighborhood: currentUser?.neighborhood || '',
  });

  const [kidAges, setKidAges] = useState<number[]>(currentUser?.kidAges || []);
  const [newAge, setNewAge] = useState('');
  const [parentingTags, setParentingTags] = useState<string[]>(currentUser?.parentingTags || []);
  const [customTag, setCustomTag] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name}`);
  const [uploading, setUploading] = useState(false);

  if (!currentUser) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploading(true);
      try {
        const processed = await processImage(e.target.files[0]);
        setAvatarUrl(processed.previewUrl);
        const remoteUrl = await uploadToCloudinary(processed.blob);
        setAvatarUrl(remoteUrl);
        showToast("Photo uploaded successfully", "success");
      } catch (err) {
        console.error(err);
        showToast("Failed to upload photo", "error");
        setAvatarUrl(currentUser.avatarUrl);
      } finally {
        setUploading(false);
      }
    }
  };

  const addKidAge = () => {
    const age = parseInt(newAge);
    if (!isNaN(age) && age >= 0 && age <= 18 && kidAges.length < 6) {
      setKidAges([...kidAges, age].sort((a, b) => a - b));
      setNewAge('');
    }
  };

  const removeKidAge = (index: number) => {
    setKidAges(kidAges.filter((_, i) => i !== index));
  };

  const toggleTag = (tag: string) => {
    if (parentingTags.includes(tag)) {
      setParentingTags(parentingTags.filter(t => t !== tag));
    } else if (parentingTags.length < 5) {
      setParentingTags([...parentingTags, tag]);
    }
  };

  const addCustomTag = () => {
    const tag = customTag.trim();
    if (tag && !parentingTags.includes(tag) && parentingTags.length < 5) {
      setParentingTags([...parentingTags, tag]);
      setCustomTag('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      ...currentUser,
      name: formData.name,
      bio: formData.bio,
      location: formData.location,
      neighborhood: formData.neighborhood,
      kidAges,
      parentingTags,
      avatarUrl
    });
    showToast("Profile updated!", "success");
    navigate('/profile');
  };

  return (
    <div className="min-h-full bg-[#FFFCF9]">
      {/* Header */}
      <div className="p-4 border-b border-[#E8DDD4] flex items-center gap-3 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#F5EDE6] rounded-full">
          <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
        </button>
        <h1 className="font-bold font-serif text-[#4A3F37]">Edit Profile</h1>
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="rounded-full p-1 bg-[#2D9B8C]">
              <img
                src={avatarUrl}
                alt="Avatar"
                className={`w-28 h-28 rounded-full object-cover bg-gray-100 border-4 border-white ${uploading ? 'opacity-50' : ''}`}
              />
            </div>

            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#2D9B8C] animate-spin" />
              </div>
            )}

            <button
              type="button"
              className="absolute bottom-0 right-0 bg-[#2D9B8C] text-white p-2.5 rounded-full shadow-lg hover:bg-[#247A6F] transition-colors border-2 border-white"
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
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-[#4A3F37] mb-1">Display Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-3 bg-white rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] transition-all text-[#4A3F37]"
            />
          </div>

          {/* Location / Zip */}
          <div>
            <label className="block text-sm font-medium text-[#4A3F37] mb-1">Zip Code</label>
            <input
              required
              type="text"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="98001"
              className="w-full p-3 bg-white rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] transition-all text-[#4A3F37]"
            />
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-sm font-medium text-[#4A3F37] mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2D9B8C]" />
              Neighborhood
            </label>
            <input
              type="text"
              value={formData.neighborhood}
              onChange={e => setFormData({...formData, neighborhood: e.target.value})}
              placeholder="e.g. Capitol Hill, Auburn, Ballard"
              className="w-full p-3 bg-white rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] transition-all text-[#4A3F37]"
            />
            <p className="text-xs text-gray-400 mt-1">Helps connect you with nearby parents</p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-[#4A3F37] mb-1">Bio</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              placeholder="Tell other parents about yourself..."
              className="w-full p-3 bg-white rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] transition-all text-[#4A3F37]"
            />
          </div>

          {/* Kid Ages */}
          <div>
            <label className="block text-sm font-medium text-[#4A3F37] mb-2 flex items-center gap-2">
              <Baby className="w-4 h-4 text-[#2D9B8C]" />
              Kids' Ages
            </label>

            {/* Current Ages */}
            <div className="flex flex-wrap gap-2 mb-3">
              {kidAges.map((age, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2D9B8C]/10 text-[#2D9B8C] rounded-full text-sm font-medium"
                >
                  {age === 0 ? '<1' : age} {age === 1 ? 'year' : 'years'}
                  <button
                    type="button"
                    onClick={() => removeKidAge(index)}
                    className="ml-1 hover:bg-[#2D9B8C]/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {kidAges.length === 0 && (
                <span className="text-sm text-gray-400">No ages added yet</span>
              )}
            </div>

            {/* Add Age */}
            {kidAges.length < 6 && (
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="18"
                  value={newAge}
                  onChange={e => setNewAge(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKidAge())}
                  placeholder="Age (0-18)"
                  className="flex-1 p-2.5 bg-white rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] text-[#4A3F37] text-sm"
                />
                <button
                  type="button"
                  onClick={addKidAge}
                  className="px-4 py-2 bg-[#F5EDE6] text-[#4A3F37] rounded-xl font-medium text-sm hover:bg-[#E8DDD4] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Helps match you with parents at similar stages</p>
          </div>

          {/* Parenting Interests */}
          <div>
            <label className="block text-sm font-medium text-[#4A3F37] mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#2D9B8C]" />
              Parenting Interests
              <span className="text-xs text-gray-400 font-normal">({parentingTags.length}/5)</span>
            </label>

            {/* Selected Tags */}
            {parentingTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {parentingTags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4A3F37] text-white rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggested Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {SUGGESTED_TAGS.filter(t => !parentingTags.includes(t)).slice(0, 8).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={parentingTags.length >= 5}
                  className="px-3 py-1.5 bg-white border border-[#E8DDD4] text-[#4A3F37] rounded-full text-sm hover:border-[#2D9B8C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Custom Tag */}
            {parentingTags.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  placeholder="Add custom interest..."
                  className="flex-1 p-2.5 bg-white rounded-xl border border-[#E8DDD4] focus:outline-none focus:ring-2 focus:ring-[#2D9B8C] text-[#4A3F37] text-sm"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-4 py-2 bg-[#F5EDE6] text-[#4A3F37] rounded-xl font-medium text-sm hover:bg-[#E8DDD4] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-4 bg-[#2D9B8C] text-white text-lg font-semibold rounded-xl hover:bg-[#247A6F] shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
