document.addEventListener('DOMContentLoaded', () => {
    // Initialisation de la navigation globale (config-nav.js)
    if (typeof renderGlobalNavigation === 'function') {
        renderGlobalNavigation('analyses');
    }

    const container = document.getElementById('analysis-container');
    const buttons = document.querySelectorAll('.crit-toggle');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const moduleId = btn.getAttribute('data-module');
            
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                removeModule(moduleId);
            } else {
                btn.classList.add('active');
                addModule(moduleId, btn.textContent);
            }
        });
    });

    function addModule(id, label) {
        // Retirer le message "vide" s'il existe
        if (container.querySelector('.empty-state')) {
            container.innerHTML = '';
        }

        const isLarge = (id === 'ocean' || id === 'skills');
        
        const moduleHTML = `
            <div class="analysis-module ${isLarge ? 'large' : ''}" id="mod-${id}">
                <div class="module-header">
                    <h4>${label.toUpperCase()}</h4>
                    <span class="status-tag">LIVE DATA</span>
                </div>
                <div class="module-body">
                    <div class="chart-placeholder">
                        Chargement des données ${id}...
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', moduleHTML);
    }

    function removeModule(id) {
        const mod = document.getElementById(`mod-${id}`);
        if (mod) mod.remove();
        
        if (container.children.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>En attente de sélection de données...</p></div>';
        }
    }
});