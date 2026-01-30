import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'townconnect2026';
const STORAGE_KEY = 'partner-academy-auth';

export const checkStoredAuth = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'authenticated';
  } catch {
    return false;
  }
};

export const setStoredAuth = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, 'authenticated');
  } catch {
    // localStorage not available
  }
};

export default function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === APP_PASSWORD) {
      setStoredAuth();
      onAuthenticated();
    } else {
      setError('Incorrect password');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest to-forest-dark flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md ${isShaking ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-forest rounded-2xl flex items-center justify-center">
            <span className="text-white text-3xl font-bold">PA</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Partner Academy
        </h1>
        <p className="text-gray-500 text-center mb-8">
          Enter password to access training materials
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter password"
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent text-lg"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-forest hover:bg-forest-dark text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Access Academy
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          For Area Partners only
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
