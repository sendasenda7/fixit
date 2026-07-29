from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Panel admin Django
    path('admin/', admin.site.urls),

    # Toutes nos APIs commencent par /api/
    path('api/', include('core.urls')),
]

# En dev, Django sert lui-même les fichiers médias (photos de profil...).
# En prod, ça doit être géré par le serveur web (nginx, etc.) — voir Django docs.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)