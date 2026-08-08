import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Ferme le menu mobile après un clic sur un lien (évite de rester coincé ouvert)
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" style={styles.nav}>
      <Link to="/" style={styles.logo} onClick={closeMenu}>
        <span style={styles.logoFix}>Fix</span>
        <span style={styles.logoIt}>It</span>
      </Link>

      <button
        type="button"
        className="navbar-toggle"
        aria-label={menuOpen ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      <ul
        className={`navbar-links${menuOpen ? ' navbar-links--open' : ''}`}
        style={styles.navLinks}
      >
        <li><a href="#comment" style={styles.link} onClick={closeMenu}>Comment ça marche</a></li>
        <li><a href="#services" style={styles.link} onClick={closeMenu}>Services</a></li>
        <li><Link to="/artisans" style={styles.link} onClick={closeMenu}>Trouver un artisan</Link></li>
        <li><a href="#avantages" style={styles.link} onClick={closeMenu}>Avantages</a></li>
      </ul>

      <div className="navbar-buttons" style={styles.navButtons}>
        {user ? (
          <>
            <NotificationBell />
            <Link to="/dashboard" style={styles.btnLogin}>Tableau de bord</Link>
            <button
              type="button"
              onClick={logout}
              style={{ ...styles.btnRegister, border: 'none', cursor: 'pointer' }}
            >
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
  logoFix: { color: 'var(--blue)' },
  logoIt: { color: 'var(--green)' },
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
    alignItems: 'center',
    gap: '12px',
  },
  btnLogin: {
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: '25px',
    border: '2px solid var(--blue)',
    color: 'var(--blue)',
    fontWeight: '600',
    fontSize: '14px',
  },
  btnRegister: {
    textDecoration: 'none',
    padding: '8px 20px',
    borderRadius: '25px',
    backgroundColor: 'var(--blue)',
    color: '#fff',
    fontWeight: '600',
    fontSize: '14px',
  },
};

export default Navbar;