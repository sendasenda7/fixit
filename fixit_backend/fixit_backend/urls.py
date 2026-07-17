from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Panel admin Django
    path('admin/', admin.site.urls),

    # Toutes nos APIs commencent par /api/
    path('api/', include('core.urls')),
]