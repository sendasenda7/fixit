from django.contrib import admin
from .models import User, Demande, Offre, Evaluation

# Enregistrer les modèles
admin.site.register(User)
admin.site.register(Demande)
admin.site.register(Offre)
admin.site.register(Evaluation)