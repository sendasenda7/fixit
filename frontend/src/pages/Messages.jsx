import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// ================================
// CONSTANTES D'AFFICHAGE
// ================================
const ICONES_SERVICE = {
  plomberie: '🚿',
  electricite: '⚡',
  peinture: '🎨',
  climatisation: '❄️',
  menuiserie: '🪚',
  reparation: '🔨',
  autre: '🔧',
};

// Reprend exactement le code couleur des statuts utilisé sur les dashboards,
// pour que le statut d'un chantier se lise pareil partout dans l'app.
const STATUTS = {
  ouverte: { label: 'Ouverte', bg: '#e8f5e9', couleur: '#2e7d32' },
  en_cours: { label: 'En cours', bg: '#fff3e0', couleur: '#e65100' },
  terminee: { label: 'Terminée', bg: '#e3f2fd', couleur: '#1565c0' },
};

const iconeService = (type) => ICONES_SERVICE[type] || ICONES_SERVICE.autre;
const infosStatut = (statut) => STATUTS[statut] || STATUTS.ouverte;

const formatSeparateurDate = (dateStr) => {
  const date = new Date(dateStr);
  const aujourdhui = new Date();
  const hier = new Date();
  hier.setDate(aujourdhui.getDate() - 1);
  const memesJours = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (memesJours(date, aujourdhui)) return "Aujourd'hui";
  if (memesJours(date, hier)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
};

// Regroupe les messages par jour pour insérer des séparateurs de date
const grouperParJour = (messages) => {
  const groupes = [];
  let jourCourant = null;
  messages.forEach((msg) => {
    const cle = new Date(msg.date_creation).toDateString();
    if (cle !== jourCourant) {
      groupes.push({ type: 'separateur', cle, label: formatSeparateurDate(msg.date_creation) });
      jourCourant = cle;
    }
    groupes.push({ type: 'message', data: msg });
  });
  return groupes;
};

const Messages = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [texte, setTexte] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [authLoading, user, navigate]);

  const chargerConversations = useCallback(async () => {
    try {
      const res = await api.get('/conversations/');
      setConversations(res.data);
      return res.data;
    } catch {
      setErreur('Impossible de charger les conversations');
      return [];
    }
  }, []);

  const chargerMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      const res = await api.get(`/conversations/${conversationId}/messages/`);
      setMessages(res.data);
    } catch {
      setErreur('Impossible de charger les messages');
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingConversations(true);
      const convs = await chargerConversations();
      setLoadingConversations(false);
      const paramId = searchParams.get('conversation');
      if (paramId) {
        setActiveId(Number(paramId));
      } else if (convs.length > 0) {
        setActiveId(convs[0].id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!activeId) return;
    chargerMessages(activeId);

    pollingRef.current = setInterval(() => {
      chargerMessages(activeId);
      chargerConversations();
    }, 5000);

    return () => clearInterval(pollingRef.current);
  }, [activeId, chargerMessages, chargerConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const envoyerMessage = async (e) => {
    e.preventDefault();
    const contenu = texte.trim();
    if (!contenu || !activeId) return;

    setEnvoiEnCours(true);
    setErreur('');
    try {
      const res = await api.post(`/conversations/${activeId}/messages/`, { contenu });
      setMessages((prev) => [...prev, res.data]);
      setTexte('');
      chargerConversations();
    } catch {
      setErreur("Le message n'a pas pu être envoyé — réessaie");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const conversationActive = conversations.find((c) => c.id === activeId);
  const groupesMessages = grouperParJour(messages);

  if (authLoading || !user) return null;

  return (
    <div style={styles.page}>
      {/* Police d'accent utilisée uniquement pour les en-têtes de cette page */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap');
        .fx-scroll::-webkit-scrollbar { width: 6px; }
        .fx-scroll::-webkit-scrollbar-thumb { background: #dfe3ee; border-radius: 10px; }
        .fx-msg-input:focus { border-color: #1a73e8 !important; box-shadow: 0 0 0 3px rgba(26,115,232,0.12); }
        @media (max-width: 760px) {
          .fx-container { flex-direction: column !important; height: auto !important; min-height: 85vh; }
          .fx-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid #eee; max-height: 260px; }
          .fx-chat { min-height: 420px; }
        }
      `}</style>

      <div style={styles.container} className="fx-container">
        {/* ===== Colonne des chantiers en discussion ===== */}
        <div style={styles.sidebar} className="fx-sidebar">
          <div style={styles.sidebarHeader}>
            <button onClick={() => navigate('/dashboard')} style={styles.backBtn} aria-label="Retour au tableau de bord">
              ←
            </button>
            <div>
              <p style={styles.eyebrow}>FIXIT · SUIVI</p>
              <h2 style={styles.sidebarTitle}>Messages</h2>
            </div>
          </div>

          {loadingConversations ? (
            <p style={styles.infoText}>Chargement des chantiers…</p>
          ) : conversations.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={{ fontSize: '34px' }}>🧰</span>
              <p style={styles.emptyTitle}>Aucun chantier en discussion</p>
              <p style={styles.emptyText}>
                Contacte un artisan depuis une offre, ou un client depuis une de tes offres envoyées,
                pour démarrer un échange.
              </p>
            </div>
          ) : (
            <div style={styles.convList} className="fx-scroll">
              {conversations.map((conv) => {
                const autreNom = user.role === 'artisan' ? conv.client_nom : conv.artisan_nom;
                const statut = infosStatut(conv.demande_statut);
                const active = activeId === conv.id;
                return (
                  <motion.div
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    style={{
                      ...styles.convItem,
                      ...(active ? styles.convItemActive : {}),
                      borderLeftColor: statut.couleur,
                    }}
                    whileHover={{ backgroundColor: active ? '#eef3fd' : '#fafbff' }}
                  >
                    <div style={{ ...styles.convIcon, backgroundColor: statut.bg }}>
                      {iconeService(conv.demande_type_service)}
                    </div>
                    <div style={styles.convPerforation} />
                    <div style={styles.convInfo}>
                      <div style={styles.convTop}>
                        <span style={styles.convNom}>{autreNom}</span>
                        {conv.non_lus > 0 && <span style={styles.badge}>{conv.non_lus}</span>}
                      </div>
                      <span style={styles.convDemande}>{conv.demande_titre}</span>
                      {conv.dernier_message && (
                        <span style={styles.convApercu}>
                          {conv.dernier_message.contenu.slice(0, 42)}
                          {conv.dernier_message.contenu.length > 42 ? '…' : ''}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== Fil de discussion ===== */}
        <div style={styles.chat} className="fx-chat">
          {!conversationActive ? (
            <div style={styles.emptyChat}>
              <span style={{ fontSize: '42px' }}>💬</span>
              <p style={styles.emptyChatTitle}>Choisis un chantier à gauche</p>
              <p style={styles.emptyChatText}>La discussion associée s'affichera ici.</p>
            </div>
          ) : (
            <>
              <div style={styles.chatHeader}>
                <div
                  style={{
                    ...styles.chatIcon,
                    backgroundColor: infosStatut(conversationActive.demande_statut).bg,
                  }}
                >
                  {iconeService(conversationActive.demande_type_service)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={styles.eyebrow}>CHANTIER</p>
                  <p style={styles.chatNom}>
                    {user.role === 'artisan' ? conversationActive.client_nom : conversationActive.artisan_nom}
                  </p>
                  <p style={styles.chatDemande}>{conversationActive.demande_titre}</p>
                </div>
                <span
                  style={{
                    ...styles.statutBadge,
                    backgroundColor: infosStatut(conversationActive.demande_statut).bg,
                    color: infosStatut(conversationActive.demande_statut).couleur,
                  }}
                >
                  {infosStatut(conversationActive.demande_statut).label}
                </span>
              </div>

              <div style={styles.chatBody} className="fx-scroll">
                {groupesMessages.length === 0 ? (
                  <div style={styles.emptyThread}>
                    <p style={styles.emptyChatText}>
                      Aucun message pour l'instant. Écris le premier pour lancer la discussion sur ce chantier.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {groupesMessages.map((item) =>
                      item.type === 'separateur' ? (
                        <div key={item.cle} style={styles.dateSeparator}>
                          <span style={styles.dateSeparatorText}>{item.label}</span>
                        </div>
                      ) : (
                        <motion.div
                          key={item.data.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          style={{
                            ...styles.bulleWrap,
                            justifyContent: item.data.expediteur === user.id ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              ...styles.bulle,
                              ...(item.data.expediteur === user.id ? styles.bulleMoi : styles.bulleAutre),
                            }}
                          >
                            <p style={{ margin: 0 }}>{item.data.contenu}</p>
                            <span style={styles.bulleHeure}>
                              {new Date(item.data.date_creation).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </motion.div>
                      )
                    )}
                  </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
              </div>

              {erreur && <p style={styles.erreur}>{erreur}</p>}

              <form onSubmit={envoyerMessage} style={styles.form}>
                <input
                  type="text"
                  className="fx-msg-input"
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  placeholder="Écris ton message…"
                  style={styles.input}
                />
                <motion.button
                  type="submit"
                  disabled={envoiEnCours || !texte.trim()}
                  style={{
                    ...styles.sendBtn,
                    opacity: envoiEnCours || !texte.trim() ? 0.5 : 1,
                    cursor: envoiEnCours || !texte.trim() ? 'not-allowed' : 'pointer',
                  }}
                  whileHover={!envoiEnCours && texte.trim() ? { scale: 1.05 } : {}}
                  whileTap={!envoiEnCours && texte.trim() ? { scale: 0.95 } : {}}
                >
                  ➤
                </motion.button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const FONT_DISPLAY = "'Space Grotesk', 'Segoe UI', sans-serif";

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f4f6fb',
    padding: '30px',
    boxSizing: 'border-box',
  },
  container: {
    display: 'flex',
    maxWidth: '1100px',
    margin: '0 auto',
    height: '80vh',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(20,30,60,0.08)',
    overflow: 'hidden',
  },
  sidebar: {
    width: '340px',
    borderRight: '1px solid #eee',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  backBtn: {
    border: 'none',
    background: '#f4f6fb',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '16px',
    cursor: 'pointer',
    color: '#1a73e8',
    flexShrink: 0,
  },
  eyebrow: {
    margin: 0,
    fontFamily: FONT_DISPLAY,
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '1.2px',
    color: '#9aa3b8',
  },
  sidebarTitle: {
    margin: '2px 0 0',
    fontFamily: FONT_DISPLAY,
    fontSize: '21px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  infoText: {
    padding: '20px',
    color: '#888',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  emptyState: {
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '8px',
  },
  emptyTitle: {
    margin: 0,
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    color: '#1a1a2e',
    fontSize: '15px',
  },
  emptyText: {
    margin: 0,
    color: '#888',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  convList: {
    overflowY: 'auto',
    flex: 1,
  },
  convItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0',
    padding: '14px 18px 14px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f5f5f5',
    borderLeft: '4px solid transparent',
  },
  convItemActive: {
    backgroundColor: '#eef3fd',
  },
  convIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '17px',
    flexShrink: 0,
  },
  convPerforation: {
    width: '1px',
    alignSelf: 'stretch',
    margin: '2px 12px',
    backgroundImage: 'repeating-linear-gradient(to bottom, #e2e5ee 0, #e2e5ee 3px, transparent 3px, transparent 7px)',
  },
  convInfo: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flex: 1,
    gap: '2px',
  },
  convTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  convNom: {
    fontWeight: '600',
    color: '#1a1a2e',
    fontSize: '14px',
  },
  badge: {
    backgroundColor: '#e53935',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold',
    borderRadius: '10px',
    padding: '1px 7px',
    marginLeft: 'auto',
  },
  convDemande: {
    fontSize: '12px',
    color: '#1a73e8',
    fontWeight: 500,
  },
  convApercu: {
    fontSize: '12px',
    color: '#8a90a3',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  chat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#aaa',
  },
  emptyChatTitle: {
    margin: 0,
    fontFamily: FONT_DISPLAY,
    fontWeight: 600,
    color: '#555',
  },
  emptyChatText: {
    margin: 0,
    fontSize: '13px',
    color: '#999',
  },
  emptyThread: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '20px',
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '16px 24px',
    borderBottom: '1px solid #eee',
  },
  chatIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  chatNom: {
    margin: '1px 0 0',
    fontFamily: FONT_DISPLAY,
    fontWeight: 700,
    fontSize: '16px',
    color: '#1a1a2e',
  },
  chatDemande: {
    margin: 0,
    fontSize: '13px',
    color: '#888',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statutBadge: {
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 700,
    flexShrink: 0,
  },
  chatBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  dateSeparator: {
    display: 'flex',
    justifyContent: 'center',
    margin: '10px 0',
  },
  dateSeparatorText: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa3b8',
    backgroundColor: '#f4f6fb',
    padding: '4px 12px',
    borderRadius: '10px',
    letterSpacing: '0.4px',
  },
  bulleWrap: {
    display: 'flex',
  },
  bulle: {
    maxWidth: '65%',
    padding: '10px 14px',
    borderRadius: '14px',
    fontSize: '14px',
    lineHeight: 1.45,
  },
  bulleMoi: {
    background: 'linear-gradient(135deg, #1a73e8, #0f5fd6)',
    color: '#fff',
    borderBottomRightRadius: '4px',
  },
  bulleAutre: {
    backgroundColor: '#f0f2f5',
    color: '#1a1a2e',
    borderBottomLeftRadius: '4px',
  },
  bulleHeure: {
    display: 'block',
    fontSize: '10px',
    opacity: 0.7,
    marginTop: '4px',
    textAlign: 'right',
  },
  erreur: {
    color: '#e53935',
    fontSize: '13px',
    padding: '0 24px',
  },
  form: {
    display: 'flex',
    gap: '10px',
    padding: '16px 24px',
    borderTop: '1px solid #eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '25px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#1a73e8',
    color: '#fff',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

export default Messages;
