import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import artisanImg from '../assets/artisan.png';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  try {
    await login(formData.username, formData.password); // ← remplace l'axios.post
    navigate('/dashboard');
  } catch (err) {
    setError('Identifiants incorrects. Réessayez !');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>

      {/* ===== CÔTÉ GAUCHE ===== */}
      <motion.div
        style={styles.leftSide}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        {/* Image de fond animée */}
        <motion.div
          style={styles.bgImage}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        />

        {/* Overlay dégradé */}
        <div style={styles.overlay} />

        {/* Contenu en haut à gauche */}
        <div style={styles.leftContent}>

          {/* Logo */}
          <motion.div
            style={styles.logoBox}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span style={{ color: '#fff', fontSize: '36px', fontWeight: '800' }}>Fix</span>
            <span style={{ color: '#00c853', fontSize: '36px', fontWeight: '800' }}>It</span>
          </motion.div>

          {/* Texte principal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 style={styles.leftTitle}>Bienvenue sur FixIt !</h2>
            <p style={styles.leftDesc}>
              Trouvez le meilleur artisan près de chez vous en quelques clics.
            </p>
          </motion.div>

          {/* Features */}
          <div style={styles.features}>
            {[
              '✅ Artisans vérifiés',
              '⚡ Réponse rapide',
              '💰 Meilleur prix',
              '🛡️ Garantie qualité',
            ].map((f, i) => (
              <motion.div
                key={f}
                style={styles.featureItem}
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
              >
                {f}
              </motion.div>
            ))}
          </div>

          {/* Badge flottant */}
          <motion.div
            style={styles.badge}
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            ⭐ 4.9/5 – Noté par 2000+ clients
          </motion.div>

        </div>
      </motion.div>

      {/* ===== CÔTÉ DROIT ===== */}
      <motion.div
        style={styles.rightSide}
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          style={styles.formBox}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2 style={styles.formTitle}>Se connecter</h2>
          <p style={styles.formSubtitle}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={styles.formLink}>S'inscrire</Link>
          </p>

          {error && (
            <motion.div
              style={styles.errorBox}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ❌ {error}
            </motion.div>
          )}

          <div style={styles.form}>
            {[
              { label: "Nom d'utilisateur", name: 'username', type: 'text', placeholder: 'Entrez votre nom' },
              { label: 'Mot de passe', name: 'password', type: 'password', placeholder: 'Entrez votre mot de passe' },
            ].map((field, i) => (
              <motion.div
                key={field.name}
                style={styles.inputGroup}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <label style={styles.label}>{field.label}</label>
                <motion.input
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  value={formData[field.name]}
                  onChange={handleChange}
                  style={styles.input}
                  whileFocus={{ borderColor: '#1a73e8', scale: 1.01 }}
                />
              </motion.div>
            ))}

            <motion.button
              onClick={handleSubmit}
              style={loading ? styles.btnDisabled : styles.btn}
              disabled={loading}
              whileHover={!loading ? { scale: 1.03, backgroundColor: '#1557b0' } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
            >
              {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
            </motion.button>
          </div>

          <Link to="/" style={styles.backLink}>← Retour à l'accueil</Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh' },

  // Côté gauche
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
    background: 'linear-gradient(135deg, rgba(26,115,232,0.82) 0%, rgba(13,71,161,0.88) 100%)',
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
    color: 'rgba(255,255,255,0.85)',
    lineHeight: '1.7',
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  featureItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(255,255,255,0.2)',
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

  // Côté droit
  rightSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8faff',
    padding: '40px',
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '50px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  },
  formTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', marginBottom: '8px' },
  formSubtitle: { fontSize: '14px', color: '#888', marginBottom: '30px' },
  formLink: { color: '#1a73e8', fontWeight: '600', textDecoration: 'none' },
  errorBox: {
    backgroundColor: '#ffe8e8',
    color: '#d32f2f',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333' },
  input: {
    padding: '14px 16px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    fontSize: '15px',
    outline: 'none',
  },
  btn: {
    padding: '15px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '10px',
  },
  btnDisabled: {
    padding: '15px',
    backgroundColor: '#90bdf5',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'not-allowed',
    marginTop: '10px',
  },
  backLink: {
    display: 'block',
    textAlign: 'center',
    marginTop: '20px',
    color: '#888',
    fontSize: '14px',
    textDecoration: 'none',
  },
};

export default Login;