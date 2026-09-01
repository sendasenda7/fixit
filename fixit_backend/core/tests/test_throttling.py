from decimal import Decimal

from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande, Conversation


class OffreThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()  # le throttle DRF utilise le cache Django ; on repart propre à chaque test
        self.client_user = User.objects.create_user(username='client1', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='artisan1', password='MotDePasse123!', role='artisan')
        self.client.force_authenticate(user=self.artisan)

    def _poster_offre(self, demande_id, prix):
        return self.client.post('/api/offres/', {
            'demande': demande_id, 'prix_propose': str(prix), 'message': 'Disponible rapidement.',
        })

    def test_bloque_apres_le_seuil(self):
        # Taux configuré : 10/min. On crée 11 demandes distinctes pour ne pas
        # déclencher la règle "une seule offre par demande" avant le throttle.
        demandes = [
            Demande.objects.create(
                titre=f'Demande {i}', description='...', type_service='plomberie',
                localisation='Tunis', budget=Decimal('100'), statut='ouverte', client=self.client_user,
            )
            for i in range(11)
        ]

        for i in range(10):
            response = self._poster_offre(demandes[i].id, 100 + i)
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"échec à la tentative {i+1}")

        # 11e tentative dans la même minute → throttlée
        response = self._poster_offre(demandes[10].id, 200)
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_get_non_comptabilise_dans_le_throttle(self):
        # Le listing (GET) ne doit jamais être limité par ce throttle, même
        # après de nombreux appels.
        for _ in range(20):
            response = self.client.get('/api/offres/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)


class MessageThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.client_user = User.objects.create_user(username='client1', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='artisan1', password='MotDePasse123!', role='artisan')
        self.demande = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte', client=self.client_user,
        )
        self.conversation = Conversation.objects.create(demande=self.demande, artisan=self.artisan)
        self.client.force_authenticate(user=self.client_user)

    def test_bloque_apres_le_seuil(self):
        # Taux configuré : 30/min
        for i in range(30):
            response = self.client.post(f'/api/conversations/{self.conversation.id}/messages/', {'contenu': f'Message {i}'})
            self.assertEqual(response.status_code, status.HTTP_201_CREATED, f"échec au message {i+1}")

        response = self.client.post(f'/api/conversations/{self.conversation.id}/messages/', {'contenu': 'Message de trop'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_get_non_comptabilise_dans_le_throttle(self):
        for _ in range(40):
            response = self.client.get(f'/api/conversations/{self.conversation.id}/messages/')
            self.assertEqual(response.status_code, status.HTTP_200_OK)