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
        
        initializeBoard(currentView); // Crée les colonnes vides
        renderCards(loadedInitiatives); // Remplit les colonnes
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
            <h3>${KANBAN_STATUSES[key].toUpperCase()} <span class="count">0</span></h3>
            <div class="cards-container"></div>
        `;
        board.appendChild(col);
    });
    
    renderCards(loadedInitiatives);
}

function renderCards(initiatives) {
    initiatives.forEach(init => {
        const acceptedCount = init.candidates.filter(c => c.acceptation_status === 'accepted').length;
        
        const card = document.createElement('div');
        card.className = 'initiative-card';
        card.innerHTML = `
            <div class="card-id">#${init.id}</div>
            <h4>${init.title}</h4>
            <div class="card-progress">
                <div class="progress-labels">
                    <span>Recrutement</span>
                    <span>${acceptedCount}/${init.targetCount}</span>
                </div>
                <div class="progress-bar">
                    <div class="bar-fill" style="width: ${(acceptedCount/init.targetCount)*100}%"></div>
                </div>
            </div>
            <div class="card-footer">
                <span>👤 ${init.supervisor}</span>
            </div>
        `;

        card.addEventListener('click', () => {
            showInitiativeDetails(init);
        });

        const container = document.querySelector(`#col-${init.status} .cards-container`);
        if (container) {
            container.appendChild(card);
            const countSpan = document.querySelector(`#col-${init.status} h3 .count`);
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
    });
}

/** CONSOLE BEHAVIOR */

let currentInitiative = null;

function showInitiativeDetails(init) {
    currentInitiative = init;
    document.getElementById('initiative-console').classList.add('active');
    document.getElementById('console-title').textContent = init.title.toUpperCase();
    document.getElementById('console-id-badge').textContent = init.id;
    document.getElementById('con-desc').textContent = init.description;

    const globalContainer = document.getElementById('con-global-process');
    globalContainer.innerHTML = init.process.map(p => `
        <div class="process-item ${p.status || 'pending'}">
            <span class="type-tag">${p.type}</span> ${p.label}
        </div>
    `).join('');

    const candidateContainer = document.getElementById('con-candidate-list');
    candidateContainer.innerHTML = init.candidates.map(c => `
        <div class="subject-card ${c.acceptation_status}" onclick="analyzeCandidate('${c.id}')">
            <span class="sub-id">${c.id.split('-').pop()}</span>
            <span class="sub-status">${c.acceptation_status}</span>
        </div>
    `).join('');
    
    document.getElementById('con-individual-details').innerHTML = '<p class="hint">Sélectionnez un sujet pour analyse.</p>';
}

function analyzeCandidate(candidateId) {
    const candidateData = currentInitiative.candidates.find(c => c.id === candidateId);
    if (!candidateData) return;

    const detailsContainer = document.getElementById('con-individual-details');
    
    const stepsHtml = candidateData.process_status.map(step => {
        const processInfo = currentInitiative.process.find(p => p.id === step.process_id);
        return `
            <div class="step-row ${step.status}">
                <span class="step-indicator"></span>
                <span class="step-label">${processInfo ? processInfo.label : 'Inconnu'}</span>
                <span class="step-status">${step.status}</span>
            </div>
        `;
    }).join('');

    detailsContainer.innerHTML = `
        <div class="analysis-header">
            <h4>ANALYSE : ${candidateId}</h4>
            <button class="nav-to-profile" onclick="goToCandidate('${candidateId}')">VOIR FICHE COMPLÈTE</button>
        </div>
        <div class="steps-container">${stepsHtml}</div>
    `;
}

function goToCandidate(id) {
    window.location.href = `candidats.html?id=${id}`;
}

function toggleConsole() {
    const consoleElement = document.getElementById('initiative-console');
    consoleElement.classList.toggle('active');
}