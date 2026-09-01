from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Demande


class DemandesListTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='client1', password='MotDePasse123!', role='client')
        self.artisan_user = User.objects.create_user(username='artisan1', password='MotDePasse123!', role='artisan')

        self.d_plomberie = Demande.objects.create(
            titre='Fuite évier', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('150'), statut='ouverte',
            urgent=True, client=self.client_user,
        )
        self.d_electricite = Demande.objects.create(
            titre='Panne électrique', description='...', type_service='electricite',
            localisation='Ariana', budget=Decimal('600'), statut='ouverte',
            urgent=False, client=self.client_user,
        )
        self.d_terminee = Demande.objects.create(
            titre='Peinture salon', description='...', type_service='peinture',
            localisation='Sousse', budget=Decimal('400'), statut='terminee',
            client=self.client_user,
        )

    def test_liste_publique_sans_authentification(self):
        response = self.client.get('/api/demandes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_filtre_statut(self):
        response = self.client.get('/api/demandes/?statut=ouverte')
        titres = [d['titre'] for d in response.data['results']]
        self.assertIn('Fuite évier', titres)
        self.assertNotIn('Peinture salon', titres)

    def test_filtre_multi_service(self):
        response = self.client.get('/api/demandes/?type_service=plomberie,electricite')
        titres = [d['titre'] for d in response.data['results']]
        self.assertIn('Fuite évier', titres)
        self.assertIn('Panne électrique', titres)
        self.assertNotIn('Peinture salon', titres)

    def test_filtre_budget_min_max(self):
        response = self.client.get('/api/demandes/?budget_min=200&budget_max=700')
        titres = [d['titre'] for d in response.data['results']]
        self.assertIn('Panne électrique', titres)
        self.assertNotIn('Fuite évier', titres)  # budget 150, en dessous du min

    def test_filtre_urgent(self):
        response = self.client.get('/api/demandes/?urgent=1')
        titres = [d['titre'] for d in response.data['results']]
        self.assertEqual(titres, ['Fuite évier'])

    def test_creation_necessite_authentification(self):
        response = self.client.post('/api/demandes/', {
            'titre': 'Test', 'description': 'Test', 'type_service': 'plomberie',
            'localisation': 'Tunis', 'budget': '100',
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_seul_un_client_peut_creer_une_demande(self):
        self.client.force_authenticate(user=self.artisan_user)
        response = self.client.post('/api/demandes/', {
            'titre': 'Test', 'description': 'Test', 'type_service': 'plomberie',
            'localisation': 'Tunis', 'budget': '100',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creation_reussie_par_un_client(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post('/api/demandes/', {
            'titre': 'Nouvelle demande', 'description': 'Description', 'type_service': 'menuiserie',
            'localisation': 'Nabeul', 'budget': '300', 'urgent': True,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Demande.objects.filter(titre='Nouvelle demande').count(), 1)
        self.assertTrue(Demande.objects.get(titre='Nouvelle demande').urgent)


class DemandeDetailTests(APITestCase):
    def setUp(self):
        self.proprietaire = User.objects.create_user(username='proprio', password='MotDePasse123!', role='client')
        self.autre_client = User.objects.create_user(username='autre', password='MotDePasse123!', role='client')
        self.demande = Demande.objects.create(
            titre='Ma demande', description='...', type_service='plomberie',
            localisation='Tunis', budget=Decimal('100'), client=self.proprietaire,
        )

    def test_modification_par_un_autre_client_refusee(self):
        self.client.force_authenticate(user=self.autre_client)
        response = self.client.put(f'/api/demandes/{self.demande.id}/', {'titre': 'Piraté'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_modification_par_le_proprietaire_reussie(self):
        self.client.force_authenticate(user=self.proprietaire)
        response = self.client.put(f'/api/demandes/{self.demande.id}/', {'titre': 'Titre modifié'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.demande.refresh_from_db()
        self.assertEqual(self.demande.titre, 'Titre modifié')