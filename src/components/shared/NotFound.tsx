import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerIcon } from './OwnerIcons';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center text-white p-4">
      <div className="w-64 h-64 relative flex items-center justify-center mb-8">
          {/* Animated Glitch Effect Placeholder */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-20"></div>
          <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <OwnerIcon name="ExclamationTriangleIcon" className="w-32 h-32 text-gyn-orange drop-shadow-[0_0_30px_rgba(245,166,35,0.5)]" />
      </div>
      
      <h1 className="text-6xl font-black font-machina mb-4 tracking-tighter">404</h1>
      <h2 className="text-xl md:text-2xl text-gray-400 mb-8 text-center max-w-md">
          System Error: The requested sector coordinates could not be resolved.
      </h2>

      <div className="flex gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-white/20 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center gap-2"
          >
              <OwnerIcon name="ChevronLeft" className="w-4 h-4" /> Go Back
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gyn-blue-medium text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/50"
          >
              Return to Base
          </button>
      </div>
    </div>
  );
};

export default NotFound;