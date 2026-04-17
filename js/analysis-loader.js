
const AIDA_STATE = {
    analysis_group: [],
    analysis_state: {
        active_criteria: new Set(),
        visuals_registry: []
    },
    criteria_stats: {},
    collapsed_visuals: new Set()
};


document.addEventListener('DOMContentLoaded', async () => {
    renderGlobalNavigation('analyses');

    /* /!\ Keep order between loadVisualsRegistry and renderCriteriaExplorer */
    /* To display the number of visual available by criteria, visuals registry shall be loaded */
    await loadVisualsRegistry();
    await renderCriteriaExplorer();
    
    
    initViewButtons();
    initSelectionEvents();

    
});

async function renderCriteriaExplorer() {
    const scrollList = document.querySelector('.scroll-list');
    if (!scrollList) return;

    try {
        const [typesRes, indexRes] = await Promise.all([
            fetch('assets/data/criteria/summary/criteria_type.json'),
            fetch('assets/data/criteria/summary/index-criteria.json')
        ]);

        const typesData = await typesRes.json();
        const indexData = await indexRes.json();

        typesData.list.forEach(typeObj => {
            AIDA_STATE.analysis_group[typeObj.type] = {
                name: typeObj.name,
                items: []
            };
        });

        const criteriaPromises = indexData.map(fileName => 
            fetch(`assets/data/criteria/${fileName}.json`).then(res => res.json())
        );
        const allCriteria = await Promise.all(criteriaPromises);

        allCriteria.forEach(crit => {
            if (AIDA_STATE.analysis_group[crit.type]) {
                AIDA_STATE.analysis_group[crit.type].items.push(crit);
            }
        });

        scrollList.innerHTML = '';

        let isFirst = true;

        Object.keys(AIDA_STATE.analysis_group).forEach(typeKey => {

            const group = AIDA_STATE.analysis_group[typeKey];
            if (group.items.length === 0) return;

            const groupElement = document.createElement('div');
            groupElement.className = 'scroll-item compact-group';
            
            groupElement.innerHTML = `
                <h3 class="compact-group-title">${group.name.toUpperCase()}</h3>
                <ul class="criteria-tree">
                    ${group.items.map(item => {

                        const checked = isFirst ? 'checked' : '';
                        if (isFirst) AIDA_STATE.analysis_state.active_criteria.add(item.criteria);
                        isFirst = false;

                        const count = AIDA_STATE.criteria_stats[item.criteria] || 0;
                        const badge = count > 0 ? `<span class="crit-count">(${count})</span>` : '';
                        console.log(item.label + " " + count);
                        return `
                            <li>
                                <label class="tree-node">
                                    <input type="checkbox" data-criteria="${item.criteria}" ${checked}>
                                    <span class="custom-checkbox"></span>
                                    <span class="crit-label">${item.label} ${badge}</span>
                                </label>
                            </li>
                        `
                    }).join('')}
                </ul>
            `;
            scrollList.appendChild(groupElement);
        });

    } catch (error) {
        console.error("AIDA System Error: Échec du chargement des critères", error);
    }
}

async function loadVisualsRegistry() {
    const indexRes = await fetch('assets/data/analyse_visuals/summary/index-analyse_visuals.json');
    const visualFiles = await indexRes.json();
    
    const promises = visualFiles.map(file => 
        fetch(`assets/data/analyse_visuals/${file}.json`).then(res => res.json())
    );
    AIDA_STATE.analysis_state.visuals_registry = await Promise.all(promises);

    AIDA_STATE.analysis_state.visuals_registry.forEach(visual => {
        visual.required_criteria.forEach(critId => {
            AIDA_STATE.criteria_stats[critId] = (AIDA_STATE.criteria_stats[critId] || 0) + 1;
        });
    });
}

