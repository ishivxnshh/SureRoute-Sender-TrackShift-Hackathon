import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { useStore } from './store';

// Small wrapper so we can run a one-time effect before rendering the app.
// It checks the URL for ?authToken=... which is how the backend returns
// our OWN JWT after a successful Google OAuth redirect.
function Root() {
  const setAuthFromToken = useStore((state) => state.setAuthFromToken);
  const initAuth = useStore((state) => state.initAuth);

  useEffect(() => {
    // First, try to restore auth from localStorage
    initAuth();

    // Then check for OAuth callback token in URL
    const url = new URL(window.location.href);
    const token = url.searchParams.get('authToken');
    if (token) {
      // Hydrate auth state from token, then clean it from the URL so it
      // doesn't linger in the browser history.
      setAuthFromToken(token);
      url.searchParams.delete('authToken');
      const cleaned =
        url.origin + url.pathname + (url.search ? `?${url.searchParams}` : '') + url.hash;
      window.history.replaceState({}, '', cleaned);
    }
  }, [setAuthFromToken, initAuth]);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
