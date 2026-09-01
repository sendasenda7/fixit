"""Utilitaires géographiques : calcul de distance entre deux points GPS."""
import math


def haversine_km(lat1, lng1, lat2, lng2):
    """Distance en kilomètres entre deux points (latitude/longitude) sur Terre."""
    r = 6371.0  # rayon moyen de la Terre en km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c