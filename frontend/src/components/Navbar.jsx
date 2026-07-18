import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav style={styles.nav}>
      {/* Logo */}
      <Link to="/" style={styles.logo}>
        <span style={styles.logoFix}>Fix</span>
        <span style={styles.logoIt}>It</span>
      </Link>

      {/* Liens navigation */}
      <ul style={styles.navLinks}>
        <li><a href="#comment" style={styles.link}>Comment ça marche</a></li>
        <li><a href="#services" style={styles.link}>Services</a></li>
        <li><a href="#avantages" style={styles.link}>Avantages</a></li>
      </ul>

      {/* Boutons */}
      <div style={styles.navButtons}>
        {user ? (
          <>
            <Link to="/dashboard" style={styles.btnLogin}>Tableau de bord</Link>
            <button onClick={logout} style={{ ...styles.btnRegister, border: 'none', cursor: 'pointer' }}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.btnLogin}>Se connecter</Link>
            <Link to="/register" style={styles.btnRegister}>S'inscrire</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px 60px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: '28px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  logoFix: { color: '#1a73e8' },
  logoIt: { color: '#00c853' },
  navLinks: {
    display: 'flex',
    listStyle: 'none',
    gap: '30px',
  },
  link: {
    textDecoration: 'none',
    color: '#555',
    fontSize: '15px',
    fontWeight: '500',
  },
  navButtons: {
    display: 'flex',
    gap: '12px',
  },
  btnLogin: {
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: '25px',
    border: '2px solid #1a73e8',
    color: '#1a73e8',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnRegister: {
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: '25px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
  },
};

export default Navbar;