const NAV_CONFIG = [
    { id: 'home', label: 'Home', desc: '', icon_svg: "icon-home", url: 'index.html', locked: false },
    { id: 'candidats', label: 'Candidats', desc:'Gestion et fiches individuelles', icon_svg: "icon-candidats", url: 'pages/candidats.html', locked: false },
    { id: 'initiatives', label: 'Initiatives', desc:'Flux des projets de recrutement', icon_svg: "icon-initiatives", url: 'pages/initiatives.html', locked: false },
    { id: 'analyses', label: 'Analyses', desc:'Objectifs & Répartition', icon_svg: "icon-analyse", url: '#', locked: true },
    { id: 'journal', label: 'Journal', desc:'Logs des activités système', icon_svg: "icon-journal", url: '#', locked: true },
    { id: 'simulation', label: 'Simulation', desc:"Moteur d'optimisation IA", icon_svg: "icon-simulations", url: '#', locked: true },
    { id: 'config', label: 'Configurations', desc:"Connecteurs & Paramètres", icon_svg: "icon-config", url: '#', locked: true }
];

function renderGlobalNavigation(current_id) {
    const navContainers = document.querySelectorAll('.side-nav'); 
    
    const navHTML = NAV_CONFIG.map(item => `
        <a href="${current_id === item.id ? item.url+"#" : item.url}" 
           class="nav-item ${item.locked ? 'locked' : ''} ${current_id === item.id ? 'active' : ''}"
           ${item.locked ? 'onclick="return false;"' : ''}>
            <div class="icon-wrapper">
                <svg width="24" height="24">
                    <use href="assets/svg/icons.svg#${item.icon_svg}"></use>
                </svg>
            </div>
            <span class="nav-label">${item.label}</span>
        </a>
    `).join('');

    navContainers.forEach(nav => {
        nav.innerHTML = `<div class="nav-group middle">${navHTML}</div>`;
    });
}

function renderHomeCards() {
    const grid = document.querySelector('.menu-grid');
    if (!grid) return;

    grid.innerHTML = NAV_CONFIG.filter(item => item.id !== 'home').map(item => `
        <div class="menu-card ${item.locked ? 'locked' : ''}" 
             onclick="${item.locked ? '' : `location.href='${item.url}'`}">
            <div class="icon">
                <svg width="48" height="48">
                    <use href="assets/svg/icons.svg#${item.icon_svg}"></use>
                </svg>
            </div>
            <h3>${item.label.toUpperCase()}</h3>
            <p>${item.desc}</p>
        </div>
    `).join('');
}