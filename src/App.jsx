import { useState, useEffect } from 'react';
import DeveloperBoard from './components/DeveloperBoard';
import { ClientProvider } from './context/ClientContext';
import { ProfileProvider } from './context/ProfileContext';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
     return sessionStorage.getItem('auth_token') === 'true';
  });

  const handleLogin = (user) => {
    sessionStorage.setItem('auth_token', 'true');
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ProfileProvider>
      <ClientProvider>
        <div className="app">
          <DeveloperBoard />
        </div>
      </ClientProvider>
    </ProfileProvider>
  );
}

export default App;
