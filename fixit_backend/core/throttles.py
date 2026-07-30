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