import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import Pagination from '../components/Pagination';
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
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const PAGE_SIZE = 12;

  useEffect(() => {
    fetchArtisans(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialite, page]);

  const fetchArtisans = async (pageToLoad = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (specialite) params.append('specialite', specialite);
      if (q) params.append('q', q);
      params.append('page', pageToLoad);
      const res = await api.get(`/artisans/?${params.toString()}`);
      setArtisans(res.data.results ?? res.data);
      setCount(res.data.count ?? (res.data.results ?? res.data).length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchArtisans(1);
  };

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const contacterArtisan = () => {
    // Contacter un artisan passe par la publication d'une demande (pas de messagerie directe pour l'instant)
    if (!user) { navigate('/register'); return; }
    navigate('/nouvelle-demande', { state: { type_service: specialite || undefined } });
  };

  return (
    <div style={styles.page}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');`}</style>
      <Navbar />

      <div style={styles.hero}>
        <p style={styles.eyebrow}>FIXIT · ANNUAIRE</p>
        <h1 style={styles.heroTitle}>Trouver un artisan</h1>
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
              onClick={() => { setSpecialite(s.id); setPage(1); }}
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
          <p style={{ textAlign: 'center', color: '#888', gridColumn: '1 / -1' }}>Chargement…</p>
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
                whileHover={{ y: -4, boxShadow: '0 14px 32px rgba(20,30,60,0.12)' }}
              >
                <Avatar photo={a.photo} name={a.username} size={64} fontSize={26}
                  style={{ display: 'inline-flex', marginBottom: '14px' }} />
                <h3 style={styles.cardName}>{a.username}</h3>
                <p style={styles.cardSpecialite}>{spec ? `${spec.icon} ${spec.label}` : '🔧 Métier non précisé'}</p>
                {a.adresse && <p style={styles.cardAdresse}>📍 {a.adresse}</p>}
                <div style={styles.cardPerforation} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '14px 0' }}>
                  <StarRating value={Math.round(a.note_moyenne)} readOnly />
                  <span style={{ fontSize: '13px', color: '#8a90a3' }}>
                    {a.nb_avis > 0 ? `${a.note_moyenne} (${a.nb_avis} avis)` : 'Pas encore d\'avis'}
                  </span>
                </div>
                <motion.button
                  onClick={contacterArtisan}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={styles.contactBtn}
                >
                  Publier une demande
                </motion.button>
              </motion.div>
            );
          })
        )}
      </div>

      {!loading && artisans.length > 0 && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </div>
  );
};

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f4f6fb' },
  hero: {
    padding: '54px 20px 34px', textAlign: 'center',
    background: 'linear-gradient(135deg, #1a73e8 0%, #00c853 100%)',
  },
  eyebrow: {
    margin: '0 0 6px', fontFamily: FONT_DISPLAY, fontSize: '11px', fontWeight: 600,
    letterSpacing: '1.6px', color: 'rgba(255,255,255,0.8)',
  },
  heroTitle: { color: '#fff', fontFamily: FONT_DISPLAY, fontSize: '32px', fontWeight: '700', margin: '0 0 10px' },
  heroDesc: { color: 'rgba(255,255,255,0.9)', fontSize: '15px', margin: '0 0 30px' },
  searchBar: {
    display: 'flex', maxWidth: '500px', margin: '0 auto 20px',
    backgroundColor: '#fff', borderRadius: '14px', overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(20,30,60,0.18)',
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
    maxWidth: '1100px', margin: '0 auto', padding: '44px 20px',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: '18px', padding: '26px 24px',
    textAlign: 'center', boxShadow: '0 4px 24px rgba(20,30,60,0.08)',
  },
  cardAvatar: {
    width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 14px',
    background: 'linear-gradient(135deg, #1a73e8, #00c853)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '26px', fontWeight: '700', fontFamily: FONT_DISPLAY,
  },
  cardName: { fontFamily: FONT_DISPLAY, fontSize: '17px', fontWeight: '700', margin: '0 0 4px', color: '#1a1a2e' },
  cardSpecialite: { fontSize: '13px', color: '#1a73e8', fontWeight: '600', margin: '0 0 4px' },
  cardAdresse: { fontSize: '13px', color: '#8a90a3', margin: 0 },
  cardPerforation: {
    height: '1px', margin: '16px 0 0',
    backgroundImage: 'repeating-linear-gradient(to right, #e2e5ee 0, #e2e5ee 4px, transparent 4px, transparent 9px)',
  },
  contactBtn: {
    width: '100%', border: 'none', backgroundColor: '#1a73e8', color: '#fff',
    padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
};

export default ArtisansListe;