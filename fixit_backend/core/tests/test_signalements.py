from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande, Signalement


class SignalerUtilisateurTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan')
        self.staff = User.objects.create_user(username='staff', password='MotDePasse123!', role='client', is_staff=True)

    def test_necessite_authentification(self):
        response = self.client.post(f'/api/signalements/utilisateur/{self.artisan.id}/', {'motif': 'spam'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_signalement_reussi(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/signalements/utilisateur/{self.artisan.id}/', {
            'motif': 'comportement', 'description': 'Ne répond jamais aux messages.',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Signalement.objects.filter(auteur=self.client_user, utilisateur_signale=self.artisan).exists())

    def test_ne_peut_pas_se_signaler_soi_meme(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post(f'/api/signalements/utilisateur/{self.artisan.id}/', {'motif': 'spam'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_motif_invalide_refuse(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/signalements/utilisateur/{self.artisan.id}/', {'motif': 'inexistant'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_signalement_en_attente_refuse(self):
        self.client.force_authenticate(user=self.client_user)
        self.client.post(f'/api/signalements/utilisateur/{self.artisan.id}/', {'motif': 'spam'})
        response = self.client.post(f'/api/signalements/utilisateur/{self.artisan.id}/', {'motif': 'arnaque'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_utilisateur_inexistant_404(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post('/api/signalements/utilisateur/9999/', {'motif': 'spam'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class SignalerDemandeTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan')
        self.demande = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte', client=self.client_user,
        )

    def test_signalement_reussi(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post(f'/api/signalements/demande/{self.demande.id}/', {
            'motif': 'arnaque', 'description': 'Budget irréaliste, semble suspect.',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_client_ne_peut_pas_signaler_sa_propre_demande(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/signalements/demande/{self.demande.id}/', {'motif': 'spam'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_double_signalement_en_attente_refuse(self):
        self.client.force_authenticate(user=self.artisan)
        self.client.post(f'/api/signalements/demande/{self.demande.id}/', {'motif': 'spam'})
        response = self.client.post(f'/api/signalements/demande/{self.demande.id}/', {'motif': 'autre'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReviewSignalementsTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan')
        self.staff = User.objects.create_user(username='staff', password='MotDePasse123!', role='client', is_staff=True)
        self.signalement = Signalement.objects.create(
            auteur=self.client_user, utilisateur_signale=self.artisan, motif='spam',
        )

    def test_liste_reservee_au_staff(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.get('/api/signalements/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_liste_visible_par_staff(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/signalements/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filtre_par_statut(self):
        Signalement.objects.create(auteur=self.client_user, demande_signalee=None, utilisateur_signale=self.artisan, motif='autre', statut='traite')
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/signalements/?statut=nouveau')
        self.assertEqual(len(response.data), 1)

    def test_traiter_signalement(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(f'/api/signalements/{self.signalement.id}/traiter/', {'statut': 'traite'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.signalement.refresh_from_db()
        self.assertEqual(self.signalement.statut, 'traite')
        self.assertIsNotNone(self.signalement.date_traitement)

    def test_traiter_par_non_staff_refuse(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/signalements/{self.signalement.id}/traiter/', {'statut': 'traite'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)