function initSelectionEvents() {
    const checkboxes = document.querySelectorAll('.tree-node input');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', (e) => {
            const criteriaId = e.target.dataset.criteria;
            if (e.target.checked) {
                AIDA_STATE.analysis_state.active_criteria.add(criteriaId);
            } else {
                AIDA_STATE.analysis_state.active_criteria.delete(criteriaId);
            }
            updateWorkspace();
        });
    });
    updateWorkspace();
}

function initViewButtons() {
    const btnGrid = document.getElementById('btn-grid');
    const btnFocus = document.getElementById('btn-focus');
    const grid = document.getElementById('analysis-grid');

    btnGrid.addEventListener('click', () => {
        btnGrid.classList.add('active');
        btnFocus.classList.remove('active');
        grid.classList.replace('focus-mode', 'grid-mode');
    });

    btnFocus.addEventListener('click', () => {
        btnFocus.classList.add('active');
        btnGrid.classList.remove('active');
        grid.classList.replace('grid-mode', 'focus-mode');
    });

    setTimeout(() => {
        Object.values(Chart.instances).forEach(chart => chart.resize());
    }, 300);
}

function updateWorkspace() {
    const grid = document.getElementById('analysis-grid');
    
    const visibleVisuals = AIDA_STATE.analysis_state.visuals_registry.filter(visual => 
        visual.required_criteria.every(crit => AIDA_STATE.analysis_state.active_criteria.has(crit))
    );
    renderVisualCards(visibleVisuals, grid);

}

function renderVisualCards(visuals, container) {
    container.innerHTML = '';
    let collapsedCount = 0; 

    if (visuals.length === 0) {
        text = "Sélectionner un critère d'analyse ..."
        container.innerHTML = `<div class="analysis-placeholder">${text}</div>`;
        return;
    }

    visuals.forEach(visual => {
        const card = createCardElement(visual);
        container.appendChild(card);

        console.log("render visual cards");
        if (AIDA_STATE.collapsed_visuals.has(visual.id)) {
            card.classList.add('collapsed-vertical');
            console.log("collapsed !");
            
            const topPosition = (collapsedCount * 160); 
            card.style.top = `${topPosition}px`;
            
            collapsedCount++; // On incrémente pour la suivante
        }

        initializeChart(visual);
    });
}

function createCardElement(visual) {
    const div = document.createElement('div');
    const isCollapsed = AIDA_STATE.collapsed_visuals.has(visual.id);
    div.className = `analysis-card ${isCollapsed ? 'collapsed-vertical' : ''}`;
    div.id = `card-${visual.id}`;

    div.innerHTML = `
        <div class="card-header">
            <h4 class="card-title">${visual.title}</h4>
            <div class="card-actions">
                <button class="close-button">▼</button>
            </div>
        </div>
        <div class="card-content">
            <canvas id="chart-${visual.id}"></canvas>
        </div>
        <div class="card-footer">
            <div class="rationale">
                <span class="label">RATIONNEL :</span>
                <p>${visual.rationale}</p>
            </div>
        </div>
    `;

    div.addEventListener('click', () => {
        if (div.classList.contains('collapsed-vertical')) {
            div.classList.remove('collapsed-vertical');
            AIDA_STATE.collapsed_visuals.delete(visual.id);

            setTimeout(() => {
                const chart = Chart.getChart(`chart-${visual.id}`);
                if (chart) chart.resize();
            }, 300);
            updateWorkspace()
        }
        
    });

    div.querySelector('.close-button').addEventListener('click', (e) => {
        e.stopPropagation();
        div.classList.add('collapsed-vertical');
        AIDA_STATE.collapsed_visuals.add(visual.id);
        updateWorkspace()
    });

    


    return div;
}

async function initializeChart(visual) {
    const criteriaFiles = visual.required_criteria;
    const dataPromises = criteriaFiles.map(id => 
        fetch(`assets/data/criteria/${id}.json`).then(res => res.json())
    );
    const criteriaData = await Promise.all(dataPromises);
    console.log(criteriaData);
    
    VisualEngine.render(`chart-${visual.id}`, visual, criteriaData);
}