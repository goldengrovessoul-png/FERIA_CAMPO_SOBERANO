// Datos geográficos de los 24 estados de Venezuela
// Fuente: coordenadas aproximadas oficiales de los límites político-territoriales

export interface VenezuelaState {
    name: string; // Nombre oficial como aparece en los reportes
    bounds: [[number, number], [number, number]]; // [[sur, oeste], [norte, este]]
    center: [number, number]; // [lat, lng] del centroide
    zoom: number; // Nivel de zoom óptimo para ver el estado completo
}

// Mapa de nombres normalizados -> datos geográficos
export const VENEZUELA_STATES: Record<string, VenezuelaState> = {
    'AMAZONAS': {
        name: 'Amazonas',
        bounds: [[-1.5, -68.2], [5.8, -60.8]],
        center: [2.2, -64.5],
        zoom: 6,
    },
    'ANZOÁTEGUI': {
        name: 'Anzoátegui',
        bounds: [[7.2, -67.2], [10.8, -62.4]],
        center: [9.0, -64.7],
        zoom: 7,
    },
    'APURE': {
        name: 'Apure',
        bounds: [[4.8, -72.5], [8.2, -66.0]],
        center: [6.5, -68.5],
        zoom: 7,
    },
    'ARAGUA': {
        name: 'Aragua',
        bounds: [[9.3, -68.1], [10.6, -66.6]],
        center: [10.0, -67.4],
        zoom: 9,
    },
    'BARINAS': {
        name: 'Barinas',
        bounds: [[6.6, -71.6], [9.1, -68.0]],
        center: [7.9, -69.8],
        zoom: 7,
    },
    'BOLÍVAR': {
        name: 'Bolívar',
        bounds: [[1.6, -65.6], [8.7, -60.0]],
        center: [5.2, -63.0],
        zoom: 6,
    },
    'CARABOBO': {
        name: 'Carabobo',
        bounds: [[9.7, -68.5], [10.8, -67.6]],
        center: [10.2, -68.1],
        zoom: 9,
    },
    'COJEDES': {
        name: 'Cojedes',
        bounds: [[8.4, -69.4], [10.0, -67.7]],
        center: [9.2, -68.6],
        zoom: 8,
    },
    'DELTA AMACURO': {
        name: 'Delta Amacuro',
        bounds: [[7.4, -63.1], [9.3, -59.7]],
        center: [8.4, -61.5],
        zoom: 7,
    },
    'DISTRITO CAPITAL': {
        name: 'Distrito Capital',
        bounds: [[10.4, -67.1], [10.7, -66.7]],
        center: [10.5, -66.9],
        zoom: 11,
    },
    'FALCÓN': {
        name: 'Falcón',
        bounds: [[10.2, -70.9], [12.3, -67.6]],
        center: [11.2, -69.3],
        zoom: 7,
    },
    'GUÁRICO': {
        name: 'Guárico',
        bounds: [[7.4, -68.4], [9.9, -64.8]],
        center: [8.7, -66.6],
        zoom: 7,
    },
    'LARA': {
        name: 'Lara',
        bounds: [[9.2, -70.5], [11.0, -68.4]],
        center: [10.1, -69.4],
        zoom: 8,
    },
    'MÉRIDA': {
        name: 'Mérida',
        bounds: [[7.8, -72.3], [9.2, -70.3]],
        center: [8.5, -71.3],
        zoom: 8,
    },
    'MIRANDA': {
        name: 'Miranda',
        bounds: [[9.6, -67.3], [10.7, -65.8]],
        center: [10.2, -66.5],
        zoom: 9,
    },
    'MONAGAS': {
        name: 'Monagas',
        bounds: [[8.3, -64.5], [10.2, -61.9]],
        center: [9.2, -63.2],
        zoom: 7,
    },
    'NUEVA ESPARTA': {
        name: 'Nueva Esparta',
        bounds: [[10.7, -64.5], [11.3, -63.7]],
        center: [11.0, -64.1],
        zoom: 10,
    },
    'PORTUGUESA': {
        name: 'Portuguesa',
        bounds: [[8.3, -70.6], [10.0, -68.8]],
        center: [9.1, -69.7],
        zoom: 8,
    },
    'SUCRE': {
        name: 'Sucre',
        bounds: [[9.9, -64.2], [10.9, -61.8]],
        center: [10.4, -63.0],
        zoom: 8,
    },
    'TÁCHIRA': {
        name: 'Táchira',
        bounds: [[6.9, -72.6], [8.4, -71.3]],
        center: [7.7, -72.0],
        zoom: 8,
    },
    'TRUJILLO': {
        name: 'Trujillo',
        bounds: [[8.9, -71.1], [10.0, -69.9]],
        center: [9.4, -70.5],
        zoom: 9,
    },
    'LA GUAIRA': {
        name: 'La Guaira',
        bounds: [[10.3, -67.4], [10.8, -66.6]],
        center: [10.6, -67.0],
        zoom: 10,
    },
    'YARACUY': {
        name: 'Yaracuy',
        bounds: [[9.7, -69.1], [10.7, -68.3]],
        center: [10.2, -68.7],
        zoom: 9,
    },
    'ZULIA': {
        name: 'Zulia',
        bounds: [[7.8, -73.5], [11.9, -70.4]],
        center: [9.9, -72.0],
        zoom: 7,
    },
    'PETARE': {
        name: 'Petare',
        bounds: [[10.4, -66.9], [10.6, -66.7]],
        center: [10.48, -66.81],
        zoom: 12,
    },
};

// Vista Nacional por defecto
export const VENEZUELA_NATIONAL = {
    center: [7.0, -66.0] as [number, number],
    zoom: 6,
    bounds: [[0.5, -73.5], [12.5, -59.5]] as [[number, number], [number, number]],
};

/**
 * Normaliza el nombre de un estado para buscar en el mapa de datos.
 * Maneja variaciones de acentos y espacios.
 */
export function normalizeStateName(name: string): string {
    return name
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // quita tildes
        .trim();
}

/**
 * Busca los datos de un estado por su nombre, manejando variaciones.
 */
export function getStateGeoData(stateName: string): VenezuelaState | null {
    if (!stateName || stateName === 'Todos') return null;

    const upperName = stateName.toUpperCase().trim();

    // Búsqueda directa
    if (VENEZUELA_STATES[upperName]) return VENEZUELA_STATES[upperName];

    // Búsqueda normalizada (sin acentos)
    const normalized = normalizeStateName(stateName);
    const entry = Object.entries(VENEZUELA_STATES).find(([key]) =>
        normalizeStateName(key) === normalized
    );

    return entry ? entry[1] : null;
}
