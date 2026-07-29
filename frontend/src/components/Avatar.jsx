import React from 'react';

/**
 * Avatar : affiche la photo de profil de l'utilisateur si elle existe,
 * sinon un rond avec son initiale (comportement d'origine du projet).
 */
const Avatar = ({ photo, name, size = 42, fontSize, background, style = {} }) => {
  const initiale = name?.charAt(0).toUpperCase() || '?';
  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
  };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name || 'avatar'}
        style={{ ...base, objectFit: 'cover', ...style }}
      />
    );
  }

  return (
    <div
      style={{
        ...base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: fontSize || Math.round(size * 0.42),
        background: background || 'linear-gradient(135deg, #1a73e8, #00c853)',
        ...style,
      }}
    >
      {initiale}
    </div>
  );
};

export default Avatar;