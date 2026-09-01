import { render, screen } from '@testing-library/react';

import Avatar from './Avatar';



describe('Avatar', () => {

  test("affiche l'image quand une photo est fournie", () => {

    render(<Avatar photo="/media/photos/karim.jpg" name="Karim" />);

    const img = screen.getByAltText('Karim');

    expect(img).toBeInTheDocument();

    expect(img).toHaveAttribute('src', '/media/photos/karim.jpg');

  });



  test("affiche l'initiale en majuscule quand aucune photo n'est fournie", () => {

    render(<Avatar name="karim" />);

    expect(screen.getByText('K')).toBeInTheDocument();

  });



  test("affiche '?' quand aucun nom n'est fourni", () => {

    render(<Avatar />);

    expect(screen.getByText('?')).toBeInTheDocument();

  });



  test('applique la taille demandée', () => {

    const { container } = render(<Avatar name="Sami" size={64} />);

    const el = container.firstChild;

    expect(el).toHaveStyle({ width: '64px', height: '64px' });

  });

});