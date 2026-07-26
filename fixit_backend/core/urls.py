from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('register/', views.register),
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('profile/', views.profile),
    path('profile/password/', views.change_password),
    path('profile/delete/', views.delete_account),

    # Artisans (public)
    path('artisans/', views.artisans_list),

    # Demandes
    path('demandes/', views.demandes_list),
    path('demandes/<int:pk>/', views.demande_detail),
    path('demandes/mes/', views.mes_demandes),

    # Offres
    path('offres/', views.offres_list),
    path('offres/demande/<int:demande_id>/', views.offres_par_demande),
    path('offres/<int:offre_id>/accepter/', views.accepter_offre),

    # Evaluations
    path('evaluations/', views.evaluations_list),
    path('evaluations/artisan/<int:artisan_id>/', views.evaluations_artisan),
    path('evaluations/evaluer/<int:offre_id>/', views.evaluer_artisan),

]