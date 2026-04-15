let allCandidates = [];
let selectedStatuses = new Set();
const listContainer = document.getElementById('candidates-list');

async function loadCandidatesList() {
    
    listContainer.innerHTML = '<p class="loading">Initialisation du scan...</p>';

    try {
        const response = await fetch('./../assets/data/candidates/_index-candidates.json');
        const fileNames = await response.json();

        const candidatePromises = fileNames.map(name => 
            fetch(`./../assets/data/candidates/${name}.json`).then(res => res.json())
        );
        
        const candidates = await Promise.all(candidatePromises);
        allCandidates = candidates.filter(c => c !== null);
        console.log(allCandidates);

        createStatusFilters();
        applyFilters();

    } catch (error) {
        listContainer.innerHTML = '<p class="error">Erreur de synchronisation AIDA</p>';
        console.error("Erreur lors du chargement des candidats:", error);
    }
}

function renderList(selectedCandidates = allCandidates){

    listContainer.innerHTML = '';
    
    selectedCandidates.forEach(candidate => {
        const item = document.createElement('div');
        item.className = 'candidate-item';
        item.dataset.id = candidate.id; 
        
        item.innerHTML = `
            <span class="id-badge">${candidate.id.split('-').pop()}</span>
            <span class="name">${candidate.identity.firstName} ${candidate.identity.lastName}</span>
        `;

        item.addEventListener('click', () => {
            selectCandidate(candidate);
        });

        listContainer.appendChild(item);
    });
}

function selectCandidate(candidate) {
    const detailsContainer = document.getElementById('candidate-details');
    
    detailsContainer.classList.add('has-selection');

    document.querySelectorAll('.candidate-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    console.log("Candidat sélectionné :", candidate.identity.firstName);
}

window.addEventListener('DOMContentLoaded', loadCandidatesList);


function selectCandidate(candidate) {
    const detailsContainer = document.getElementById('candidate-details');
    detailsContainer.classList.add('has-selection');

    document.querySelectorAll('.candidate-item').forEach(el => el.classList.remove('active'));
    const selectedItem = document.querySelector(`.candidate-item[data-id="${candidate.id}"]`);
    if(selectedItem) selectedItem.classList.add('active');

    // 2. Mise à jour de l'Identité
    document.getElementById('det-fullname').textContent = `${candidate.identity.firstName} ${candidate.identity.lastName}`;
    document.getElementById('det-situation').textContent = candidate.identity.currentSituation;
    document.getElementById('det-age').textContent = candidate.identity.age;
    document.getElementById('det-sex').textContent = candidate.identity.sexe || "N/A";
    
    // 3. Injection des Expériences
    const expContainer = document.getElementById('det-experience');
    expContainer.innerHTML = candidate.professional.experiences.map(exp => `
        <div class="data-item">
            <div class="item-header">
                <strong>${exp.role}</strong> — ${exp.company}
            </div>
            <div class="item-date">${exp.startDate} / ${exp.endDate}</div>
            <div class="item-desc">${exp.description}</div>
        </div>
    `).join('');

    // 4. Injection de l'Éducation
    const eduContainer = document.getElementById('det-education');
    const schools = candidate.education.schools.map(s => `
        <div class="data-item">
            <strong>${s.name}</strong><br/>
            ${s.degree} (${s.status}) — ${s.year}
        </div>
    `).join('');
    
    const certifs = candidate.education.certifications.map(c => `
        <div class="data-item">
            <span class="cert-label">Certifié:</span> ${c.name} (${c.date})
        </div>
    `).join('');
    
    eduContainer.innerHTML = schools + certifs;

    // 5. Psychologie
    document.getElementById('det-mbti').textContent = candidate.psychology.mbti;
    document.getElementById('det-notes').textContent = candidate.psychology.notes;
}

/*** COLUMN 2: list of candidates ***/

function createStatusFilters() {
    const filterContainer = document.getElementById('status-filters');
    
    // Extraction des statuts uniques
    const statuses = [...new Set(allCandidates.map(c => c.recruitment.globalStatus))];
    
    filterContainer.innerHTML = '';
    statuses.forEach(status => {
        const pill = document.createElement('div');
        pill.className = 'status-pill';
        pill.textContent = status;
        pill.dataset.status = status;
        
        pill.addEventListener('click', () => {
            if (selectedStatuses.has(status)) {
                selectedStatuses.delete(status);
                pill.classList.remove('active');
            } else {
                selectedStatuses.add(status);
                pill.classList.add('active');
            }
            applyFilters();
        });
        
        filterContainer.appendChild(pill);
    });
}

function applyFilters() {
    const filtered = allCandidates.filter(candidate => {
        const matchesStatus = selectedStatuses.size === 0 || 
                             selectedStatuses.has(candidate.recruitment.globalStatus);
        return matchesStatus;
    });
    
    renderList(filtered);
}
