from rest_framework import status
from rest_framework.test import APITestCase

from core.models import User


class RegisterTests(APITestCase):
    def test_register_client_reussi(self):
        url = '/api/register/'
        data = {
            'username': 'nouveau_client',
            'email': 'nouveau@test.tn',
            'password': 'MotDePasse123!',
            'role': 'client',
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertTrue(User.objects.filter(username='nouveau_client').exists())

    def test_register_username_deja_pris(self):
        User.objects.create_user(username='deja_pris', password='MotDePasse123!')
        response = self.client.post('/api/register/', {
            'username': 'deja_pris',
            'email': 'autre@test.tn',
            'password': 'MotDePasse123!',
            'role': 'client',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_mot_de_passe_trop_faible(self):
        response = self.client.post('/api/register/', {
            'username': 'quelqu_un',
            'email': 'x@test.tn',
            'password': '123',
            'role': 'client',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='marc', password='MotDePasse123!', role='artisan')

    def test_login_reussi(self):
        response = self.client.post('/api/login/', {'username': 'marc', 'password': 'MotDePasse123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['username'], 'marc')

    def test_login_mauvais_mot_de_passe(self):
        response = self.client.post('/api/login/', {'username': 'marc', 'password': 'mauvais'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_utilisateur_inexistant(self):
        response = self.client.post('/api/login/', {'username': 'fantome', 'password': 'peu importe'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileTests(APITestCase):
    def setUp(self):
        self.artisan = User.objects.create_user(
            username='sami', password='MotDePasse123!', role='artisan', specialite='plomberie',
        )

    def test_profile_necessite_authentification(self):
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_get_utilisateur_connecte(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'sami')

    def test_profile_maj_bio_et_competences(self):
        self.client.force_authenticate(user=self.artisan)
        response = self.client.put('/api/profile/', {
            'bio': 'Plombier expérimenté.',
            'competences': 'Fuites, Chauffe-eau',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.artisan.refresh_from_db()
        self.assertEqual(self.artisan.bio, 'Plombier expérimenté.')
        self.assertEqual(self.artisan.competences, 'Fuites, Chauffe-eau')