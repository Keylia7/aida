// Configuration des colonnes (Clé technique : Libellé affiché)
const KANBAN_STATUSES = {
    "proposed": "Proposées",
    "analysis": "En cours d'analyse",
    "cancelled": "Annulées",
    "to-launch": "À lancer",
    "in-progress": "En cours",
    "completed": "Terminées"
};

const AIDA_STATE = {
    view: "strategy",
    allInitiatives: [],
    allCandidates: [],
    selectedInitiative: null,
    selectedCandidate: null,
    currentWheelIndex: null
};

const VIEWS = {
    "strategy": ["proposed", "analysis", "cancelled", "to-launch"],
    "ops": ["to-launch", "in-progress", "completed"]
};

window.addEventListener('DOMContentLoaded', async () => {
    renderGlobalNavigation('initiatives')
    await loadInitiatives();
    await loadCandidateProfiles(); 
});

document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        initializeBoard(e.target.dataset.view);
    });
});

async function loadInitiatives() {
    try {
        const response = await fetch('assets/data/initiatives/summary/index-initiatives.json');
        const fileNames = await response.json();

        const promises = fileNames.map(name => 
            fetch(`assets/data/initiatives/${name}.json`).then(res => res.json())
        );
        
        AIDA_STATE.allInitiatives = await Promise.all(promises);
        console.log("Système AIDA : Initiatives synchronisées.");

        initializeBoard(AIDA_STATE.view); 
    } catch (error) {
        console.error("Erreur AIDA Initiatives:", error);
    }
}

async function loadCandidateProfiles() {
    try {
        const response = await fetch('assets/data/candidates/summary/index-candidates.json');
        const fileNames = await response.json();

        const promises = fileNames.map(name => 
            fetch(`assets/data/candidates/${name}.json`).then(res => res.json())
        );
        
        const profiles = await Promise.all(promises);
        
        profiles.forEach(profile => {
            AIDA_STATE.allCandidates[profile.id] = profile;
        });
        
        console.log("Système AIDA : Profils candidats synchronisés.");
    } catch (error) {
        console.error("Erreur lors du chargement des profils :", error);
    }
}

function initializeBoard(viewName) {
    const board = document.getElementById('kanban-board');
    board.innerHTML = '';
    AIDA_STATE.view = viewName;

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
    
    renderCards(AIDA_STATE.allInitiatives);
}

