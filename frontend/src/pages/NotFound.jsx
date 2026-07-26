import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => (
  <div style={styles.page}>
    <motion.div
      style={styles.box}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={styles.logo}>
        <span style={{ color: '#1a73e8', fontWeight: '800', fontSize: '26px' }}>Fix</span>
        <span style={{ color: '#00c853', fontWeight: '800', fontSize: '26px' }}>It</span>
      </div>
      <motion.div
        style={styles.code}
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
      >
        404
      </motion.div>
      <h1 style={styles.title}>Page introuvable</h1>
      <p style={styles.desc}>
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link to="/" style={styles.btn}>← Retour à l'accueil</Link>
    </motion.div>
  </div>
);

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f8faff', padding: '20px',
  },
  box: {
    backgroundColor: '#fff', borderRadius: '24px', padding: '60px 50px',
    textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.08)', maxWidth: '440px',
  },
  logo: { display: 'flex', justifyContent: 'center', gap: '2px', marginBottom: '20px' },
  code: {
    fontSize: '72px', fontWeight: '800', color: '#1a73e8',
    lineHeight: 1, marginBottom: '10px',
  },
  title: { fontSize: '22px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 10px' },
  desc: { color: '#888', fontSize: '14px', marginBottom: '30px', lineHeight: '1.6' },
  btn: {
    display: 'inline-block', padding: '14px 28px', backgroundColor: '#1a73e8',
    color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
    textDecoration: 'none',
  },
};

export default NotFound;