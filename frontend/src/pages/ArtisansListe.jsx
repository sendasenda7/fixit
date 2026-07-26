import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import Navbar from '../components/Navbar';

const specialites = [
  { id: '', icon: '🌐', label: 'Tous' },
  { id: 'plomberie', icon: '🚿', label: 'Plomberie' },
  { id: 'electricite', icon: '⚡', label: 'Électricité' },
  { id: 'peinture', icon: '🎨', label: 'Peinture' },
  { id: 'reparation', icon: '🔨', label: 'Réparation' },
  { id: 'climatisation', icon: '❄️', label: 'Climatisation' },
  { id: 'menuiserie', icon: '🪚', label: 'Menuiserie' },
  { id: 'autre', icon: '🔧', label: 'Autre' },
];

const ArtisansListe = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [artisans, setArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialite, setSpecialite] = useState(location.state?.type_service || '');
  const [q, setQ] = useState('');

  useEffect(() => {
    fetchArtisans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialite]);

  const fetchArtisans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (specialite) params.append('specialite', specialite);
      if (q) params.append('q', q);
      const res = await api.get(`/artisans/?${params.toString()}`);
      setArtisans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchArtisans();
  };

  const contacterArtisan = () => {
    // Contacter un artisan passe par la publication d'une demande (pas de messagerie directe pour l'instant)
    if (!user) { navigate('/register'); return; }
    navigate('/nouvelle-demande', { state: { type_service: specialite || undefined } });
  };

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>🔍 Trouver un artisan</h1>
        <p style={styles.heroDesc}>Parcourez nos artisans qualifiés et consultez leurs avis</p>

        <form onSubmit={handleSearchSubmit} style={styles.searchBar}>
          <input
            type="text"
            placeholder="Rechercher par nom ou ville..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={styles.searchInput}
          />
          <motion.button type="submit" style={styles.searchBtn} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            🔍 Rechercher
          </motion.button>
        </form>

        <div style={styles.filtres}>
          {specialites.map(s => (
            <motion.button
              key={s.id}
              onClick={() => setSpecialite(s.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                ...styles.filtreBtn,
                backgroundColor: specialite === s.id ? '#1a73e8' : '#f0f0f0',
                color: specialite === s.id ? '#fff' : '#333',
              }}
            >
              {s.icon} {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={styles.grid}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', gridColumn: '1 / -1' }}>⏳ Chargement...</p>
        ) : artisans.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 0' }}>
            <p style={{ fontSize: '40px', margin: 0 }}>🔍</p>
            <p style={{ color: '#888' }}>Aucun artisan ne correspond à votre recherche</p>
          </div>
        ) : (
          artisans.map((a, i) => {
            const spec = specialites.find(s => s.id === a.specialite);
            return (
              <motion.div
                key={a.id}
                style={styles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }}
              >
                <div style={styles.cardAvatar}>{a.username.charAt(0).toUpperCase()}</div>
                <h3 style={styles.cardName}>{a.username}</h3>
                <p style={styles.cardSpecialite}>{spec ? `${spec.icon} ${spec.label}` : '🔧 Métier non précisé'}</p>
                {a.adresse && <p style={styles.cardAdresse}>📍 {a.adresse}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
                  <StarRating value={Math.round(a.note_moyenne)} readOnly />
                  <span style={{ fontSize: '13px', color: '#888' }}>
                    {a.nb_avis > 0 ? `${a.note_moyenne} (${a.nb_avis} avis)` : 'Pas encore d\'avis'}
                  </span>
                </div>
                <motion.button
                  onClick={contacterArtisan}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={styles.contactBtn}
                >
                  📩 Publier une demande
                </motion.button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f8faff' },
  hero: {
    padding: '50px 20px 30px', textAlign: 'center',
    background: 'linear-gradient(135deg, #1a73e8 0%, #00c853 100%)',
  },
  heroTitle: { color: '#fff', fontSize: '32px', fontWeight: '800', margin: '0 0 10px' },
  heroDesc: { color: 'rgba(255,255,255,0.9)', fontSize: '15px', margin: '0 0 30px' },
  searchBar: {
    display: 'flex', maxWidth: '500px', margin: '0 auto 20px',
    backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
  searchInput: { flex: 1, border: 'none', padding: '16px 20px', fontSize: '14px', outline: 'none' },
  searchBtn: {
    border: 'none', backgroundColor: '#1a1a2e', color: '#fff',
    padding: '0 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer',
  },
  filtres: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', maxWidth: '700px', margin: '0 auto' },
  filtreBtn: {
    border: 'none', padding: '10px 18px', borderRadius: '20px',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  grid: {
    maxWidth: '1100px', margin: '0 auto', padding: '40px 20px',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: '18px', padding: '24px',
    textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  cardAvatar: {
    width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 12px',
    background: 'linear-gradient(135deg, #1a73e8, #00c853)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '26px', fontWeight: '800',
  },
  cardName: { fontSize: '17px', fontWeight: '800', margin: '0 0 4px', color: '#1a1a2e' },
  cardSpecialite: { fontSize: '13px', color: '#1a73e8', fontWeight: '600', margin: '0 0 4px' },
  cardAdresse: { fontSize: '13px', color: '#888', margin: 0 },
  contactBtn: {
    width: '100%', border: 'none', backgroundColor: '#1a73e8', color: '#fff',
    padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
};

export default ArtisansListe;