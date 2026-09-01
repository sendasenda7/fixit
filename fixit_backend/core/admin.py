from django.contrib import admin
from .models import User, Demande, Offre, Evaluation, FavoriArtisan, FavoriDemande


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'role', 'specialite', 'statut_verification', 'date_soumission_verification')
    list_filter = ('role', 'statut_verification', 'specialite')
    search_fields = ('username', 'email')
    actions = ['approuver_verifications', 'rejeter_verifications']

    @admin.action(description="✅ Approuver la vérification des artisans sélectionnés")
    def approuver_verifications(self, request, queryset):
        from django.utils import timezone
        maj = queryset.filter(role='artisan').update(
            statut_verification='verifie',
            date_traitement_verification=timezone.now(),
            motif_rejet='',
        )
        self.message_user(request, f"{maj} artisan(s) vérifié(s).")

    @admin.action(description="❌ Rejeter la vérification des artisans sélectionnés")
    def rejeter_verifications(self, request, queryset):
        from django.utils import timezone
        maj = queryset.filter(role='artisan').update(
            statut_verification='rejete',
            date_traitement_verification=timezone.now(),
            motif_rejet='Document illisible ou non conforme.',
        )
        self.message_user(request, f"{maj} artisan(s) rejeté(s).")


admin.site.register(Demande)
admin.site.register(Offre)
admin.site.register(Evaluation)
admin.site.register(FavoriArtisan)
admin.site.register(FavoriDemande)