import React from 'react';
import { motion } from 'framer-motion';

const ETAPES = [
  { key: 'ouverte', label: 'Demande publiée', icon: '📋' },
  { key: 'en_cours', label: 'Artisan sélectionné', icon: '🔧' },
  { key: 'terminee', label: 'Mission terminée', icon: '✅' },
];

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

/**
 * Timeline verticale du statut d'une demande.
 * `demande` doit contenir : statut, date_creation, date_debut, date_fin.
 */
const StatusTimeline = ({ demande }) => {
  const indexActuel = ETAPES.findIndex(e => e.key === demande.statut);
  const dates = {
    ouverte: demande.date_creation,
    en_cours: demande.date_debut,
    terminee: demande.date_fin,
  };

  return (
    <div style={styles.wrapper}>
      {ETAPES.map((etape, i) => {
        const atteinte = i <= indexActuel;
        const estActuelle = i === indexActuel;
        const date = dates[etape.key];

        return (
          <div key={etape.key} style={styles.ligne}>
            <div style={styles.colonneIcone}>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                style={{
                  ...styles.pastille,
                  backgroundColor: atteinte ? (estActuelle ? '#1a73e8' : '#00c853') : '#e0e0e0',
                  boxShadow: estActuelle ? '0 0 0 5px rgba(26,115,232,0.15)' : 'none',
                }}
              >
                {atteinte ? etape.icon : ''}
              </motion.div>
              {i < ETAPES.length - 1 && (
                <div style={{ ...styles.trait, backgroundColor: i < indexActuel ? '#00c853' : '#e0e0e0' }} />
              )}
            </div>
            <div style={styles.colonneTexte}>
              <p style={{ ...styles.label, color: atteinte ? '#1a1a2e' : '#a8adba', fontWeight: estActuelle ? 700 : 600 }}>
                {etape.label}
              </p>
              {date ? (
                <p style={styles.date}>{formatDate(date)}</p>
              ) : (
                <p style={styles.dateAttente}>{atteinte ? '' : 'À venir'}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', flexDirection: 'column' },
  ligne: { display: 'flex', gap: '14px' },
  colonneIcone: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  pastille: {
    width: '32px', height: '32px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', flexShrink: 0,
  },
  trait: { width: '3px', flex: 1, minHeight: '28px', margin: '2px 0' },
  colonneTexte: { paddingBottom: '22px' },
  label: { margin: '4px 0 2px', fontSize: '14px' },
  date: { margin: 0, fontSize: '12px', color: '#8a90a3' },
  dateAttente: { margin: 0, fontSize: '12px', color: '#c3c7d1', fontStyle: 'italic' },
};

export default StatusTimeline;