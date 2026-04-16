// Configuration des colonnes (Clé technique : Libellé affiché)
const KANBAN_STATUSES = {
    "proposed": "Proposées",
    "analysis": "En cours d'analyse",
    "cancelled": "Annulées",
    "to-launch": "À lancer",
    "in-progress": "En cours",
    "completed": "Terminées"
};

const VIEWS = {
    "strategy": ["proposed", "analysis", "cancelled", "to-launch"],
    "ops": ["to-launch", "in-progress", "completed"]
};

window.addEventListener('DOMContentLoaded', loadInitiatives);

let currentView = "strategy";
let loadedInitiatives = [];

document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        initializeBoard(e.target.dataset.view);
    });
});

async function loadInitiatives() {
    try {
        const response = await fetch('./../assets/data/initiatives/summary/index-initiatives.json');
        const fileNames = await response.json();

        const promises = fileNames.map(name => 
            fetch(`./../assets/data/initiatives/${name}.json`).then(res => res.json())
        );
        
        loadedInitiatives = await Promise.all(promises);
        
        initializeBoard(currentView); 
    } catch (error) {
        console.error("Erreur AIDA Initiatives:", error);
    }
}

function initializeBoard(viewName) {
    const board = document.getElementById('kanban-board');
    board.innerHTML = '';
    currentView = viewName;

    const columnsToDisplay = VIEWS[viewName];

    columnsToDisplay.forEach(key => {
        const col = document.createElement('div');
        col.className = 'kanban-column';
        col.id = `col-${key}`;
        col.innerHTML = `
            <h3>${KANBAN_STATUSES[key].toUpperCase()} <span class="column-count">0</span></h3>
            <div class="cards-container"></div>
        `;
        board.appendChild(col);
    });
    
    renderCards(loadedInitiatives);
}

function renderCards(initiatives) {

    initiatives.forEach(init => {
        const acceptedCount = init.candidates.filter(c => c.acceptation_status === 'accepted').length;
        const initials = getInitials(init.supervisor);
        const avatarColor = getSupervisorColor(init.supervisor);

        const card = document.createElement('div');
        card.className = 'initiative-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>${init.title}</h4>
                <div class="supervisor-avatar" style="background-color: ${avatarColor}" title="${init.supervisor}">
                    ${initials}
                </div>
            </div>
            <div class="card-progress-area">
                <div class="progress-bar">
                    <div class="bar-fill" style="width: ${(acceptedCount/init.targetCount)*100}%"></div>
                </div>
                <div class="progress-count">${acceptedCount}/${init.targetCount}</div>
            </div>
        `;

        card.addEventListener('click', () => {
            showInitiativeDetails(init);
        });

        const container = document.querySelector(`#col-${init.status} .cards-container`);
        if (container) {
            container.appendChild(card);

            const countBadge = document.querySelector(`#col-${init.status} .column-count`);
            if (countBadge) {
                let currentVal = parseInt(countBadge.textContent);
                countBadge.textContent = currentVal + 1;
            }
        }

    });
}

/** CONSOLE BEHAVIOR */

let currentInitiative = null;

function showInitiativeDetails(init) {
    currentInitiative = init;
    const consoleEl = document.getElementById('initiative-console');
    consoleEl.classList.add('active');

    // Header simplifié et plus bas
    consoleEl.querySelector('.console-header').innerHTML = `
        <div class="header-left">
            <span class="status-indicator status-${init.status}">${init.status}</span>
            <span class="console-title-text">${init.title}</span>
            <span class="console-id-subtle">#${init.id}</span>
        </div>
        <div class="header-right">
            <span class="supervisor-info">SUPERVISEUR <span class="supervisor-name">${init.supervisor}</span></span>
            <button class="close-console" onclick="toggleConsole()" title="Fermer le terminal">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M1 1L11 11M11 1L1 11" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `;

    // Rendu du stepper global
    const processHtml = renderProcessSection(init.process);
    const candidatesListHtml = renderCandidatesList(init.candidates, init.process)

    // On n'utilise plus que deux colonnes dans .console-content
    consoleEl.querySelector('.console-content').innerHTML = `
        <div class="console-column info-panel">
            <p class="desc-text">${init.description}</p>
            <div class="process-section">
                ${processHtml}
            </div>
        </div>
        <div class="console-column subjects-panel" style="display: flex; flex-direction: column; height: 100%;">  
            <div class="candidate-scroll-area">
                ${candidatesListHtml}
            </div>
        </div>
        <div class="console-column analysis-panel" style="display: flex; flex-direction: column; height: 100%;">   
        </div>
    `;
}

