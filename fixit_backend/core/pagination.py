from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Pagination standard utilisée sur les listes qui peuvent grossir
    (artisans, demandes, offres).

    - page_size : nombre d'éléments par page par défaut
    - page_size_query_param : permet au frontend de demander une taille
      de page différente via ?page_size=...
    - max_page_size : garde-fou pour éviter qu'on demande une page énorme
    """
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50