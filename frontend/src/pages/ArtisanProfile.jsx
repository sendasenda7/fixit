import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import StarRating from '../components/StarRating';
import Navbar from '../components/Navbar';
import FavoriButton from '../components/FavoriButton';

const ICONES_SERVICE = {
  plomberie: '🚿',
  electricite: '⚡',
  peinture: '🎨',
  climatisation: '❄️',
  menuiserie: '🪚',
  reparation: '🔨',
  autre: '🔧',
};

const LABELS_SERVICE = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  peinture: 'Peinture',
  climatisation: 'Climatisation',
  menuiserie: 'Menuiserie',
  reparation: 'Réparation',
  autre: 'Autre',
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const ArtisanProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [artisan, setArtisan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState('');

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [competences, setCompetences] = useState('');
  const [saving, setSaving] = useState(false);
  const [reponseOuverte, setReponseOuverte] = useState(null); // id de l'avis en cours de réponse
  const [reponseTexte, setReponseTexte] = useState('');
  const [reponseEnvoi, setReponseEnvoi] = useState(false);
  const [reponseErreur, setReponseErreur] = useState('');
  const [fichierVerification, setFichierVerification] = useState(null);
  const [envoiVerification, setEnvoiVerification] = useState(false);
  const [erreurVerification, setErreurVerification] = useState('');

  const estMonProfil = user && String(user.id) === String(id);

  useEffect(() => {
    fetchArtisan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchArtisan = async () => {
    setLoading(true);
    setErreur('');
    try {
      const res = await api.get(`/artisans/${id}/`);
      setArtisan(res.data);
      setBio(res.data.bio || '');
      setCompetences(res.data.competences || '');
    } catch (err) {
      console.error(err);
      setErreur("Impossible de charger ce profil pour le moment.");
    } finally {
      setLoading(false);
    }
  };

   const enregistrer = async () => {
    setSaving(true);
    try {
      const res = await api.put('/profile/', { bio, competences });
      if (updateUser) updateUser({ bio: res.data.bio, competences: res.data.competences });
      await fetchArtisan(); // recharge le profil complet (recalcule competences_liste, etc.)
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("La mise à jour du profil a échoué. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

    const envoyerReponse = async (avisId) => {
    if (!reponseTexte.trim()) return;
    setReponseEnvoi(true);
    setReponseErreur('');
    try {
      const res = await api.post(`/evaluations/${avisId}/repondre/`, { reponse_artisan: reponseTexte.trim() });
      setArtisan((prev) => ({
        ...prev,
        avis: prev.avis.map((av) =>
          av.id === avisId
            ? { ...av, reponse_artisan: res.data.reponse_artisan, date_reponse: res.data.date_reponse }
            : av
        ),
      }));
      setReponseOuverte(null);
      setReponseTexte('');
    } catch (err) {
      console.error(err);
      setReponseErreur(err.response?.data?.error || "La réponse n'a pas pu être envoyée.");
    } finally {
      setReponseEnvoi(false);
    }
  };

    const soumettreVerification = async () => {
    if (!fichierVerification) return;
    setEnvoiVerification(true);
    setErreurVerification('');
    try {
      const formData = new FormData();
      formData.append('document_verification', fichierVerification);
      const res = await api.post('/verification/soumettre/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setArtisan((prev) => ({ ...prev, statut_verification: res.data.statut_verification }));
      setFichierVerification(null);
    } catch (err) {
      console.error(err);
      setErreurVerification(err.response?.data?.error || "L'envoi a échoué. Réessaie.");
    } finally {
      setEnvoiVerification(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <p style={{ textAlign: 'center', color: '#888', padding: '60px 0' }}>Chargement du profil…</p>
      </div>
    );
  }

  if (erreur || !artisan) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '40px', margin: 0 }}>⚠️</p>
          <p style={{ color: '#d32f2f' }}>{erreur || 'Artisan introuvable.'}</p>
          <button onClick={() => navigate('/artisans')} style={styles.retourBtn}>← Retour à l'annuaire</button>
        </div>
      </div>
    );
  }

  const competencesListe = artisan.competences_liste || [];

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* Bandeau d'en-tête */}
        <motion.div style={styles.headerCard} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Avatar photo={artisan.photo} name={artisan.username} size={88} fontSize={34} />
          <div style={styles.headerInfo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 style={styles.name}>{artisan.username}</h1>
              {artisan.est_verifie && <span style={styles.badgeVerifie}>✓ Vérifié</span>}
              {user?.role === 'client' && (
                <FavoriButton
                  estFavori={artisan.est_favori}
                  onToggle={async () => (await api.post(`/favoris/artisans/${artisan.id}/toggle/`)).data}
                  size={22}
                />
              )}
            </div>
            <p style={styles.metier}>
              {ICONES_SERVICE[artisan.specialite] || '🔧'} {LABELS_SERVICE[artisan.specialite] || 'Métier non précisé'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <StarRating value={Math.round(artisan.note_moyenne)} readOnly />
              <span style={styles.metaText}>
                {artisan.nb_avis > 0 ? `${artisan.note_moyenne} (${artisan.nb_avis} avis)` : "Pas encore d'avis"}
              </span>
              {artisan.adresse && <span style={styles.metaText}>📍 {artisan.adresse}</span>}
            </div>
          </div>

          {estMonProfil ? (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={styles.editBtn}
              onClick={() => setEditing((e) => !e)}
            >
              {editing ? 'Annuler' : '✏️ Modifier mon profil'}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={styles.editBtn}
              onClick={() => navigate('/nouvelle-demande', { state: { type_service: artisan.specialite || undefined } })}
            >
              Proposer une demande
            </motion.button>
          )}
        </motion.div>

        <div style={styles.grid}>
          {/* Colonne principale */}
          <div style={styles.mainCol}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Bio / Description</h2>
              {editing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Présentez votre expérience, vos spécialités, vos certifications…"
                  style={styles.textarea}
                />
              ) : artisan.bio ? (
                <p style={styles.bioText}>{artisan.bio}</p>
              ) : (
                <p style={styles.emptyText}>
                  {estMonProfil ? "Ajoute une bio pour que les clients te connaissent mieux." : 'Cet artisan n\'a pas encore renseigné de bio.'}
                </p>
              )}
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Compétences & Services</h2>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={competences}
                    onChange={(e) => setCompetences(e.target.value)}
                    placeholder="Ex: Installation Électrique, Domotique (KNX, Loxone), Mise aux normes"
                    style={styles.input}
                  />
                  <p style={styles.hint}>Sépare chaque compétence par une virgule.</p>
                </>
              ) : competencesListe.length > 0 ? (
                <div style={styles.tagsWrap}>
                  {competencesListe.map((c) => (
                    <span key={c} style={styles.tag}>{c}</span>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>
                  {estMonProfil ? 'Ajoute tes compétences pour te démarquer.' : 'Aucune compétence renseignée.'}
                </p>
              )}
            </div>

            {editing && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={enregistrer}
                disabled={saving}
                style={{ ...styles.saveBtn, opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </motion.button>
            )}

                        {estMonProfil && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Vérification d'identité</h2>

                {artisan.statut_verification === 'verifie' ? (
                  <p style={{ ...styles.emptyText, fontStyle: 'normal', color: '#00854a' }}>
                    ✅ Ton identité est vérifiée. Le badge "Vérifié" est visible sur ton profil.
                  </p>
                ) : (
                  <>
                    {artisan.statut_verification === 'en_attente' && (
                      <p style={{ ...styles.emptyText, fontStyle: 'normal', color: '#e65100' }}>
                        ⏳ Document envoyé, en attente de validation par notre équipe.
                      </p>
                    )}
                    {artisan.statut_verification === 'rejete' && (
                      <p style={{ ...styles.emptyText, fontStyle: 'normal', color: '#d32f2f' }}>
                        ❌ Demande refusée{artisan.motif_rejet ? ` : ${artisan.motif_rejet}` : ''}. Tu peux soumettre un nouveau document.
                      </p>
                    )}
                    {artisan.statut_verification === 'non_soumis' && (
                      <p style={styles.emptyText}>
                        Envoie une pièce d'identité ou un justificatif professionnel (CIN, matricule fiscal) pour obtenir le badge "Vérifié".
                      </p>
                    )}

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => setFichierVerification(e.target.files[0] || null)}
                      style={{ fontSize: '13px', marginTop: '10px' }}
                    />
                    {erreurVerification && <p style={{ ...styles.emptyText, color: '#d32f2f', fontStyle: 'normal' }}>{erreurVerification}</p>}
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={soumettreVerification}
                      disabled={!fichierVerification || envoiVerification}
                      style={{
                        ...styles.saveBtn, marginTop: '12px',
                        opacity: !fichierVerification || envoiVerification ? 0.5 : 1,
                      }}
                    >
                      {envoiVerification ? 'Envoi…' : 'Soumettre pour vérification'}
                    </motion.button>
                  </>
                )}
              </div>
            )}

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Dernières missions</h2>
              {artisan.dernieres_missions && artisan.dernieres_missions.length > 0 ? (
                <div>
                  {artisan.dernieres_missions.map((m) => (
                    <div key={m.id} style={styles.missionRow}>
                      <span style={styles.missionIcon}>{ICONES_SERVICE[m.type_service] || '🔧'}</span>
                      <div style={{ flex: 1 }}>
                        <p style={styles.missionTitre}>{m.titre}</p>
                        <p style={styles.missionMeta}>Terminée le {formatDate(m.date)} · {m.localisation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.emptyText}>Aucune mission terminée pour le moment.</p>
              )}
            </div>
          </div>

          {/* Colonne latérale */}
          <div style={styles.sideCol}>
            <div style={styles.statsRow}>
              <div style={styles.statCard}>
                <p style={styles.statValue}>{artisan.missions_completees}</p>
                <p style={styles.statLabel}>Missions</p>
              </div>
              <div style={{ ...styles.statCard, backgroundColor: '#e8f9ef' }}>
                <p style={{ ...styles.statValue, color: '#00854a' }}>{artisan.taux_reussite}%</p>
                <p style={styles.statLabel}>Taux de réussite</p>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Avis clients</h2>
              {artisan.avis && artisan.avis.length > 0 ? (
                artisan.avis.map((av) => (
                  <div key={av.id} style={styles.avisRow}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={styles.avisNom}>{av.client_nom}</span>
                      <StarRating value={av.note} readOnly />
                    </div>
                    <p style={styles.avisCommentaire}>"{av.commentaire}"</p>

                    {av.reponse_artisan ? (
                      <div style={styles.reponseBox}>
                        <p style={styles.reponseLabel}>💬 Réponse de l'artisan</p>
                        <p style={styles.reponseTexte}>{av.reponse_artisan}</p>
                      </div>
                    ) : estMonProfil ? (
                      reponseOuverte === av.id ? (
                        <div style={styles.reponseForm}>
                          <textarea
                            value={reponseTexte}
                            onChange={(e) => setReponseTexte(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            placeholder="Remercie ton client ou apporte une précision..."
                            style={styles.reponseTextarea}
                          />
                          {reponseErreur && <p style={{ ...styles.emptyText, color: '#d32f2f', fontStyle: 'normal' }}>{reponseErreur}</p>}
                          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <motion.button
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => envoyerReponse(av.id)}
                              disabled={reponseEnvoi}
                              style={{ ...styles.reponseSendBtn, opacity: reponseEnvoi ? 0.6 : 1 }}
                            >
                              {reponseEnvoi ? 'Envoi...' : 'Publier la réponse'}
                            </motion.button>
                            <button
                              onClick={() => { setReponseOuverte(null); setReponseTexte(''); setReponseErreur(''); }}
                              style={styles.reponseCancelBtn}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setReponseOuverte(av.id); setReponseTexte(''); setReponseErreur(''); }}
                          style={styles.reponseLienBtn}
                        >
                          Répondre à cet avis
                        </button>
                      )
                    ) : null}
                  </div>
                ))
              ) : (
                <p style={styles.emptyText}>Aucun avis pour le moment.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f4f6fb' },
  container: { maxWidth: '1000px', margin: '0 auto', padding: '36px 20px 60px' },
  retourBtn: {
    marginTop: '16px', border: 'none', backgroundColor: '#1a73e8', color: '#fff',
    padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
  },
  headerCard: {
    display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap',
    backgroundColor: '#fff', borderRadius: '18px', padding: '28px', marginBottom: '24px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.08)',
  },
  headerInfo: { flex: 1, minWidth: '220px' },
  name: { fontFamily: FONT_DISPLAY, fontSize: '24px', fontWeight: '700', margin: 0, color: '#1a1a2e' },
  badgeVerifie: {
    fontSize: '11px', fontWeight: '700', color: '#00854a', backgroundColor: '#e8f9ef',
    padding: '4px 10px', borderRadius: '20px',
  },
  metier: { fontSize: '14px', color: '#1a73e8', fontWeight: '600', margin: '4px 0 10px' },
  metaText: { fontSize: '13px', color: '#8a90a3' },
  editBtn: {
    border: 'none', backgroundColor: '#1a1a2e', color: '#fff',
    padding: '12px 22px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  grid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '18px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '18px' },
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '22px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.08)',
  },
  cardTitle: { fontFamily: FONT_DISPLAY, fontSize: '15px', fontWeight: '700', margin: '0 0 14px', color: '#1a1a2e' },
  bioText: { fontSize: '14px', lineHeight: 1.7, color: '#444', margin: 0, whiteSpace: 'pre-wrap' },
  emptyText: { fontSize: '13px', color: '#a8adba', margin: 0, fontStyle: 'italic' },
  textarea: {
    width: '100%', border: '1.5px solid #e2e5ee', borderRadius: '10px', padding: '12px 14px',
    fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
  },
  input: {
    width: '100%', border: '1.5px solid #e2e5ee', borderRadius: '10px', padding: '12px 14px',
    fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  hint: { fontSize: '12px', color: '#a8adba', margin: '8px 0 0' },
  tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: {
    fontSize: '12px', fontWeight: '600', color: '#1a73e8', backgroundColor: '#eaf2fe',
    padding: '7px 14px', borderRadius: '20px',
  },
  saveBtn: {
    border: 'none', backgroundColor: '#00c853', color: '#fff',
    padding: '13px', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
  missionRow: {
    display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0',
    borderBottom: '1px solid #f0f1f6',
  },
  missionIcon: { fontSize: '20px' },
  missionTitre: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e', margin: '0 0 2px' },
  missionMeta: { fontSize: '12px', color: '#8a90a3', margin: 0 },
  statsRow: { display: 'flex', gap: '14px' },
  statCard: {
    flex: 1, backgroundColor: '#eaf2fe', borderRadius: '14px', padding: '16px', textAlign: 'center',
  },
  statValue: { fontFamily: FONT_DISPLAY, fontSize: '24px', fontWeight: '700', margin: 0, color: '#1a73e8' },
  statLabel: { fontSize: '11px', color: '#6b7180', margin: '4px 0 0', fontWeight: '600' },
  avisRow: { padding: '12px 0', borderBottom: '1px solid #f0f1f6' },
  avisNom: { fontSize: '13px', fontWeight: '700', color: '#1a1a2e' },
  avisCommentaire: { fontSize: '13px', color: '#666', margin: '6px 0 0', lineHeight: 1.5 },
    reponseBox: {
    marginTop: '10px', backgroundColor: '#f4f6fb', borderRadius: '10px',
    padding: '10px 12px', borderLeft: '3px solid #1a73e8',
  },
  reponseLabel: { fontSize: '11px', fontWeight: '700', color: '#1a73e8', margin: '0 0 4px' },
  reponseTexte: { fontSize: '13px', color: '#444', margin: 0, lineHeight: 1.5 },
  reponseLienBtn: {
    marginTop: '8px', border: 'none', background: 'transparent', color: '#1a73e8',
    fontSize: '12px', fontWeight: '700', cursor: 'pointer', padding: 0,
  },
  reponseForm: { marginTop: '10px' },
  reponseTextarea: {
    width: '100%', border: '1.5px solid #e2e5ee', borderRadius: '10px', padding: '10px 12px',
    fontSize: '13px', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
  },
  reponseSendBtn: {
    border: 'none', backgroundColor: '#1a73e8', color: '#fff',
    padding: '9px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
  },
  reponseCancelBtn: {
    border: 'none', background: 'transparent', color: '#8a90a3',
    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
};

export default ArtisanProfile;