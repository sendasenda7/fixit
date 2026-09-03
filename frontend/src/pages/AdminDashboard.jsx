import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { SkeletonRowList } from '../components/Skeleton';

const LABELS_SERVICE = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  peinture: 'Peinture',
  climatisation: 'Climatisation',
  menuiserie: 'Menuiserie',
  reparation: 'Réparation',
  autre: 'Autre',
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
const formatDateHeure = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [verifications, setVerifications] = useState([]);
  const [loadingVerifs, setLoadingVerifs] = useState(true);
  const [verifActionId, setVerifActionId] = useState(null);

  const [signalements, setSignalements] = useState([]);
  const [loadingSignalements, setLoadingSignalements] = useState(true);
  const [signalementActionId, setSignalementActionId] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!user.is_staff) { navigate('/dashboard'); return; }
    fetchStats();
    fetchVerifications();
    fetchSignalements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await api.get('/admin/stats/');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchVerifications = async () => {
    setLoadingVerifs(true);
    try {
      const res = await api.get('/verification/en-attente/');
      setVerifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVerifs(false);
    }
  };

  const fetchSignalements = async () => {
    setLoadingSignalements(true);
    try {
      const res = await api.get('/signalements/?statut=nouveau');
      setSignalements(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSignalements(false);
    }
  };

  const traiterVerification = async (artisanId, action) => {
    setVerifActionId(artisanId);
    try {
      await api.post(`/verification/${artisanId}/${action}/`);
      setVerifications((prev) => prev.filter((v) => v.id !== artisanId));
      setStats((prev) => prev && ({ ...prev, verifications_en_attente: prev.verifications_en_attente - 1 }));
    } catch (err) {
      console.error(err);
      alert("L'action a échoué. Réessaie.");
    } finally {
      setVerifActionId(null);
    }
  };

  const traiterSignalement = async (id, statut) => {
    setSignalementActionId(id);
    try {
      await api.post(`/signalements/${id}/traiter/`, { statut });
      setSignalements((prev) => prev.filter((s) => s.id !== id));
      setStats((prev) => prev && ({ ...prev, signalements_en_attente: prev.signalements_en_attente - 1 }));
    } catch (err) {
      console.error(err);
      alert("L'action a échoué. Réessaie.");
    } finally {
      setSignalementActionId(null);
    }
  };

  if (!user || !user.is_staff) return null;

  const maxService = stats?.demandes_par_service?.length
    ? Math.max(...stats.demandes_par_service.map((d) => d.n))
    : 1;
  const maxInscriptions = stats?.inscriptions_7j?.length
    ? Math.max(1, ...stats.inscriptions_7j.map((d) => d.n))
    : 1;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <h1 style={styles.title}>🛠️ Dashboard admin</h1>
        <p style={styles.subtitle}>Vue d'ensemble de la plateforme FixIt</p>

        {/* Cartes de stats */}
        {loadingStats ? (
          <SkeletonRowList count={2} />
        ) : stats && (
          <div style={styles.statsGrid}>
            <StatCard icon="👥" label="Utilisateurs" value={stats.total_utilisateurs}
              sub={`${stats.total_clients} clients · ${stats.total_artisans} artisans`} />
            <StatCard icon="✅" label="Artisans vérifiés" value={stats.artisans_verifies}
              sub={`${stats.verifications_en_attente} en attente`} accent="#00c853" />
            <StatCard icon="📋" label="Demandes" value={stats.total_demandes}
              sub={`${stats.missions_terminees} missions terminées`} />
            <StatCard icon="💼" label="Offres envoyées" value={stats.total_offres} />
            <StatCard icon="⭐" label="Note moyenne" value={stats.note_moyenne_globale ?? '—'}
              sub={`${stats.total_avis} avis`} accent="#e65100" />
            <StatCard icon="🚩" label="Signalements en attente" value={stats.signalements_en_attente}
              accent={stats.signalements_en_attente > 0 ? '#d32f2f' : undefined} />
          </div>
        )}

        {/* Graphiques simples */}
        {stats && (
          <div style={styles.chartsRow}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Demandes par service</h3>
              <div style={styles.barList}>
                {stats.demandes_par_service.map((d) => (
                  <div key={d.type_service} style={styles.barRow}>
                    <span style={styles.barLabel}>{LABELS_SERVICE[d.type_service] || d.type_service}</span>
                    <div style={styles.barTrack}>
                      <motion.div
                        style={styles.barFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.n / maxService) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span style={styles.barValue}>{d.n}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Inscriptions — 7 derniers jours</h3>
              <div style={styles.miniChart}>
                {stats.inscriptions_7j.map((d) => (
                  <div key={d.date} style={styles.miniChartCol}>
                    <motion.div
                      style={styles.miniChartBar}
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.n / maxInscriptions) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                    <span style={styles.miniChartLabel}>{formatDate(d.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Vérifications en attente */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>✅ Vérifications d'identité en attente</h3>
          {loadingVerifs ? (
            <SkeletonRowList count={2} />
          ) : verifications.length === 0 ? (
            <p style={styles.emptyText}>Aucune vérification en attente.</p>
          ) : (
            verifications.map((v) => (
              <div key={v.id} style={styles.reviewRow}>
                <div>
                  <p style={styles.reviewTitle}>{v.username} <span style={styles.reviewMeta}>({LABELS_SERVICE[v.specialite] || v.specialite || 'métier non précisé'})</span></p>
                  <p style={styles.reviewMeta}>Soumis le {formatDateHeure(v.date_soumission_verification)}</p>
                  {v.document_verification && (
                    <a href={v.document_verification} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      📎 Voir le document
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    disabled={verifActionId === v.id}
                    onClick={() => traiterVerification(v.id, 'approuver')}
                    style={styles.btnApprouver}>
                    ✅ Approuver
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    disabled={verifActionId === v.id}
                    onClick={() => traiterVerification(v.id, 'rejeter')}
                    style={styles.btnRejeter}>
                    ❌ Rejeter
                  </motion.button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Signalements en attente */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🚩 Signalements en attente</h3>
          {loadingSignalements ? (
            <SkeletonRowList count={2} />
          ) : signalements.length === 0 ? (
            <p style={styles.emptyText}>Aucun signalement en attente.</p>
          ) : (
            signalements.map((s) => (
              <div key={s.id} style={styles.reviewRow}>
                <div>
                  <p style={styles.reviewTitle}>
                    {s.utilisateur_signale_nom ? `Profil : ${s.utilisateur_signale_nom}` : `Demande : ${s.demande_signalee_titre}`}
                  </p>
                  <p style={styles.reviewMeta}>
                    Motif : {s.motif} · signalé par {s.auteur_nom} le {formatDateHeure(s.date_creation)}
                  </p>
                  {s.description && <p style={styles.reviewDesc}>"{s.description}"</p>}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    disabled={signalementActionId === s.id}
                    onClick={() => traiterSignalement(s.id, 'traite')}
                    style={styles.btnApprouver}>
                    ✅ Traité
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    disabled={signalementActionId === s.id}
                    onClick={() => traiterSignalement(s.id, 'rejete')}
                    style={styles.btnRejeter}>
                    ❌ Rejeter
                  </motion.button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, accent }) => (
  <motion.div style={styles.statCard} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
    <span style={styles.statIcon}>{icon}</span>
    <p style={{ ...styles.statValue, color: accent || '#1a1a2e' }}>{value}</p>
    <p style={styles.statLabel}>{label}</p>
    {sub && <p style={styles.statSub}>{sub}</p>}
  </motion.div>
);

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f4f6fb' },
  container: { maxWidth: '1100px', margin: '0 auto', padding: '36px 20px 60px' },
  title: { fontFamily: FONT_DISPLAY, fontSize: '26px', fontWeight: '800', margin: 0, color: '#1a1a2e' },
  subtitle: { color: '#8a90a3', fontSize: '14px', margin: '4px 0 28px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  statCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '20px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.06)',
  },
  statIcon: { fontSize: '22px' },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: '28px', fontWeight: '800', margin: '8px 0 2px' },
  statLabel: { fontSize: '13px', fontWeight: '700', color: '#555', margin: 0 },
  statSub: { fontSize: '11px', color: '#a8adba', margin: '4px 0 0' },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '22px', marginBottom: '20px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.06)',
  },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: '15px', fontWeight: '700', margin: '0 0 16px', color: '#1a1a2e' },
  barList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  barLabel: { fontSize: '12px', color: '#555', width: '90px', flexShrink: 0 },
  barTrack: { flex: 1, height: '10px', backgroundColor: '#f0f1f6', borderRadius: '6px', overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#1a73e8', borderRadius: '6px' },
  barValue: { fontSize: '12px', fontWeight: '700', color: '#1a1a2e', width: '20px', textAlign: 'right' },
  miniChart: { display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' },
  miniChartCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  miniChartBar: { width: '100%', minHeight: '3px', backgroundColor: '#00c853', borderRadius: '4px 4px 0 0' },
  miniChartLabel: { fontSize: '10px', color: '#a8adba', marginTop: '6px' },
  emptyText: { fontSize: '13px', color: '#a8adba', fontStyle: 'italic', margin: 0 },
  reviewRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px',
    padding: '14px 0', borderBottom: '1px solid #f0f1f6',
  },
  reviewTitle: { fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' },
  reviewMeta: { fontSize: '12px', color: '#8a90a3', margin: 0, fontWeight: '400' },
  reviewDesc: { fontSize: '12px', color: '#666', margin: '6px 0 0', fontStyle: 'italic' },
  link: { fontSize: '12px', color: '#1a73e8', fontWeight: '600' },
  btnApprouver: {
    border: 'none', backgroundColor: '#e8f9ef', color: '#00854a',
    padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  btnRejeter: {
    border: 'none', backgroundColor: '#fdecea', color: '#d32f2f',
    padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
  },
};

export default AdminDashboard;