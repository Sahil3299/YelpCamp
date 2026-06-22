(function () {
    const root = document.querySelector('[data-location-search]');
    if (!root) return;

    const input = root.querySelector('#location');
    const countryInput = document.getElementById('country');
    const suggestionsEl = root.querySelector('[data-location-suggestions]');
    const statusEl = root.querySelector('[data-location-status]');
    const currentBtn = root.querySelector('[data-current-location]');

    let activeRequest = null;
    let debounceTimer = null;

    function setStatus(message, tone) {
        if (!statusEl) return;
        statusEl.className = `location-status text-muted${tone ? ` location-status-${tone}` : ''}`;
        statusEl.innerHTML = message;
    }

    function clearSuggestions() {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('is-open');
    }

    function selectFeature(feature) {
        input.value = feature.label || feature.name || input.value;
        if (countryInput && feature.country) countryInput.value = feature.country;
        clearSuggestions();
        setStatus('<i class="fas fa-check me-1"></i>Location selected and ready to map.', 'success');
    }

    function renderSuggestions(features) {
        clearSuggestions();
        if (!features.length) {
            setStatus('<i class="fas fa-triangle-exclamation me-1"></i>No matches found. Try a more specific address.', 'error');
            return;
        }

        const fragment = document.createDocumentFragment();
        features.forEach(feature => {
            const button = document.createElement('button');
            const icon = document.createElement('span');
            const text = document.createElement('span');
            const name = document.createElement('strong');
            const label = document.createElement('small');

            button.type = 'button';
            button.className = 'location-suggestion';
            icon.className = 'location-suggestion-icon';
            icon.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            name.textContent = feature.name || 'Location';
            label.textContent = feature.label || '';
            text.append(name, label);
            button.append(icon, text);
            button.addEventListener('click', () => selectFeature(feature));
            fragment.appendChild(button);
        });

        suggestionsEl.appendChild(fragment);
        suggestionsEl.classList.add('is-open');
    }

    async function lookupLocation(query) {
        if (activeRequest) activeRequest.abort();
        activeRequest = new AbortController();

        const response = await fetch(`/campgrounds/geocode?q=${encodeURIComponent(query)}`, {
            signal: activeRequest.signal,
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('Location search failed');
        return response.json();
    }

    input.addEventListener('input', () => {
        window.clearTimeout(debounceTimer);
        const query = input.value.trim();

        if (query.length < 3) {
            clearSuggestions();
            setStatus('<i class="fas fa-info-circle me-1"></i>Type at least 3 characters for suggestions.');
            return;
        }

        setStatus('<i class="fas fa-circle-notch fa-spin me-1"></i>Searching places...', 'loading');
        debounceTimer = window.setTimeout(async () => {
            try {
                const data = await lookupLocation(query);
                renderSuggestions(data.features || []);
            } catch (error) {
                if (error.name === 'AbortError') return;
                clearSuggestions();
                setStatus('<i class="fas fa-triangle-exclamation me-1"></i>Search is unavailable right now.', 'error');
            }
        }, 280);
    });

    currentBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            setStatus('<i class="fas fa-triangle-exclamation me-1"></i>Your browser does not support current location.', 'error');
            return;
        }

        setStatus('<i class="fas fa-circle-notch fa-spin me-1"></i>Finding your current location...', 'loading');
        navigator.geolocation.getCurrentPosition(async position => {
            const { longitude, latitude } = position.coords;
            try {
                const response = await fetch(`/campgrounds/geocode?lng=${longitude}&lat=${latitude}`, {
                    headers: { Accept: 'application/json' }
                });
                if (!response.ok) throw new Error('Reverse lookup failed');
                const data = await response.json();
                const [feature] = data.features || [];
                if (!feature) throw new Error('No place found');
                selectFeature(feature);
            } catch (error) {
                setStatus('<i class="fas fa-triangle-exclamation me-1"></i>Could not convert your position into an address.', 'error');
            }
        }, () => {
            setStatus('<i class="fas fa-triangle-exclamation me-1"></i>Location permission was denied.', 'error');
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
        });
    });

    document.addEventListener('click', event => {
        if (!root.contains(event.target)) clearSuggestions();
    });
})();
