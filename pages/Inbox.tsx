
import React from 'react';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { MessageCircle, Calendar } from 'lucide-react';
import { TransactionStatus } from '../types';

const Inbox = () => {
  const { conversations, listings, getActiveTransactionForListing } = useStore();

  const sortedConversations = [...conversations].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (sortedConversations.length === 0) {
    return (
      <div className="p-4 lg:p-8 flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Your Inbox</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs">
          Chat with sellers to arrange safe meetups. 
          <br/>Browse listings to start a conversation!
        </p>
        <Link to="/" className="mt-6 px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium text-sm">
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white">
      <div className="p-4 lg:px-8 border-b border-gray-100 lg:hidden">
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
      </div>

      <div className="divide-y divide-gray-100 lg:max-w-2xl lg:mx-auto lg:mt-4 lg:border lg:rounded-xl lg:shadow-sm">
        {sortedConversations.map((conv) => {
          const listing = listings.find(l => l.id === conv.listingId);
          if (!listing) return null;
          
          const transaction = getActiveTransactionForListing(listing.id);
          const isScheduled = transaction?.status === TransactionStatus.MEETUP_AGREED && transaction.meetupTime;

          return (
            <Link to={`/chat/${conv.id}`} key={conv.id} className="block p-4 hover:bg-gray-50 transition-colors relative">
              <div className="flex gap-4">
                <div className="relative">
                   <img 
                     src={listing.images[0]} 
                     alt={listing.title} 
                     className="w-14 h-14 rounded-lg object-cover bg-gray-100 border border-gray-200"
                   />
                   {isScheduled && (
                     <div className="absolute -bottom-1 -right-1 bg-brand-600 text-white rounded-full p-1 border-2 border-white">
                        <Calendar className="w-3 h-3" />
                     </div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start mb-0.5">
                     <h3 className="font-semibold text-gray-900 text-sm truncate pr-2">{listing.title}</h3>
                     <span className="text-[10px] text-gray-400 whitespace-nowrap">
                       {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                   </div>
                   
                   {isScheduled ? (
                      <p className="text-xs font-bold text-brand-700 bg-brand-50 inline-block px-2 py-0.5 rounded-md mt-0.5">
                         📅 Meetup: {transaction.meetupTime}
                      </p>
                   ) : (
                      <p className={`text-sm truncate ${conv.lastMessage?.senderId !== 'currentUser' && !conv.lastMessage?.isRead ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                        {conv.lastMessage ? conv.lastMessage.text : 'Started conversation'}
                      </p>
                   )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Inbox;
