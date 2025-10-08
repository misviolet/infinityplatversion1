import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import { supabaseAuth } from './services/supabaseAuth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('App: Initializing...');
    try {
      // Check if user is already logged in (from sessionStorage)
      const savedAuth = sessionStorage.getItem('isAuthenticated');
      const savedUsername = sessionStorage.getItem('username');
      const savedUserFullName = sessionStorage.getItem('userFullName');
      const savedUserRole = sessionStorage.getItem('userRole');

      console.log('App: Checking saved auth:', { savedAuth, savedUsername });

      if (savedAuth === 'true' && savedUsername && savedUserFullName) {
        setIsAuthenticated(true);
        setUsername(savedUsername);
        setUserFullName(savedUserFullName);
        setUserRole(savedUserRole || 'User');
        console.log('App: Restored user session');
      }

      setIsLoading(false);
      console.log('App: Initialization complete');
    } catch (error) {
      console.error('App: Error during initialization:', error);
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (inputUsername: string, password: string): Promise<boolean> => {
    try {
      const result = await supabaseAuth.validateCredentials(inputUsername, password);
      
      if (result.isValid) {
        setIsAuthenticated(true);
        setUsername(inputUsername);
        setUserFullName(result.name || inputUsername);
        setUserRole(result.role || 'User');
        // Save authentication state
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('username', inputUsername);
        sessionStorage.setItem('userFullName', result.name || inputUsername);
        sessionStorage.setItem('userRole', result.role || 'User');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setUserFullName('');
    setUserRole('');
    // Clear authentication state
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userFullName');
    sessionStorage.removeItem('userRole');
  };

  console.log('App: Rendering, isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {isAuthenticated ? (
        <Dashboard username={username} userFullName={userFullName} userRole={userRole} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;