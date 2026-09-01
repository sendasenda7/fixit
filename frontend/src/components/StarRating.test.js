import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating', () => {
  test('affiche 5 étoiles', () => {
    render(<StarRating value={3} onChange={() => {}} />);
    expect(screen.getAllByText('⭐')).toHaveLength(5);
  });

  test('mode lecture seule : aucun rôle interactif, pas de clic possible', () => {
    const onChange = jest.fn();
    render(<StarRating value={4} onChange={onChange} readOnly />);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  test('clic sur une étoile déclenche onChange avec la bonne valeur', () => {
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    const etoiles = screen.getAllByRole('radio');
    fireEvent.click(etoiles[2]); // 3e étoile
    expect(onChange).toHaveBeenCalledWith(3);
  });

  test("touche Entrée sur une étoile déclenche onChange", () => {
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    const etoiles = screen.getAllByRole('radio');
    fireEvent.keyDown(etoiles[4], { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  test('en readOnly, onChange n\'est jamais appelé au clic', () => {
    const onChange = jest.fn();
    const { container } = render(<StarRating value={2} onChange={onChange} readOnly />);
    const spans = container.querySelectorAll('span');
    fireEvent.click(spans[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});