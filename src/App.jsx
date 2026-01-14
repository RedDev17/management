import { useState, useEffect } from 'react';
import DeveloperBoard from './components/DeveloperBoard';
import { ClientProvider } from './context/ClientContext';
import { ProfileProvider } from './context/ProfileContext';
import Login from './components/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
     return sessionStorage.getItem('auth_token') === 'true' || localStorage.getItem('auth_token') === 'true';
  });

  const handleLogin = (user, rememberMe) => {
    if (rememberMe) {
        localStorage.setItem('auth_token', 'true');
    } else {
        sessionStorage.setItem('auth_token', 'true');
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ProfileProvider>
      <ClientProvider>
        <div className="app">
          <DeveloperBoard onLogout={handleLogout} />
        </div>
      </ClientProvider>
    </ProfileProvider>
  );
}

export default App;
