(() => {
    const uploadTimeoutMs = 45000;

    const setStatus = (status, message, state) => {
        if (!status) return;
        status.className = `upload-status upload-status-${state}`;
        status.textContent = message;
        status.hidden = false;
    };

    const resetButton = (button, originalLabel) => {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.classList.remove('btn-loading');
        button.innerHTML = originalLabel;
    };

    document.querySelectorAll('[data-upload-form]').forEach(form => {
        const button = form.querySelector('[data-upload-submit]') || form.querySelector('button[type="submit"]');
        const status = form.querySelector('[data-upload-status]');
        if (!button) return;

        const originalLabel = button.innerHTML;

        form.addEventListener('submit', async event => {
            if (event.defaultPrevented || !form.checkValidity()) return;
            event.preventDefault();
            if (form.dataset.uploading === 'true') return;

            form.dataset.uploading = 'true';
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.classList.add('btn-loading');
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Uploading images...';
            setStatus(status, 'Uploading your images securely. This can take a few seconds.', 'loading');

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), uploadTimeoutMs);

            try {
                const response = await fetch(form.action, {
                    method: form.method || 'POST',
                    body: new FormData(form),
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    signal: controller.signal
                });
                const contentType = response.headers.get('content-type') || '';
                const payload = contentType.includes('application/json') ? await response.json() : {};

                if (!response.ok) {
                    throw new Error(payload.error || 'The upload could not be completed. Please try again.');
                }
                if (!payload.redirectUrl) {
                    throw new Error('The upload completed, but the app could not open the campground page. Please try again.');
                }

                setStatus(status, 'Upload complete. Opening your campground...', 'success');
                window.location.assign(payload.redirectUrl);
            } catch (error) {
                const message = error.name === 'AbortError'
                    ? 'The upload took too long. Please check your connection and try again.'
                    : error.message;
                setStatus(status, message, 'error');
                resetButton(button, originalLabel);
                delete form.dataset.uploading;
            } finally {
                clearTimeout(timeout);
            }
        });
    });
})();
