import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardArtisan from './pages/DashboardArtisan';
import NouvelleDemande from './pages/NouvelleDemande';
import ArtisansListe from './pages/ArtisansListe';
import ArtisanProfile from './pages/ArtisanProfile';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';

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
        <Route path="/artisans" element={<ArtisansListe />} />
        <Route path="/artisans/:id" element={<ArtisanProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute><DashboardRoute /></PrivateRoute>
        } />
        <Route path="/nouvelle-demande" element={
          <PrivateRoute><NouvelleDemande /></PrivateRoute>
        } />
        <Route path="/messages" element={
          <PrivateRoute><Messages /></PrivateRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;