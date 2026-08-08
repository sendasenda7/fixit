import React, { useId } from 'react';
import { motion } from 'framer-motion';

/**
 * Champ de formulaire réutilisé dans les modals du Dashboard.
 * `useId()` (React 18+) génère un id stable et unique par instance,
 * pour que <label htmlFor> soit toujours correctement lié à l'input —
 * ce qui manquait dans les 6 modals d'origine.
 */
const FormField = ({ label, type = 'text', value, onChange, placeholder, theme, error, accent = '#1a73e8', ...rest }) => {
  const fieldId = useId();

  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={fieldId} style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px', color: theme?.text || '#333' }}>
        {label}
      </label>
      <motion.input
        id={fieldId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        whileFocus={{ borderColor: accent, scale: 1.01 }}
        aria-invalid={error ? 'true' : undefined}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: '10px',
          border: error ? '2px solid #d32f2f' : '2px solid #e0e0e0',
          fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
          backgroundColor: theme?.bg || '#fff', color: theme?.text || '#1a1a2e',
        }}
        {...rest}
      />
      {error && <span style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block' }}>{error}</span>}
    </div>
  );
};

export default FormField;