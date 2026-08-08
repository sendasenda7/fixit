import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const FIELDS = [
  { label: "Nom d'utilisateur", name: 'username', type: 'text', placeholder: 'Entrez votre nom', autoComplete: 'username' },
  { label: 'Mot de passe', name: 'password', type: 'password', placeholder: 'Entrez votre mot de passe', autoComplete: 'current-password' },
];

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
    if (!formData.username.trim() || !formData.password) {
      setError('Merci de renseigner votre nom d\'utilisateur et votre mot de passe.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(formData.username, formData.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Trop de tentatives. Merci de patienter avant de réessayer.');
      } else {
        setError('Identifiants incorrects. Réessayez !');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      accentColor="#1a73e8"
      accentColorDark="#0d47a1"
      title="Bienvenue sur FixIt !"
      description="Trouvez le meilleur artisan près de chez vous en quelques clics."
      features={['✅ Artisans vérifiés', '⚡ Réponse rapide', '💰 Meilleur prix', '🛡️ Garantie qualité']}
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
            role="alert"
            aria-live="polite"
            style={styles.errorBox}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ❌ {error}
          </motion.div>
        )}

        <form style={styles.form} onSubmit={handleSubmit} noValidate>
          {FIELDS.map((field, i) => (
            <motion.div
              key={field.name}
              style={styles.inputGroup}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <label htmlFor={`login-${field.name}`} style={styles.label}>{field.label}</label>
              <motion.input
                id={`login-${field.name}`}
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                value={formData[field.name]}
                onChange={handleChange}
                style={styles.input}
                whileFocus={{ borderColor: '#1a73e8', scale: 1.01 }}
              />
            </motion.div>
          ))}

          <motion.button
            type="submit"
            style={loading ? styles.btnDisabled : styles.btn}
            disabled={loading}
            whileHover={!loading ? { scale: 1.03, backgroundColor: '#1557b0' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
          >
            {loading ? '⏳ Connexion...' : '🔐 Se connecter'}
          </motion.button>
        </form>

        <Link to="/forgot-password" style={styles.forgotLink}>Mot de passe oublié ?</Link>
        <Link to="/" style={styles.backLink}>← Retour à l'accueil</Link>
      </motion.div>
    </AuthLayout>
  );
};

const styles = {
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
  forgotLink: {
    display: 'block',
    textAlign: 'center',
    marginTop: '18px',
    color: '#1a73e8',
    fontSize: '14px',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

export default Login;