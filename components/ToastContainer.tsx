import React from 'react';
import { useToast, ToastType } from '../context/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-white border-green-100 text-green-800';
      case 'error': return 'bg-white border-red-100 text-red-800';
      default: return 'bg-white border-blue-100 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 max-w-sm w-full ${getStyles(toast.type)}`}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-sm font-medium text-gray-800">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;