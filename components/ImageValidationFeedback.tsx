import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, Loader2 } from 'lucide-react';
import { ImageValidationResponse } from '../services/geminiService';

interface ImageValidationFeedbackProps {
  validation: ImageValidationResponse | null;
  isValidating: boolean;
  onDismiss?: () => void;
}

const ImageValidationFeedback: React.FC<ImageValidationFeedbackProps> = ({
  validation,
  isValidating,
  onDismiss
}) => {
  if (isValidating) {
    return (
      <div className="bg-[#F0FAF8] border border-[#2D9B8C]/20 rounded-xl p-4 animate-in fade-in">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-[#2D9B8C] animate-spin" />
          <div>
            <p className="text-sm font-medium text-[#4A3F37]">Checking your photos...</p>
            <p className="text-xs text-[#6B5D52]">Making sure they look great for buyers</p>
          </div>
        </div>
      </div>
    );
  }

  if (!validation) return null;

  const { overallStatus, results, message } = validation;

  // Color schemes for different statuses
  const statusConfig = {
    approved: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle2,
      iconColor: 'text-green-600',
      textColor: 'text-green-800'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      textColor: 'text-amber-800'
    },
    rejected: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: XCircle,
      iconColor: 'text-red-600',
      textColor: 'text-red-800'
    }
  };

  const config = statusConfig[overallStatus];
  const Icon = config.icon;

  // Collect unique issues and suggestions
  const allIssues = results.flatMap(r => r.issues).filter(Boolean);
  const allSuggestions = results.flatMap(r => r.suggestions || []).filter(Boolean);
  const uniqueIssues = [...new Set(allIssues)].slice(0, 3);
  const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, 2);

  // Get rejected images info
  const rejectedResults = results.filter(r => r.status === 'rejected');

  return (
    <div className={`${config.bg} border ${config.border} rounded-xl p-4 animate-in fade-in`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
          <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
        </div>
        {onDismiss && overallStatus !== 'rejected' && (
          <button
            onClick={onDismiss}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Dismiss
          </button>
        )}
      </div>

      {/* Issues for rejected images */}
      {rejectedResults.length > 0 && (
        <div className="mt-3 space-y-2">
          {rejectedResults.map(result => (
            <div key={result.index} className="bg-white/60 rounded-lg p-2.5 text-xs">
              <span className="font-medium text-red-700">Photo {result.index + 1}: </span>
              <span className="text-red-600">{result.rejectionReason}</span>
            </div>
          ))}
        </div>
      )}

      {/* General issues */}
      {uniqueIssues.length > 0 && overallStatus !== 'rejected' && (
        <ul className="mt-3 space-y-1">
          {uniqueIssues.map((issue, i) => (
            <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
              <span className="text-amber-500 mt-0.5">•</span>
              {issue}
            </li>
          ))}
        </ul>
      )}

      {/* Suggestions */}
      {uniqueSuggestions.length > 0 && overallStatus !== 'rejected' && (
        <div className="mt-3 bg-white/50 rounded-lg p-2.5 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600">
            <span className="font-medium">Tip: </span>
            {uniqueSuggestions.join(' ')}
          </div>
        </div>
      )}

      {/* Quality scores for debugging (optional, hidden by default) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            Debug: View scores
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
            {results.map(r => (
              <div key={r.index} className="bg-white/60 rounded p-2">
                Photo {r.index + 1}: Q{r.qualityScore} / R{r.relevanceScore}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default ImageValidationFeedback;
