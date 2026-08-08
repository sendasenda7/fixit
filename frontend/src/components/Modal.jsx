import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Modal générique réutilisée par toutes les popups du Dashboard
 * (évaluation, édition profil, mot de passe, suppression compte,
 * bascule mode artisan, suppression demande).
 *
 * Avant, chaque modal dupliquait le même JSX overlay + box avec des
 * couleurs en dur ('#fff', '#1a1a2e') qui ignoraient le mode sombre.
 * Ici, `theme` pilote les couleurs une seule fois pour toutes les modals.
 */
const Modal = ({ open, onClose, closable = true, theme, title, titleColor, maxWidth = '480px', centered = false, children }) => {
  // Fermeture au clavier (Échap) — accessibilité clavier
  useEffect(() => {
    if (!open || !closable) return;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closable, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={styles.overlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => closable && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || undefined}
            style={{
              ...styles.box,
              backgroundColor: theme?.card || '#fff',
              maxWidth,
              textAlign: centered ? 'center' : 'left',
            }}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }} onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <h2 style={{ ...styles.title, color: titleColor || theme?.text || '#1a1a2e' }}>
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const styles = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  box: {
    borderRadius: '20px', padding: '40px', width: '480px',
    maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto',
  },
  title: { fontSize: '22px', fontWeight: '800', margin: '0 0 20px' },
};

export default Modal;