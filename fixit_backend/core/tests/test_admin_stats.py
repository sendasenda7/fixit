from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande, Evaluation, Signalement


class AdminStatsTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(username='staff', password='MotDePasse123!', role='client', is_staff=True)
        self.non_staff = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(
            username='karim', password='MotDePasse123!', role='artisan', statut_verification='verifie',
        )
        self.demande_ouverte = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte', client=self.non_staff,
        )
        self.demande_terminee = Demande.objects.create(
            titre='Peinture salon', description='...', type_service='peinture',
            localisation='Sousse', budget=Decimal('400'), statut='terminee', client=self.non_staff,
        )
        Evaluation.objects.create(client=self.non_staff, artisan=self.artisan, note=4, commentaire='Bien.')
        Signalement.objects.create(auteur=self.non_staff, utilisateur_signale=self.artisan, motif='spam')

    def test_reserve_au_staff(self):
        self.client.force_authenticate(user=self.non_staff)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_necessite_authentification(self):
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_stats_correctes(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/admin/stats/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data['total_clients'], 2)
        self.assertEqual(data['total_artisans'], 1)
        self.assertEqual(data['artisans_verifies'], 1)
        self.assertEqual(data['total_demandes'], 2)
        self.assertEqual(data['missions_terminees'], 1)
        self.assertEqual(data['demandes_par_statut'].get('ouverte'), 1)
        self.assertEqual(data['demandes_par_statut'].get('terminee'), 1)
        self.assertEqual(data['note_moyenne_globale'], 4.0)
        self.assertEqual(data['total_avis'], 1)
        self.assertEqual(data['signalements_en_attente'], 1)
        self.assertEqual(len(data['inscriptions_7j']), 7)