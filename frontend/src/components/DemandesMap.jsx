import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correctif nécessaire : react-leaflet/webpack ne résout pas correctement les
// chemins d'icônes par défaut de Leaflet. On importe les images directement.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import api from '../api/axios';
import FavoriButton from './FavoriButton';

const iconDefaut = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const iconUrgent = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-urgent', // teinté en rouge via CSS (voir plus bas)
});

const iconMaPosition = L.divIcon({
  className: 'marker-ma-position',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 2px #1a73e8;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const TUNIS = [36.8065, 10.1815];

/**
 * Carte affichant les demandes géolocalisées (latitude/longitude non nulles).
 * `demandes` : liste d'objets Demande (venant de l'API, avec distance_km optionnel).
 * `maPosition` : { lat, lng } optionnel, position de l'artisan si partagée.
 * `onFaireOffre(demande)` : callback appelé au clic sur "Faire une offre" dans la popup.
 * `dejaOfferIds` : Set des ids de demandes déjà répondues par l'artisan.
 */
const DemandesMap = ({ demandes, maPosition, onFaireOffre, dejaOfferIds = new Set() }) => {
  const demandesAvecCoords = demandes.filter(d => d.latitude != null && d.longitude != null);

  const centre = maPosition
    ? [maPosition.lat, maPosition.lng]
    : demandesAvecCoords.length > 0
      ? [demandesAvecCoords[0].latitude, demandesAvecCoords[0].longitude]
      : TUNIS;

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(20,30,60,0.08)' }}>
      <style>{`
        .marker-urgent { filter: hue-rotate(150deg) saturate(2); }
      `}</style>
      <MapContainer center={centre} zoom={maPosition ? 12 : 7} style={{ height: '520px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {maPosition && (
          <Marker position={[maPosition.lat, maPosition.lng]} icon={iconMaPosition}>
            <Popup>📍 Ma position</Popup>
          </Marker>
        )}

        {demandesAvecCoords.map((d) => (
          <Marker
            key={d.id}
            position={[d.latitude, d.longitude]}
            icon={d.urgent ? iconUrgent : iconDefaut}
          >
            <Popup>
              <div style={{ minWidth: '180px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {d.urgent ? (
                    <div style={{ color: '#d32f2f', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>🚨 URGENT</div>
                  ) : <span />}
                  <FavoriButton
                    estFavori={d.est_favori}
                    onToggle={async () => (await api.post(`/favoris/demandes/${d.id}/toggle/`)).data}
                    size={16}
                    style={{ padding: 0 }}
                  />
                </div>
                <strong style={{ fontSize: '14px' }}>{d.titre}</strong>
                <p style={{ margin: '6px 0', fontSize: '12px', color: '#555' }}>
                  📍 {d.localisation}{d.distance_km != null ? ` · ${d.distance_km} km` : ''}
                </p>
                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#1a73e8' }}>
                  💰 {d.budget} TND
                </p>
                {dejaOfferIds.has(d.id) ? (
                  <span style={{ fontSize: '12px', color: '#00854a', fontWeight: 700 }}>✅ Offre envoyée</span>
                ) : (
                  <button
                    onClick={() => onFaireOffre(d)}
                    style={{
                      border: 'none', backgroundColor: '#1a73e8', color: '#fff',
                      padding: '7px 12px', borderRadius: '8px', fontSize: '12px',
                      fontWeight: 700, cursor: 'pointer', width: '100%',
                    }}
                  >
                    💼 Faire une offre
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {demandes.length > 0 && demandesAvecCoords.length === 0 && (
        <p style={{ textAlign: 'center', color: '#888', fontSize: '13px', padding: '12px' }}>
          Aucune des demandes affichées n'a de position GPS renseignée.
        </p>
      )}
    </div>
  );
};

export default DemandesMap;