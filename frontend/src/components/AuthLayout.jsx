import React from 'react';
import { motion } from 'framer-motion';
import artisanImg from '../assets/artisan-optimized.jpg';

/**
 * Layout partagé pour les pages d'authentification (Login / Register).
 * Avant, ce bloc (image de fond, overlay, features, badge) était dupliqué
 * à l'identique dans Login.jsx et Register.jsx — toute correction devait
 * être faite deux fois. Il est maintenant centralisé ici.
 *
 * @param {string} accentColor - couleur du overlay/logo ('#1a73e8' pour Login, '#00c853' pour Register)
 * @param {string} accentColorDark - variante foncée pour le dégradé
 * @param {string} title
 * @param {string} description
 * @param {string[]} features
 */
const AuthLayout = ({ accentColor, accentColorDark, title, description, features, children }) => {
  return (
    <div className="auth-container" style={styles.container}>
      {/* ===== CÔTÉ GAUCHE (masqué sur mobile, voir index.css) ===== */}
      <motion.div
        className="auth-left"
        style={styles.leftSide}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          style={styles.bgImage}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />
        <div
          style={{
            ...styles.overlay,
            background: `linear-gradient(135deg, ${accentColor}d1 0%, ${accentColorDark}e0 100%)`,
          }}
        />

        <div style={styles.leftContent}>
          <motion.div
            style={styles.logoBox}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span style={{ color: '#fff', fontSize: '36px', fontWeight: '800' }}>Fix</span>
            <span style={{ color: accentColor === '#1a73e8' ? '#00c853' : '#1a73e8', fontSize: '36px', fontWeight: '800' }}>It</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 style={styles.leftTitle}>{title}</h2>
            <p style={styles.leftDesc}>{description}</p>
          </motion.div>

          <div style={styles.features}>
            {features.map((f, i) => (
              <motion.div
                key={f}
                style={styles.featureItem}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {f}
              </motion.div>
            ))}
          </div>

          <motion.div
            style={styles.badge}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            ⭐ 4.9/5 – Noté par 2000+ clients
          </motion.div>
        </div>
      </motion.div>

      {/* ===== CÔTÉ DROIT (le formulaire, passé en children) ===== */}
      <motion.div
        className="auth-right"
        style={styles.rightSide}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh' },
  leftSide: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: '100vh',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${artisanImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
  },
  leftContent: {
    position: 'relative',
    zIndex: 2,
    padding: '50px 50px',
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
    height: '100%',
  },
  logoBox: { display: 'flex', gap: '2px' },
  leftTitle: {
    fontSize: '30px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '10px',
  },
  leftDesc: {
    fontSize: '15px',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: '1.7',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '30px',
    fontSize: '13px',
    fontWeight: '600',
    border: '1px solid rgba(255,255,255,0.3)',
    alignSelf: 'flex-start',
  },
  rightSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8faff',
    padding: '40px',
    overflowY: 'auto',
  },
};

export default AuthLayout;