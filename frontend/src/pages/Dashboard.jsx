import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import Avatar from '../components/Avatar';
import NotificationBell from '../components/NotificationBell';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// ===== ICÔNE PAR TYPE DE SERVICE (une seule source, réutilisée partout) =====
const SERVICE_ICONS = {
  plomberie: '🚿',
  electricite: '⚡',
  peinture: '🎨',
  climatisation: '❄️',
  menuiserie: '🪚',
};
const getServiceIcon = (type) => SERVICE_ICONS[type] || '🔨';

// ===== COMPOSANT OFFRES PAR DEMANDE =====
const OffresDemande = ({ demande, theme, index, onEvaluer }) => {
  const navigate = useNavigate();
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/offres/demande/${demande.id}/`)
      .then(res => setOffres(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [demande.id]);

  const accepterOffre = async (offreId) => {
    await api.post(`/offres/${offreId}/accepter/`);
    const res = await api.get(`/offres/demande/${demande.id}/`);
    setOffres(res.data);
  };

  const contacterArtisan = async (artisanId) => {
    const res = await api.post('/conversations/', { demande: demande.id, artisan: artisanId });
    navigate(`/messages?conversation=${res.data.id}`);
  };

  return (
    <motion.div style={{ ...styles.tableCard, backgroundColor: theme.card, marginBottom: '20px' }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <h3 style={{ ...styles.chartTitle, color: theme.text, marginBottom: '15px' }}>
        {getServiceIcon(demande.type_service)} {demande.titre}
        <span style={{ ...styles.statutBadge, backgroundColor: demande.statut === 'en_cours' ? '#fff3e0' : '#e8f5e9', color: demande.statut === 'en_cours' ? '#e65100' : '#2e7d32', marginLeft: '10px' }}>
          {demande.statut === 'en_cours' ? '🔄 En cours' : '🟢 Ouverte'}
        </span>
      </h3>
      {loading ? <p style={{ color: theme.subtext }}>Chargement des offres...</p>
       : offres.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: theme.subtext }}>
          ⏳ Aucune offre reçue pour l'instant
        </div>
       ) : offres.map(o => (
        <motion.div key={o.id} style={{ ...styles.demandeRow, alignItems: 'flex-start' }}
          whileHover={{ backgroundColor: '#f8faff' }}>
          <div style={styles.demandeRowLeft}>
            <div style={{ ...styles.demandeRowIcon, backgroundColor: '#fff3e0', fontSize: '20px' }}>👷</div>
            <div>
              <p style={{ ...styles.demandeRowTitle, color: theme.text }}>{o.artisan_nom}</p>
              <p style={styles.demandeRowSub}>{o.message}</p>
              <p style={{ ...styles.demandeRowSub, color: '#1a73e8', fontWeight: '700' }}>
                💰 {o.prix_propose} TND
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <motion.button style={styles.contactBtn} whileHover={{ scale: 1.05 }}
              onClick={() => contacterArtisan(o.artisan)}>
              💬 Contacter
            </motion.button>
            {o.est_acceptee ? (
              <>
                <span style={{ ...styles.statutBadge, backgroundColor: '#e8f5e9', color: '#2e7d32' }}>
                  ✅ Acceptée
                </span>
                {demande.statut === 'en_cours' && (
                  <motion.button style={styles.evalBtn} whileHover={{ scale: 1.05 }}
                    onClick={() => onEvaluer(o)}>
                    ⭐ Évaluer
                  </motion.button>
                )}
              </>
            ) : (
              <motion.button style={styles.acceptBtn} whileHover={{ scale: 1.05 }}
                onClick={() => accepterOffre(o.id)}>
                ✅ Accepter
              </motion.button>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

// ===== DASHBOARD PRINCIPAL =====
// ===== SPÉCIALITÉS (mêmes options que côté artisan) =====
const specialitesDisponibles = [
  { id: 'plomberie', icon: '🚿', label: 'Plomberie' },
  { id: 'electricite', icon: '⚡', label: 'Électricité' },
  { id: 'peinture', icon: '🎨', label: 'Peinture' },
  { id: 'reparation', icon: '🔨', label: 'Réparation' },
  { id: 'climatisation', icon: '❄️', label: 'Climatisation' },
  { id: 'menuiserie', icon: '🪚', label: 'Menuiserie' },
  { id: 'autre', icon: '🔧', label: 'Autre' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // sidebar mobile (fermée par défaut)

  // Évaluations
  const [evalModal, setEvalModal] = useState(null);
  const [evalForm, setEvalForm] = useState({ note: 0, commentaire: '' });
  const [evalSuccess, setEvalSuccess] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);

  // Édition du profil
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ email: '', telephone: '', adresse: '' });
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Changement de mot de passe
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Suppression de compte
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Notifications (préférences locales)

  // Bascule mode artisan
  const [artisanModeLoading, setArtisanModeLoading] = useState(false);
  const [artisanModeError, setArtisanModeError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchDemandes();
  }, [user]);

  const fetchDemandes = async () => {
    try {
      const res = await api.get('/demandes/mes/');
      setDemandes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const envoyerEvaluation = async () => {
    if (evalForm.note === 0) return;
    setEvalLoading(true);
    try {
      await api.post(`/evaluations/evaluer/${evalModal.id}/`, evalForm);
      setEvalSuccess(true);
      setEvalModal(null);
      setEvalForm({ note: 0, commentaire: '' });
      fetchDemandes();
      setTimeout(() => setEvalSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleLogout = () => logout();

  const [confirmArtisanModalOpen, setConfirmArtisanModalOpen] = useState(false);
  const [specialiteChoisie, setSpecialiteChoisie] = useState('');
  const [deleteDemandeModal, setDeleteDemandeModal] = useState(null);
  const [deleteDemandeLoading, setDeleteDemandeLoading] = useState(false);

  const confirmerSuppressionDemande = async () => {
    setDeleteDemandeLoading(true);
    try {
      await api.delete(`/demandes/${deleteDemandeModal.id}/`);
      setDeleteDemandeModal(null);
      fetchDemandes();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDemandeLoading(false);
    }
  };

  const executerBasculeModeArtisan = async () => {
    const newRole = user.role === 'artisan' ? 'client' : 'artisan';
    if (newRole === 'artisan' && !specialiteChoisie) {
      setArtisanModeError('Choisis ta spécialité pour continuer');
      return;
    }
    setConfirmArtisanModalOpen(false);
    setArtisanModeError('');
    setArtisanModeLoading(true);
    try {
      const payload = newRole === 'artisan'
        ? { role: newRole, specialite: specialiteChoisie }
        : { role: newRole };
      const res = await api.put('/profile/', payload);
      updateUser(res.data);
      navigate('/dashboard'); // App.js redirige automatiquement vers le bon Dashboard selon le rôle
    } catch (err) {
      setArtisanModeError('Impossible de changer de mode. Réessayez !');
    } finally {
      setArtisanModeLoading(false);
    }
  };

  const ouvrirEditionProfil = () => {
    setProfileForm({
      email: user.email || '',
      telephone: user.telephone || '',
      adresse: user.adresse || '',
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setProfileError('');
    setEditProfileOpen(true);
  };

  // Libère l'URL blob de la preview précédente à chaque changement de photo
  // (et au démontage) — évite l'accumulation mémoire signalée en revue.
  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  const choisirPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const enregistrerProfil = async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      let res;
      if (photoFile) {
        const formData = new FormData();
        Object.entries(profileForm).forEach(([key, value]) => formData.append(key, value));
        formData.append('photo', photoFile);
        res = await api.put('/profile/', formData);
      } else {
        res = await api.put('/profile/', profileForm);
      }
      updateUser(res.data);
      setEditProfileOpen(false);
    } catch (err) {
      const data = err.response?.data;
      setProfileError(data ? Object.values(data)[0] : 'Une erreur est survenue. Réessayez !');
    } finally {
      setProfileLoading(false);
    }
  };

  const changerMotDePasse = async () => {
    setPasswordError('');
    if (passwordForm.nouveau_mot_de_passe !== passwordForm.confirmation) {
      setPasswordError('Les nouveaux mots de passe ne correspondent pas !');
      return;
    }
    setPasswordLoading(true);
    try {
      await api.post('/profile/password/', {
        ancien_mot_de_passe: passwordForm.ancien_mot_de_passe,
        nouveau_mot_de_passe: passwordForm.nouveau_mot_de_passe,
      });
      setPasswordModalOpen(false);
      setPasswordForm({ ancien_mot_de_passe: '', nouveau_mot_de_passe: '', confirmation: '' });
    } catch (err) {
      const data = err.response?.data?.error;
      setPasswordError(Array.isArray(data) ? data[0] : (data || 'Une erreur est survenue. Réessayez !'));
    } finally {
      setPasswordLoading(false);
    }
  };

  const supprimerCompte = async () => {
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await api.post('/profile/delete/', { mot_de_passe: deletePassword });
      logout();
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'Une erreur est survenue. Réessayez !');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Regroupe les demandes du client par mois réel de création (6 derniers mois)
  const demandesParMois = (() => {
    const now = new Date();
    const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ year: d.getFullYear(), month: d.getMonth(), mois: moisLabels[d.getMonth()], demandes: 0 });
    }
    demandes.forEach(d => {
      const created = new Date(d.date_creation);
      const bucket = buckets.find(b => b.year === created.getFullYear() && b.month === created.getMonth());
      if (bucket) bucket.demandes += 1;
    });
    return buckets;
  })();

  const demandesParService = [
    { name: 'Plomberie', value: demandes.filter(d => d.type_service === 'plomberie').length },
    { name: 'Électricité', value: demandes.filter(d => d.type_service === 'electricite').length },
    { name: 'Peinture', value: demandes.filter(d => d.type_service === 'peinture').length },
    { name: 'Réparation', value: demandes.filter(d => d.type_service === 'reparation').length },
    { name: 'Autre', value: demandes.filter(d => !['plomberie', 'electricite', 'peinture', 'reparation'].includes(d.type_service)).length },
  ].filter(d => d.value > 0);

  const budgetParService = ['plomberie', 'electricite', 'peinture', 'reparation', 'autre'].map(type => ({
    service: type.charAt(0).toUpperCase() + type.slice(1),
    budget: (() => {
      const filtered = demandes.filter(d => d.type_service === type);
      if (!filtered.length) return 0;
      return Math.round(filtered.reduce((sum, d) => sum + parseFloat(d.budget), 0) / filtered.length);
    })()
  })).filter(d => d.budget > 0);

  const COLORS = ['#1a73e8', '#00c853', '#ff9800', '#e91e63', '#9c27b0'];

  const theme = {
    bg: darkMode ? '#0f0f1a' : '#f8faff',
    sidebar: darkMode ? '#1a1a2e' : '#1a1a2e',
    card: darkMode ? '#1e1e30' : '#ffffff',
    text: darkMode ? '#ffffff' : '#1a1a2e',
    subtext: darkMode ? '#aaaaaa' : '#888888',
    border: darkMode ? '#2a2a3e' : '#f0f0f0',
  };

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'demandes', icon: '📋', label: 'Demandes' },
    { id: 'offres', icon: '💼', label: 'Offres' },
    { id: 'messages', icon: '💬', label: 'Messages' },
    { id: 'profil', icon: '👤', label: 'Profil' },
    { id: 'parametres', icon: '⚙️', label: 'Paramètres' },
  ];

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'ouverte': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'en_cours': return { bg: '#fff3e0', color: '#e65100' };
      case 'terminee': return { bg: '#e3f2fd', color: '#1565c0' };
      default: return { bg: '#f5f5f5', color: '#666' };
    }
  };

  if (!user) return null;

  // ===== SECTIONS =====

  const renderDashboard = () => (
    <div>
      <div className="dashboard-stats-grid" style={styles.statsGrid}>
        {[
          { icon: '📋', label: 'Total Demandes', value: demandes.length, color: '#1a73e8', bg: '#e8f4fd' },
          { icon: '🟢', label: 'Ouvertes', value: demandes.filter(d => d.statut === 'ouverte').length, color: '#00c853', bg: '#e8f5e9' },
          { icon: '🔄', label: 'En cours', value: demandes.filter(d => d.statut === 'en_cours').length, color: '#ff9800', bg: '#fff3e0' },
          { icon: '✅', label: 'Terminées', value: demandes.filter(d => d.statut === 'terminee').length, color: '#9c27b0', bg: '#f3e5f5' },
        ].map((stat, i) => (
          <motion.div key={stat.label} style={{ ...styles.statCard, backgroundColor: stat.bg }}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }} whileHover={{ y: -5, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
            <div style={styles.statIcon}>{stat.icon}</div>
            <div>
              <motion.p style={{ ...styles.statValue, color: stat.color }}
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 + 0.3, type: 'spring' }}>
                {stat.value}
              </motion.p>
              <p style={styles.statLabel}>{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard-charts-row" style={styles.chartsRow}>
        <motion.div style={{ ...styles.chartCard, backgroundColor: theme.card }}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ ...styles.chartTitle, color: theme.text }}>📈 Demandes par mois</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={demandesParMois}>
              <defs>
                <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1a73e8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="demandes" stroke="#1a73e8" strokeWidth={3} fill="url(#colorDemandes)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div style={{ ...styles.chartCard, backgroundColor: theme.card }}
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <h3 style={{ ...styles.chartTitle, color: theme.text }}>🍩 Répartition par service</h3>
          {demandesParService.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: theme.subtext }}>
              Pas encore de demandes à répartir
            </div>
          ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={demandesParService} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                {demandesParService.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {budgetParService.length > 0 && (
        <motion.div style={{ ...styles.chartCardFull, backgroundColor: theme.card }}
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 style={{ ...styles.chartTitle, color: theme.text }}>💰 Budget moyen par service (TND)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={budgetParService}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="service" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="budget" radius={[8, 8, 0, 0]}>
                {budgetParService.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <motion.div style={{ ...styles.tableCard, backgroundColor: theme.card }}
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div style={styles.tableHeader}>
          <h3 style={{ ...styles.chartTitle, color: theme.text, margin: 0 }}>📋 Dernières demandes</h3>
          <motion.button style={styles.newBtn} onClick={() => navigate('/nouvelle-demande')}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            ➕ Nouvelle
          </motion.button>
        </div>
        {demandes.length === 0 ? (
          <div style={styles.emptyBox}>
            <p style={{ fontSize: '40px' }}>📭</p>
            <p style={{ color: theme.subtext }}>Aucune demande pour l'instant</p>
            <motion.button style={styles.emptyBtn} onClick={() => navigate('/nouvelle-demande')} whileHover={{ scale: 1.05 }}>
              Publier une demande
            </motion.button>
          </div>
        ) : demandes.slice(0, 5).map((d, i) => {
          const s = getStatutColor(d.statut);
          return (
            <motion.div key={d.id} style={styles.demandeRow}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }} whileHover={{ backgroundColor: '#f8faff', x: 4 }}>
              <div style={styles.demandeRowLeft}>
                <span style={styles.demandeRowIcon}>
                  {getServiceIcon(d.type_service)}
                </span>
                <div>
                  <p style={{ ...styles.demandeRowTitle, color: theme.text }}>{d.titre}</p>
                  <p style={styles.demandeRowSub}>📍 {d.localisation} | 💰 {d.budget} TND</p>
                </div>
              </div>
              <span style={{ ...styles.statutBadge, backgroundColor: s.bg, color: s.color }}>
                {d.statut === 'ouverte' ? '🟢 Ouverte' : d.statut === 'en_cours' ? '🔄 En cours' : '✅ Terminée'}
              </span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );

  const renderDemandes = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={styles.tableHeader}>
        <p style={{ color: theme.subtext, margin: 0 }}>{demandes.length} demande(s)</p>
        <motion.button style={styles.newBtn} onClick={() => navigate('/nouvelle-demande')}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          ➕ Nouvelle demande
        </motion.button>
      </div>
      {loading ? (
        <div style={styles.emptyBox}><p>⏳ Chargement...</p></div>
      ) : demandes.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: '40px' }}>📭</p>
          <p style={{ color: theme.subtext }}>Aucune demande pour l'instant</p>
          <motion.button style={styles.emptyBtn} onClick={() => navigate('/nouvelle-demande')} whileHover={{ scale: 1.05 }}>
            Publier une demande
          </motion.button>
        </div>
      ) : (
        <div style={{ ...styles.tableCard, backgroundColor: theme.card }}>
          {demandes.map((d, i) => {
            const s = getStatutColor(d.statut);
            return (
              <motion.div key={d.id} style={styles.demandeRow}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }} whileHover={{ backgroundColor: '#f8faff', x: 4 }}>
                <div style={styles.demandeRowLeft}>
                  <span style={styles.demandeRowIcon}>
                    {getServiceIcon(d.type_service)}
                  </span>
                  <div>
                    <p style={{ ...styles.demandeRowTitle, color: theme.text }}>{d.titre}</p>
                    <p style={styles.demandeRowSub}>
                      📍 {d.localisation} | 💰 {d.budget} TND | 📅 {new Date(d.date_creation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ ...styles.statutBadge, backgroundColor: s.bg, color: s.color }}>
                    {d.statut === 'ouverte' ? '🟢 Ouverte' : d.statut === 'en_cours' ? '🔄 En cours' : '✅ Terminée'}
                  </span>
                  <motion.button style={styles.deleteBtn} whileHover={{ scale: 1.1 }}
                    onClick={() => setDeleteDemandeModal(d)}>🗑️</motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const renderOffres = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {demandes.filter(d => d.statut === 'ouverte' || d.statut === 'en_cours').length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: '40px' }}>💼</p>
          <p style={{ color: theme.subtext }}>Aucune demande active pour l'instant</p>
        </div>
      ) : (
        demandes.filter(d => d.statut === 'ouverte' || d.statut === 'en_cours').map((d, i) => (
          <OffresDemande key={d.id} demande={d} theme={theme} index={i} onEvaluer={setEvalModal} />
        ))
      )}
    </motion.div>
  );

  const renderProfil = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={styles.profileCover}>
        <Avatar photo={user.photo} name={user.username} size={80} fontSize={36}
          background="rgba(255,255,255,0.3)" style={{ border: '3px solid rgba(255,255,255,0.5)' }} />
        <div style={styles.profileInfo}>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>{user.username}</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0' }}>
            {user.role === 'artisan' ? '🔧 Artisan' : '👤 Client'} • {user.email}
          </p>
        </div>
      </div>
      <div className="dashboard-profile-grid" style={styles.profileGrid}>
        <motion.div style={{ ...styles.profileCard, backgroundColor: theme.card }} whileHover={{ y: -3 }}>
          <h3 style={{ ...styles.profileCardTitle, color: theme.text }}>👤 Informations personnelles</h3>
          {[
            { label: "Nom d'utilisateur", value: user.username, icon: '👤' },
            { label: 'Email', value: user.email || 'Non renseigné', icon: '✉️' },
            { label: 'Téléphone', value: user.telephone || 'Non renseigné', icon: '📞' },
            { label: 'Adresse', value: user.adresse || 'Non renseigné', icon: '📍' },
            { label: 'Rôle', value: user.role === 'artisan' ? '🔧 Artisan' : '👤 Client', icon: '🎭' },
          ].map((item) => (
            <div key={item.label} style={styles.profileRow}>
              <span style={styles.profileRowIcon}>{item.icon}</span>
              <div>
                <p style={styles.profileRowLabel}>{item.label}</p>
                <p style={{ ...styles.profileRowValue, color: theme.text }}>{item.value}</p>
              </div>
            </div>
          ))}
          <motion.button style={styles.editBtn} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={ouvrirEditionProfil}>
            ✏️ Modifier le profil
          </motion.button>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <motion.div style={{ ...styles.profileCard, backgroundColor: theme.card }} whileHover={{ y: -3 }}>
            <h3 style={{ ...styles.profileCardTitle, color: theme.text }}>📊 Mes statistiques</h3>
            {[
              { label: 'Demandes publiées', value: demandes.length, color: '#1a73e8' },
              { label: 'Demandes terminées', value: demandes.filter(d => d.statut === 'terminee').length, color: '#00c853' },
              { label: 'En cours', value: demandes.filter(d => d.statut === 'en_cours').length, color: '#ff9800' },
            ].map((stat) => (
              <div key={stat.label} style={styles.statRow}>
                <span style={styles.statRowLabel}>{stat.label}</span>
                <span style={{ ...styles.statRowValue, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </motion.div>

          <motion.div style={{ ...styles.profileCard, backgroundColor: theme.card, border: '2px solid #1a73e8' }} whileHover={{ y: -3 }}>
            <h3 style={{ ...styles.profileCardTitle, color: theme.text }}>🔧 Mode Artisan</h3>
            <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '10px' }}>
              {user.role === 'artisan'
                ? 'Vous êtes actuellement en mode Artisan.'
                : 'Activez le mode Artisan pour proposer vos services et recevoir des demandes.'}
            </p>
            {artisanModeError && (
              <p style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '10px' }}>❌ {artisanModeError}</p>
            )}
            <motion.button
              style={{ ...styles.artisanBtn, backgroundColor: user.role === 'artisan' ? '#ff5252' : '#1a73e8', opacity: artisanModeLoading ? 0.6 : 1 }}
              whileHover={!artisanModeLoading ? { scale: 1.03 } : {}} whileTap={!artisanModeLoading ? { scale: 0.97 } : {}}
              disabled={artisanModeLoading}
              onClick={() => { setSpecialiteChoisie(''); setArtisanModeError(''); setConfirmArtisanModalOpen(true); }}>
              {artisanModeLoading ? '⏳ Mise à jour...' : user.role === 'artisan' ? '🔴 Désactiver mode Artisan' : '🔧 Activer mode Artisan'}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );

  const renderParametres = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={styles.settingsGrid}>
        {[
          {
            title: '🎨 Apparence',
            items: [{
              label: 'Mode sombre', desc: 'Activer le thème sombre',
              action: (
                <motion.div style={{ ...styles.toggle, backgroundColor: darkMode ? '#1a73e8' : '#ccc' }}
                  onClick={() => setDarkMode(!darkMode)} whileTap={{ scale: 0.95 }}>
                  <motion.div style={styles.toggleKnob} animate={{ x: darkMode ? 22 : 2 }}
                    transition={{ type: 'spring', stiffness: 500 }} />
                </motion.div>
              )
            }]
          },
          {
            title: '🔔 Notifications',
            items: [
              {
                label: 'Nouvelles offres', desc: 'Bientôt disponible',
                action: (
                  <div style={{ ...styles.toggle, backgroundColor: '#e0e0e0', cursor: 'not-allowed', opacity: 0.6 }}
                    title="Bientôt disponible">
                    <div style={{ ...styles.toggleKnob, transform: 'translateX(2px)' }} />
                  </div>
                )
              },
              {
                label: 'Messages', desc: 'Bientôt disponible',
                action: (
                  <div style={{ ...styles.toggle, backgroundColor: '#e0e0e0', cursor: 'not-allowed', opacity: 0.6 }}
                    title="Bientôt disponible">
                    <div style={{ ...styles.toggleKnob, transform: 'translateX(2px)' }} />
                  </div>
                )
              },
            ]
          },
          {
            title: '🔐 Sécurité',
            items: [
              {
                label: 'Changer le mot de passe', desc: 'Mettre à jour votre mot de passe',
                action: (
                  <motion.button style={styles.settingBtn} whileHover={{ scale: 1.05 }}
                    onClick={() => { setPasswordError(''); setPasswordModalOpen(true); }}>
                    Modifier
                  </motion.button>
                )
              },
              {
                label: 'Supprimer le compte', desc: 'Supprimer définitivement votre compte',
                action: (
                  <motion.button style={{ ...styles.settingBtn, backgroundColor: '#ff5252' }} whileHover={{ scale: 1.05 }}
                    onClick={() => { setDeleteError(''); setDeletePassword(''); setDeleteModalOpen(true); }}>
                    Supprimer
                  </motion.button>
                )
              },
            ]
          },
        ].map((section, i) => (
          <motion.div key={section.title} style={{ ...styles.settingCard, backgroundColor: theme.card }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <h3 style={{ ...styles.settingTitle, color: theme.text }}>{section.title}</h3>
            {section.items.map((item) => (
              <div key={item.label} style={styles.settingRow}>
                <div>
                  <p style={{ ...styles.settingLabel, color: theme.text }}>{item.label}</p>
                  <p style={styles.settingDesc}>{item.desc}</p>
                </div>
                {item.action}
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'demandes': return renderDemandes();
      case 'offres': return renderOffres();
      case 'profil': return renderProfil();
      case 'parametres': return renderParametres();
      default: return null;
    }
  };

  return (
    <>
      {/* TOAST évaluation */}
      <AnimatePresence>
        {evalSuccess && (
          <motion.div style={styles.toast}
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}>
            ⭐ Évaluation envoyée avec succès !
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL évaluation */}
      <Modal open={!!evalModal} onClose={() => setEvalModal(null)} theme={theme}
        title="⭐ Évaluer l'artisan">
        <p style={{ color: theme.subtext, margin: '-15px 0 25px', fontSize: '14px' }}>
          {evalModal?.artisan_nom}
        </p>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '12px', color: theme.text }}>
            Note *
          </label>
          <StarRating value={evalForm.note} onChange={note => setEvalForm({ ...evalForm, note })} />
          {evalForm.note > 0 && (
            <p style={{ color: theme.subtext, fontSize: '13px', marginTop: '8px' }}>
              {['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bien', 'Excellent !'][evalForm.note]}
            </p>
          )}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px', color: theme.text }}>
            Commentaire
          </label>
          <textarea rows={4} placeholder="Décrivez votre expérience avec cet artisan..."
            value={evalForm.commentaire}
            onChange={e => setEvalForm({ ...evalForm, commentaire: e.target.value })}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '10px',
              border: '2px solid #e0e0e0', fontSize: '14px', outline: 'none',
              resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
              backgroundColor: theme.bg, color: theme.text,
            }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button onClick={() => setEvalModal(null)} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </motion.button>
          <motion.button onClick={envoyerEvaluation} disabled={evalForm.note === 0 || evalLoading}
            whileHover={{ scale: evalForm.note === 0 ? 1 : 1.03 }}
            style={{
              flex: 2, padding: '12px',
              backgroundColor: evalForm.note === 0 ? '#ccc' : '#ff9800',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: '700',
              cursor: evalForm.note === 0 ? 'not-allowed' : 'pointer',
            }}>
            {evalLoading ? '⏳ Envoi...' : '🚀 Envoyer l\'évaluation'}
          </motion.button>
        </div>
      </Modal>

      {/* MODAL édition du profil */}
      <Modal open={editProfileOpen} onClose={() => !profileLoading && setEditProfileOpen(false)}
        theme={theme} title="✏️ Modifier le profil">
        {profileError && (
          <div style={{ backgroundColor: '#ffe8e8', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
            ❌ {profileError}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <Avatar photo={photoPreview || user.photo} name={user.username} size={64} fontSize={26} background="#1a73e8" />
          <div>
            <label htmlFor="dashboard-photo-input" style={{
              display: 'inline-block', padding: '8px 16px', backgroundColor: theme.border,
              color: theme.text, borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}>
              📷 Changer la photo
            </label>
            <input id="dashboard-photo-input" type="file" accept="image/*" onChange={choisirPhoto} style={{ display: 'none' }} />
          </div>
        </div>
        {[
          { label: 'Email', name: 'email', type: 'email' },
          { label: 'Téléphone', name: 'telephone', type: 'text' },
          { label: 'Adresse', name: 'adresse', type: 'text' },
        ].map(field => (
          <FormField
            key={field.name}
            label={field.label}
            type={field.type}
            theme={theme}
            value={profileForm[field.name]}
            onChange={e => setProfileForm({ ...profileForm, [field.name]: e.target.value })}
          />
        ))}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <motion.button onClick={() => setEditProfileOpen(false)} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </motion.button>
          <motion.button onClick={enregistrerProfil} disabled={profileLoading}
            whileHover={{ scale: 1.03 }}
            style={{ flex: 2, padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: profileLoading ? 'not-allowed' : 'pointer' }}>
            {profileLoading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
          </motion.button>
        </div>
      </Modal>

      {/* MODAL changement de mot de passe */}
      <Modal open={passwordModalOpen} onClose={() => !passwordLoading && setPasswordModalOpen(false)}
        theme={theme} title="🔐 Changer le mot de passe">
        {passwordError && (
          <div style={{ backgroundColor: '#ffe8e8', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
            ❌ {passwordError}
          </div>
        )}
        {[
          { label: 'Ancien mot de passe', name: 'ancien_mot_de_passe' },
          { label: 'Nouveau mot de passe', name: 'nouveau_mot_de_passe' },
          { label: 'Confirmer le nouveau mot de passe', name: 'confirmation' },
        ].map(field => (
          <FormField
            key={field.name}
            label={field.label}
            type="password"
            theme={theme}
            value={passwordForm[field.name]}
            onChange={e => setPasswordForm({ ...passwordForm, [field.name]: e.target.value })}
          />
        ))}
        <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
          <motion.button onClick={() => setPasswordModalOpen(false)} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </motion.button>
          <motion.button onClick={changerMotDePasse} disabled={passwordLoading}
            whileHover={{ scale: 1.03 }}
            style={{ flex: 2, padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: passwordLoading ? 'not-allowed' : 'pointer' }}>
            {passwordLoading ? '⏳ Modification...' : '🔐 Confirmer'}
          </motion.button>
        </div>
      </Modal>

      {/* MODAL suppression de compte */}
      <Modal open={deleteModalOpen} onClose={() => !deleteLoading && setDeleteModalOpen(false)}
        theme={theme} title="⚠️ Supprimer le compte" titleColor="#d32f2f">
        <p style={{ color: theme.subtext, fontSize: '14px', margin: '0 0 20px' }}>
          Cette action est irréversible. Toutes vos données seront définitivement supprimées.
        </p>
        {deleteError && (
          <div style={{ backgroundColor: '#ffe8e8', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', marginBottom: '16px' }}>
            ❌ {deleteError}
          </div>
        )}
        <FormField
          label="Confirmez votre mot de passe" type="password" theme={theme}
          value={deletePassword} onChange={e => setDeletePassword(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button onClick={() => setDeleteModalOpen(false)} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </motion.button>
          <motion.button onClick={supprimerCompte} disabled={deleteLoading || !deletePassword}
            whileHover={{ scale: 1.03 }}
            style={{ flex: 2, padding: '12px', backgroundColor: '#ff5252', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: (deleteLoading || !deletePassword) ? 'not-allowed' : 'pointer' }}>
            {deleteLoading ? '⏳ Suppression...' : '🗑️ Supprimer définitivement'}
          </motion.button>
        </div>
      </Modal>

      {/* MODAL confirmation changement de mode */}
      <Modal open={confirmArtisanModalOpen} onClose={() => !artisanModeLoading && setConfirmArtisanModalOpen(false)}
        theme={theme} maxWidth="400px" centered>
        <div style={{ fontSize: '44px', marginBottom: '10px' }}>{user.role === 'artisan' ? '👤' : '🔧'}</div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: theme.text, margin: '0 0 12px' }}>
          {user.role === 'artisan' ? 'Repasser en mode Client ?' : 'Activer le mode Artisan ?'}
        </h2>
        <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
          {user.role === 'artisan'
            ? 'Vos offres existantes resteront visibles mais vous ne pourrez plus en soumettre de nouvelles.'
            : 'Vous pourrez répondre aux demandes des clients et proposer vos services.'}
        </p>

        {user.role !== 'artisan' && (
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label htmlFor="dashboard-specialite-select" style={{ fontSize: '13px', fontWeight: '600', color: theme.text, display: 'block', marginBottom: '8px' }}>
              Ta spécialité *
            </label>
            <select
              id="dashboard-specialite-select"
              value={specialiteChoisie}
              onChange={(e) => { setSpecialiteChoisie(e.target.value); setArtisanModeError(''); }}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '2px solid #e0e0e0', fontSize: '14px', backgroundColor: theme.bg, color: theme.text }}
            >
              <option value="">-- Choisir --</option>
              {specialitesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
              ))}
            </select>
          </div>
        )}

        {artisanModeError && (
          <p style={{ color: '#d32f2f', fontSize: '13px', marginBottom: '16px' }}>❌ {artisanModeError}</p>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button onClick={() => setConfirmArtisanModalOpen(false)} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </motion.button>
          <motion.button onClick={executerBasculeModeArtisan} disabled={artisanModeLoading} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: artisanModeLoading ? 'not-allowed' : 'pointer' }}>
            {artisanModeLoading ? '⏳...' : 'Confirmer'}
          </motion.button>
        </div>
      </Modal>

      {/* MODAL confirmation suppression de demande */}
      <Modal open={!!deleteDemandeModal} onClose={() => !deleteDemandeLoading && setDeleteDemandeModal(null)}
        theme={theme} maxWidth="400px" centered>
        <div style={{ fontSize: '44px', marginBottom: '10px' }}>🗑️</div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: theme.text, margin: '0 0 12px' }}>
          Supprimer cette demande ?
        </h2>
        <p style={{ color: theme.subtext, fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
          « {deleteDemandeModal?.titre} » sera définitivement supprimée. Cette action est irréversible.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button onClick={() => setDeleteDemandeModal(null)} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: theme.border, color: theme.text, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Annuler
          </motion.button>
          <motion.button onClick={confirmerSuppressionDemande} disabled={deleteDemandeLoading} whileHover={{ scale: 1.03 }}
            style={{ flex: 1, padding: '12px', backgroundColor: '#ff5252', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: deleteDemandeLoading ? 'not-allowed' : 'pointer' }}>
            {deleteDemandeLoading ? '⏳...' : '🗑️ Supprimer'}
          </motion.button>
        </div>
      </Modal>

      <div style={{ ...styles.container, backgroundColor: theme.bg }}>

        {/* Overlay mobile : cliquer en dehors de la sidebar la referme */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="dashboard-sidebar-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* SIDEBAR */}
        <motion.div
          className={`dashboard-sidebar${sidebarOpen ? ' dashboard-sidebar--open' : ''}`}
          style={{ ...styles.sidebar, backgroundColor: theme.sidebar }}
          initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          <div style={styles.sidebarLogo}>
            <span style={{ color: '#fff', fontSize: '26px', fontWeight: '700', fontFamily: FONT_DISPLAY }}>Fix</span>
            <span style={{ color: '#00c853', fontSize: '26px', fontWeight: '700', fontFamily: FONT_DISPLAY }}>It</span>
          </div>
          <div style={styles.sidebarUser}>
            <Avatar photo={user.photo} name={user.username} size={42} fontSize={18} background="#1a73e8" />
            <div>
              <p style={styles.userName}>{user.username}</p>
              <p style={styles.userRole}>{user.role === 'artisan' ? 'ARTISAN' : 'CLIENT'}</p>
            </div>
          </div>
          <nav style={styles.sidebarNav}>
            {menuItems.map((item) => (
              <motion.div key={item.id}
                style={{ ...styles.menuItem, ...(activeMenu === item.id ? styles.menuItemActive : {}) }}
                onClick={() => {
                  if (item.id === 'messages') navigate('/messages');
                  else setActiveMenu(item.id);
                  setSidebarOpen(false); // referme le menu sur mobile après un choix
                }}
                whileHover={{ x: 5 }} whileTap={{ scale: 0.97 }}>
                <span style={styles.menuIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </motion.div>
            ))}
          </nav>
          <motion.button style={styles.logoutBtn} onClick={handleLogout}
            whileHover={{ backgroundColor: 'rgba(255,100,100,0.2)' }}>
            🚪 Déconnexion
          </motion.button>
        </motion.div>

        {/* MAIN */}
        <div className="dashboard-main" style={{ ...styles.main, backgroundColor: theme.bg }}>
          <motion.div style={styles.header} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button
                type="button"
                className="dashboard-sidebar-toggle"
                aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={sidebarOpen}
                onClick={() => setSidebarOpen((open) => !open)}
                style={{ color: theme.text }}
              >
                ☰
              </button>
              <div>
                <p style={{ ...styles.eyebrow, color: darkMode ? '#6b7590' : '#9aa3b8' }}>ESPACE CLIENT</p>
                <h1 style={{ ...styles.headerTitle, color: theme.text }}>
                  {activeMenu === 'dashboard' && `Bonjour, ${user.username}`}
                  {activeMenu === 'demandes' && 'Mes demandes'}
                  {activeMenu === 'offres' && 'Mes offres'}
                  {activeMenu === 'profil' && 'Mon profil'}
                  {activeMenu === 'parametres' && 'Paramètres'}
                </h1>
                <p style={{ ...styles.headerSubtitle, color: theme.subtext }}>
                  {activeMenu === 'dashboard' && 'Voici un résumé de votre activité'}
                  {activeMenu === 'profil' && 'Gérez vos informations personnelles'}
                  {activeMenu === 'parametres' && 'Personnalisez votre expérience'}
                </p>
              </div>
            </div>
            <NotificationBell color={theme.text} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={activeMenu}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";

const styles = {
  container: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: '260px', display: 'flex', flexDirection: 'column',
    padding: '30px 20px', position: 'fixed', height: '100vh', overflowY: 'auto',
  },
  sidebarLogo: { display: 'flex', marginBottom: '30px', paddingLeft: '10px' },
  sidebarUser: {
    display: 'flex', alignItems: 'center', gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px',
    padding: '12px', marginBottom: '30px',
  },
  userAvatar: {
    width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#1a73e8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '18px', fontWeight: '800',
  },
  userName: { color: '#fff', fontSize: '14px', fontWeight: '700', margin: 0 },
  userRole: { color: '#aaa', fontSize: '11px', fontWeight: 600, letterSpacing: '1px', margin: 0 },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
    borderRadius: '10px', color: '#aaa', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
  },
  menuItemActive: { backgroundColor: 'rgba(26,115,232,0.3)', color: '#fff', borderLeft: '3px solid #1a73e8' },
  menuIcon: { fontSize: '18px' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
    borderRadius: '10px', color: '#ff6b6b', backgroundColor: 'transparent',
    border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginTop: '20px', width: '100%',
  },
  main: { marginLeft: '260px', flex: 1, padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' },
  eyebrow: {
    margin: '0 0 4px', fontFamily: FONT_DISPLAY, fontSize: '11px', fontWeight: 600,
    letterSpacing: '1.4px',
  },
  headerTitle: { fontFamily: FONT_DISPLAY, fontSize: '26px', fontWeight: '700', margin: 0 },
  headerSubtitle: { fontSize: '14px', margin: '5px 0 0' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' },
  statCard: { borderRadius: '18px', padding: '25px 20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  statIcon: { fontSize: '35px' },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: '30px', fontWeight: '700', margin: 0 },
  statLabel: { fontSize: '13px', color: '#888', margin: 0 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  chartCard: { borderRadius: '18px', padding: '25px', boxShadow: '0 4px 24px rgba(20,30,60,0.08)' },
  chartCardFull: { borderRadius: '18px', padding: '25px', boxShadow: '0 4px 24px rgba(20,30,60,0.08)', marginBottom: '20px' },
  chartTitle: { fontFamily: FONT_DISPLAY, fontSize: '15px', fontWeight: '700', margin: '0 0 15px' },
  tableCard: { borderRadius: '18px', padding: '25px', boxShadow: '0 4px 24px rgba(20,30,60,0.08)' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  newBtn: { padding: '8px 18px', backgroundColor: '#00c853', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  demandeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 10px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', borderRadius: '8px' },
  demandeRowLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  demandeRowIcon: { fontSize: '24px', width: '44px', height: '44px', backgroundColor: '#f8faff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  demandeRowTitle: { fontFamily: FONT_DISPLAY, fontSize: '14px', fontWeight: '700', margin: '0 0 3px' },
  demandeRowSub: { fontSize: '12px', color: '#888', margin: 0 },
  statutBadge: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  emptyBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', textAlign: 'center', gap: '10px' },
  emptyBtn: { padding: '10px 22px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' },
  deleteBtn: { background: '#fff0f0', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px' },
  acceptBtn: { padding: '8px 16px', backgroundColor: '#00c853', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' },
  contactBtn: { padding: '8px 16px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' },
  evalBtn: { padding: '6px 14px', backgroundColor: '#ff9800', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  profileCover: { background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)', borderRadius: '20px', padding: '40px', display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '25px' },
  profileAvatarBig: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '36px', fontWeight: '800', border: '3px solid rgba(255,255,255,0.5)' },
  profileInfo: {},
  profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  profileCard: { borderRadius: '18px', padding: '25px', boxShadow: '0 4px 24px rgba(20,30,60,0.08)' },
  profileCardTitle: { fontFamily: FONT_DISPLAY, fontSize: '16px', fontWeight: '700', marginBottom: '20px' },
  profileRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  profileRowIcon: { fontSize: '20px', width: '30px' },
  profileRowLabel: { fontSize: '11px', color: '#888', margin: '0 0 2px' },
  profileRowValue: { fontSize: '14px', fontWeight: '600', margin: 0 },
  editBtn: { width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  statRowLabel: { fontSize: '14px', color: '#888' },
  statRowValue: { fontSize: '18px', fontWeight: '800' },
  artisanBtn: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  settingsGrid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  settingCard: { borderRadius: '18px', padding: '25px', boxShadow: '0 4px 24px rgba(20,30,60,0.08)' },
  settingTitle: { fontFamily: FONT_DISPLAY, fontSize: '16px', fontWeight: '700', marginBottom: '20px' },
  settingRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0f0f0' },
  settingLabel: { fontSize: '14px', fontWeight: '600', margin: '0 0 3px' },
  settingDesc: { fontSize: '12px', color: '#888', margin: 0 },
  toggle: { width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center' },
  toggleKnob: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', left: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  settingBtn: { padding: '8px 18px', backgroundColor: '#1a73e8', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  toast: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#ff9800', color: '#fff', padding: '14px 28px', borderRadius: '30px', fontWeight: '700', fontSize: '15px', zIndex: 2000, boxShadow: '0 8px 25px rgba(255,152,0,0.4)' },
};

export default Dashboard;