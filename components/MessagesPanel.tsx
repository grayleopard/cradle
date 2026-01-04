import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Send, MessageCircle, Sparkles, Calendar } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { TransactionStatus } from '../types';

interface MessagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const MessagesPanel: React.FC<MessagesPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    conversations,
    messages,
    listings,
    currentUser,
    getUserById,
    getActiveTransactionForListing,
    sendMessage,
    markMessagesAsRead,
    getMessagesByConversationId
  } = useStore();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [view, setView] = useState<'inbox' | 'thread'>('inbox');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sort conversations by most recent
  const sortedConversations = [...conversations].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Get current conversation data
  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  const selectedListing = selectedConversation ? listings.find(l => l.id === selectedConversation.listingId) : null;
  const conversationMessages = selectedConversationId ? getMessagesByConversationId(selectedConversationId) : [];
  const otherParticipantId = selectedConversation?.participantIds.find(id => id !== currentUser?.id);
  const otherUser = otherParticipantId ? getUserById(otherParticipantId) : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    if (view === 'thread') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages.length, view]);

  // Focus input when entering thread view
  useEffect(() => {
    if (view === 'thread') {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [view]);

  // Mark messages as read when viewing thread
  useEffect(() => {
    if (selectedConversationId && view === 'thread') {
      markMessagesAsRead(selectedConversationId);
    }
  }, [selectedConversationId, view, markMessagesAsRead]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setSelectedConversationId(null);
      setView('inbox');
      setIsClosing(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setSelectedConversationId(null);
      setView('inbox');
    }, 200);
  };

  const handleSelectConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setView('thread');
  };

  const handleBackToInbox = () => {
    setView('inbox');
    setSelectedConversationId(null);
    setInputText('');
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConversationId) return;
    sendMessage(selectedConversationId, inputText);
    setInputText('');
  };

  const handleListingClick = () => {
    if (selectedListing) {
      handleClose();
      navigate(`/listing/${selectedListing.id}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#4A3F37]/30 z-[99] transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] max-w-[90vw] bg-white shadow-[-8px_0_30px_rgba(30,25,20,0.12)] z-[100] flex flex-col ${
          isClosing ? 'animate-slideOut' : 'animate-slideIn'
        }`}
      >
        {view === 'inbox' ? (
          /* Inbox View */
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DDD4]">
              <h2 className="font-serif text-xl font-semibold text-[#4A3F37]">Messages</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9A8578] hover:bg-[#F5EDE6] hover:text-[#4A3F37] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              {sortedConversations.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-[#F5EDE6] rounded-full flex items-center justify-center">
                      <MessageCircle className="w-10 h-10 text-[#2D9B8C]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#2D9B8C] rounded-full p-1.5">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-[#4A3F37] mb-2">No messages yet</h3>
                  <p className="text-sm text-[#6B5D52] max-w-[240px]">
                    When you connect with other parents, your conversations will appear here.
                  </p>
                </div>
              ) : (
                sortedConversations.map((conv) => {
                  const listing = listings.find(l => l.id === conv.listingId);
                  if (!listing) return null;

                  const participantId = conv.participantIds.find(id => id !== currentUser?.id);
                  const participant = participantId ? getUserById(participantId) : null;
                  const transaction = getActiveTransactionForListing(listing.id);
                  const isScheduled = transaction?.status === TransactionStatus.MEETUP_AGREED;
                  const hasUnread = conv.lastMessage && conv.lastMessage.senderId !== currentUser?.id && !conv.lastMessage.isRead;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFFCF9] transition-colors text-left border-b border-[#E8DDD4] ${
                        hasUnread ? 'bg-[#2D9B8C]/5' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={participant?.avatarUrl || listing.images[0]}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover bg-[#F5EDE6]"
                        />
                        {hasUnread && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#2D9B8C] rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-[15px] truncate ${hasUnread ? 'font-semibold text-[#4A3F37]' : 'font-medium text-[#4A3F37]'}`}>
                            {participant?.name || 'User'}
                          </span>
                          <span className="text-xs text-[#9A8578] ml-2 flex-shrink-0">
                            {formatTime(conv.updatedAt)}
                          </span>
                        </div>
                        {isScheduled ? (
                          <div className="flex items-center gap-1 text-xs text-[#2D9B8C]">
                            <Calendar className="w-3 h-3" />
                            <span>Meetup scheduled</span>
                          </div>
                        ) : (
                          <p className={`text-sm truncate ${hasUnread ? 'text-[#4A3F37]' : 'text-[#6B5D52]'}`}>
                            {conv.lastMessage?.text || `Re: ${listing.title}`}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* Thread View */
          <>
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8DDD4]">
              <button
                onClick={handleBackToInbox}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B5D52] hover:bg-[#F5EDE6] hover:text-[#4A3F37] transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#4A3F37] truncate">{otherUser?.name || 'User'}</h3>
                {selectedListing && (
                  <button
                    onClick={handleListingClick}
                    className="text-[13px] text-[#2D9B8C] hover:underline truncate block"
                  >
                    {selectedListing.title} · ${selectedListing.price}
                  </button>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9A8578] hover:bg-[#F5EDE6] hover:text-[#4A3F37] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {conversationMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[80%] px-4 py-3 text-[15px] leading-relaxed ${
                        isMe
                          ? 'bg-[#2D9B8C] text-white rounded-2xl rounded-br-md'
                          : 'bg-[#F5EDE6] text-[#4A3F37] rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className={`text-[11px] mt-1 ${isMe ? 'text-[#9A8578]' : 'text-[#9A8578]'}`}>
                      {formatMessageTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-[#E8DDD4]">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-[#FFFCF9] border border-[#E8DDD4] rounded-full text-[15px] placeholder:text-[#B8A395] focus:outline-none focus:border-[#2D9B8C] focus:ring-2 focus:ring-[#2D9B8C]/15 transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-11 h-11 rounded-full bg-[#2D9B8C] text-white flex items-center justify-center hover:bg-[#247A6F] disabled:bg-[#E8DDD4] disabled:cursor-not-allowed transition-all hover:scale-105 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideOut {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        .animate-slideIn {
          animation: slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slideOut {
          animation: slideOut 200ms ease-in forwards;
        }
      `}</style>
    </>
  );
};

export default MessagesPanel;
