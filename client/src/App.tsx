import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Chat from './Chat';
import PrivacyPolicy from './PrivacyPolicy';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... existing checkAuth effect ...
    const checkAuth = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/user', { withCredentials: true });
        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <Chat /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
