import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  test('affiche une erreur si les champs sont vides à la soumission', async () => {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Merci de renseigner votre nom d'utilisateur et votre mot de passe."
    );
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('appelle login puis redirige vers /dashboard en cas de succès', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1, username: 'karim' });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), { target: { value: 'karim' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('karim', 'MotDePasse123!'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  test('affiche un message générique si les identifiants sont incorrects', async () => {
    mockLogin.mockRejectedValueOnce({ response: { status: 400 } });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), { target: { value: 'karim' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'mauvais' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Identifiants incorrects. Réessayez !');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('affiche un message spécifique en cas de rate limiting (429)', async () => {
    mockLogin.mockRejectedValueOnce({ response: { status: 429 } });
    renderLogin();

    fireEvent.change(screen.getByLabelText(/nom d'utilisateur/i), { target: { value: 'karim' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Trop de tentatives. Merci de patienter avant de réessayer.'
    );
  });
});