import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import Navbar from '../components/Navbar';

// Hook pour détecter quand un élément est visible
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
};

// Composant animé au scroll
const AnimatedSection = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

const LandingPage = () => {
  const [searchText, setSearchText] = useState('');
  const [counter, setCounter] = useState({ artisans: 0, clients: 0, satisfaction: 0 });
  const [statsRef, statsInView] = useInView();

  // Animation des compteurs
  useEffect(() => {
    if (statsInView) {
      const duration = 2000;
      const steps = 60;
      const interval = duration / steps;
      let step = 0;
      const timer = setInterval(() => {
        step++;
        setCounter({
          artisans: Math.floor((step / steps) * 500),
          clients: Math.floor((step / steps) * 2000),
          satisfaction: Math.floor((step / steps) * 98),
        });
        if (step >= steps) clearInterval(timer);
      }, interval);
    }
  }, [statsInView]);

  // Suggestions de recherche
  const suggestions = ['Plombier', 'Électricien', 'Peintre', 'Menuisier', 'Climatisation'];
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState('');

  useEffect(() => {
    let charIndex = 0;
    let currentText = suggestions[suggestionIndex];
    const typing = setInterval(() => {
      if (charIndex <= currentText.length) {
        setPlaceholder(currentText.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typing);
        setTimeout(() => {
          setSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        }, 1500);
      }
    }, 100);
    return () => clearInterval(typing);
  }, [suggestionIndex]);

  return (
    <div style={{ overflowX: 'hidden' }}>
      <Navbar />

      {/* ========== HERO ========== */}
      <section style={styles.hero}>
        <motion.div
          style={styles.heroLeft}
          initial={{ opacity: 0, x: -80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.p
            style={styles.heroBadge}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            🔧 Plateforme N°1 en Tunisie
          </motion.p>

          <motion.h1
            style={styles.heroTitle}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            Trouvez rapidement un artisan
            <span style={styles.heroTitleBlue}> près de vous</span>
          </motion.h1>

          <motion.p
            style={styles.heroSubtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Plomberie, électricité, réparation... Des artisans qualifiés
            disponibles rapidement pour tous vos travaux.
          </motion.p>

          {/* Barre de recherche animée */}
          <motion.div
            style={styles.searchBar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <input
              type="text"
              placeholder={`Rechercher un ${placeholder}...`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={styles.searchInput}
            />
            <motion.button
              style={styles.searchBtn}
              whileHover={{ backgroundColor: '#1557b0', scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔍 Rechercher
            </motion.button>
          </motion.div>

          {/* Compteurs animés */}
          <div ref={statsRef} style={styles.stats}>
            {[
              { num: counter.artisans + '+', label: 'Artisans' },
              { num: counter.clients + '+', label: 'Clients' },
              { num: counter.satisfaction + '%', label: 'Satisfaction' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                style={styles.stat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <strong style={styles.statNum}>{stat.num}</strong>
                <span style={styles.statLabel}>{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Image hero animée */}
        <motion.div
          style={styles.heroRight}
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <motion.div
            style={styles.heroImageBox}
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <div style={styles.heroEmoji}>👨‍🔧</div>
            <motion.div
              style={styles.heroBubble}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, type: 'spring' }}
            >
              ✅ Artisan disponible maintenant !
            </motion.div>

            {/* Badges flottants */}
            <motion.div
              style={{ ...styles.floatingBadge, top: '20px', right: '-20px' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            >
              ⭐ 4.9/5
            </motion.div>
            <motion.div
              style={{ ...styles.floatingBadge, top: '80px', left: '-30px' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 1 }}
            >
              🔧 500+ Artisans
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ========== COMMENT ÇA MARCHE ========== */}
      <section id="comment" style={styles.howSection}>
        <AnimatedSection>
          <h2 style={styles.sectionTitle}>Comment ça marche ?</h2>
          <p style={styles.sectionSubtitle}>3 étapes simples pour résoudre vos problèmes</p>
        </AnimatedSection>

        <div style={styles.steps}>
          {[
            { num: '1', icon: '📝', title: 'Publiez votre demande', desc: 'Décrivez votre problème et votre budget en quelques secondes.' },
            { num: '2', icon: '💼', title: 'Recevez des offres', desc: 'Des artisans qualifiés vous envoient leurs meilleures offres.' },
            { num: '3', icon: '⭐', title: 'Choisissez et évaluez', desc: "Choisissez l'artisan et laissez un avis après le travail." },
          ].map((step, i) => (
            <AnimatedSection key={step.num} delay={i * 0.2}>
              <motion.div
                style={styles.stepCard}
                whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(26,115,232,0.15)' }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  style={styles.stepNum}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                >
                  {step.num}
                </motion.div>
                <div style={styles.stepIcon}>{step.icon}</div>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ========== SERVICES ========== */}
      <section id="services" style={styles.servicesSection}>
        <AnimatedSection>
          <h2 style={styles.sectionTitle}>Nos Services</h2>
          <p style={styles.sectionSubtitle}>Tous les services dont vous avez besoin</p>
        </AnimatedSection>

        <div style={styles.servicesGrid}>
          {[
            { icon: '🚿', name: 'Plomberie', color: '#e3f2fd' },
            { icon: '⚡', name: 'Électricité', color: '#fff8e1' },
            { icon: '🔨', name: 'Réparation', color: '#fce4ec' },
            { icon: '🎨', name: 'Peinture', color: '#f3e5f5' },
            { icon: '❄️', name: 'Climatisation', color: '#e0f7fa' },
            { icon: '🪚', name: 'Menuiserie', color: '#f1f8e9' },
          ].map((service, i) => (
            <AnimatedSection key={service.name} delay={i * 0.1}>
              <motion.div
                style={{ ...styles.serviceCard, backgroundColor: service.color }}
                whileHover={{ scale: 1.08, y: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <motion.div
                  style={styles.serviceIcon}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                >
                  {service.icon}
                </motion.div>
                <p style={styles.serviceName}>{service.name}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ========== AVANTAGES ========== */}
      <section id="avantages" style={styles.avantagesSection}>
        <AnimatedSection>
          <div style={styles.avantagesLeft}>
            <h2 style={styles.avantagesTitle}>
              Pourquoi choisir FixIt pour vos travaux ?
            </h2>
            <p style={styles.avantagesDesc}>
              FixIt vous connecte avec les meilleurs artisans de votre région,
              rapidement et en toute sécurité.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" style={styles.avantagesBtn}>
                Commencer maintenant →
              </Link>
            </motion.div>
          </div>
        </AnimatedSection>

        <div style={styles.avantagesRight}>
          {[
            { icon: '✅', title: 'Artisans vérifiés', desc: 'Tous nos artisans sont vérifiés et notés par la communauté.' },
            { icon: '⚡', title: 'Réponse rapide', desc: 'Recevez des offres en moins de 30 minutes.' },
            { icon: '💰', title: 'Meilleur prix', desc: 'Comparez les offres et choisissez le meilleur rapport qualité/prix.' },
            { icon: '🛡️', title: 'Garantie qualité', desc: 'Satisfaction garantie ou remboursement.' },
          ].map((av, i) => (
            <AnimatedSection key={av.title} delay={i * 0.15}>
              <motion.div
                style={styles.avantageCard}
                whileHover={{ x: 10, backgroundColor: '#eef4ff' }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.span
                  style={styles.avantageIcon}
                  whileHover={{ scale: 1.3, rotate: 10 }}
                >
                  {av.icon}
                </motion.span>
                <div>
                  <h4 style={styles.avantageTitle}>{av.title}</h4>
                  <p style={styles.avantageDesc}>{av.desc}</p>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ========== CTA ========== */}
      <AnimatedSection>
        <section style={styles.ctaSection}>
          <motion.h2
            style={styles.ctaTitle}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Prêt à démarrer votre projet ?
          </motion.h2>
          <p style={styles.ctaSubtitle}>Rejoignez des milliers de clients satisfaits</p>
          <div style={styles.ctaButtons}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" style={styles.ctaBtnPrimary}>
                Publier une demande
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/register" style={styles.ctaBtnSecondary}>
                Devenir artisan
              </Link>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* ========== FOOTER ========== */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerCol}>
            <div style={styles.footerLogo}>
              <span style={{ color: '#1a73e8' }}>Fix</span>
              <span style={{ color: '#00c853' }}>It</span>
            </div>
            <p style={styles.footerDesc}>
              La plateforme qui connecte clients et artisans qualifiés en Tunisie.
            </p>
            <div style={styles.footerSocials}>
              {['📘', '📸', '🐦'].map((s) => (
                <motion.span
                  key={s}
                  style={styles.socialBtn}
                  whileHover={{ scale: 1.3, y: -3 }}
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>Services</h4>
            <ul style={styles.footerList}>
              {['🚿 Plomberie', '⚡ Électricité', '🔨 Réparation', '🎨 Peinture', '❄️ Climatisation'].map((s) => (
                <motion.li key={s} whileHover={{ x: 5, color: '#fff' }}>{s}</motion.li>
              ))}
            </ul>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>Liens utiles</h4>
            <ul style={styles.footerList}>
              {['🏠 Accueil', 'ℹ️ Comment ça marche', '🔐 Se connecter', '📝 S\'inscrire'].map((s) => (
                <motion.li key={s} whileHover={{ x: 5, color: '#fff' }}>{s}</motion.li>
              ))}
            </ul>
          </div>
          <div style={styles.footerCol}>
            <h4 style={styles.footerColTitle}>Contact</h4>
            <ul style={styles.footerList}>
              <li>📍 Tunis, Tunisie</li>
              <li>📞 +216 XX XXX XXX</li>
              <li>✉️ contact@fixit.tn</li>
              <li>🕐 Lun-Ven : 8h - 18h</li>
            </ul>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p>© 2026 FixIt – Tous droits réservés</p>
          <p>Fait avec ❤️ en Tunisie</p>
        </div>
      </footer>
    </div>
  );
};

const styles = {
  hero: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '80px 60px',
    background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)',
    minHeight: '90vh',
  },
  heroLeft: { flex: 1, maxWidth: '550px' },
  heroBadge: {
    display: 'inline-block',
    backgroundColor: '#e8f4fd',
    color: '#1a73e8',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '800',
    lineHeight: '1.2',
    color: '#1a1a2e',
    marginBottom: '20px',
  },
  heroTitleBlue: { color: '#1a73e8' },
  heroSubtitle: {
    fontSize: '17px',
    color: '#666',
    lineHeight: '1.7',
    marginBottom: '35px',
  },
  searchBar: {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: '50px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
    overflow: 'hidden',
    marginBottom: '35px',
  },
  searchInput: {
    flex: 1,
    padding: '16px 24px',
    border: 'none',
    outline: 'none',
    fontSize: '15px',
  },
  searchBtn: {
    padding: '16px 30px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  },
  stats: { display: 'flex', gap: '40px' },
  stat: { display: 'flex', flexDirection: 'column' },
  statNum: { fontSize: '28px', fontWeight: '800', color: '#1a73e8' },
  statLabel: { fontSize: '14px', color: '#888' },
  heroRight: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageBox: {
    width: '350px',
    height: '350px',
    backgroundColor: '#e8f4fd',
    borderRadius: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroEmoji: { fontSize: '120px' },
  heroBubble: {
    position: 'absolute',
    bottom: '20px',
    backgroundColor: '#fff',
    padding: '10px 20px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    fontSize: '14px',
    fontWeight: '600',
    color: '#00c853',
  },
  floatingBadge: {
    position: 'absolute',
    backgroundColor: '#fff',
    padding: '8px 14px',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  },
  howSection: {
    padding: '80px 60px',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: '12px',
  },
  sectionSubtitle: {
    fontSize: '16px',
    color: '#888',
    marginBottom: '50px',
  },
  steps: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
  },
  stepCard: {
    backgroundColor: '#f8faff',
    borderRadius: '20px',
    padding: '40px 30px',
    flex: 1,
    maxWidth: '300px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  stepNum: {
    width: '40px',
    height: '40px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '18px',
    margin: '0 auto 15px',
    cursor: 'pointer',
  },
  stepIcon: { fontSize: '40px', marginBottom: '15px' },
  stepTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '10px',
  },
  stepDesc: { fontSize: '14px', color: '#888', lineHeight: '1.6' },
  servicesSection: {
    padding: '80px 60px',
    backgroundColor: '#f8faff',
    textAlign: 'center',
  },
  servicesGrid: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  serviceCard: {
    borderRadius: '15px',
    padding: '30px 25px',
    width: '150px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  serviceIcon: { fontSize: '40px', marginBottom: '10px' },
  serviceName: { fontSize: '14px', fontWeight: '600', color: '#333' },
  avantagesSection: {
    display: 'flex',
    padding: '80px 60px',
    backgroundColor: '#fff',
    gap: '60px',
    alignItems: 'center',
  },
  avantagesLeft: { flex: 1 },
  avantagesTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#1a1a2e',
    marginBottom: '20px',
    lineHeight: '1.3',
  },
  avantagesDesc: {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.7',
    marginBottom: '30px',
  },
  avantagesBtn: {
    display: 'inline-block',
    padding: '14px 30px',
    backgroundColor: '#1a73e8',
    color: '#fff',
    borderRadius: '30px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '16px',
  },
  avantagesRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  avantageCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    backgroundColor: '#f8faff',
    padding: '20px',
    borderRadius: '15px',
    cursor: 'pointer',
  },
  avantageIcon: { fontSize: '28px', cursor: 'pointer' },
  avantageTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: '5px',
  },
  avantageDesc: { fontSize: '14px', color: '#888' },
  ctaSection: {
    padding: '80px 60px',
    background: 'linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)',
    textAlign: 'center',
    color: '#fff',
  },
  ctaTitle: {
    fontSize: '40px',
    fontWeight: '800',
    marginBottom: '15px',
  },
  ctaSubtitle: {
    fontSize: '18px',
    opacity: 0.85,
    marginBottom: '40px',
  },
  ctaButtons: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
  },
  ctaBtnPrimary: {
    padding: '16px 35px',
    backgroundColor: '#00c853',
    color: '#fff',
    borderRadius: '30px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '16px',
    display: 'inline-block',
  },
  ctaBtnSecondary: {
    padding: '16px 35px',
    backgroundColor: 'transparent',
    color: '#fff',
    borderRadius: '30px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '16px',
    border: '2px solid #fff',
    display: 'inline-block',
  },
  footer: {
    backgroundColor: '#1a1a2e',
    color: '#ccc',
    padding: '60px 60px 20px',
  },
  footerContent: {
    display: 'flex',
    gap: '40px',
    justifyContent: 'space-between',
    marginBottom: '40px',
  },
  footerCol: { flex: 1 },
  footerLogo: {
    fontSize: '28px',
    fontWeight: '800',
    marginBottom: '15px',
  },
  footerDesc: {
    fontSize: '14px',
    color: '#888',
    lineHeight: '1.7',
    marginBottom: '20px',
  },
  footerSocials: {
    display: 'flex',
    gap: '10px',
  },
  socialBtn: {
    fontSize: '22px',
    cursor: 'pointer',
  },
  footerColTitle: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '15px',
  },
  footerList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px',
    color: '#888',
    cursor: 'pointer',
  },
  footerBottom: {
    borderTop: '1px solid #333',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#666',
  },
};

export default LandingPage;