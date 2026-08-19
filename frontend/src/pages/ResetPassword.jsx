import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import AuthCard, { authCardStyles as styles } from '../components/AuthCard';

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasse2, setMotDePasse2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [succes, setSucces] = useState(false);

  const passwordsMismatch = motDePasse2.length > 0 && motDePasse !== motDePasse2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (motDePasse.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (motDePasse !== motDePasse2) {
      setError('Les mots de passe ne correspondent pas !');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password-reset/confirm/', {
        uidb64,
        token,
        nouveau_mot_de_passe: motDePasse,
      });
      setSucces(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const data = err.response?.data;
      if (data?.error) {
        setError(Array.isArray(data.error) ? data.error[0] : data.error);
      } else {
        setError('Une erreur est survenue. Réessaie.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      {succes ? (
        <>
          <div style={{ fontSize: '40px', textAlign: 'center', margin: '10px 0' }} aria-hidden="true">✅</div>
          <h2 style={styles.title}>Mot de passe mis à jour !</h2>
          <p style={styles.desc}>Redirection vers la connexion...</p>
        </>
      ) : (
        <>
          <h2 style={styles.title}>Nouveau mot de passe</h2>
          <p style={styles.desc}>Choisis un nouveau mot de passe pour ton compte.</p>

          {error && <div role="alert" aria-live="polite" style={styles.errorBox}>❌ {error}</div>}

          <form onSubmit={handleSubmit} style={styles.form} noValidate>
            <label htmlFor="reset-password" style={styles.label}>Nouveau mot de passe</label>
            <input
              id="reset-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="Minimum 8 caractères"
              style={styles.input}
            />
            <label htmlFor="reset-password2" style={styles.label}>Confirmer le mot de passe</label>
            <input
              id="reset-password2"
              type="password"
              required
              autoComplete="new-password"
              value={motDePasse2}
              onChange={(e) => setMotDePasse2(e.target.value)}
              placeholder="Répétez le mot de passe"
              style={{ ...styles.input, ...(passwordsMismatch ? styles.inputError : {}) }}
              aria-invalid={passwordsMismatch ? 'true' : undefined}
            />
            {passwordsMismatch && (
              <span style={styles.fieldError}>Les mots de passe ne correspondent pas.</span>
            )}
            <motion.button
              type="submit"
              disabled={loading}
              style={{ ...styles.btn, opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? '⏳ Mise à jour...' : 'Réinitialiser le mot de passe'}
            </motion.button>
          </form>

          <Link to="/login" style={styles.backLink}>← Retour à la connexion</Link>
        </>
      )}
    </AuthCard>
  );
};

export default ResetPassword;