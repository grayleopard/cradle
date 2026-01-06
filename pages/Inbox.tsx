
import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { TransactionStatus } from '../types';

const Inbox = () => {
  const { conversations, listings, getActiveTransactionForListing } = useStore();

  const sortedConversations = [...conversations].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (sortedConversations.length === 0) {
    return (
      <div className="min-h-full bg-[#FFFCF9]">
        {/* Header */}
        <div className="p-4 lg:px-8 border-b border-[#E8DDD4] bg-white lg:hidden">
          <h1 className="text-xl font-bold font-serif text-[#4A3F37]">Messages</h1>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="text-5xl mb-6">💬</div>

          <h2 className="text-xl font-bold font-serif text-[#4A3F37] mb-2">No Messages Yet</h2>
          <p className="text-[#6B5D52] text-sm max-w-xs leading-relaxed mb-8">
            When you message a seller about an item, your conversations will appear here.
          </p>

          <Link
            to="/"
            className="px-8 py-3 bg-[#2D9B8C] text-white rounded-full font-semibold text-sm hover:bg-[#247A6F] transition-colors shadow-sm"
          >
            Browse Listings
          </Link>

          <p className="text-xs text-[#9CA3AF] mt-6 max-w-xs">
            💡 Tap "Message Seller" on any listing to start a conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#FFFCF9]">
      {/* Header */}
      <div className="p-4 lg:px-8 border-b border-[#E8DDD4] bg-white lg:hidden">
        <h1 className="text-xl font-bold font-serif text-[#4A3F37]">Messages</h1>
      </div>

      {/* Conversations List */}
      <div className="lg:max-w-2xl lg:mx-auto lg:mt-4 lg:px-4">
        <div className="bg-white lg:rounded-xl lg:border lg:border-[#E8DDD4] lg:shadow-sm overflow-hidden">
          {sortedConversations.map((conv, index) => {
            const listing = listings.find(l => l.id === conv.listingId);
            if (!listing) return null;

            const transaction = getActiveTransactionForListing(listing.id);
            const isScheduled = transaction?.status === TransactionStatus.MEETUP_AGREED && transaction.meetupTime;
            const hasUnread = conv.lastMessage?.senderId !== 'currentUser' && !conv.lastMessage?.isRead;

            return (
              <Link
                to={`/chat/${conv.id}`}
                key={conv.id}
                className={`block p-4 hover:bg-[#FFFCF9] transition-colors relative group ${
                  index !== sortedConversations.length - 1 ? 'border-b border-[#E8DDD4]' : ''
                }`}
              >
                <div className="flex gap-4 items-center">
                  {/* Listing Image */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-14 h-14 rounded-xl object-cover bg-[#F5EDE6] border border-[#E8DDD4]"
                    />
                    {isScheduled && (
                      <div className="absolute -bottom-1 -right-1 bg-[#2D9B8C] text-white rounded-full p-1.5 border-2 border-white shadow-sm">
                        <Calendar className="w-3 h-3" />
                      </div>
                    )}
                    {hasUnread && !isScheduled && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#2D9B8C] rounded-full border-2 border-white" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-[#4A3F37] text-sm truncate pr-2">
                        {listing.title}
                      </h3>
                      <span className="text-[10px] text-[#9CA3AF] whitespace-nowrap">
                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {isScheduled ? (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#2D9B8C] bg-[#2D9B8C]/10 inline-flex px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3" />
                        Meetup: {transaction.meetupTime}
                      </div>
                    ) : (
                      <p className={`text-sm truncate ${hasUnread ? 'text-[#4A3F37] font-medium' : 'text-[#6B5D52]'}`}>
                        {conv.lastMessage ? conv.lastMessage.text : 'Started conversation'}
                      </p>
                    )}
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-[#E8DDD4] group-hover:text-[#2D9B8C] transition-colors flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
