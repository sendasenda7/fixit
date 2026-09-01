from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande, Offre


class OffresListTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='client1', password='MotDePasse123!', role='client')
        self.artisan1 = User.objects.create_user(username='artisan1', password='MotDePasse123!', role='artisan')
        self.artisan2 = User.objects.create_user(username='artisan2', password='MotDePasse123!', role='artisan')
        self.demande = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte', client=self.client_user,
        )

    def test_seul_un_artisan_peut_faire_une_offre(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post('/api/offres/', {
            'demande': self.demande.id, 'prix_propose': '140', 'message': 'Je peux venir demain.',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_offre_reussie(self):
        self.client.force_authenticate(user=self.artisan1)
        response = self.client.post('/api/offres/', {
            'demande': self.demande.id, 'prix_propose': '140', 'message': 'Je peux venir demain.',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Offre.objects.filter(demande=self.demande, artisan=self.artisan1).count(), 1)

    def test_offre_en_double_refusee(self):
        Offre.objects.create(demande=self.demande, artisan=self.artisan1, prix_propose=Decimal('140'), message='Premier essai')
        self.client.force_authenticate(user=self.artisan1)
        response = self.client.post('/api/offres/', {
            'demande': self.demande.id, 'prix_propose': '135', 'message': 'Deuxième essai',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_offre_sur_demande_non_ouverte_refusee(self):
        self.demande.statut = 'en_cours'
        self.demande.save()
        self.client.force_authenticate(user=self.artisan1)
        response = self.client.post('/api/offres/', {
            'demande': self.demande.id, 'prix_propose': '140', 'message': 'Trop tard ?',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_artisan_ne_voit_pas_les_offres_des_concurrents(self):
        Offre.objects.create(demande=self.demande, artisan=self.artisan1, prix_propose=Decimal('140'), message='Offre 1')
        Offre.objects.create(demande=self.demande, artisan=self.artisan2, prix_propose=Decimal('130'), message='Offre 2')

        self.client.force_authenticate(user=self.artisan1)
        response = self.client.get(f'/api/offres/demande/{self.demande.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['message'], 'Offre 1')

    def test_client_proprietaire_voit_toutes_les_offres(self):
        Offre.objects.create(demande=self.demande, artisan=self.artisan1, prix_propose=Decimal('140'), message='Offre 1')
        Offre.objects.create(demande=self.demande, artisan=self.artisan2, prix_propose=Decimal('130'), message='Offre 2')

        self.client.force_authenticate(user=self.client_user)
        response = self.client.get(f'/api/offres/demande/{self.demande.id}/')
        self.assertEqual(len(response.data), 2)


class AccepterOffreTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='client1', password='MotDePasse123!', role='client')
        self.autre_client = User.objects.create_user(username='autre_client', password='MotDePasse123!', role='client')
        self.artisan1 = User.objects.create_user(username='artisan1', password='MotDePasse123!', role='artisan')
        self.artisan2 = User.objects.create_user(username='artisan2', password='MotDePasse123!', role='artisan')
        self.demande = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte', client=self.client_user,
        )
        self.offre1 = Offre.objects.create(demande=self.demande, artisan=self.artisan1, prix_propose=Decimal('140'), message='Offre 1')
        self.offre2 = Offre.objects.create(demande=self.demande, artisan=self.artisan2, prix_propose=Decimal('130'), message='Offre 2')

    def test_seul_le_proprietaire_de_la_demande_peut_accepter(self):
        self.client.force_authenticate(user=self.autre_client)
        response = self.client.post(f'/api/offres/{self.offre1.id}/accepter/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_acceptation_reussie_met_a_jour_statuts(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/offres/{self.offre1.id}/accepter/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.offre1.refresh_from_db()
        self.offre2.refresh_from_db()
        self.demande.refresh_from_db()

        self.assertTrue(self.offre1.est_acceptee)
        self.assertFalse(self.offre2.est_acceptee)
        self.assertEqual(self.demande.statut, 'en_cours')