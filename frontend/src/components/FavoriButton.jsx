import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Bouton "cœur" pour ajouter/retirer un favori.
 * `estFavori` : état initial (vient du backend, champ est_favori).
 * `onToggle` : async function() → doit retourner le nouvel état { est_favori } ou lever une erreur.
 * `size` : taille de police de l'icône.
 */
const FavoriButton = ({ estFavori, onToggle, size = 20, style }) => {
  const [favori, setFavori] = useState(!!estFavori);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const precedent = favori;
    setFavori(!precedent); // optimiste
    try {
      const res = await onToggle();
      if (res && typeof res.est_favori === 'boolean') {
        setFavori(res.est_favori);
      }
    } catch (err) {
      console.error(err);
      setFavori(precedent); // rollback en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.1 }}
      aria-label={favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      style={{
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontSize: `${size}px`, lineHeight: 1, padding: '4px',
        filter: loading ? 'opacity(0.5)' : 'none',
        ...style,
      }}
    >
      {favori ? '❤️' : '🤍'}
    </motion.button>
  );
};

export default FavoriButton;