function renderProcessSection(process) {
    // Légende avec distinction Global vs Individuel
    const legendHtml = `
        <div class="process-legend">
            <div class="legend-item"><span class="legend-dot dot-pending"></span> En attente</div>
            <div class="legend-item"><span class="legend-dot dot-progress"></span> En cours</div>
            <div class="legend-item"><span class="legend-dot dot-completed"></span> Terminé</div>
            <div class="legend-item type-separator"><span class="legend-dot dot-individual"></span> Individuel </div>
        </div>
    `;

    // Génération des blocs avec gestion du type
    const stepsHtml = process.map(p => {
        const statusClass = p.type === 'global' ? (p.status || 'pending') : 'individual';
        return `<div class="step-box ${statusClass}" title="${p.label} [${p.type}]"></div>`;
    }).join('');

    const descriptionsHtml = process.map(p => {
        const activeClass = (p.type === 'global' && p.status === 'in-progress') ? 'style="color:#fbbf24; font-weight:bold; opacity:1;"' : '';
        return `<div class="step-desc" ${activeClass}>${p.label}</div>`;
    }).join('');

    return `
        ${legendHtml}
        <div class="stepper-container">
            <div class="process-stepper">${stepsHtml}</div>
            <div class="step-descriptions">${descriptionsHtml}</div>
        </div>
    `;
}

function toggleConsole() {
    const consoleElement = document.getElementById('initiative-console');
    consoleElement.classList.toggle('active');
}

function getSupervisorColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // On reste dans des tons bleus/cyans/violets pour le thème AIDA
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 60%, 40%)`; 
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function renderCandidatesList(candidates, processes) {
    return candidates.map(c => {
        const completed = c.process_status.filter(s => s.status === 'completed').length;
        const total = c.process_status.length;
        const pct = Math.round((completed / total) * 100);

        return `
            <div class="candidate-item" onclick="showIndividualDetail('${c.id}')" id="item-${c.id}">
                <div class="candidate-info">
                    <span class="c-id">ID: ${c.id}</span>
                </div>
                <div class="status-pill status-${c.acceptation_status}">${c.acceptation_status}</div>
                <div class="mini-progress-box" style="margin-left:15px; width:40px;">
                    <div class="progress-bar" style="height:4px;"><div class="bar-fill" style="width:${pct}%"></div></div>
                </div>
            </div>
        `;
    }).join('');
}

function showIndividualDetail(candidateId) {
    document.querySelectorAll('.candidate-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`item-${candidateId}`).classList.add('selected');

    const content = document.querySelector('.console-content');
    content.classList.add('show-details');

    const candidate = currentInitiative.candidates.find(c => c.id === candidateId);
    const steps = candidate.process_status;
    const focusIndex = getFocusedStepIndex(candidate, steps);
    
    const detailPanel = document.querySelector('.analysis-panel');

    let wheelHtml = steps.map((step, index) => {        
        let displayClass = 'far';
        if (index === focusIndex) displayClass = 'focus';
        else if (index === focusIndex - 1 || index === focusIndex + 1) displayClass = 'adjacent';

        return `
            <div class="wheel-step ${displayClass}">
                <span class="step-text ${step.status}">
                    <span class="step-label-main">${get_process_label(currentInitiative.process, step.process_id)}</span>
                </span>
            </div>
        `;
    }).join('');

    detailPanel.innerHTML = `
       
        <div class="wheel-header" style="margin-bottom: 10px;">
            <h4 style="font-size:0.75rem; color:var(--accent-cyan); margin:0;">DIAGNOSTIC : ${candidateId}</h4>
        </div>

         <div class="diagnostic-frame">
            <div class="individual-wheel">
                ${wheelHtml}
            </div>

            <div class="wheel-legend">
                <div class="legend-item"><span class="legend-dot dot-pending"></span> En attente</div>
                <div class="legend-item"><span class="legend-dot dot-progress"></span> En cours</div>
                <div class="legend-item"><span class="legend-dot dot-completed"></span> Terminé</div>
            </div>
        </div>
    `;
}

function get_process_label(processes, process_id){
    const process = processes.find(p => p.id === process_id);
    return process ? process.label : "Label inconnu";
}

function getFocusedStepIndex(candidate, steps) {
    if (candidate.acceptation_status === 'rejected') {
        const lastCompleted = [...candidate.process_status].reverse().find(s => s.status === 'completed');
        return lastCompleted ? steps.findIndex(st => st.id === lastCompleted.process_id) : 0;
    }
    
    if (candidate.acceptation_status === 'accepted') {
        return steps.length - 1;
    }

    const firstActive = candidate.process_status.find(s => s.status !== 'completed');
    return firstActive ? steps.findIndex(st => st.process_id === firstActive.process_id) : 0;
}