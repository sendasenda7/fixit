import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();

  const [motDePasse, setMotDePasse] = useState('');
  const [motDePasse2, setMotDePasse2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [succes, setSucces] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

        {succes ? (
          <>
            <div style={{ fontSize: '40px', textAlign: 'center', margin: '10px 0' }}>✅</div>
            <h2 style={styles.title}>Mot de passe mis à jour !</h2>
            <p style={styles.desc}>Redirection vers la connexion...</p>
          </>
        ) : (
          <>
            <h2 style={styles.title}>Nouveau mot de passe</h2>
            <p style={styles.desc}>Choisis un nouveau mot de passe pour ton compte.</p>

            {error && <div style={styles.errorBox}>❌ {error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Nouveau mot de passe</label>
              <input
                type="password"
                required
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                placeholder="Minimum 8 caractères"
                style={styles.input}
              />
              <label style={styles.label}>Confirmer le mot de passe</label>
              <input
                type="password"
                required
                value={motDePasse2}
                onChange={(e) => setMotDePasse2(e.target.value)}
                placeholder="Répétez le mot de passe"
                style={styles.input}
              />
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
      </motion.div>
    </div>
  );
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
  },
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

export default ResetPassword;
