import { useState, useEffect } from 'react';
import PasswordGate, { checkStoredAuth } from './components/PasswordGate';
import ChatInterface from './components/ChatInterface';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for stored authentication
    const hasAuth = checkStoredAuth();
    setIsAuthenticated(hasAuth);
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="h-screen">
      <ChatInterface />
    </div>
  );
}
