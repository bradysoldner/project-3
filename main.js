let allTeams = [];
let currentPage = 1;

// I asked ai: How can I make the grid view show 8 cards instead of 6?
function getTeamsPerPage(viewMode) {
    return viewMode === 'grid' ? 8 : 6;

}

function fetchTeams() {
    const loadingElement = document.getElementById('loading');
    const container = document.getElementById('teams-container');

    if (loadingElement) loadingElement.classList.remove('hidden');

    // Reset allTeams
    allTeams = [];

    fetch("https://sports.is120.ckearl.com/")
        .then((response) => response.json())
        .then((dataObject) => {
            CompleteSteps(dataObject); // Pass dataObject directly

            console.log('Mapped allTeams:', allTeams);

            if (window.location.pathname.includes('index.html')) {
                displayFeaturedTeam();
            } else {
                renderTeams();
            }
        })
        .finally(() => {
            if (loadingElement) loadingElement.classList.add('hidden');
        });
}

// Define CompleteSteps to process the data
function CompleteSteps(data) {
    ['nfl', 'mlb', 'nba', 'nhl'].forEach(league => {
        const leagueTeams = data[league]?.teams || [];
        const mappedTeams = leagueTeams.map(team => {
            // Parse the record to extract wins and losses
            const [wins, losses] = team.record ? team.record.split('-').map(Number) : [0, 0];
            return {
                team_id: team.id.toString(),
                name: team.name,
                city: team.location || 'Unknown',
                league: league.toUpperCase(),
                roster: team.roster.map(player => ({
                    id: player.id.toString(),
                    fullName: player.fullName,
                    position: player.position || 'N/A',
                    height: player.height || 0,
                    weight: player.weight || 0,
                    age: player.age || 0,
                    experience: player.experience || 0
                })),
                wins: wins || 0,
                losses: losses || 0,
                recent_games: team.recent_games || [],
                logo: team.logo || getResponsiveImage()
            };
        });
        allTeams = [...allTeams, ...mappedTeams];
    });
}

// I asked ai: How can make a hover effect in javascript?
function applyHoverBackground(card, league) {
    const leagueColors = {
        'NFL': '#ffcccc', 
        'MLB': '#cce5ff', 
        'NBA': '#ccffcc',
        'NHL': '#fff5cc'
    };

    card.addEventListener('mouseover', () => {
        card.style.backgroundColor = leagueColors[league] || '';
    });
    card.addEventListener('mouseout', () => {
        card.style.backgroundColor = '';
    });
}

function setupDarkModeBackgroundReset() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.querySelectorAll('.team-card, .team-list-item').forEach(card => {
                card.style.backgroundColor = '';
            });
        });
    }
}

function displayFeaturedTeam() {
    const featuredTeam = allTeams[Math.floor(Math.random() * allTeams.length)];
    const container = document.getElementById('featured-team');
    if (container && featuredTeam) {
        const recentGame = featuredTeam.recent_games?.[0];
        const gameResult = recentGame
            ? (recentGame.scores?.find(s => s.team === featuredTeam.name)?.winner ? 'Won' : 'Lost')
            : 'No recent games';

        container.innerHTML = `
            <div class="team-card" data-id="${featuredTeam.team_id}" data-league="${featuredTeam.league}">
                <img src="${featuredTeam.logo}" alt="${featuredTeam.name} Logo" class="team-img">
                <h3>${featuredTeam.name}</h3>
                <p>League: ${featuredTeam.league}</p>
                <p>Location: ${featuredTeam.city}</p>
                <p style="color: ${featuredTeam.wins > featuredTeam.losses ? 'green' : 'red'}">Record: ${featuredTeam.wins}-${featuredTeam.losses}</p>
                <p style="color: ${gameResult === 'Won' ? 'blue' : 'orange'}">Last Game: ${gameResult}</p>
                ${featuredTeam.roster.length ? `
                    <div class="roster-toggle">Show Roster</div>
                    <div class="roster">
                        ${featuredTeam.roster.map(player => `
                            <p>${player.fullName} (${player.position}, Age: ${player.age}, Height: ${player.height}", Weight: ${player.weight} lbs, Exp: ${player.experience} yrs)</p>
                        `).join('')}
                    </div>
                ` : '<p>No roster available.</p>'}
            </div>
        `;

        // I asked ai: How can I make it so that you can toggle displaying the roster?
        const toggle = container.querySelector('.roster-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => {
                const roster = toggle.nextElementSibling;
                const card = toggle.closest('.team-card');
                if (roster && card) {
                    if (roster.classList.contains('expanded')) {
                        roster.classList.remove('expanded');
                        roster.style.height = '0';
                        card.classList.remove('roster-expanded');
                        toggle.textContent = 'Show Roster';
                    } else {
                        roster.classList.add('expanded');
                        roster.style.height = `${roster.scrollHeight}px`;
                        card.classList.add('roster-expanded');
                        toggle.textContent = 'Hide Roster';
                    }
                }
            });
        }

        const card = container.querySelector('.team-card');
        if (card) {
            applyHoverBackground(card, featuredTeam.league);
        }
    } else if (container) {
        container.innerHTML = '<p>No featured team available.</p>';
    }
}

