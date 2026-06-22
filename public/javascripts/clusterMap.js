(function () {
    const SDK_JS = 'https://cdn.jsdelivr.net/npm/@maptiler/sdk@latest/dist/maptiler-sdk.umd.min.js';
    const SDK_CSS = 'https://cdn.jsdelivr.net/npm/@maptiler/sdk@latest/dist/maptiler-sdk.css';

    // Load the SDK only on pages where the map enters the viewport.
    function loadMapTilerSdk() {
        if (window.maptilersdk) return Promise.resolve(window.maptilersdk);

        return new Promise((resolve, reject) => {
            if (!document.querySelector(`link[href="${SDK_CSS}"]`)) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = SDK_CSS;
                document.head.appendChild(css);
            }

            const existing = document.querySelector(`script[src="${SDK_JS}"]`);
            if (existing) {
                existing.addEventListener('load', () => resolve(window.maptilersdk), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = SDK_JS;
            script.async = true;
            script.onload = () => resolve(window.maptilersdk);
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    function showMapError(mapEl, message) {
        const shell = mapEl.closest('.map-shell');
        if (shell) shell.classList.add('is-loaded');
        mapEl.classList.add('map-error');
        mapEl.textContent = message;
    }

    function validCoordinates(campground) {
        const coordinates = campground.geometry && campground.geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

        const lng = Number(coordinates[0]);
        const lat = Number(coordinates[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        return [lng, lat];
    }

    function toFeature(campground) {
        const coordinates = validCoordinates(campground);
        if (!coordinates) return null;

        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: {
                id: campground._id,
                title: campground.title || 'Campground',
                description: campground.description || '',
                location: [campground.location, campground.country].filter(Boolean).join(', '),
                image: campground.image || ''
            }
        };
    }

    // Build compact cards for marker popups without trusting external data as HTML.
    function popupHtml(properties) {
        return `
            <article class="map-popup-card">
                ${properties.image ? `<img src="${escapeHtml(properties.image)}" alt="${escapeHtml(properties.title)}">` : ''}
                <div class="map-popup-body">
                    <span class="map-popup-kicker">${escapeHtml(properties.location)}</span>
                    <h3>${escapeHtml(properties.title)}</h3>
                    <a href="/campgrounds/${escapeHtml(properties.id)}">View details</a>
                </div>
            </article>
        `;
    }

    // The clustered layer uses a custom image so individual places still feel branded.
    function addMarkerImage(map) {
        return new Promise(resolve => {
            const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
                    <filter id="shadow" x="-30%" y="-20%" width="160%" height="170%">
                        <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#193516" flood-opacity=".35"/>
                    </filter>
                    <path filter="url(#shadow)" fill="#d95f12" d="M48 8c-16.6 0-30 13.4-30 30 0 22.5 30 50 30 50s30-27.5 30-50C78 21.4 64.6 8 48 8Z"/>
                    <circle cx="48" cy="38" r="19" fill="#fffaf0"/>
                    <path fill="#294f25" d="M36 44h24l-12-17-4.4 6.6-2.6-3.7L36 44Zm7.5 0 4.5-6.7 4.7 6.7h-9.2Z"/>
                </svg>
            `;
            const image = new Image(96, 96);
            image.onload = () => {
                if (!map.hasImage('campground-marker')) {
                    map.addImage('campground-marker', image, { pixelRatio: 2 });
                }
                resolve();
            };
            image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        });
    }

    async function initClusterMap() {
        const mapEl = document.getElementById('cluster-map');
        const apiKey = window.mapTilerApiKey;
        const features = (Array.isArray(window.campgrounds) ? window.campgrounds : [])
            .map(toFeature)
            .filter(Boolean);

        if (!mapEl) return;
        if (!apiKey) {
            showMapError(mapEl, 'MapTiler API key is missing. Add MAPTILER_API_KEY to your .env file.');
            return;
        }
        if (!features.length) {
            showMapError(mapEl, 'No mapped campgrounds yet.');
            return;
        }

        try {
            const maptilersdk = await loadMapTilerSdk();
            maptilersdk.config.apiKey = apiKey;

            const map = new maptilersdk.Map({
                container: mapEl,
                style: maptilersdk.MapStyle.OUTDOOR,
                center: [78.9629, 22.5937],
                zoom: 3.7,
                pitch: 28,
                navigationControl: false
            });

            map.addControl(new maptilersdk.NavigationControl({ visualizePitch: true }), 'top-right');

            map.on('load', async () => {
                await addMarkerImage(map);

                map.addSource('campgrounds', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features },
                    cluster: true,
                    clusterMaxZoom: 12,
                    clusterRadius: 54
                });

                map.addLayer({
                    id: 'clusters',
                    type: 'circle',
                    source: 'campgrounds',
                    filter: ['has', 'point_count'],
                    paint: {
                        'circle-color': ['step', ['get', 'point_count'], '#294f25', 10, '#d95f12', 30, '#193516'],
                        'circle-radius': ['step', ['get', 'point_count'], 22, 10, 28, 30, 34],
                        'circle-stroke-width': 4,
                        'circle-stroke-color': 'rgba(255,250,240,.92)'
                    }
                });

                map.addLayer({
                    id: 'cluster-count',
                    type: 'symbol',
                    source: 'campgrounds',
                    filter: ['has', 'point_count'],
                    layout: {
                        'text-field': ['get', 'point_count_abbreviated'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 13
                    },
                    paint: { 'text-color': '#fffaf0' }
                });

                map.addLayer({
                    id: 'unclustered-point',
                    type: 'symbol',
                    source: 'campgrounds',
                    filter: ['!', ['has', 'point_count']],
                    layout: {
                        'icon-image': 'campground-marker',
                        'icon-size': 0.52,
                        'icon-anchor': 'bottom',
                        'icon-allow-overlap': true
                    }
                });

                const bounds = new maptilersdk.LngLatBounds();
                features.forEach(feature => bounds.extend(feature.geometry.coordinates));
                map.fitBounds(bounds, { padding: 74, maxZoom: 10, duration: 900 });

                mapEl.closest('.map-shell').classList.add('is-loaded');
            });

            map.on('click', 'clusters', event => {
                const featuresAtPoint = map.queryRenderedFeatures(event.point, { layers: ['clusters'] });
                const clusterId = featuresAtPoint[0].properties.cluster_id;
                map.getSource('campgrounds').getClusterExpansionZoom(clusterId, (error, zoom) => {
                    if (error) return;
                    map.easeTo({ center: featuresAtPoint[0].geometry.coordinates, zoom, duration: 650 });
                });
            });

            map.on('click', 'unclustered-point', event => {
                const feature = event.features[0];
                new maptilersdk.Popup({ offset: 24, closeButton: false, maxWidth: '290px' })
                    .setLngLat(feature.geometry.coordinates)
                    .setHTML(popupHtml(feature.properties))
                    .addTo(map);
            });

            ['clusters', 'unclustered-point'].forEach(layer => {
                map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer'; });
                map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = ''; });
            });

            map.on('error', () => {
                showMapError(mapEl, 'The map could not initialize. Please refresh the page.');
            });
        } catch (error) {
            showMapError(mapEl, 'Map assets could not load. Please check your connection and refresh.');
        }
    }

    if ('IntersectionObserver' in window) {
        const mapEl = document.getElementById('cluster-map');
        if (mapEl) {
            const observer = new IntersectionObserver(entries => {
                if (!entries[0].isIntersecting) return;
                observer.disconnect();
                initClusterMap();
            }, { rootMargin: '220px' });
            observer.observe(mapEl);
        }
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClusterMap);
    } else {
        initClusterMap();
    }
})();
