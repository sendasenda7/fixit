import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test("l'application démarre et affiche la page d'accueil FixIt", () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  expect(screen.getAllByText(/FixIt/i).length).toBeGreaterThan(0);
});