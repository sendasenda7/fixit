import React, { useState } from 'react';
import { motion } from 'framer-motion';

const StarRating = ({ value, onChange, readOnly = false }) => {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: 'flex', gap: '6px' }} role={readOnly ? undefined : 'radiogroup'} aria-label={readOnly ? undefined : 'Note'}>
      {[1, 2, 3, 4, 5].map(star => (
        <motion.span
          key={star}
          role={readOnly ? undefined : 'radio'}
          aria-checked={readOnly ? undefined : star === value}
          aria-label={readOnly ? undefined : `${star} étoile${star > 1 ? 's' : ''}`}
          tabIndex={readOnly ? undefined : 0}
          style={{
            fontSize: '32px',
            cursor: readOnly ? 'default' : 'pointer',
            filter: star <= (hovered || value) ? 'none' : 'grayscale(100%)',
            opacity: star <= (hovered || value) ? 1 : 0.4,
          }}
          whileHover={!readOnly ? { scale: 1.3 } : {}}
          whileTap={!readOnly ? { scale: 0.9 } : {}}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange && onChange(star)}
          onKeyDown={(e) => {
            if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              onChange && onChange(star);
            }
          }}
        >
          ⭐
        </motion.span>
      ))}
    </div>
  );
};

export default StarRating;