import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';

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

        {envoye ? (
          <>
            <div style={{ fontSize: '40px', textAlign: 'center', margin: '10px 0' }}>📬</div>
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

            {error && <div style={styles.errorBox}>❌ {error}</div>}

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                required
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

export default ForgotPassword;
