
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { askConcierge, ConciergeResponse } from '../services/geminiService';
import { CradleLiveService } from '../services/geminiLive';
import { MessageCircle, X, Send, Sparkles, Loader2, Minimize2, Camera, Image as ImageIcon, Headphones, Mic, MicOff } from 'lucide-react';
import ListingCard from './ListingCard';
import { processImage } from '../utils/fileHelpers';
import { useToast } from '../context/ToastContext';
import { Link, useLocation } from 'react-router-dom';

const Concierge = () => {
  const { listings } = useStore();
  const { showToast } = useToast();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Chat State
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; recommendedIds?: string[] }[]>([
    { role: 'model', text: "Hi! I'm the Cradle Concierge. I can help you find gear, compare prices, or check safety. Upload a photo or ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ base64: string, previewUrl: string, mimeType: string } | null>(null);
  
  // Live Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveVolume, setLiveVolume] = useState(0);
  const [liveStatus, setLiveStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error' | 'unavailable'>('disconnected');
  const liveServiceRef = useRef<CradleLiveService | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized && !isLiveMode) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isLiveMode]);

  // Focus input when Concierge opens
  useEffect(() => {
    if (isOpen && !isMinimized && !isLiveMode) {
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToBottom();
      }, 300);
    }
    // Handle viewport changes (keyboard)
    if (window.visualViewport && isOpen) {
      window.visualViewport.addEventListener('resize', scrollToBottom);
    }
    return () => {
      window.visualViewport?.removeEventListener('resize', scrollToBottom);
    };
  }, [isOpen, isMinimized, isLiveMode]);

  // Clean up live service on unmount or close
  useEffect(() => {
    return () => {
      if (liveServiceRef.current) {
        liveServiceRef.current.disconnect();
      }
    };
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const processed = await processImage(e.target.files[0]);
        setAttachedImage({
          base64: processed.base64,
          previewUrl: processed.previewUrl,
          mimeType: processed.mimeType
        });
      } catch (err) {
        showToast("Failed to attach image", "error");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || loading) return;

    const userText = input;
    const currentImage = attachedImage;
    
    setInput('');
    setAttachedImage(null);
    
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userText || (currentImage ? "Sent an image" : "")
    }]);
    
    setLoading(true);

    try {
      const response = await askConcierge(
        messages, 
        userText || (currentImage ? "Please analyze this image I sent." : ""), 
        listings,
        currentImage ? { base64: currentImage.base64, mimeType: currentImage.mimeType } : undefined
      );
      
      if (response) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: response.message,
          recommendedIds: response.recommendedListingIds
        }]);
      } else {
         setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the marketplace right now. Please try again." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error." }]);
    } finally {
      setLoading(false);
      if (!isLiveMode) inputRef.current?.focus();
    }
  };

  const toggleLiveMode = async () => {
    if (isLiveMode) {
      liveServiceRef.current?.disconnect();
      liveServiceRef.current = null;
      setIsLiveMode(false);
      setLiveStatus('disconnected');
    } else {
      setIsLiveMode(true);
      setLiveStatus('connecting');
      
      const service = new CradleLiveService();
      liveServiceRef.current = service;
      
      service.onVolumeUpdate = (vol) => {
         setLiveVolume(prev => prev * 0.8 + vol * 5 * 0.2);
      };
      
      service.onStatusChange = (status) => {
        setLiveStatus(status);
        if (status === 'error') showToast("Connection failed", 'error');
        if (status === 'unavailable') {
          showToast("Voice mode is currently unavailable", 'error');
          setIsLiveMode(false);
        }
        if (status === 'disconnected') setIsLiveMode(false);
      };

      await service.connect(listings);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform animate-in zoom-in"
      >
        <Sparkles className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
      </button>
    );
  }

  if (isMinimized) {
    return (
       <div 
         onClick={() => setIsMinimized(false)}
         className="fixed bottom-24 right-6 z-40 bg-white border border-gray-200 shadow-xl rounded-full px-4 py-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors animate-in fade-in"
       >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-bold text-gray-800">Concierge</span>
          <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="ml-2 p-1 hover:bg-gray-200 rounded-full">
            <X className="w-3 h-3 text-gray-400" />
          </button>
       </div>
    );
  }

  return (
    <div className="fixed bottom-[max(20px,env(safe-area-inset-bottom))] right-4 z-[100] w-[calc(100vw-32px)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[70dvh] animate-in slide-in-from-bottom-10 fade-in transition-all">
       {/* Header */}
       <div className={`p-4 flex justify-between items-center text-white transition-colors duration-500 ${isLiveMode ? 'bg-gray-900' : 'bg-gradient-to-r from-indigo-600 to-purple-600'}`}>
          <div className="flex items-center gap-2">
             <div className="bg-white/20 p-1.5 rounded-lg">
                {isLiveMode ? <Headphones className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
             </div>
             <div>
               <h3 className="font-bold text-sm">Cradle {isLiveMode ? 'Live' : 'Concierge'}</h3>
               <p className="text-[10px] opacity-80">{isLiveMode ? 'Real-time Voice' : 'AI Shopping Assistant'}</p>
             </div>
          </div>
          <div className="flex gap-1">
             <button onClick={() => setIsMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-full"><Minimize2 className="w-4 h-4" /></button>
             <button onClick={() => { setIsOpen(false); if(isLiveMode) toggleLiveMode(); }} className="p-1.5 hover:bg-white/20 rounded-full"><X className="w-4 h-4" /></button>
          </div>
       </div>

       {isLiveMode ? (
         <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center p-8 text-center space-y-8 relative overflow-hidden h-[350px]">
             <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <div className="w-64 h-64 bg-indigo-500 rounded-full blur-3xl transition-transform duration-100" style={{ transform: `scale(${1 + liveVolume})` }}></div>
             </div>
             <div className="relative z-10">
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${liveStatus === 'connected' ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'border-gray-700'}`}>
                   {liveStatus === 'connecting' ? (
                      <Loader2 className="w-12 h-12 text-gray-500 animate-spin" />
                   ) : (
                      <div className="flex gap-1 items-end h-12">
                         <div className="w-2 bg-indigo-500 rounded-full transition-all duration-75" style={{ height: `${20 + liveVolume * 80}%` }}></div>
                         <div className="w-2 bg-purple-500 rounded-full transition-all duration-75 delay-75" style={{ height: `${30 + liveVolume * 60}%` }}></div>
                         <div className="w-2 bg-pink-500 rounded-full transition-all duration-75 delay-100" style={{ height: `${20 + liveVolume * 90}%` }}></div>
                      </div>
                   )}
                </div>
             </div>
             <div className="relative z-10 text-white">
                <h3 className="text-lg font-bold mb-2">
                   {liveStatus === 'connecting' ? 'Connecting...' : 'Listening...'}
                </h3>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
                   Ask about strollers, safety, or just say hello!
                </p>
             </div>
             <button onClick={toggleLiveMode} className="relative z-10 bg-red-500/20 text-red-400 border border-red-500/50 px-6 py-2 rounded-full text-sm font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2">
               <MicOff className="w-4 h-4" /> End Call
             </button>
         </div>
       ) : (
         <>
           <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 max-h-[400px] no-scrollbar">
              {messages.map((msg, idx) => (
                 <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                       {msg.text}
                    </div>
                    {msg.recommendedIds && msg.recommendedIds.length > 0 && (
                       <div className="mt-3 w-full overflow-x-auto pb-2 no-scrollbar pl-1">
                          <div className="flex gap-3 w-max">
                             {msg.recommendedIds.map(id => {
                                const item = listings.find(l => l.id === id);
                                if (!item) return null;
                                return (
                                   <Link to={`/listing/${id}`} state={{ from: location.pathname }} key={id} onClick={() => setIsOpen(false)} className="w-48 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0 block hover:shadow-md transition-shadow cursor-pointer">
                                      <img src={item.images[0]} className="w-full h-24 object-cover" alt={item.title} />
                                      <div className="p-2">
                                         <div className="font-bold text-xs truncate text-gray-900">{item.title}</div>
                                         <div className="text-brand-600 font-bold text-xs">${item.price}</div>
                                      </div>
                                   </Link>
                                );
                             })}
                          </div>
                       </div>
                    )}
                 </div>
              ))}
              {loading && (
                 <div className="flex items-start">
                   <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
           </div>
           {attachedImage && (
             <div className="bg-white px-4 pt-2 flex items-center gap-2 animate-in slide-in-from-bottom-2">
                <div className="relative">
                  <img src={attachedImage.previewUrl} className="h-12 w-12 rounded-lg object-cover border border-gray-200" alt="Preview" />
                  <button onClick={() => setAttachedImage(null)} className="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-0.5"><X className="w-2.5 h-2.5" /></button>
                </div>
                <span className="text-xs text-gray-500">Image attached</span>
             </div>
           )}
           <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center relative">
              <button onClick={toggleLiveMode} className="absolute -top-12 right-4 bg-gray-900 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-1 pl-3 pr-3 text-xs font-bold">
                 <Headphones className="w-3 h-3" /> Live
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-full transition-colors"><Camera className="w-5 h-5" /></button>
              <form onSubmit={handleSend} className="flex-1 flex gap-2">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onFocus={() => setTimeout(scrollToBottom, 300)} placeholder="Ask anything..." className="flex-1 bg-gray-100 border border-transparent focus:bg-white focus:border-purple-300 rounded-full px-4 py-2 text-sm text-gray-900 outline-none transition-all" />
                <button type="submit" disabled={(!input.trim() && !attachedImage) || loading} className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                   <Send className="w-4 h-4" />
                </button>
              </form>
           </div>
         </>
       )}
    </div>
  );
};

export default Concierge;
