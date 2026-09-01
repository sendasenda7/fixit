from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User, Evaluation


class RepondreAvisTests(APITestCase):
    def setUp(self):
        self.client_user = User.objects.create_user(username='hela', password='MotDePasse123!', role='client')
        self.artisan = User.objects.create_user(username='karim', password='MotDePasse123!', role='artisan')
        self.autre_artisan = User.objects.create_user(username='sami', password='MotDePasse123!', role='artisan')
        self.evaluation = Evaluation.objects.create(
            client=self.client_user, artisan=self.artisan, note=5, commentaire='Excellent travail !',
        )

    def test_necessite_authentification(self):
        response = self.client.post(f'/api/evaluations/{self.evaluation.id}/repondre/', {'reponse_artisan': 'Merci !'})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_seul_artisan_concerne_peut_repondre(self):
        self.client.force_authenticate(user=self.autre_artisan)
        response = self.client.post(f'/api/evaluations/{self.evaluation.id}/repondre/', {'reponse_artisan': 'Merci !'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_ne_peut_pas_repondre(self):
        self.client.force_authenticate(user=self.client_user)
        response = self.client.post(f'/api/evaluations/{self.evaluation.id}/repondre/', {'reponse_artisan': 'Merci !'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_reponse_reussie(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post(f'/api/evaluations/{self.evaluation.id}/repondre/', {
            'reponse_artisan': 'Merci beaucoup pour votre retour !',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.evaluation.refresh_from_db()
        self.assertEqual(self.evaluation.reponse_artisan, 'Merci beaucoup pour votre retour !')
        self.assertIsNotNone(self.evaluation.date_reponse)

    def test_reponse_vide_refusee(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post(f'/api/evaluations/{self.evaluation.id}/repondre/', {'reponse_artisan': '   '})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_avis_inexistant_retourne_404(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.post('/api/evaluations/9999/repondre/', {'reponse_artisan': 'Merci !'})
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_reponse_visible_dans_profil_artisan(self):
        self.evaluation.reponse_artisan = 'Merci pour votre confiance !'
        self.evaluation.save()

        response = self.client.get(f'/api/artisans/{self.artisan.id}/')
        avis = response.data['avis'][0]
        self.assertEqual(avis['reponse_artisan'], 'Merci pour votre confiance !')