// assets/js/app.js

document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE BÚSQUEDA UNIFICADA (AJAX) ---

    // Función para manejar la búsqueda
    const handleGlobalSearch = (inputElement, resultsContainer, isMobile = false) => {
        if (!inputElement) return;

        // Crear/Verificar contenedor de resultados
        if (!resultsContainer) {
            if (isMobile) {
                // Móvil: contenedor debajo del input
                resultsContainer = document.createElement('div');
                resultsContainer.id = 'mobileSearchResults';
                resultsContainer.style.cssText = 'max-height: 60vh; overflow-y: auto; padding: 20px;';
                inputElement.parentElement.after(resultsContainer);
            } else {
                // Escritorio: Dropdown flotante
                resultsContainer = document.createElement('div');
                resultsContainer.className = 'search-results-dropdown';
                const searchWrapper = inputElement.closest('.search-container') || inputElement.parentElement;
                searchWrapper.appendChild(resultsContainer);
                searchWrapper.style.position = 'relative'; // Asegurar posicionamiento
            }
        }

        let searchTimeout;

        // Evento Input (KeyUp)
        inputElement.addEventListener('keyup', (e) => {
            clearTimeout(searchTimeout);
            const term = e.target.value.toLowerCase().trim();

            // Si está vacío o muy corto
            if (term.length < 2) {
                if (isMobile) resultsContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Escribe al menos 2 caracteres...</p>';
                else {
                    resultsContainer.innerHTML = '';
                    resultsContainer.classList.remove('show');
                }
                return;
            }

            // Mostrar "Buscando..."
            if (isMobile) {
                resultsContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Buscando...</p>';
            } else {
                resultsContainer.innerHTML = '<div style="padding:15px; text-align:center; color:var(--text-secondary);">Buscando...</div>';
                resultsContainer.classList.add('show');
            }

            // Debounce
            searchTimeout = setTimeout(() => {
                fetch(window.BASE_URL + 'search?q=' + encodeURIComponent(term))
                    .then(response => response.json())
                    .then(data => {
                        // Sin resultados
                        if (data.channels.length === 0 && data.stations.length === 0) {
                            const noResMsg = '<p style="color: #888; text-align: center; padding: 20px;">No se encontraron resultados</p>';
                            resultsContainer.innerHTML = noResMsg;
                            return;
                        }

                        let html = '';
                        const itemClass = isMobile ? 'mobile-result-item' : 'search-item';

                        // Canales
                        if (data.channels.length > 0) {
                            html += isMobile
                                ? '<h4 style="color: #3b82f6; margin-bottom: 10px; font-size: 0.9rem;">📺 Canales</h4>'
                                : '<div class="search-category-title">📺 Canales</div>';

                            data.channels.forEach(channel => {
                                html += `<a href="${channel.url}" class="${itemClass}">
                                    <img src="${channel.img}" alt="">
                                    <span>${channel.name}</span>
                                </a>`;
                            });
                        }

                        // Emisoras
                        if (data.stations.length > 0) {
                            html += isMobile
                                ? '<h4 style="color: #8b5cf6; margin: 15px 0 10px; font-size: 0.9rem;">📻 Emisoras</h4>'
                                : '<div class="search-category-title">📻 Emisoras</div>';

                            data.stations.forEach(station => {
                                html += `<a href="${station.url}" class="${itemClass}">
                                    <img src="${station.img}" alt="" style="border-radius: 50%;">
                                    <span>${station.name}</span>
                                </a>`;
                            });
                        }

                        resultsContainer.innerHTML = html;
                        if (!isMobile) resultsContainer.classList.add('show');
                    })
                    .catch(err => {
                        console.error('Search error:', err);
                        resultsContainer.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Error en la búsqueda</p>';
                    });
            }, 300);
        });

        // Cerrar dropdown desktop al hacer click fuera
        if (!isMobile) {
            document.addEventListener('click', (e) => {
                if (!inputElement.contains(e.target) && !resultsContainer.contains(e.target)) {
                    resultsContainer.classList.remove('show');
                }
            });

            // Reabrir si tiene texto al hacer focus
            inputElement.addEventListener('focus', () => {
                if (inputElement.value.length >= 2) {
                    resultsContainer.classList.add('show'); // Podríamos volver a buscar aquí si queremos refrescar
                }
            });
        }
    };

    // 1. Desktop Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        handleGlobalSearch(searchInput, null, false);
    }

    // 2. Mobile Search
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileResults = document.getElementById('mobileSearchResults');
    if (mobileSearchInput) {
        handleGlobalSearch(mobileSearchInput, mobileResults, true);
    }

});

// Exponer BASE_URL para JS - detectar desde la URL actual
if (typeof window.BASE_URL === 'undefined') {
    // Obtener base URL del pathname actual
    const path = window.location.pathname;
    const basePath = path.substring(0, path.lastIndexOf('/') + 1);
    window.BASE_URL = window.location.origin + basePath;
}
