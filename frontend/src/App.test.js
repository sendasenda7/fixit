import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

test("l'application démarre et affiche la page d'accueil FixIt", () => {
  render(
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
  expect(screen.getAllByText(/FixIt/i).length).toBeGreaterThan(0);
});