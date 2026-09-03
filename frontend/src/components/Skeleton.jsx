import React from 'react';
import './Skeleton.css';

/**
 * Bloc de base : rectangle gris avec animation de pulsation.
 * Utilise la classe CSS .skeleton-pulse (définie dans Skeleton.css).
 */
export const SkeletonBox = ({ width = '100%', height = '16px', radius = '6px', style }) => (
  <div
    className="skeleton-pulse"
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

/**
 * Skeleton d'une carte "artisan" (ArtisansListe) ou "demande" (DashboardArtisan) —
 * même gabarit général : avatar/icône rond, titre, 2 lignes de texte, bouton.
 */
export const SkeletonCard = () => (
  <div style={styles.card}>
    <SkeletonBox width="64px" height="64px" radius="50%" style={{ margin: '0 auto 14px' }} />
    <SkeletonBox width="70%" height="16px" style={{ margin: '0 auto 10px' }} />
    <SkeletonBox width="50%" height="12px" style={{ margin: '0 auto 18px' }} />
    <SkeletonBox width="100%" height="38px" radius="10px" />
  </div>
);

/**
 * Grille de N SkeletonCard, pour remplacer une grille de cartes en cours de chargement.
 */
export const SkeletonCardGrid = ({ count = 6, minWidth = '220px' }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minWidth}, 1fr))`, gap: '16px' }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

/**
 * Skeleton d'une ligne de tableau/liste (Dashboard.jsx "Mes demandes"/"Mes offres").
 */
export const SkeletonRow = () => (
  <div style={styles.row}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
      <SkeletonBox width="40px" height="40px" radius="10px" />
      <div style={{ flex: 1 }}>
        <SkeletonBox width="55%" height="14px" style={{ marginBottom: '8px' }} />
        <SkeletonBox width="35%" height="11px" />
      </div>
    </div>
    <SkeletonBox width="80px" height="26px" radius="20px" />
  </div>
);

export const SkeletonRowList = ({ count = 4 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
    {Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />)}
  </div>
);

/**
 * Skeleton d'une page de profil (ArtisanProfile) : en-tête + 2 cartes de contenu.
 */
export const SkeletonProfile = () => (
  <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 20px' }}>
    <div style={styles.profileHeader}>
      <SkeletonBox width="88px" height="88px" radius="50%" />
      <div style={{ flex: 1 }}>
        <SkeletonBox width="180px" height="20px" style={{ marginBottom: '10px' }} />
        <SkeletonBox width="120px" height="14px" style={{ marginBottom: '10px' }} />
        <SkeletonBox width="200px" height="12px" />
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginTop: '24px' }}>
      <div>
        <div style={styles.contentCard}>
          <SkeletonBox width="140px" height="15px" style={{ marginBottom: '14px' }} />
          <SkeletonBox width="100%" height="12px" style={{ marginBottom: '8px' }} />
          <SkeletonBox width="90%" height="12px" />
        </div>
      </div>
      <div style={styles.contentCard}>
        <SkeletonBox width="100px" height="15px" style={{ marginBottom: '14px' }} />
        <SkeletonBox width="100%" height="12px" />
      </div>
    </div>
  </div>
);

const styles = {
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px', textAlign: 'center',
    boxShadow: '0 4px 24px rgba(20,30,60,0.06)',
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', backgroundColor: '#fff', borderRadius: '12px',
  },
  profileHeader: {
    display: 'flex', alignItems: 'center', gap: '22px',
    backgroundColor: '#fff', borderRadius: '18px', padding: '28px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.08)',
  },
  contentCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '22px', marginBottom: '18px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.08)',
  },
};