function renderCards(initiatives) {

    initiatives.forEach(init => {
        const acceptedCount = init.candidates.filter(c => c.acceptation_status === 'accepted').length;
        const initials = getInitials(init.supervisor);
        const avatarColor = getSupervisorColor(init.supervisor);

        const card = document.createElement('div');
        card.className = 'initiative-card';
        card.setAttribute('data-id', init.id);
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

function showInitiativeDetails(init) {
    document.querySelectorAll('.initiative-card').forEach(card => {
        card.classList.remove('selected');
    });

    const selectedCard = document.querySelector(`.initiative-card[data-id="${init.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    AIDA_STATE.selectedInitiative = init;
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

        <div class="console-divider" onclick="closeDiagnostic()">
            <div class="divider-line"></div>
            <div class="divider-handle">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
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
    const consoleEl = document.getElementById('initiative-console');
    const isClosing = consoleEl.classList.contains('active');

    if (isClosing) {
        consoleEl.classList.remove('active');
        document.querySelectorAll('.initiative-card').forEach(card => {
            card.classList.remove('selected');
        });
    } else {
        consoleEl.classList.add('active');
    }
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

function showIndividualDetail(candidateId) {
    document.querySelectorAll('.candidate-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`item-${candidateId}`).classList.add('selected');

    const content = document.querySelector('.console-content');
    content.classList.add('show-details');

    AIDA_STATE.selectedCandidate = AIDA_STATE.selectedInitiative.candidates.find(c => c.id === candidateId);
    const steps = AIDA_STATE.selectedCandidate.process_status;
    const focusIndex = getFocusedStepIndex(AIDA_STATE.selectedCandidate);
    AIDA_STATE.currentWheelIndex = focusIndex;

    const detailPanel = document.querySelector('.analysis-panel');

    let rejected_index = -1;
    if (AIDA_STATE.selectedCandidate.acceptation_status == "rejected") rejected_index = focusIndex;

    const individualStepperHtml = steps.map((step, i) => {
        const isActive = i === focusIndex ? 'active-focus' : '';
        const statusClass = (i === rejected_index) ? 'last-failed' : step.status;
        return `<div class="mini-step ${statusClass} ${step.status} ${isActive}" 
                     data-index="${i}" 
                     onclick="jumpToStep(${i})"></div>`;
    }).join('');

    const timelineHtml = steps.map((step, i) => {
        const label = get_process_label(AIDA_STATE.selectedInitiative.process, step.process_id);
        const errorClass = (i === rejected_index) ? 'last-failed' : '';
        return `
            <div class="timeline-step" data-index="${i}" id="step-${i}">
                <div class="step-marker ${step.status} ${errorClass}"></div>
                <div class="step-content">
                    <span class="step-label">${label}</span>
                    <span class="step-status-text">${step.status.toUpperCase()}</span>
                </div>
            </div>
        `;
    }).join('');


    const legendDotClass = (rejected_index === -1) ? "dot-completed" : "dot-status-mixed";
    detailPanel.innerHTML = `
        <div class="diagnostic-frame">
            <div class="indiv-stepper">${individualStepperHtml}</div>
            <div class="timeline-container custom-scrollbar" id="timeline-scroll">
                ${timelineHtml}
            </div>
            <div class="wheel-legend">
                <div class="legend-item"><span class="legend-dot dot-pending"></span> Attente</div>
                <div class="legend-item"><span class="legend-dot dot-progress"></span> En cours</div>
                <div class="legend-item"><span class="legend-dot ${legendDotClass}"></span> Terminé</div>
            </div>
        </div>
    `;

    setTimeout(() => jumpToStep(focusIndex), 100);
}

function get_process_label(processes, process_id){
    const process = processes.find(p => p.id === process_id);
    return process ? process.label : "Label inconnu";
}

function getFocusedStepIndex(candidate) {
    if (candidate.acceptation_status === 'rejected') {
        const lastCompleted = [...candidate.process_status].reverse().find(s => s.status === 'completed');
        return lastCompleted ? candidate.process_status.findIndex(st => st.process_id === lastCompleted.process_id) : 0;
    }
    
    if (candidate.acceptation_status === 'accepted') {
        return candidate.process_status.length - 1;
    }

    const firstActive = candidate.process_status.find(s => s.status !== 'completed');
    return firstActive ? candidate.process_status.findIndex(st => st.process_id === firstActive.process_id) : 0;
}

function jumpToStep(index) {
    AIDA_STATE.currentWheelIndex = index;
    
    const target = document.getElementById(`step-${index}`);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    document.querySelectorAll('.timeline-step').forEach(s => s.classList.remove('focus'));
    target.classList.add('focus');

    document.querySelectorAll('.mini-step').forEach((s, i) => {
        s.classList.toggle('active-focus', i === index);
    });
}

function renderCandidatesList(candidates) {
    return candidates.map(c => {
        const profile = AIDA_STATE.allCandidates[c.id];
        const firstName = profile ? profile.identity.firstName : "";
        const lastName = profile ? profile.identity.lastName : c.id;
        const jobTitle = profile ? profile.identity.currentSituation : "Profil inconnu";
        
        const completed = c.process_status.filter(s => s.status === 'completed').length;
        const total = c.process_status.length;
        const pct = Math.round((completed / total) * 100);

        return `
            <div class="candidate-item" onclick="showIndividualDetail('${c.id}')" id="item-${c.id}">
                <div class="candidate-identity">
                    <div class="name-row">
                        <span class="c-name">${firstName} ${lastName}</span>
                        <a href="candidats.html?id=${c.id}" class="external-link-icon" title="Voir la fiche complète" onclick="event.stopPropagation();">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </a>
                    </div>
                    <span class="c-job">${jobTitle}</span>
                </div>

                <div class="candidate-metrics">
                    <div class="status-pill status-${c.acceptation_status}">${c.acceptation_status}</div>
                    <div class="mini-progress-wrapper">
                        <div class="progress-label">${pct}%</div>
                        <div class="progress-bar-container">
                            <div class="progress-fill" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


function closeDiagnostic() {
    const content = document.querySelector('.console-content');
    content.classList.remove('show-details');
    
    document.querySelectorAll('.candidate-item').forEach(el => el.classList.remove('selected'));

    AIDA_STATE.selectedCandidate = null;
    AIDA_STATE.currentWheelIndex = null;
}