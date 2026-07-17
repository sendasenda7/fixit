import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardArtisan from './pages/DashboardArtisan';
import NouvelleDemande from './pages/NouvelleDemande';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
};

// Redirige vers le bon dashboard selon le rôle
const DashboardRoute = () => {
  const { user } = useAuth();
  if (user?.role === 'artisan') return <DashboardArtisan />;
  return <Dashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardRoute /></PrivateRoute>
        } />
        <Route path="/nouvelle-demande" element={
          <PrivateRoute><NouvelleDemande /></PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;