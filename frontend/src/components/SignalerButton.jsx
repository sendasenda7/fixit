import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';

const MOTIFS = [
  { value: 'spam', label: 'Spam ou publicité' },
  { value: 'contenu_inapproprie', label: 'Contenu inapproprié' },
  { value: 'arnaque', label: 'Arnaque ou fraude suspectée' },
  { value: 'comportement', label: 'Comportement abusif' },
  { value: 'autre', label: 'Autre' },
];

/**
 * Bouton discret "Signaler" + modal de sélection de motif.
 * `onSubmit(motif, description)` doit envoyer la requête (POST) et peut lever une erreur.
 * `label` : texte du bouton déclencheur (par défaut "🚩 Signaler").
 */
const SignalerButton = ({ onSubmit, label = '🚩 Signaler', style }) => {
  const [open, setOpen] = useState(false);
  const [motif, setMotif] = useState('');
  const [description, setDescription] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState(false);

  const fermer = () => {
    setOpen(false);
    setTimeout(() => { setMotif(''); setDescription(''); setErreur(''); setSucces(false); }, 200);
  };

  const envoyer = async () => {
    if (!motif) {
      setErreur('Choisis un motif.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      await onSubmit(motif, description.trim());
      setSucces(true);
      setTimeout(fermer, 1500);
    } catch (err) {
      setErreur(err.response?.data?.error || "Le signalement n'a pas pu être envoyé.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        style={{
          border: 'none', background: 'transparent', color: '#a8adba',
          fontSize: '12px', fontWeight: '600', cursor: 'pointer', padding: '4px',
          ...style,
        }}
      >
        {label}
      </button>

      <Modal open={open} onClose={fermer} title="Signaler" maxWidth="400px">
        {succes ? (
          <p style={{ color: '#00854a', fontSize: '14px', fontWeight: '600' }}>
            ✅ Signalement envoyé. Merci, notre équipe va l'examiner.
          </p>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: '#8a90a3', margin: '0 0 16px' }}>
              Explique-nous pourquoi ce contenu te semble problématique. Ton signalement reste confidentiel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {MOTIFS.map((m) => (
                <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="radio" name="motif" value={m.value} checked={motif === m.value}
                    onChange={() => setMotif(m.value)} />
                  {m.label}
                </label>
              ))}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Détails complémentaires (optionnel)"
              style={{
                width: '100%', border: '1.5px solid #e2e5ee', borderRadius: '10px', padding: '10px 12px',
                fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            {erreur && <p style={{ color: '#d32f2f', fontSize: '12px', margin: '8px 0 0' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={envoyer}
                disabled={envoi}
                style={{
                  flex: 1, border: 'none', backgroundColor: '#d32f2f', color: '#fff',
                  padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer', opacity: envoi ? 0.6 : 1,
                }}
              >
                {envoi ? 'Envoi…' : 'Envoyer le signalement'}
              </motion.button>
              <button onClick={fermer} style={{
                border: 'none', background: '#f0f0f0', color: '#555',
                padding: '11px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}>
                Annuler
              </button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
};

export default SignalerButton;