import { useState, useEffect } from 'react';

export default function useAuth() {
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const parseToken = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUsername('');
      setIsAuthenticated(false);
      return;
    }
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUsername(decoded.username || '');
      setIsAuthenticated(!!decoded.username);
    } catch (e) {
      console.warn('Ошибка декодирования токена:', e);
      setUsername('');
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    parseToken();
    window.addEventListener('token-changed', parseToken);
    return () => window.removeEventListener('token-changed', parseToken);
  }, []);

  return { username, isAuthenticated };
}
