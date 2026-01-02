
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Database, Image, RotateCcw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const DevSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Initialize state lazily with explicit typing to Record<string, string>
  // Removed Gemini API Key from manual configuration as it is strictly environment-based
  const [keys, setKeys] = useState<Record<string, string>>(() => ({
    VITE_SUPABASE_URL: localStorage.getItem('VITE_SUPABASE_URL') || 'https://heykcjvqkkecpcrjowjy.supabase.co',
    VITE_SUPABASE_ANON_KEY: localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhleWtjanZxa2tlY3Bjcmpvd2p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyOTg2NzYsImV4cCI6MjA4Mjg3NDY3Nn0.G3IO36EqdfHeIuDhnZK_qjfbC-ba0E1dmXNOzyXFyQM',
    VITE_CLOUDINARY_CLOUD_NAME: localStorage.getItem('VITE_CLOUDINARY_CLOUD_NAME') || 'dgq9mn6uz',
    VITE_CLOUDINARY_UPLOAD_PRESET: localStorage.getItem('VITE_CLOUDINARY_UPLOAD_PRESET') || 'cradle_uploads'
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeys({ ...keys, [e.target.name]: e.target.value });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(keys).forEach(([key, value]) => {
      if (value) {
        // Explicitly casting value to string as required by setItem
        localStorage.setItem(key, value as string);
      } else {
        localStorage.removeItem(key);
      }
    });
    showToast('Settings saved. Reloading...', 'success');
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleClear = () => {
    if(confirm("Clear all local API keys?")) {
        localStorage.removeItem('VITE_SUPABASE_URL');
        localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
        localStorage.removeItem('VITE_CLOUDINARY_CLOUD_NAME');
        localStorage.removeItem('VITE_CLOUDINARY_UPLOAD_PRESET');
        
        setKeys({
            VITE_SUPABASE_URL: '',
            VITE_SUPABASE_ANON_KEY: '',
            VITE_CLOUDINARY_CLOUD_NAME: '',
            VITE_CLOUDINARY_UPLOAD_PRESET: ''
        });
        showToast('Keys cleared', 'info');
        setTimeout(() => window.location.reload(), 500);
    }
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/profile')} className="p-2 hover:bg-gray-50 rounded-full">
          <ChevronLeft className="w-5 h-5 text-gray-800" />
        </button>
        <h1 className="font-bold text-gray-900">Developer Settings</h1>
      </div>

      <div className="p-6 max-w-lg mx-auto pb-20">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-blue-800">
           <p className="font-bold mb-1">Configuration Helper</p>
           <p>
             Paste your backend keys below. Gemini API keys are strictly environment-managed and cannot be configured here.
           </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center gap-2 mb-4 text-brand-600 font-bold border-b border-gray-100 pb-2">
                <Database className="w-4 h-4" /> Supabase Config
             </div>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Project URL</label>
                   <input 
                     name="VITE_SUPABASE_URL"
                     value={keys.VITE_SUPABASE_URL}
                     onChange={handleChange}
                     placeholder="https://xyz.supabase.co"
                     className="w-full p-3 bg-gray-50 rounded-lg text-sm font-mono border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anon Key</label>
                   <input 
                     name="VITE_SUPABASE_ANON_KEY"
                     value={keys.VITE_SUPABASE_ANON_KEY}
                     onChange={handleChange}
                     type="password"
                     placeholder="eyJhbGciOiJIUz..."
                     className="w-full p-3 bg-gray-50 rounded-lg text-sm font-mono border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                   />
                </div>
             </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <div className="flex items-center gap-2 mb-4 text-orange-600 font-bold border-b border-gray-100 pb-2">
                <Image className="w-4 h-4" /> Cloudinary Config
             </div>
             <div className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cloud Name</label>
                   <input 
                     name="VITE_CLOUDINARY_CLOUD_NAME"
                     value={keys.VITE_CLOUDINARY_CLOUD_NAME}
                     onChange={handleChange}
                     placeholder="e.g. demo"
                     className="w-full p-3 bg-gray-50 rounded-lg text-sm font-mono border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Upload Preset</label>
                   <input 
                     name="VITE_CLOUDINARY_UPLOAD_PRESET"
                     value={keys.VITE_CLOUDINARY_UPLOAD_PRESET}
                     onChange={handleChange}
                     placeholder="e.g. cradle_uploads"
                     className="w-full p-3 bg-gray-50 rounded-lg text-sm font-mono border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                   />
                </div>
             </div>
          </div>

          <div className="flex gap-3 pt-4">
             <button type="button" onClick={handleClear} className="px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                <RotateCcw className="w-5 h-5" />
             </button>
             <button type="submit" className="flex-1 py-3 bg-black text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> Save Configuration
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DevSettings;
