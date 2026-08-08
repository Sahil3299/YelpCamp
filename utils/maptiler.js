const ExpressError = require('./ExpressError');

const MAPTILER_GEOCODING_URL = 'https://api.maptiler.com/geocoding';
const MAPTILER_TIMEOUT_MS = 10000;

const getApiKey = () => process.env.MAPTILER_API_KEY || process.env.MAPTILER_BROWSER_KEY;

// Keep MapTiler responses small and app-shaped before controllers or clients use them.
const normalizeFeature = feature => {
    if (!feature || !feature.geometry || !Array.isArray(feature.geometry.coordinates)) return null;

    const [lng, lat] = feature.geometry.coordinates.map(Number);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

    const context = Array.isArray(feature.context) ? feature.context : [];
    const country = context.find(item => item.id && item.id.startsWith('country')) || {};

    return {
        label: feature.place_name || feature.text || 'Selected location',
        name: feature.text || feature.place_name || 'Selected location',
        country: country.text || '',
        geometry: {
            type: 'Point',
            coordinates: [lng, lat]
        },
        bbox: feature.bbox || null
    };
};

const requestMapTiler = async (path, params = {}) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new ExpressError('MapTiler API key is not configured. Add MAPTILER_API_KEY to your .env file.', 500);
    }

    const url = new URL(`${MAPTILER_GEOCODING_URL}/${path}.json`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.set(key, value);
        }
    });
    url.searchParams.set('key', apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), MAPTILER_TIMEOUT_MS);
    let response;
    try {
        response = await fetch(url, { signal: controller.signal });
    } catch (err) {
        if (err.name === 'AbortError') {
            throw new ExpressError('Location lookup timed out. Please try again.', 504);
        }
        throw new ExpressError('Location lookup failed. Please check your connection and try again.', 502);
    } finally {
        clearTimeout(timeout);
    }
    if (!response.ok) {
        throw new ExpressError('Location lookup failed. Please try another search.', response.status);
    }

    return response.json();
};

// Forward geocoding converts a typed place name into GeoJSON coordinates.
module.exports.forwardGeocode = async (query, options = {}) => {
    const searchText = String(query || '').trim();
    if (searchText.length < 2) {
        throw new ExpressError('Please enter a more specific location.', 400);
    }

    const data = await requestMapTiler(encodeURIComponent(searchText), {
        limit: options.limit || 5,
        language: options.language || 'en'
    });

    return (data.features || []).map(normalizeFeature).filter(Boolean);
};

// Reverse geocoding powers the "Use Current Location" form action.
module.exports.reverseGeocode = async (lng, lat) => {
    const longitude = Number(lng);
    const latitude = Number(lat);

    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        throw new ExpressError('Current location coordinates are invalid.', 400);
    }

    const data = await requestMapTiler(`${longitude},${latitude}`, {
        limit: 1,
        language: 'en'
    });

    const [feature] = (data.features || []).map(normalizeFeature).filter(Boolean);
    if (!feature) {
        throw new ExpressError('Could not identify that location. Please enter it manually.', 404);
    }

    return feature;
};
