import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';

const FIELDS = [
  { label: "Nom d'utilisateur *", name: 'username', type: 'text', placeholder: 'ex: ahmed123', autoComplete: 'username' },
  { label: 'Email *', name: 'email', type: 'email', placeholder: 'ex: ahmed@email.com', autoComplete: 'email' },
  { label: 'Téléphone', name: 'telephone', type: 'tel', placeholder: 'ex: 0612345678', autoComplete: 'tel' },
  { label: 'Adresse', name: 'adresse', type: 'text', placeholder: 'ex: Tunis', autoComplete: 'address-line1' },
  { label: 'Mot de passe *', name: 'password', type: 'password', placeholder: 'Minimum 8 caractères', autoComplete: 'new-password', minLength: 8 },
  { label: 'Confirmer le mot de passe *', name: 'password2', type: 'password', placeholder: 'Répétez le mot de passe', autoComplete: 'new-password' },
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    telephone: '',
    adresse: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Feedback en temps réel dès que les deux champs mot de passe sont renseignés,
  // plutôt que d'attendre la soumission du formulaire pour prévenir l'utilisateur.
  const passwordsMismatch =
    formData.password2.length > 0 && formData.password !== formData.password2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (formData.password !== formData.password2) {
      setError('Les mots de passe ne correspondent pas !');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: 'client',
        telephone: formData.telephone,
        adresse: formData.adresse,
      });
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data) {
        const errors = err.response.data;
        const firstError = Object.values(errors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError('Une erreur est survenue. Réessayez !');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      accentColor="#00c853"
      accentColorDark="#009624"
      title="Rejoignez FixIt !"
      description="Créez votre compte gratuitement et accédez à des centaines d'artisans qualifiés près de chez vous."
      features={['🆓 Inscription gratuite', '⚡ Accès immédiat', '🔧 Tous les services', '⭐ Artisans notés']}
    >
      <motion.div
        style={styles.formBox}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 style={styles.formTitle}>Créer un compte</h2>
        <p style={styles.formSubtitle}>
          Déjà un compte ?{' '}
          <Link to="/login" style={styles.formLink}>Se connecter</Link>
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
              transition={{ delay: 0.4 + i * 0.08 }}
            >
              <label htmlFor={`register-${field.name}`} style={styles.label}>{field.label}</label>
              <motion.input
                id={`register-${field.name}`}
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                minLength={field.minLength}
                value={formData[field.name]}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  ...(field.name === 'password2' && passwordsMismatch ? styles.inputError : {}),
                }}
                whileFocus={{ borderColor: '#00c853', scale: 1.01 }}
                aria-invalid={field.name === 'password2' && passwordsMismatch ? 'true' : undefined}
              />
              {field.name === 'password2' && passwordsMismatch && (
                <span style={styles.fieldError}>Les mots de passe ne correspondent pas.</span>
              )}
            </motion.div>
          ))}

          <motion.div
            style={styles.infoBox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            ℹ️ Vous commencez en tant que <strong>Client</strong>.
            Vous pourrez activer le mode Artisan depuis votre profil.
          </motion.div>

          <motion.button
            type="submit"
            style={loading ? styles.btnDisabled : styles.btn}
            disabled={loading}
            whileHover={!loading ? { scale: 1.03, backgroundColor: '#009624' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
          >
            {loading ? '⏳ Création...' : '🚀 Créer mon compte'}
          </motion.button>
        </form>

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
    maxWidth: '480px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  },
  formTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', marginBottom: '8px' },
  formSubtitle: { fontSize: '14px', color: '#888', marginBottom: '25px' },
  formLink: { color: '#00c853', fontWeight: '600', textDecoration: 'none' },
  errorBox: {
    backgroundColor: '#ffe8e8',
    color: '#d32f2f',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333' },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    fontSize: '14px',
    outline: 'none',
  },
  inputError: {
    border: '2px solid #d32f2f',
  },
  fieldError: {
    color: '#d32f2f',
    fontSize: '12px',
  },
  infoBox: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    lineHeight: '1.5',
  },
  btn: {
    padding: '15px',
    backgroundColor: '#00c853',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '5px',
  },
  btnDisabled: {
    padding: '15px',
    backgroundColor: '#a5d6a7',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'not-allowed',
    marginTop: '5px',
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

export default Register;