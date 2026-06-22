(function () {
    const SDK_JS = 'https://cdn.jsdelivr.net/npm/@maptiler/sdk@latest/dist/maptiler-sdk.umd.min.js';
    const SDK_CSS = 'https://cdn.jsdelivr.net/npm/@maptiler/sdk@latest/dist/maptiler-sdk.css';

    // Detail pages lazy-load MapTiler so non-map pages do not pay the SDK cost.
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

    function coordinatesFor(campground) {
        const coordinates = campground.geometry && campground.geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

        const lng = Number(coordinates[0]);
        const lat = Number(coordinates[1]);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
        return [lng, lat];
    }

    function showMapError(mapEl, message) {
        const shell = mapEl.closest('.map-shell');
        if (shell) shell.classList.add('is-loaded');
        mapEl.classList.add('map-error');
        mapEl.textContent = message;
    }

    function markerElement() {
        const el = document.createElement('button');
        el.className = 'campground-map-marker';
        el.type = 'button';
        el.setAttribute('aria-label', 'Campground location');
        el.innerHTML = '<span><i class="fas fa-campground"></i></span>';
        return el;
    }

    // Popup copy is escaped because campground content is user controlled.
    function popupHtml(campground) {
        const description = escapeHtml(campground.description || '').slice(0, 135);
        return `
            <article class="map-popup-card map-popup-card-detail">
                <div class="map-popup-body">
                    <span class="map-popup-kicker">${escapeHtml(campground.location || '')}</span>
                    <h3>${escapeHtml(campground.title || 'Campground')}</h3>
                    <p>${description}${description.length >= 135 ? '...' : ''}</p>
                </div>
            </article>
        `;
    }

    async function initShowMap() {
        const mapEl = document.getElementById('map');
        const campground = window.campground;
        const apiKey = window.mapTilerApiKey;
        if (!mapEl || !campground) return;

        const center = coordinatesFor(campground);
        if (!center) {
            showMapError(mapEl, 'This campground does not have valid map coordinates yet.');
            return;
        }
        if (!apiKey) {
            showMapError(mapEl, 'MapTiler API key is missing. Add MAPTILER_API_KEY to your .env file.');
            return;
        }

        try {
            const maptilersdk = await loadMapTilerSdk();
            maptilersdk.config.apiKey = apiKey;

            const map = new maptilersdk.Map({
                container: mapEl,
                style: maptilersdk.MapStyle.OUTDOOR,
                center,
                zoom: 11.8,
                pitch: 42,
                bearing: -10,
                navigationControl: false
            });

            map.addControl(new maptilersdk.NavigationControl({ visualizePitch: true }), 'top-right');

            map.on('load', () => {
                const popup = new maptilersdk.Popup({ offset: 30, closeButton: false, maxWidth: '320px' })
                    .setHTML(popupHtml(campground));

                new maptilersdk.Marker({ element: markerElement(), anchor: 'bottom' })
                    .setLngLat(center)
                    .setPopup(popup)
                    .addTo(map)
                    .togglePopup();

                map.easeTo({ center, zoom: 12.8, pitch: 48, duration: 900 });
                mapEl.closest('.map-shell').classList.add('is-loaded');
            });

            map.on('error', () => {
                showMapError(mapEl, 'The map could not initialize. Please refresh the page.');
            });
        } catch (error) {
            showMapError(mapEl, 'Map assets could not load. Please check your connection and refresh.');
        }
    }

    if ('IntersectionObserver' in window) {
        const mapEl = document.getElementById('map');
        if (mapEl) {
            const observer = new IntersectionObserver(entries => {
                if (!entries[0].isIntersecting) return;
                observer.disconnect();
                initShowMap();
            }, { rootMargin: '220px' });
            observer.observe(mapEl);
        }
    } else if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initShowMap);
    } else {
        initShowMap();
    }
})();
