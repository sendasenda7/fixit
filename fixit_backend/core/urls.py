from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('register/', views.register),
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('password-reset/request/', views.password_reset_request),
    path('password-reset/confirm/', views.password_reset_confirm),
    path('token/refresh/', TokenRefreshView.as_view()),
    path('profile/', views.profile),
    path('profile/password/', views.change_password),
    path('profile/delete/', views.delete_account),

    # Artisans (public)
    path('artisans/', views.artisans_list),
        path('artisans/<int:pk>/', views.artisan_detail),

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
    path('evaluations/<int:evaluation_id>/repondre/', views.repondre_avis),

    # Messagerie
    path('conversations/', views.conversations_list),
    path('conversations/<int:conversation_id>/messages/', views.messages_list),

    # Notifications
    path('notifications/', views.notifications_list),
    path('notifications/non-lues/', views.notifications_non_lues),
    path('notifications/<int:pk>/lire/', views.notification_marquer_lue),
    path('notifications/tout-lire/', views.notifications_tout_marquer_lu),

    # Favoris
    path('favoris/artisans/', views.mes_favoris_artisans),
    path('favoris/artisans/<int:artisan_id>/toggle/', views.toggle_favori_artisan),
    path('favoris/demandes/', views.mes_favoris_demandes),
    path('favoris/demandes/<int:demande_id>/toggle/', views.toggle_favori_demande),

    # Vérification d'identité
    path('verification/soumettre/', views.soumettre_verification),
    path('verification/en-attente/', views.verifications_en_attente),
    path('verification/<int:artisan_id>/approuver/', views.approuver_verification),
        path('verification/<int:artisan_id>/rejeter/', views.rejeter_verification),

    # Signalements
    path('signalements/utilisateur/<int:user_id>/', views.signaler_utilisateur),
    path('signalements/demande/<int:demande_id>/', views.signaler_demande),
    path('signalements/', views.signalements_list),
    path('signalements/<int:signalement_id>/traiter/', views.traiter_signalement),

    # Dashboard admin
    path('admin/stats/', views.admin_stats),

]
