import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import App from './App';

// Wrapper component that uses AuthContext
const AppWrapper = () => {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0F1116',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '3px solid rgba(99, 102, 241, 0.3)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <span>Loading AutoFlow...</span>
        </div>
      </div>
    );
  }

  // Pass auth props to App
  return <App user={user} onLogout={logout} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>
);
