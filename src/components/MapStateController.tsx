import { useEffect, useRef, useState } from 'react';
import { useMap, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { getStateGeoData, VENEZUELA_NATIONAL } from '../data/venezuelaStates';

// ──────────────────────────────────────────────────────────────────────────────
// Cache en memoria: evita volver a descargar el mismo estado dos veces
// ──────────────────────────────────────────────────────────────────────────────
const polygonCache: Record<string, GeoJSON.Geometry | null> = {};

// ──────────────────────────────────────────────────────────────────────────────
// MapFlyController: Anima el mapa al estado seleccionado
// ──────────────────────────────────────────────────────────────────────────────
function MapFlyController({ selectedState }: { selectedState: string }) {
    const map = useMap();
    const prevState = useRef<string>('');

    useEffect(() => {
        if (prevState.current === selectedState) return;
        prevState.current = selectedState;

        if (!selectedState || selectedState === 'Todos') {
            map.flyTo(VENEZUELA_NATIONAL.center, VENEZUELA_NATIONAL.zoom, {
                animate: true,
                duration: 1.2,
                easeLinearity: 0.5,
            });
        } else {
            const stateData = getStateGeoData(selectedState);
            if (stateData) {
                map.flyToBounds(
                    L.latLngBounds(stateData.bounds[0], stateData.bounds[1]),
                    {
                        padding: [40, 40],
                        animate: true,
                        duration: 1.5,
                        easeLinearity: 0.4,
                        maxZoom: stateData.zoom + 1,
                    }
                );
            }
        }
    }, [selectedState, map]);

    return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Props del componente público
// ──────────────────────────────────────────────────────────────────────────────
interface MapStateControllerProps {
    selectedState: string;
    geoJsonData?: unknown; // Aceptado por compatibilidad descendente
}

/**
 * MapStateController (Opción B completa):
 *
 * 1. Anima el mapa hacia el estado seleccionado con flyToBounds.
 * 2. Descarga la silueta REAL del estado desde Nominatim (OpenStreetMap).
 *    - Primer uso: descarga y cachea en memoria.
 *    - Uso posterior: usa el caché sin red.
 * 3. Dibuja el polígono/multipolígono del estado en azul sobre el mapa.
 * 4. Fallback al rectángulo de bounding-box si Nominatim no responde.
 *
 * IMPORTANTE: Debe estar DENTRO de <MapContainer>
 */
export function MapStateController({ selectedState }: MapStateControllerProps) {
    const [statePolygon, setStatePolygon] = useState<GeoJSON.Geometry | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!selectedState || selectedState === 'Todos') {
            setStatePolygon(null);
            return;
        }

        // Si ya está en caché, usarlo directamente
        if (polygonCache[selectedState] !== undefined) {
            setStatePolygon(polygonCache[selectedState]);
            return;
        }

        const fetchStatePolygon = async () => {
            setIsLoading(true);
            try {
                // Nominatim devuelve el polígono exacto del estado venezolano
                const query = `${selectedState} Venezuela`;
                const url = `https://nominatim.openstreetmap.org/search?` +
                    `q=${encodeURIComponent(query)}&` +
                    `polygon_geojson=1&` +
                    `format=geojson&` +
                    `limit=3&` +
                    `featuretype=state`;

                const res = await fetch(url, {
                    headers: { 'Accept-Language': 'es' }
                });
                const data: GeoJSON.FeatureCollection = await res.json();

                // Buscar la feature que sea un polígono (no un punto)
                const polygonFeature = data.features?.find(
                    f => f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
                );

                const geometry = polygonFeature?.geometry ?? null;
                polygonCache[selectedState] = geometry;
                setStatePolygon(geometry);
            } catch {
                // Si falla la red, el rectángulo de fallback se activa
                polygonCache[selectedState] = null;
                setStatePolygon(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStatePolygon();
    }, [selectedState]);

    // Datos del estado para el rectángulo de fallback
    const stateData = selectedState && selectedState !== 'Todos'
        ? getStateGeoData(selectedState)
        : null;

    // Feature GeoJSON para el componente de react-leaflet
    const geoJsonFeature: GeoJSON.Feature | null = statePolygon
        ? {
            type: 'Feature',
            geometry: statePolygon,
            properties: { name: selectedState }
        }
        : null;

    return (
        <>
            {/* Animación de zoom al estado */}
            <MapFlyController selectedState={selectedState} />

            {/* Silueta REAL del estado (polígono de Nominatim) */}
            {geoJsonFeature && !isLoading && (
                <GeoJSON
                    key={`polygon-${selectedState}`}
                    data={geoJsonFeature}
                    style={{
                        color: '#007AFF',
                        weight: 2.5,
                        opacity: 0.95,
                        fillColor: '#007AFF',
                        fillOpacity: 0.10,
                        lineCap: 'round',
                        lineJoin: 'round',
                    }}
                />
            )}

            {/* Rectángulo de fallback (si Nominatim no responde o mientras carga) */}
            {!geoJsonFeature && stateData && (
                <GeoJSON
                    key={`bbox-${selectedState}`}
                    data={{
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [stateData.bounds[0][1], stateData.bounds[0][0]],
                                [stateData.bounds[1][1], stateData.bounds[0][0]],
                                [stateData.bounds[1][1], stateData.bounds[1][0]],
                                [stateData.bounds[0][1], stateData.bounds[1][0]],
                                [stateData.bounds[0][1], stateData.bounds[0][0]],
                            ]]
                        },
                        properties: { name: selectedState }
                    }}
                    style={{
                        color: '#007AFF',
                        weight: 2,
                        opacity: 0.6,
                        fillColor: '#007AFF',
                        fillOpacity: 0.06,
                        dashArray: '8 5',
                    }}
                />
            )}
        </>
    );
}

export { MapFlyController };
