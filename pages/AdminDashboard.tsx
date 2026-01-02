
import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Users, ShoppingBag, AlertTriangle, CheckCircle, XCircle, Gavel, Flag } from 'lucide-react';
import { TransactionStatus } from '../types';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
  const { listings, transactions, conversations, resetStore, updateTransactionStatus, reports, deleteListing } = useStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const totalGMV = transactions.reduce((acc, t) => acc + t.total, 0);
  const platformFees = transactions.reduce((acc, t) => acc + t.platformFee, 0);
  const activeListings = listings.filter(l => !l.isSold).length;
  const completedTx = transactions.filter(t => t.status === 'completed').length;
  const disputedTransactions = transactions.filter(t => t.status === TransactionStatus.DISPUTED);
  const activeReports = reports.filter(r => r.status === 'pending');

  const handleResolveDispute = (txId: string, resolution: 'refund' | 'release') => {
    if (resolution === 'refund') {
        updateTransactionStatus(txId, TransactionStatus.CANCELLED);
        showToast("Transaction cancelled. Funds refunded to buyer.", "info");
    } else {
        updateTransactionStatus(txId, TransactionStatus.COMPLETED);
        showToast("Dispute resolved. Funds released to seller.", "success");
    }
    setSelectedDisputeId(null);
  };

  const handleResolveReport = (listingId: string, action: 'delete' | 'dismiss') => {
      // In a real app we would update the report status
      if (action === 'delete') {
          deleteListing(listingId);
          showToast("Listing deleted and report resolved.", "success");
      } else {
          showToast("Report dismissed.", "info");
      }
      // Note: for MVP we aren't updating report object status in store, just visually handling it
  };

  return (
    <div className="min-h-full bg-gray-50 p-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-2 bg-white rounded-full shadow-sm">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-green-600">
               <TrendingUp className="w-5 h-5" />
               <span className="text-xs font-bold uppercase">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">${platformFees}</div>
            <div className="text-xs text-gray-400">from ${totalGMV} GMV</div>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2 text-blue-600">
               <ShoppingBag className="w-5 h-5" />
               <span className="text-xs font-bold uppercase">Orders</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{completedTx}</div>
            <div className="text-xs text-gray-400">{transactions.length} total</div>
         </div>
      </div>

      {/* Disputes Section */}
      {disputedTransactions.length > 0 && (
        <div className="bg-red-50 rounded-xl shadow-sm border border-red-100 overflow-hidden mb-6 animate-in slide-in-from-left">
            <div className="p-4 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="font-bold text-red-900 text-sm">Active Disputes ({disputedTransactions.length})</span>
            </div>
            <div className="divide-y divide-red-100">
                {disputedTransactions.map(tx => (
                    <div key={tx.id} className="p-4 bg-white/50">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="font-bold text-gray-900">Tx #{tx.id.slice(-6)}</div>
                                <div className="text-xs text-gray-500">${tx.total} • Buyer reported issue</div>
                            </div>
                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full">ACTION REQUIRED</span>
                        </div>
                        
                        {selectedDisputeId === tx.id ? (
                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 mb-3">
                                    <strong>Admin Action:</strong> Review evidence (photos/chat) and decide outcome.
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleResolveDispute(tx.id, 'refund')}
                                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200"
                                    >
                                        Refund Buyer
                                    </button>
                                    <button 
                                        onClick={() => handleResolveDispute(tx.id, 'release')}
                                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700"
                                    >
                                        Release Funds
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setSelectedDisputeId(tx.id)}
                                className="w-full py-2 bg-red-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                            >
                                <Gavel className="w-3 h-3" /> Resolve Dispute
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Reports Section */}
      {activeReports.length > 0 && (
          <div className="bg-orange-50 rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-6 animate-in slide-in-from-left">
            <div className="p-4 border-b border-orange-100 flex items-center gap-2">
                <Flag className="w-5 h-5 text-orange-600" />
                <span className="font-bold text-orange-900 text-sm">Content Reports ({activeReports.length})</span>
            </div>
            <div className="divide-y divide-orange-100">
                {activeReports.map(report => {
                    const listing = listings.find(l => l.id === report.listingId);
                    return (
                        <div key={report.id} className="p-4 bg-white/50">
                            <div className="mb-2">
                                <div className="font-bold text-gray-900 text-sm">{listing ? listing.title : 'Deleted Listing'}</div>
                                <div className="text-xs text-orange-800 bg-orange-100 inline-block px-2 py-0.5 rounded mt-1">Reason: {report.reason}</div>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button 
                                    onClick={() => handleResolveReport(report.listingId, 'dismiss')}
                                    className="flex-1 bg-white border border-gray-200 text-gray-600 py-1.5 rounded-lg text-xs font-bold"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={() => handleResolveReport(report.listingId, 'delete')}
                                    className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold"
                                >
                                    Delete Listing
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
         <div className="p-4 border-b border-gray-100 font-bold text-sm">Recent Transactions</div>
         <div className="divide-y divide-gray-100">
            {transactions.length === 0 && <div className="p-4 text-sm text-gray-400 text-center">No transactions yet</div>}
            {transactions.map(tx => (
               <div key={tx.id} className="p-3 flex justify-between items-center text-sm hover:bg-gray-50">
                  <div>
                     <div className="font-medium text-gray-900">Tx #{tx.id.slice(-4)}</div>
                     <div className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                     <div className="font-bold">${tx.total}</div>
                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                         tx.status === 'completed' ? 'bg-green-100 text-green-700' : 
                         tx.status === 'disputed' ? 'bg-red-100 text-red-700' :
                         tx.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                         'bg-yellow-100 text-yellow-700'
                     }`}>
                        {tx.status}
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-100 font-bold text-sm">Platform Health</div>
         <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
               <span className="text-gray-600">Active Listings</span>
               <span className="font-medium">{activeListings}</span>
            </div>
            <div className="flex justify-between text-sm">
               <span className="text-gray-600">Active Conversations</span>
               <span className="font-medium">{conversations.length}</span>
            </div>
         </div>
      </div>

      <div className="mt-8">
        <button onClick={resetStore} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-100">
          Reset All Database Data
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
