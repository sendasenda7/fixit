from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande, Offre, Evaluation


class ArtisansListTests(APITestCase):
    def setUp(self):
        self.artisan = User.objects.create_user(
            username='karim', password='MotDePasse123!', role='artisan', specialite='plomberie',
        )
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')

    def test_liste_ne_contient_que_des_artisans(self):
        response = self.client.get('/api/artisans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [a['username'] for a in response.data['results']]
        self.assertIn('karim', usernames)
        self.assertNotIn('hela', usernames)

    def test_accessible_sans_authentification(self):
        self.client.logout()
        response = self.client.get('/api/artisans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ArtisanDetailTests(APITestCase):
    def setUp(self):
        self.artisan = User.objects.create_user(
            username='karim', password='MotDePasse123!', role='artisan', specialite='plomberie',
            bio='Plombier expérimenté.', competences='Fuites, Chauffe-eau, Sanitaires',
        )
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')

        self.demande = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='terminee', client=self.client_user,
        )
        self.offre = Offre.objects.create(
            demande=self.demande, artisan=self.artisan, prix_propose=Decimal('140'),
            message='...', est_acceptee=True,
        )
        Evaluation.objects.create(
            client=self.client_user, artisan=self.artisan, note=5, commentaire='Excellent travail !',
        )

    def test_detail_artisan_existant(self):
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['bio'], 'Plombier expérimenté.')
        self.assertEqual(response.data['competences_liste'], ['Fuites', 'Chauffe-eau', 'Sanitaires'])

    def test_detail_calcule_missions_completees(self):
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertEqual(response.data['missions_completees'], 1)
        self.assertEqual(response.data['taux_reussite'], 100)

    def test_detail_inclut_les_avis(self):
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertEqual(len(response.data['avis']), 1)
        self.assertEqual(response.data['avis'][0]['note'], 5)

    def test_detail_client_retourne_404(self):
        response = self.client.get(f'/api/artisans/{self.client_user.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_detail_id_inexistant_retourne_404(self):
        response = self.client.get('/api/artisans/9999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)