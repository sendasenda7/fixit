import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const services = [
  { id: 'plomberie', icon: '🚿', label: 'Plomberie', desc: 'Fuite, installation, robinetterie' },
  { id: 'electricite', icon: '⚡', label: 'Électricité', desc: 'Câblage, tableau, prises' },
  { id: 'peinture', icon: '🎨', label: 'Peinture', desc: 'Intérieur, extérieur, décoration' },
  { id: 'reparation', icon: '🔨', label: 'Réparation', desc: 'Meubles, appareils, divers' },
  { id: 'climatisation', icon: '❄️', label: 'Climatisation', desc: 'Installation, maintenance' },
  { id: 'menuiserie', icon: '🪚', label: 'Menuiserie', desc: 'Portes, fenêtres, bois' },
  { id: 'autre', icon: '🔧', label: 'Autre', desc: 'Tout autre service' },
];

// ========== STEP 1 ==========
const Step1 = ({ formData, setFormData, errors }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
  >
    <h2 style={styles.stepTitle}>🔧 Quel service recherchez-vous ?</h2>
    <p style={styles.stepDesc}>Sélectionnez le type de service dont vous avez besoin</p>
    {errors.type_service && (
      <p style={styles.errorMsg}>❌ {errors.type_service}</p>
    )}
    <div style={styles.servicesGrid}>
      {services.map((service, i) => (
        <motion.div
          key={service.id}
          style={{
            ...styles.serviceCard,
            border: formData.type_service === service.id ? '2px solid #1a73e8' : '2px solid #e0e0e0',
            backgroundColor: formData.type_service === service.id ? '#e8f4fd' : '#fff',
          }}
          onClick={() => setFormData({ ...formData, type_service: service.id })}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          whileHover={{ y: -3, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
          whileTap={{ scale: 0.97 }}
        >
          <div style={styles.serviceCardIcon}>{service.icon}</div>
          <h4 style={styles.serviceCardLabel}>{service.label}</h4>
          <p style={styles.serviceCardDesc}>{service.desc}</p>
          {formData.type_service === service.id && (
            <motion.div
              style={styles.selectedBadge}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >✓</motion.div>
          )}
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// ========== STEP 2 ==========
const Step2 = ({ formData, setFormData, errors }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
  >
    <h2 style={styles.stepTitle}>📝 Décrivez votre problème</h2>
    <p style={styles.stepDesc}>Plus c'est détaillé, meilleures seront les offres reçues</p>

    <div style={styles.formGroup}>
      <label style={styles.label}>Titre de la demande *</label>
      <input
        type="text"
        name="titre"
        placeholder="ex: Fuite d'eau sous l'évier de cuisine"
        value={formData.titre}
        onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
        style={{
          ...styles.input,
          borderColor: errors.titre ? '#d32f2f' : '#e0e0e0',
        }}
      />
      {errors.titre && <p style={styles.errorMsg}>❌ {errors.titre}</p>}
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>Description détaillée *</label>
      <textarea
        name="description"
        placeholder="Décrivez le problème en détail..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={6}
        style={{
          ...styles.textarea,
          borderColor: errors.description ? '#d32f2f' : '#e0e0e0',
        }}
      />
      {errors.description && <p style={styles.errorMsg}>❌ {errors.description}</p>}
      <p style={styles.charCount}>{formData.description.length} caractères</p>
    </div>

    <div style={styles.selectedService}>
      <span>Service sélectionné : </span>
      <strong style={{ color: '#1a73e8' }}>
        {services.find(s => s.id === formData.type_service)?.icon}{' '}
        {services.find(s => s.id === formData.type_service)?.label}
      </strong>
    </div>
  </motion.div>
);

// ========== STEP 3 ==========
const Step3 = ({ formData, setFormData, errors }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
  >
    <h2 style={styles.stepTitle}>📍 Localisation & Budget</h2>
    <p style={styles.stepDesc}>Indiquez où vous êtes et combien vous souhaitez dépenser</p>

    <div style={styles.formGroup}>
      <label style={styles.label}>Localisation *</label>
      <input
        type="text"
        name="localisation"
        placeholder="ex: Tunis, La Marsa, Sfax..."
        value={formData.localisation}
        onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
        style={{
          ...styles.input,
          borderColor: errors.localisation ? '#d32f2f' : '#e0e0e0',
        }}
      />
      {errors.localisation && <p style={styles.errorMsg}>❌ {errors.localisation}</p>}
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>Budget estimé (TND) *</label>
      <input
        type="number"
        name="budget"
        min="1"
        placeholder="ex: 150"
        value={formData.budget}
        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
        style={{
          ...styles.input,
          borderColor: errors.budget ? '#d32f2f' : '#e0e0e0',
        }}
      />
      {errors.budget && <p style={styles.errorMsg}>❌ {errors.budget}</p>}
    </div>

    {/* Budgets suggérés */}
    <div style={styles.budgetSuggestions}>
      <p style={styles.suggestLabel}>Budgets suggérés :</p>
      <div style={styles.suggestBtns}>
        {['50', '100', '200', '500', '1000'].map((b) => (
          <motion.button
            key={b}
            style={{
              ...styles.suggestBtn,
              backgroundColor: formData.budget === b ? '#1a73e8' : '#f0f0f0',
              color: formData.budget === b ? '#fff' : '#333',
            }}
            onClick={() => setFormData({ ...formData, budget: b })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {b} TND
          </motion.button>
        ))}
      </div>
    </div>

    {errors.submit && (
      <div style={styles.submitError}>❌ {errors.submit}</div>
    )}

    {/* Récapitulatif */}
    <div style={styles.recap}>
      <h4 style={styles.recapTitle}>📋 Récapitulatif</h4>
      <div style={styles.recapGrid}>
        {[
          { label: 'Service', value: `${services.find(s => s.id === formData.type_service)?.icon} ${services.find(s => s.id === formData.type_service)?.label}` },
          { label: 'Titre', value: formData.titre || '—' },
          { label: 'Localisation', value: formData.localisation || '—' },
          { label: 'Budget', value: formData.budget ? `${formData.budget} TND` : '—' },
        ].map((item) => (
          <div key={item.label} style={styles.recapItem}>
            <span style={styles.recapLabel}>{item.label}</span>
            <span style={styles.recapValue}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

// ========== COMPOSANT PRINCIPAL ==========
const NouvelleDemande = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const serviceInitial = location.state?.type_service || '';
  const [step, setStep] = useState(serviceInitial ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    type_service: serviceInitial,
    localisation: '',
    budget: '',
  });
  const [errors, setErrors] = useState({});

  const validateStep = () => {
    const newErrors = {};
    if (step === 1 && !formData.type_service)
      newErrors.type_service = 'Veuillez choisir un service';
    if (step === 2) {
      if (!formData.titre) newErrors.titre = 'Titre requis';
      if (!formData.description) newErrors.description = 'Description requise';
    }
    if (step === 3) {
      if (!formData.localisation) newErrors.localisation = 'Localisation requise';
      if (!formData.budget) newErrors.budget = 'Budget requis';
      else if (Number(formData.budget) <= 0) newErrors.budget = 'Le budget doit être supérieur à 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => { if (validateStep()) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

const handleSubmit = async () => {
  if (!validateStep()) return;
  setLoading(true);
  try {
    await api.post('/demandes/', formData);
    setSuccess(true);
    setTimeout(() => navigate('/dashboard'), 2500);
  } catch (err) {
    const data = err.response?.data;
    const message = data ? Object.values(data)[0] : 'Erreur lors de la publication. Réessayez !';
    setErrors({ submit: Array.isArray(message) ? message[0] : message });
  } finally {
    setLoading(false);
  }
};

  if (success) {
    return (
      <div style={styles.successPage}>
        <motion.div
          style={styles.successBox}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <motion.div
            style={styles.successIcon}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: 2, duration: 0.5 }}
          >🎉</motion.div>
          <h2 style={styles.successTitle}>Demande publiée !</h2>
          <p style={styles.successDesc}>
            Votre demande a été publiée avec succès. Les artisans vont vous contacter très bientôt !
          </p>
          <motion.div
            style={styles.successLoader}
            animate={{ width: ['0%', '100%'] }}
            transition={{ duration: 2.5 }}
          />
          <p style={{ color: '#888', fontSize: '13px' }}>Redirection vers le dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <motion.div
        style={styles.pageHeader}
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <motion.button
          style={styles.backBtn}
          onClick={() => navigate('/dashboard')}
          whileHover={{ x: -3 }}
        >
          ← Retour
        </motion.button>
        <div style={styles.pageHeaderLogo}>
          <span style={{ color: '#1a73e8', fontWeight: '800', fontSize: '20px' }}>Fix</span>
          <span style={{ color: '#00c853', fontWeight: '800', fontSize: '20px' }}>It</span>
        </div>
      </motion.div>

      <div style={styles.formContainer}>
        <motion.div
          style={styles.formCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={styles.formCardHeader}>
            <h1 style={styles.formCardTitle}>➕ Nouvelle Demande</h1>
            <p style={styles.formCardSubtitle}>
              Publiez votre demande et recevez des offres d'artisans qualifiés
            </p>
          </div>

          {/* Barre de progression */}
          <div style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={styles.progressStep}>
                <motion.div
                  style={{
                    ...styles.progressCircle,
                    backgroundColor: s <= step ? '#1a73e8' : '#e0e0e0',
                    color: s <= step ? '#fff' : '#aaa',
                  }}
                  animate={{ scale: s === step ? 1.2 : 1 }}
                  transition={{ type: 'spring' }}
                >
                  {s < step ? '✓' : s}
                </motion.div>
                <p style={{
                  ...styles.progressLabel,
                  color: s <= step ? '#1a73e8' : '#aaa',
                  fontWeight: s === step ? '700' : '400',
                }}>
                  {s === 1 ? 'Service' : s === 2 ? 'Détails' : 'Budget'}
                </p>
                {s < 3 && (
                  <div style={{
                    ...styles.progressLine,
                    backgroundColor: s < step ? '#1a73e8' : '#e0e0e0',
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Steps */}
          <AnimatePresence mode="wait">
            <div key={step}>
              {step === 1 && <Step1 formData={formData} setFormData={setFormData} errors={errors} />}
              {step === 2 && <Step2 formData={formData} setFormData={setFormData} errors={errors} />}
              {step === 3 && <Step3 formData={formData} setFormData={setFormData} errors={errors} />}
            </div>
          </AnimatePresence>

          {/* Boutons */}
          <div style={styles.navButtons}>
            {step > 1 && (
              <motion.button
                style={styles.prevBtn}
                onClick={prevStep}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                ← Précédent
              </motion.button>
            )}
            {step < 3 ? (
              <motion.button
                style={styles.nextBtn}
                onClick={nextStep}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Suivant →
              </motion.button>
            ) : (
              <motion.button
                style={loading ? styles.submitBtnDisabled : styles.submitBtn}
                onClick={handleSubmit}
                disabled={loading}
                whileHover={!loading ? { scale: 1.03 } : {}}
                whileTap={!loading ? { scale: 0.97 } : {}}
              >
                {loading ? '⏳ Publication...' : '🚀 Publier la demande'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', backgroundColor: '#f8faff' },
  pageHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '20px 40px',
    backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  },
  backBtn: {
    backgroundColor: 'transparent', border: 'none',
    color: '#1a73e8', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  },
  pageHeaderLogo: { display: 'flex' },
  formContainer: { maxWidth: '750px', margin: '40px auto', padding: '0 20px' },
  formCard: {
    backgroundColor: '#fff', borderRadius: '24px',
    padding: '40px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  },
  formCardHeader: { marginBottom: '30px', textAlign: 'center' },
  formCardTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', margin: '0 0 8px' },
  formCardSubtitle: { fontSize: '15px', color: '#888', margin: 0 },
  progressContainer: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'flex-start', marginBottom: '40px',
  },
  progressStep: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', position: 'relative',
  },
  progressCircle: {
    width: '40px', height: '40px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '16px', fontWeight: '800', zIndex: 1,
  },
  progressLabel: { fontSize: '12px', marginTop: '8px', textAlign: 'center' },
  progressLine: {
    position: 'absolute', top: '20px', left: '40px',
    width: '120px', height: '2px', zIndex: 0,
  },
  stepTitle: { fontSize: '22px', fontWeight: '800', color: '#1a1a2e', marginBottom: '8px' },
  stepDesc: { fontSize: '14px', color: '#888', marginBottom: '25px' },
  servicesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px', marginBottom: '10px',
  },
  serviceCard: {
    borderRadius: '14px', padding: '20px 15px',
    textAlign: 'center', cursor: 'pointer', position: 'relative',
  },
  serviceCardIcon: { fontSize: '32px', marginBottom: '8px' },
  serviceCardLabel: { fontSize: '14px', fontWeight: '700', color: '#1a1a2e', margin: '0 0 4px' },
  serviceCardDesc: { fontSize: '11px', color: '#888', margin: 0 },
  selectedBadge: {
    position: 'absolute', top: '8px', right: '8px',
    width: '22px', height: '22px', borderRadius: '50%',
    backgroundColor: '#1a73e8', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '12px', fontWeight: '800',
  },
  formGroup: { marginBottom: '20px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#333', display: 'block', marginBottom: '8px' },
  input: {
    width: '100%', padding: '14px 16px', borderRadius: '10px',
    border: '2px solid #e0e0e0', fontSize: '15px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  },
  textarea: {
    width: '100%', padding: '14px 16px', borderRadius: '10px',
    border: '2px solid #e0e0e0', fontSize: '15px', outline: 'none',
    resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  charCount: { fontSize: '12px', color: '#aaa', textAlign: 'right', margin: '5px 0 0' },
  selectedService: {
    backgroundColor: '#e8f4fd', padding: '12px 16px',
    borderRadius: '10px', fontSize: '14px', color: '#555',
  },
  budgetSuggestions: { marginBottom: '25px' },
  suggestLabel: { fontSize: '13px', color: '#888', marginBottom: '10px' },
  suggestBtns: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  suggestBtn: {
    padding: '8px 16px', borderRadius: '20px', border: 'none',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  submitError: {
    backgroundColor: '#ffe8e8', color: '#d32f2f',
    padding: '12px 16px', borderRadius: '10px',
    fontSize: '14px', marginBottom: '20px',
  },
  recap: {
    backgroundColor: '#f8faff', borderRadius: '14px',
    padding: '20px', border: '1px solid #e0e0e0',
  },
  recapTitle: { fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '15px' },
  recapGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  recapItem: { display: 'flex', flexDirection: 'column', gap: '3px' },
  recapLabel: { fontSize: '11px', color: '#888', textTransform: 'uppercase' },
  recapValue: { fontSize: '14px', fontWeight: '600', color: '#1a1a2e' },
  navButtons: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginTop: '30px', paddingTop: '20px',
    borderTop: '1px solid #f0f0f0',
  },
  prevBtn: {
    padding: '12px 25px', backgroundColor: '#f0f0f0',
    color: '#333', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
  },
  nextBtn: {
    padding: '12px 25px', backgroundColor: '#1a73e8',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    marginLeft: 'auto',
  },
  submitBtn: {
    padding: '12px 30px', backgroundColor: '#00c853',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '700', cursor: 'pointer',
    marginLeft: 'auto',
  },
  submitBtnDisabled: {
    padding: '12px 30px', backgroundColor: '#a5d6a7',
    color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '700', cursor: 'not-allowed',
    marginLeft: 'auto',
  },
  errorMsg: { color: '#d32f2f', fontSize: '13px', margin: '5px 0 0' },
  successPage: {
    minHeight: '100vh', backgroundColor: '#f8faff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  successBox: {
    backgroundColor: '#fff', borderRadius: '24px',
    padding: '60px 50px', textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)', maxWidth: '450px',
  },
  successIcon: { fontSize: '70px', marginBottom: '20px' },
  successTitle: { fontSize: '28px', fontWeight: '800', color: '#1a1a2e', marginBottom: '15px' },
  successDesc: { fontSize: '15px', color: '#888', lineHeight: '1.7', marginBottom: '25px' },
  successLoader: {
    height: '4px', backgroundColor: '#00c853',
    borderRadius: '2px', marginBottom: '15px',
  },
};

export default NouvelleDemande;