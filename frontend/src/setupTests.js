import '@testing-library/jest-dom';

// Polyfills requis par react-router-dom v7 dans l'environnement de test Jest/jsdom
// (jsdom ne fournit pas TextEncoder/TextDecoder nativement dans cette version).
import { TextEncoder, TextDecoder } from 'util';
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill minimal pour IntersectionObserver, utilisé par LandingPage pour les
// animations au scroll — absent de jsdom, qui ne fait pas de vrai rendu de page.
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}