// I asked ai: How can I apply pagination to my site?
function renderTeams(searchQuery = '') {
    const container = document.getElementById('teams-container');
    const pageInfo = document.getElementById('page-info');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const viewMode = document.getElementById('view-mode')?.value || 'grid';

    // I asked ai: How can I add a working search bar to my site?
    const filteredTeams = searchQuery
        ? allTeams.filter(team =>
              (team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              team.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              team.league?.toLowerCase().includes(searchQuery.toLowerCase())))
        : allTeams;

    if (!filteredTeams.length) {
        container.innerHTML = '<p>No teams match your search.</p>';
        if (pageInfo) pageInfo.textContent = 'Page 0 of 0';
        if (prevButton) prevButton.disabled = true;
        if (nextButton) nextButton.disabled = true;
        return;
    }

    const teamsPerPage = getTeamsPerPage(viewMode);

    const start = (currentPage - 1) * teamsPerPage;
    const end = start + teamsPerPage;
    const paginatedTeams = filteredTeams.slice(start, end);

    container.className = viewMode === 'grid' ? 'teams-grid' : 'teams-list';

    container.innerHTML = paginatedTeams.map(team => {
        const recentGame = team.recent_games?.[0];
        const gameResult = recentGame
            ? (recentGame.scores?.find(s => s.team === team.name)?.winner ? 'Won' : 'Lost')
            : 'No recent games';
        const teamId = team.team_id;
        return `
        <div class="${viewMode === 'grid' ? 'team-card' : 'team-list-item'}" data-id="${teamId}" data-league="${team.league}">
            <img src="${team.logo}" alt="${team.name} Logo" class="team-img">
            <h3>${team.name}</h3>
            <p>League: ${team.league}</p>
            <p>Location: ${team.city}</p>
            <p style="color: ${team.wins > team.losses ? 'green' : 'red'}">Record: ${team.wins}-${team.losses}</p>
            <p style="color: ${gameResult === 'Won' ? 'blue' : 'orange'}">Last Game: ${gameResult}</p>
            ${team.roster.length ? `
                <div class="roster-toggle">Show Roster</div>
                <div class="roster">
                    ${team.roster.map(player => `
                        <p>${player.fullName} (${player.position}, Age: ${player.age}, Height: ${player.height}", Weight: ${player.weight} lbs, Exp: ${player.experience} yrs)</p>
                    `).join('')}
                </div>
            ` : '<p>No roster available.</p>'}
        </div>
    `;
    }).join('');

    // I asked ai: How can I make it so that you can toggle displaying the roster?
    container.querySelectorAll('.roster-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const roster = toggle.nextElementSibling;
            const card = toggle.closest('.team-card, .team-list-item');
            if (roster && card) {
                if (roster.classList.contains('expanded')) {
                    roster.classList.remove('expanded');
                    roster.style.height = '0';
                    card.classList.remove('roster-expanded');
                    toggle.textContent = 'Show Roster';
                } else {
                    roster.classList.add('expanded');
                    roster.style.height = `${roster.scrollHeight}px`;
                    card.classList.add('roster-expanded');
                    toggle.textContent = 'Hide Roster';
                }
            }
        });
    });

    container.querySelectorAll('.team-card, .team-list-item').forEach(card => {
        const league = card.getAttribute('data-league');
        applyHoverBackground(card, league);
    });

    const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
    if (prevButton) prevButton.disabled = currentPage === 1;
    if (nextButton) nextButton.disabled = currentPage === totalPages;
}

// I asked ai: How can I add a working search bar to my site?
function setupSearch() {
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', () => {
            currentPage = 1;
            renderTeams(searchBar.value);
        });
    }
}

function setupViewMode() {
    const viewMode = document.getElementById('view-mode');
    if (viewMode) {
        viewMode.addEventListener('change', () => renderTeams(document.getElementById('search-bar')?.value || ''));
    }
}

// I asked ai: How can I apply pagination to my site?
function setupPagination() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTeams(document.getElementById('search-bar')?.value || '');
            }
        });
        nextButton.addEventListener('click', () => {
            const viewMode = document.getElementById('view-mode')?.value || 'grid';
            const teamsPerPage = getTeamsPerPage(viewMode);
            const totalPages = Math.ceil(allTeams.length / teamsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTeams(document.getElementById('search-bar')?.value || '');
            }
        });
    }
}

// I asked ai: How can I implement data persistance in my site?
// function saveRecentlyViewed() {
//     const viewedTeams = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
//     const currentTeams = allTeams.slice(0, 3).map(team => team.team_id);
//     const updatedViewed = [...new Set([...currentTeams, ...viewedTeams])].slice(0, 5);
//     localStorage.setItem('recentlyViewed', JSON.stringify(updatedViewed));
// }

// I asked ai: How can I put a dark mode that I can toggle on my sight?
function setupDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });

        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTeams();
    setupSearch();
    setupViewMode();
    setupPagination();
    setupDarkMode();
    setupDarkModeBackgroundReset();
});