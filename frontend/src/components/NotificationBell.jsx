import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const ICONES = {
  nouvelle_offre: '💼',
  offre_acceptee: '✅',
  nouveau_message: '💬',
  nouvel_avis: '⭐',
};

const tempsEcoule = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return 'À l\'instant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  return `Il y a ${Math.floor(h / 24)} j`;
};

/**
 * NotificationBell : cloche avec badge de compteur non-lu, rafraîchie par
 * polling (pas de websockets, pour rester simple). Le contenu de la liste
 * n'est chargé qu'à l'ouverture du menu.
 */
const NotificationBell = ({ color = '#1a1a2e', badgeColor = '#e91e63' }) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const fetchCount = async () => {
    try {
      const res = await api.get('/notifications/non-lues/');
      setCount(res.data.count);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 25000); // polling toutes les 25s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const ouvrirMenu = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      try {
        const res = await api.get('/notifications/');
        setNotifs(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const cliquerNotif = async (notif) => {
    if (!notif.lu) {
      try {
        await api.post(`/notifications/${notif.id}/lire/`);
        setNotifs(prev => prev.map(n => (n.id === notif.id ? { ...n, lu: true } : n)));
        setCount(c => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setOpen(false);
    if (notif.lien?.startsWith('messages')) {
      navigate(`/${notif.lien}`);
    } else {
      navigate('/dashboard');
    }
  };

  const toutMarquerLu = async () => {
    try {
      await api.post('/notifications/tout-lire/');
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })));
      setCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <motion.button
        onClick={ouvrirMenu}
        aria-label={count > 0 ? `Notifications, ${count} non lue${count > 1 ? 's' : ''}` : 'Notifications'}
        aria-haspopup="true"
        aria-expanded={open}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{ ...styles.bellBtn, color }}
      >
        🔔
        {count > 0 && (
          <span style={{ ...styles.badge, backgroundColor: badgeColor }} aria-hidden="true">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={styles.dropdown}
          >
            <div style={styles.dropdownHeader}>
              <span style={styles.dropdownTitle}>Notifications</span>
              {notifs.some(n => !n.lu) && (
                <button onClick={toutMarquerLu} style={styles.markAllBtn}>Tout marquer lu</button>
              )}
            </div>
            <div style={styles.list}>
              {notifs.length === 0 ? (
                <p style={styles.empty}>Aucune notification pour l'instant</p>
              ) : (
                notifs.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => cliquerNotif(n)}
                    style={{ ...styles.item, backgroundColor: n.lu ? '#fff' : '#f0f6ff' }}
                  >
                    <span style={styles.itemIcon} aria-hidden="true">{ICONES[n.type] || '🔔'}</span>
                    <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <p style={styles.itemMsg}>{n.message}</p>
                      <p style={styles.itemTime}>{tempsEcoule(n.date_creation)}</p>
                    </span>
                    {!n.lu && <span style={styles.dot} aria-label="non lu" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const styles = {
  bellBtn: {
    position: 'relative', border: 'none', background: 'none',
    fontSize: '20px', cursor: 'pointer', padding: '6px',
  },
  badge: {
    position: 'absolute', top: '0', right: '0',
    color: '#fff', fontSize: '10px', fontWeight: '700',
    borderRadius: '10px', minWidth: '17px', height: '17px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 4px', border: '2px solid #fff',
  },
  dropdown: {
    position: 'absolute', top: '40px', right: 0, width: 'min(340px, calc(100vw - 24px))',
    backgroundColor: '#fff', borderRadius: '16px',
    boxShadow: '0 12px 40px rgba(20,30,60,0.18)', overflow: 'hidden', zIndex: 1000,
  },
  dropdownHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderBottom: '1px solid #f0f0f0',
  },
  dropdownTitle: { fontWeight: '700', fontSize: '14px', color: '#1a1a2e' },
  markAllBtn: { border: 'none', background: 'none', color: '#1a73e8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  list: { maxHeight: '360px', overflowY: 'auto' },
  empty: { textAlign: 'center', color: '#999', fontSize: '13px', padding: '30px 16px' },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    padding: '12px 16px', borderBottom: '1px solid #f7f7f7', cursor: 'pointer',
    width: '100%', border: 'none', font: 'inherit', textAlign: 'left',
  },
  itemIcon: { fontSize: '18px', flexShrink: 0 },
  itemMsg: { fontSize: '13px', color: '#333', margin: '0 0 3px', lineHeight: '1.4' },
  itemTime: { fontSize: '11px', color: '#999', margin: 0 },
  dot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#1a73e8', flexShrink: 0, marginTop: '5px' },
};

export default NotificationBell;