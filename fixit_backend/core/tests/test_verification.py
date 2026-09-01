from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User


class SoumettreVerificationTests(APITestCase):
    def setUp(self):
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan')
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.document = SimpleUploadedFile('cin.jpg', b'contenu-factice-image', content_type='image/jpeg')

    def test_necessite_authentification(self):
        response = self.client.post('/api/verification/soumettre/', {'document_verification': self.document})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_seul_un_artisan_peut_soumettre(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post('/api/verification/soumettre/', {'document_verification': self.document})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_soumission_sans_document_refusee(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post('/api/verification/soumettre/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_soumission_reussie(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post('/api/verification/soumettre/', {'document_verification': self.document})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artisan.refresh_from_db()
        self.assertEqual(self.artisan.statut_verification, 'en_attente')
        self.assertIsNotNone(self.artisan.date_soumission_verification)

    def test_artisan_deja_verifie_ne_peut_pas_resoumettre(self):
        self.artisan.statut_verification = 'verifie'
        self.artisan.save()
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post('/api/verification/soumettre/', {'document_verification': self.document})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ReviewVerificationTests(APITestCase):
    def setUp(self):
        self.artisan = User.objects.create_user(
            username='karim', password='MotDePasse123!', role='artisan', statut_verification='en_attente',
        )
        self.staff = User.objects.create_user(username='admin_staff', password='MotDePasse123!', role='client', is_staff=True)
        self.non_staff = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')

    def test_liste_en_attente_reservee_au_staff(self):
        self.client.force_authenticate(user=self.non_staff)
        response = self.client.get('/api/verification/en-attente/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_liste_en_attente_visible_par_staff(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.get('/api/verification/en-attente/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'karim')

    def test_approbation_reussie(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(f'/api/verification/{self.artisan.id}/approuver/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artisan.refresh_from_db()
        self.assertEqual(self.artisan.statut_verification, 'verifie')

    def test_rejet_avec_motif(self):
        self.client.force_authenticate(user=self.staff)
        response = self.client.post(f'/api/verification/{self.artisan.id}/rejeter/', {'motif': 'Photo floue'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artisan.refresh_from_db()
        self.assertEqual(self.artisan.statut_verification, 'rejete')
        self.assertEqual(self.artisan.motif_rejet, 'Photo floue')

    def test_approbation_par_non_staff_refusee(self):
        self.client.force_authenticate(user=self.non_staff)
        response = self.client.post(f'/api/verification/{self.artisan.id}/approuver/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_est_verifie_reflete_dans_artisan_public(self):
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertFalse(response.data['est_verifie'])

        self.artisan.statut_verification = 'verifie'
        self.artisan.save()
        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        self.assertTrue(response.data['est_verifie'])