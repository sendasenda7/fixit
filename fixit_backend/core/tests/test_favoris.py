from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande, FavoriArtisan, FavoriDemande


class FavorisArtisanTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.autre_client = User.objects.create_user(username='ons', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan', specialite='plomberie')

    def test_seul_un_client_peut_ajouter_un_favori(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post(f'/api/favoris/artisans/{self.artisan.id}/toggle/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_ajoute_puis_retire(self):
        self.client.force_authenticate(user=self.client_user)

        response = self.client.post(f'/api/favoris/artisans/{self.artisan.id}/toggle/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['est_favori'])
        self.assertTrue(FavoriArtisan.objects.filter(client=self.client_user, artisan=self.artisan).exists())

        response = self.client.post(f'/api/favoris/artisans/{self.artisan.id}/toggle/')
        self.assertFalse(response.data['est_favori'])
        self.assertFalse(FavoriArtisan.objects.filter(client=self.client_user, artisan=self.artisan).exists())

    def test_liste_ne_retourne_que_les_favoris_du_client_connecte(self):
        FavoriArtisan.objects.create(client=self.client_user, artisan=self.artisan)

        self.client.force_authenticate(user=self.autre_client)
        response = self.client.get('/api/favoris/artisans/')
        self.assertEqual(response.data, [])

        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/favoris/artisans/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'karim')

    def test_est_favori_reflete_dans_artisan_detail(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertFalse(response.data['est_favori'])

        FavoriArtisan.objects.create(client=self.client_user, artisan=self.artisan)
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertTrue(response.data['est_favori'])

    def test_favori_inexistant_retourne_404(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post('/api/favoris/artisans/9999/toggle/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class FavorisDemandeTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan')
        self.autre_artisan = User.objects.create_user(username='sami', password='MotDePasse123!', role='artisan')
        self.demande = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte', client=self.client_user,
        )

    def test_seul_un_artisan_peut_sauvegarder_une_demande(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/favoris/demandes/{self.demande.id}/toggle/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_ajoute_puis_retire(self):
        self.client.force_authenticate(user=self.artisan)

        response = self.client.post(f'/api/favoris/demandes/{self.demande.id}/toggle/')
        self.assertTrue(response.data['est_favori'])
        self.assertTrue(FavoriDemande.objects.filter(artisan=self.artisan, demande=self.demande).exists())

        response = self.client.post(f'/api/favoris/demandes/{self.demande.id}/toggle/')
        self.assertFalse(response.data['est_favori'])

    def test_liste_scopee_par_artisan(self):
        FavoriDemande.objects.create(artisan=self.artisan, demande=self.demande)

        self.client.force_authenticate(user=self.autre_artisan)
        response = self.client.get('/api/favoris/demandes/')
        self.assertEqual(response.data, [])

        self.client.force_authenticate(user=self.artisan)
        response = self.client.get('/api/favoris/demandes/')
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['titre'], 'Fuite évier')

    def test_est_favori_reflete_dans_liste_demandes(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.get('/api/demandes/')
        resultat = next(d for d in response.data['results'] if d['id'] == self.demande.id)
        self.assertFalse(resultat['est_favori'])

        FavoriDemande.objects.create(artisan=self.artisan, demande=self.demande)
        response = self.client.get('/api/demandes/')
        resultat = next(d for d in response.data['results'] if d['id'] == self.demande.id)
        self.assertTrue(resultat['est_favori'])