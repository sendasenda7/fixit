import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import AuthCard, { authCardStyles as styles } from '../components/AuthCard';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/password-reset/request/', { email });
      setEnvoye(true);
    } catch {
      setError('Une erreur est survenue. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      {envoye ? (
        <>
          <div style={{ fontSize: '40px', textAlign: 'center', margin: '10px 0' }} aria-hidden="true">📬</div>
          <h2 style={styles.title}>Vérifie tes emails</h2>
          <p style={styles.desc}>
            Si un compte existe avec l'adresse <strong>{email}</strong>, un lien de réinitialisation
            vient d'être envoyé. Pense à vérifier tes spams.
          </p>
          <Link to="/login" style={styles.backLink}>← Retour à la connexion</Link>
        </>
      ) : (
        <>
          <h2 style={styles.title}>Mot de passe oublié</h2>
          <p style={styles.desc}>
            Indique l'adresse email de ton compte, on t'envoie un lien pour choisir un nouveau mot de passe.
          </p>

          {error && <div role="alert" aria-live="polite" style={styles.errorBox}>❌ {error}</div>}

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <label htmlFor="forgot-email" style={styles.label}>Email</label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: ahmed@email.com"
              style={styles.input}
            />
            <motion.button
              type="submit"
              disabled={loading}
              style={{ ...styles.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? '⏳ Envoi...' : 'Envoyer le lien'}
            </motion.button>
          </form>

          <Link to="/login" style={styles.backLink}>← Retour à la connexion</Link>
        </>
      )}
    </AuthCard>
  );
};

export default ForgotPassword;