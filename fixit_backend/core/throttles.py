from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Limite les tentatives de connexion par IP + username, pour bloquer
    le brute-force sans bloquer tout le monde derrière la même IP
    (ex: réseau d'entreprise, connexion mobile partagée).
    Le taux est défini dans settings.py -> REST_FRAMEWORK -> DEFAULT_THROTTLE_RATES['login'].
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        username = request.data.get('username', '').strip().lower()
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': f"{ident}:{username}"
        }


class _PostSeulementParUtilisateurThrottle(SimpleRateThrottle):
    """
    Base commune : ne limite que les requêtes POST (création), par
    utilisateur authentifié. Les GET (listing, polling de messages) ne sont
    jamais comptés, pour ne pas casser la lecture/actualisation normale.
    """
    def get_cache_key(self, request, view):
        if request.method != 'POST' or not request.user or not request.user.is_authenticated:
            return None
        return self.cache_format % {
            'scope': self.scope,
            'ident': request.user.pk,
        }


class OffreRateThrottle(_PostSeulementParUtilisateurThrottle):
    """Empêche un artisan de spammer l'envoi d'offres. Taux dans settings.py['offre']."""
    scope = 'offre'


class MessageRateThrottle(_PostSeulementParUtilisateurThrottle):
    """Empêche le spam de messages dans une conversation. Taux dans settings.py['message']."""
    scope = 'message'