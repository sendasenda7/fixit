import React from 'react';
import { motion } from 'framer-motion';

/**
 * Pagination : Précédent / numéros de page (avec … si trop de pages) / Suivant.
 * page et totalPages sont 1-indexés. onChange reçoit le nouveau numéro de page.
 */
const Pagination = ({ page, totalPages, onChange, accentColor = '#1a1a2e' }) => {
  if (totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set([1, totalPages, page, page - 1, page + 1]);
    return Array.from(pages)
      .filter(p => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  };

  const pages = getPages();

  return (
    <div style={styles.wrap}>
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        style={{ ...styles.navBtn, backgroundColor: accentColor, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
      >
        ← Précédent
      </button>

      <div style={styles.numbers}>
        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <React.Fragment key={p}>
              {showEllipsis && <span style={styles.ellipsis}>…</span>}
              <motion.button
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                aria-label={`Page ${p}`}
                whileHover={p !== page ? { scale: 1.08 } : {}}
                whileTap={{ scale: 0.95 }}
                style={{
                  ...styles.numBtn,
                  ...(p === page ? { backgroundColor: accentColor, color: '#fff' } : {}),
                }}
              >
                {p}
              </motion.button>
            </React.Fragment>
          );
        })}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        style={{ ...styles.navBtn, backgroundColor: accentColor, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}
      >
        Suivant →
      </button>
    </div>
  );
};

const styles = {
  wrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', padding: '10px 0' },
  navBtn: { border: 'none', color: '#fff', padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700' },
  numbers: { display: 'flex', alignItems: 'center', gap: '4px' },
  numBtn: {
    border: 'none', backgroundColor: '#f0f0f0', color: '#333',
    width: '32px', height: '32px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  ellipsis: { color: '#aaa', fontSize: '13px', padding: '0 2px' },
};

export default Pagination;