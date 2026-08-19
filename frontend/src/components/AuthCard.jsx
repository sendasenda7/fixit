import React from 'react';
import { motion } from 'framer-motion';

/**
 * Carte d'authentification centrée, utilisée par ForgotPassword et ResetPassword.
 * (Différent de AuthLayout, qui gère le split-screen de Login/Register.)
 */
const AuthCard = ({ children }) => (
  <div style={styles.page}>
    <motion.div
      style={styles.box}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={styles.logoBox}>
        <span style={{ color: '#1a1a2e', fontSize: '28px', fontWeight: '800' }}>Fix</span>
        <span style={{ color: '#1a73e8', fontSize: '28px', fontWeight: '800' }}>It</span>
      </div>
      {children}
    </motion.div>
  </div>
);

export const authCardStyles = {
  title: { fontSize: '22px', fontWeight: '800', color: '#1a1a2e', marginBottom: '10px' },
  desc: { fontSize: '14px', color: '#888', lineHeight: 1.6, marginBottom: '24px' },
  errorBox: {
    backgroundColor: '#ffe8e8',
    color: '#d32f2f',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333' },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
    marginBottom: '10px',
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: 'inherit',
  },
  inputError: { border: '2px solid #d32f2f' },
  fieldError: { color: '#d32f2f', fontSize: '12px', margin: '-6px 0 6px' },
  btn: {
    padding: '13px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
  },
  backLink: {
    display: 'block',
    marginTop: '20px',
    color: '#888',
    fontSize: '14px',
    textDecoration: 'none',
  },
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f6fb',
    padding: '20px',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '45px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  logoBox: { marginBottom: '20px' },
};

export default AuthCard;