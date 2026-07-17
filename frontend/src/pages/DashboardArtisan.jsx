import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';


const DashboardArtisan = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState('demandes');
  const [filtreService, setFiltreService] = useState('');
  const [offreModal, setOffreModal] = useState(null); // demande sélectionnée
  const [offreForm, setOffreForm] = useState({ prix_propose: '', message: '' });
  const [offreLoading, setOffreLoading] = useState(false);
  const [offreSuccess, setOffreSuccess] = useState(false);
  const [mesOffres, setMesOffres] = useState([]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'artisan') { navigate('/dashboard'); return; }
    fetchDemandes();
    fetchMesOffres();
  }, [user]);

  const fetchDemandes = async () => {
    try {
      const params = filtreService ? `?type_service=${filtreService}&statut=ouverte` : '?statut=ouverte';
      const res = await api.get(`/demandes/${params}`);
      setDemandes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMesOffres = async () => {
    try {
      const res = await api.get('/offres/');
      setMesOffres(res.data.filter(o => o.artisan === user.id));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDemandes();
  }, [filtreService]);

  const soumettreOffre = async () => {
    if (!offreForm.prix_propose || !offreForm.message) return;
    setOffreLoading(true);
    try {
      await api.post('/offres/', {
        ...offreForm,
        demande: offreModal.id,
      });
      setOffreSuccess(true);
      setOffreModal(null);
      setOffreForm({ prix_propose: '', message: '' });
      fetchMesOffres();
      setTimeout(() => setOffreSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setOffreLoading(false);
    }
  };

  const serviceIcon = (type) => ({
    plomberie: '🚿', electricite: '⚡', peinture: '🎨',
    reparation: '🔨', climatisation: '❄️', menuiserie: '🪚', autre: '🔧'
  }[type] || '🔧');

  const menuItems = [
    { id: 'demandes', icon: '📋', label: 'Demandes disponibles' },
    { id: 'mes_offres', icon: '💼', label: 'Mes offres' },
    { id: 'profil', icon: '👤', label: 'Mon profil' },
  ];

  const renderDemandes = () => (
    <div>
      {/* Filtres */}
      <div style={styles.filtres}>
        {['', 'plomberie', 'electricite', 'peinture', 'reparation', 'climatisation', 'menuiserie', 'autre'].map(s => (
          <motion.button
            key={s}
            style={{
              ...styles.filtreBtn,
              backgroundColor: filtreService === s ? '#1a73e8' : '#f0f0f0',
              color: filtreService === s ? '#fff' : '#333',
            }}
            onClick={() => setFiltreService(s)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {s === '' ? '🌐 Tous' :
             s === 'plomberie' ? '🚿 Plomberie' :
             s === 'electricite' ? '⚡ Électricité' :
             s === 'peinture' ? '🎨 Peinture' :
             s === 'reparation' ? '🔨 Réparation' :
             s === 'climatisation' ? '❄️ Climatisation' :
             s === 'menuiserie' ? '🪚 Menuiserie' : '🔧 Autre'}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div style={styles.emptyBox}><p>⏳ Chargement...</p></div>
      ) : demandes.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: '40px' }}>📭</p>
          <p style={{ color: '#888' }}>Aucune demande disponible</p>
        </div>
      ) : (
        <div style={styles.demandesGrid}>
          {demandes.map((d, i) => {
            const dejaOffert = mesOffres.some(o => o.demande === d.id);
            return (
              <motion.div
                key={d.id}
                style={styles.demandeCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -5, boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}
              >
                <div style={styles.demandeCardHeader}>
                  <span style={styles.demandeCardIcon}>{serviceIcon(d.type_service)}</span>
                  <span style={styles.serviceTag}>{d.type_service}</span>
                </div>
                <h3 style={styles.demandeCardTitle}>{d.titre}</h3>
                <p style={styles.demandeCardDesc}>{d.description.slice(0, 100)}...</p>
                <div style={styles.demandeCardInfo}>
                  <span>📍 {d.localisation}</span>
                  <span style={{ color: '#1a73e8', fontWeight: '700' }}>💰 {d.budget} TND</span>
                </div>
                <div style={styles.demandeCardFooter}>
                  <span style={styles.clientInfo}>👤 {d.client_nom}</span>
                  {dejaOffert ? (
                    <span style={styles.dejaOffreBadge}>✅ Offre envoyée</span>
                  ) : (
                    <motion.button
                      style={styles.offreBtn}
                      onClick={() => setOffreModal(d)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      💼 Faire une offre
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMesOffres = () => (
    <div>
      {mesOffres.length === 0 ? (
        <div style={styles.emptyBox}>
          <p style={{ fontSize: '40px' }}>💼</p>
          <p style={{ color: '#888' }}>Vous n'avez pas encore soumis d'offres</p>
        </div>
      ) : (
        mesOffres.map((o, i) => (
          <motion.div
            key={o.id}
            style={styles.offreRow}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div>
              <p style={styles.offreRowTitle}>Demande #{o.demande}</p>
              <p style={styles.offreRowMsg}>{o.message}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: '#1a73e8', fontWeight: '800', fontSize: '18px' }}>{o.prix_propose} TND</p>
              <span style={{
                ...styles.statutBadge,
                backgroundColor: o.est_acceptee ? '#e8f5e9' : '#fff3e0',
                color: o.est_acceptee ? '#2e7d32' : '#e65100',
              }}>
                {o.est_acceptee ? '✅ Acceptée' : '⏳ En attente'}
              </span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderProfil = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div style={styles.profileCover}>
        <div style={styles.profileAvatar}>{user.username?.charAt(0).toUpperCase()}</div>
        <div>
          <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>{user.username}</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0' }}>🔧 Artisan • {user.email}</p>
        </div>
      </div>
      <div style={styles.profileCard}>
        {[
          { label: 'Nom d\'utilisateur', value: user.username, icon: '👤' },
          { label: 'Email', value: user.email || 'Non renseigné', icon: '✉️' },
          { label: 'Téléphone', value: user.telephone || 'Non renseigné', icon: '📞' },
          { label: 'Adresse', value: user.adresse || 'Non renseigné', icon: '📍' },
        ].map(item => (
          <div key={item.label} style={styles.profileRow}>
            <span style={{ fontSize: '20px', width: '30px' }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '11px', color: '#888', margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: 0 }}>{item.value}</p>
            </div>
          </div>
        ))}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f5e9', borderRadius: '10px' }}>
          <p style={{ color: '#2e7d32', fontWeight: '700', margin: 0 }}>
            ✅ Offres soumises : {mesOffres.length} | Acceptées : {mesOffres.filter(o => o.est_acceptee).length}
          </p>
        </div>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'demandes': return renderDemandes();
      case 'mes_offres': return renderMesOffres();
      case 'profil': return renderProfil();
      default: return null;
    }
  };

  return (
    

    <div style={styles.container}>
      {/* MODAL OFFRE */}
      <AnimatePresence>
        {offreModal && (
          <motion.div style={styles.modalOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOffreModal(null)}>
            <motion.div style={styles.modalBox}
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <h2 style={styles.modalTitle}>💼 Soumettre une offre</h2>
              <p style={styles.modalSubtitle}>{offreModal.titre}</p>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prix proposé (TND) *</label>
                <input type="number" placeholder="ex: 150"
                  value={offreForm.prix_propose}
                  onChange={e => setOffreForm({ ...offreForm, prix_propose: e.target.value })}
                  style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Message au client *</label>
                <textarea rows={4} placeholder="Décrivez votre approche, votre expérience..."
                  value={offreForm.message}
                  onChange={e => setOffreForm({ ...offreForm, message: e.target.value })}
                  style={styles.textarea} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <motion.button style={styles.cancelBtn} onClick={() => setOffreModal(null)}
                  whileHover={{ scale: 1.03 }}>
                  Annuler
                </motion.button>
                <motion.button style={styles.submitBtn}
                  onClick={soumettreOffre} disabled={offreLoading}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  {offreLoading ? '⏳ Envoi...' : '🚀 Envoyer l\'offre'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST SUCCESS */}
      <AnimatePresence>
        {offreSuccess && (
          <motion.div style={styles.toast}
            initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}>
            ✅ Offre envoyée avec succès !
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.div style={styles.sidebar}
        initial={{ x: -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
        <div style={{ display: 'flex', marginBottom: '30px', paddingLeft: '10px' }}>
          <span style={{ color: '#fff', fontSize: '26px', fontWeight: '800' }}>Fix</span>
          <span style={{ color: '#00c853', fontSize: '26px', fontWeight: '800' }}>It</span>
        </div>
        <div style={styles.sidebarUser}>
          <div style={styles.userAvatar}>{user.username?.charAt(0).toUpperCase()}</div>
          <div>
            <p style={styles.userName}>{user.username}</p>
            <p style={styles.userRole}>🔧 Artisan</p>
          </div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {menuItems.map(item => (
            <motion.div key={item.id}
              style={{ ...styles.menuItem, ...(activeMenu === item.id ? styles.menuItemActive : {}) }}
              onClick={() => setActiveMenu(item.id)}
              whileHover={{ x: 5 }} whileTap={{ scale: 0.97 }}>
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </motion.div>
          ))}
        </nav>
        <motion.button style={styles.logoutBtn} onClick={logout}
          whileHover={{ backgroundColor: 'rgba(255,100,100,0.2)' }}>
          🚪 Déconnexion
        </motion.button>
      </motion.div>

      {/* MAIN */}
      <div style={styles.main}>
        <motion.div style={styles.header}
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div>
            <h1 style={styles.headerTitle}>
              {activeMenu === 'demandes' && '📋 Demandes disponibles'}
              {activeMenu === 'mes_offres' && '💼 Mes Offres'}
              {activeMenu === 'profil' && '👤 Mon Profil'}
            </h1>
            <p style={styles.headerSubtitle}>
              {activeMenu === 'demandes' && `${demandes.length} demande(s) ouverte(s)`}
              {activeMenu === 'mes_offres' && `${mesOffres.length} offre(s) soumise(s)`}
            </p>
          </div>
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
  );
};

const styles = {
  container: { display: 'flex', minHeight: '100vh', backgroundColor: '#f8faff' },
  sidebar: {
    width: '260px', backgroundColor: '#1a1a2e',
    display: 'flex', flexDirection: 'column',
    padding: '30px 20px', position: 'fixed', height: '100vh', overflowY: 'auto',
  },
  sidebarUser: {
    display: 'flex', alignItems: 'center', gap: '12px',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '12px',
    padding: '12px', marginBottom: '30px',
  },
  userAvatar: {
    width: '42px', height: '42px', borderRadius: '50%',
    backgroundColor: '#00c853', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '18px', fontWeight: '800',
  },
  userName: { color: '#fff', fontSize: '14px', fontWeight: '700', margin: 0 },
  userRole: { color: '#00c853', fontSize: '12px', margin: 0 },
  menuItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 16px', borderRadius: '10px',
    color: '#aaa', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
  },
  menuItemActive: {
    backgroundColor: 'rgba(0,200,83,0.2)',
    color: '#fff', borderLeft: '3px solid #00c853',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 16px', borderRadius: '10px',
    color: '#ff6b6b', backgroundColor: 'transparent',
    border: 'none', cursor: 'pointer', fontSize: '14px',
    fontWeight: '500', marginTop: '20px', width: '100%',
  },
  main: { marginLeft: '260px', flex: 1, padding: '40px' },
  header: { marginBottom: '30px' },
  headerTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: 0 },
  headerSubtitle: { fontSize: '14px', color: '#888', margin: '5px 0 0' },
  filtres: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '25px' },
  filtreBtn: {
    padding: '8px 16px', borderRadius: '20px', border: 'none',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  demandesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  demandeCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)', cursor: 'pointer',
  },
  demandeCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  demandeCardIcon: { fontSize: '30px' },
  serviceTag: {
    backgroundColor: '#e8f4fd', color: '#1a73e8',
    padding: '4px 10px', borderRadius: '10px',
    fontSize: '12px', fontWeight: '700',
  },
  demandeCardTitle: { fontSize: '16px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 8px' },
  demandeCardDesc: { fontSize: '13px', color: '#888', lineHeight: '1.6', margin: '0 0 15px' },
  demandeCardInfo: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555', marginBottom: '15px' },
  demandeCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '12px' },
  clientInfo: { fontSize: '13px', color: '#888' },
  offreBtn: {
    padding: '8px 16px', backgroundColor: '#1a73e8',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
  dejaOffreBadge: {
    backgroundColor: '#e8f5e9', color: '#2e7d32',
    padding: '6px 12px', borderRadius: '10px',
    fontSize: '12px', fontWeight: '700',
  },
  offreRow: {
    backgroundColor: '#fff', borderRadius: '14px', padding: '20px 25px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },
  offreRowTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 5px' },
  offreRowMsg: { fontSize: '13px', color: '#888', margin: 0 },
  statutBadge: { padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  emptyBox: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '60px', textAlign: 'center', gap: '10px',
  },
  profileCover: {
    background: 'linear-gradient(135deg, #00c853 0%, #007b33 100%)',
    borderRadius: '20px', padding: '40px',
    display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '25px',
  },
  profileAvatar: {
    width: '80px', height: '80px', borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontSize: '36px', fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  },
  profileRow: {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 0', borderBottom: '1px solid #f0f0f0',
  },
  modalOverlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: '20px',
    padding: '40px', width: '500px', maxWidth: '90vw',
  },
  modalTitle: { fontSize: '22px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 5px' },
  modalSubtitle: { fontSize: '14px', color: '#888', margin: '0 0 25px' },
  formGroup: { marginBottom: '18px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' },
  input: {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '2px solid #e0e0e0', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '2px solid #e0e0e0', fontSize: '14px', outline: 'none',
    resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  cancelBtn: {
    flex: 1, padding: '12px', backgroundColor: '#f0f0f0',
    color: '#333', border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: '600', cursor: 'pointer',
  },
  submitBtn: {
    flex: 2, padding: '12px', backgroundColor: '#1a73e8',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
  toast: {
    position: 'fixed', top: '20px', left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#00c853', color: '#fff',
    padding: '14px 28px', borderRadius: '30px',
    fontWeight: '700', fontSize: '15px', zIndex: 2000,
    boxShadow: '0 8px 25px rgba(0,200,83,0.4)',
  },
};

export default DashboardArtisan;