// API Base URL - using the deployed Vercel API
const API_BASE = 'https://aninescraper.vercel.app';

// Constants
const AUTO_SERVER = 'auto';

// State management
let currentAnimeId = null;
let currentEpisodeId = null;
let currentEpisodes = [];
let spotlightIndex = 0;
let spotlightInterval = null;

// DOM Elements
const mainContent = document.getElementById('mainContent');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    showHome();
});

// Utility Functions
function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function handleSearchKeyup(event) {
    if (event.key === 'Enter') {
        searchAnime();
    }
}

async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Home Page
async function showHome() {
    showLoading();
    mainContent.innerHTML = '';
    
    try {
        const data = await fetchAPI('/aniwatch/');
        hideLoading();
        renderHomePage(data);
    } catch (error) {
        hideLoading();
        showError('Failed to load home page. Please try again later.');
    }
}

function renderHomePage(data) {
    let html = '';
    
    // Spotlight Section
    if (data.spotLightAnimes && data.spotLightAnimes.length > 0) {
        html += renderSpotlight(data.spotLightAnimes.slice(0, 5));
    }
    
    // Latest Episodes
    if (data.latestEpisodes && data.latestEpisodes.length > 0) {
        html += `
            <section class="anime-section">
                <h2 class="section-title">Latest Episodes</h2>
                <div class="anime-grid">
                    ${data.latestEpisodes.map(anime => renderAnimeCard(anime)).join('')}
                </div>
            </section>
        `;
    }
    
    // Top Airing
    if (data.featuredAnimes && data.featuredAnimes.topAiringAnimes) {
        html += `
            <section class="anime-section">
                <h2 class="section-title">Top Airing</h2>
                <div class="anime-grid">
                    ${data.featuredAnimes.topAiringAnimes.map(anime => renderAnimeCard(anime)).join('')}
                </div>
            </section>
        `;
    }
    
    // Most Popular
    if (data.featuredAnimes && data.featuredAnimes.mostPopularAnimes) {
        html += `
            <section class="anime-section">
                <h2 class="section-title">Most Popular</h2>
                <div class="anime-grid">
                    ${data.featuredAnimes.mostPopularAnimes.map(anime => renderAnimeCard(anime)).join('')}
                </div>
            </section>
        `;
    }
    
    // Trending
    if (data.trendingAnimes && data.trendingAnimes.length > 0) {
        html += `
            <section class="anime-section">
                <h2 class="section-title">Trending Now</h2>
                <div class="anime-grid">
                    ${data.trendingAnimes.map(anime => renderAnimeCard(anime)).join('')}
                </div>
            </section>
        `;
    }
    
    mainContent.innerHTML = html;
    
    // Start spotlight rotation
    if (data.spotLightAnimes && data.spotLightAnimes.length > 0) {
        startSpotlightRotation(data.spotLightAnimes.length);
    }
}

function renderSpotlight(spotlightAnimes) {
    return `
        <section class="spotlight-section">
            <div class="spotlight-slider">
                ${spotlightAnimes.map((anime, index) => `
                    <div class="spotlight-item ${index === 0 ? 'active' : ''}" 
                         style="background-image: url('${anime.img}')"
                         data-index="${index}">
                        <div class="spotlight-overlay">
                            <div class="spotlight-content">
                                <span class="spotlight-rank">#${anime.rank || index + 1} Spotlight</span>
                                <h1 class="spotlight-title">${escapeHtml(anime.name)}</h1>
                                <div class="spotlight-meta">
                                    ${anime.quality ? `<span>${anime.quality}</span>` : ''}
                                    ${anime.duration ? `<span>${anime.duration}</span>` : ''}
                                    ${anime.category ? `<span>${anime.category}</span>` : ''}
                                    ${anime.episodes ? `<span>EP ${anime.episodes.sub || anime.episodes.eps || '?'}</span>` : ''}
                                </div>
                                <p class="spotlight-description">${escapeHtml(anime.descriptions || 'No description available.')}</p>
                                <div class="spotlight-buttons">
                                    <button class="btn btn-primary" onclick="showAnimeDetail('${anime.id}')">
                                        ▶ Watch Now
                                    </button>
                                    <button class="btn btn-secondary" onclick="showAnimeDetail('${anime.id}')">
                                        ℹ️ Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                <div class="spotlight-nav">
                    ${spotlightAnimes.map((_, index) => `
                        <div class="spotlight-dot ${index === 0 ? 'active' : ''}" 
                             onclick="goToSpotlight(${index})"
                             data-index="${index}"></div>
                    `).join('')}
                </div>
            </div>
        </section>
    `;
}

function startSpotlightRotation(count) {
    if (spotlightInterval) {
        clearInterval(spotlightInterval);
    }
    
    spotlightInterval = setInterval(() => {
        spotlightIndex = (spotlightIndex + 1) % count;
        updateSpotlight();
    }, 5000);
}

function goToSpotlight(index) {
    spotlightIndex = index;
    updateSpotlight();
}

function updateSpotlight() {
    const items = document.querySelectorAll('.spotlight-item');
    const dots = document.querySelectorAll('.spotlight-dot');
    
    items.forEach((item, i) => {
        item.classList.toggle('active', i === spotlightIndex);
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === spotlightIndex);
    });
}

function renderAnimeCard(anime) {
    const episodes = anime.episodes || {};
    const episodeText = episodes.sub || episodes.eps || episodes.dub || '';
    
    return `
        <div class="anime-card" onclick="showAnimeDetail('${anime.id}')">
            <div class="anime-card-image">
                <img src="${anime.img}" alt="${escapeHtml(anime.name)}" loading="lazy" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>No Image</text></svg>'">
                ${anime.category ? `<span class="anime-card-badge">${anime.category}</span>` : ''}
                ${episodeText ? `<span class="anime-card-episodes">EP ${episodeText}</span>` : ''}
            </div>
            <div class="anime-card-info">
                <h3 class="anime-card-title">${escapeHtml(anime.name)}</h3>
                <div class="anime-card-meta">
                    ${anime.duration ? `<span>${anime.duration}</span>` : ''}
                    ${anime.rated ? `<span>18+</span>` : ''}
                </div>
            </div>
        </div>
    `;
}

// Search
async function searchAnime() {
    const query = searchInput.value.trim();
    if (!query) return;
    
    showLoading();
    mainContent.innerHTML = '';
    
    try {
        const data = await fetchAPI(`/aniwatch/search?keyword=${encodeURIComponent(query)}&page=1`);
        hideLoading();
        renderSearchResults(data, query);
    } catch (error) {
        hideLoading();
        showError('Search failed. Please try again.');
    }
}

function renderSearchResults(data, query) {
    let html = `
        <h2 class="section-title">Search Results for "${escapeHtml(query)}"</h2>
    `;
    
    if (data.animes && data.animes.length > 0) {
        html += `
            <div class="anime-grid">
                ${data.animes.map(anime => renderAnimeCard(anime)).join('')}
            </div>
        `;
        
        // Pagination
        if (data.totalPages > 1) {
            html += renderPagination(data.currentPage, data.totalPages, 'search', query);
        }
    } else {
        html += `
            <div class="error-message">
                <h2>No Results Found</h2>
                <p>Try a different search term.</p>
            </div>
        `;
    }
    
    mainContent.innerHTML = html;
}

// Category
async function showCategory(category, page = 1) {
    showLoading();
    mainContent.innerHTML = '';
    
    try {
        const data = await fetchAPI(`/aniwatch/${category}?page=${page}`);
        hideLoading();
        renderCategoryResults(data, category);
    } catch (error) {
        hideLoading();
        showError('Failed to load category. Please try again.');
    }
}

function renderCategoryResults(data, category) {
    const categoryNames = {
        'top-airing': 'Top Airing',
        'most-popular': 'Most Popular',
        'movie': 'Movies',
        'tv': 'TV Series',
        'ova': 'OVA',
        'ona': 'ONA',
        'special': 'Specials'
    };
    
    let html = `
        <h2 class="section-title">${categoryNames[category] || category}</h2>
    `;
    
    if (data.animes && data.animes.length > 0) {
        html += `
            <div class="anime-grid">
                ${data.animes.map(anime => renderAnimeCard(anime)).join('')}
            </div>
        `;
        
        if (data.totalPages > 1) {
            html += renderPagination(data.currentPage, data.totalPages, 'category', category);
        }
    } else {
        html += `
            <div class="error-message">
                <h2>No Anime Found</h2>
                <p>Check back later for updates.</p>
            </div>
        `;
    }
    
    mainContent.innerHTML = html;
}

// Anime Detail
async function showAnimeDetail(id) {
    showLoading();
    mainContent.innerHTML = '';
    currentAnimeId = id;
    
    try {
        const [animeData, episodesData] = await Promise.all([
            fetchAPI(`/aniwatch/anime/${id}`),
            fetchAPI(`/aniwatch/episodes/${id}`)
        ]);
        
        hideLoading();
        currentEpisodes = episodesData.episodes || [];
        renderAnimeDetail(animeData, episodesData);
    } catch (error) {
        hideLoading();
        showError('Failed to load anime details. Please try again.');
    }
}

function renderAnimeDetail(animeData, episodesData) {
    const info = animeData.info || {};
    const moreInfo = animeData.moreInfo || {};
    
    let html = `
        <div class="player-section" id="playerSection">
            <div class="player-container" id="playerContainer">
                <div class="player-placeholder">
                    <span class="player-placeholder-icon">▶️</span>
                    <p>Select an episode to start watching</p>
                </div>
            </div>
            <div class="player-info" id="playerInfo" style="display: none;">
                <span class="player-episode-info" id="episodeInfo">Episode 1</span>
                <div class="server-buttons" id="serverButtons"></div>
            </div>
        </div>
        
        <div class="anime-detail">
            <div class="anime-detail-poster">
                <img src="${info.img}" alt="${escapeHtml(info.name || 'Anime')}" 
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22><rect fill=%22%231a1a2e%22 width=%22200%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2220%22>No Image</text></svg>'">
            </div>
            <div class="anime-detail-info">
                <h1 class="anime-detail-title">${escapeHtml(info.name || 'Unknown')}</h1>
                <div class="anime-detail-meta">
                    ${info.rating ? `<span>⭐ ${info.rating}</span>` : ''}
                    ${info.quality ? `<span>${info.quality}</span>` : ''}
                    ${info.category ? `<span>${info.category}</span>` : ''}
                    ${info.duration ? `<span>${info.duration}</span>` : ''}
                    ${info.episodes ? `<span>Episodes: ${info.episodes.sub || info.episodes.eps || '?'}</span>` : ''}
                </div>
                <p class="anime-detail-description">${escapeHtml(info.description || 'No description available.')}</p>
                
                <div class="anime-detail-extra">
                    <h3>More Information</h3>
                    <div class="anime-detail-extra-grid">
                        ${moreInfo['Japanese:'] ? `
                            <div class="anime-detail-extra-item">
                                <strong>Japanese</strong>
                                <span>${escapeHtml(moreInfo['Japanese:'])}</span>
                            </div>
                        ` : ''}
                        ${moreInfo['Aired:'] ? `
                            <div class="anime-detail-extra-item">
                                <strong>Aired</strong>
                                <span>${escapeHtml(moreInfo['Aired:'])}</span>
                            </div>
                        ` : ''}
                        ${moreInfo['Status:'] ? `
                            <div class="anime-detail-extra-item">
                                <strong>Status</strong>
                                <span>${escapeHtml(moreInfo['Status:'])}</span>
                            </div>
                        ` : ''}
                        ${moreInfo['MAL Score:'] ? `
                            <div class="anime-detail-extra-item">
                                <strong>MAL Score</strong>
                                <span>${escapeHtml(moreInfo['MAL Score:'])}</span>
                            </div>
                        ` : ''}
                        ${moreInfo['Studios:'] ? `
                            <div class="anime-detail-extra-item">
                                <strong>Studios</strong>
                                <span>${Array.isArray(moreInfo['Studios:']) ? moreInfo['Studios:'].join(', ') : escapeHtml(moreInfo['Studios:'])}</span>
                            </div>
                        ` : ''}
                        ${moreInfo['Genres'] ? `
                            <div class="anime-detail-extra-item">
                                <strong>Genres</strong>
                                <span>${Array.isArray(moreInfo['Genres']) ? moreInfo['Genres'].join(', ') : escapeHtml(moreInfo['Genres'])}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="episodes-section">
            <div class="episodes-header">
                <h2 class="episodes-title">Episodes (${episodesData.totalEpisodes || 0})</h2>
                <div class="episodes-filters">
                    <button class="episodes-filter active" onclick="filterEpisodes('all', this)">All</button>
                    <button class="episodes-filter" onclick="filterEpisodes('sub', this)">Sub</button>
                    <button class="episodes-filter" onclick="filterEpisodes('dub', this)">Dub</button>
                </div>
            </div>
            <div class="episodes-grid" id="episodesGrid">
                ${renderEpisodeButtons(episodesData.episodes || [])}
            </div>
        </div>
    `;
    
    // Related/Recommended anime
    if (animeData.recommendedAnimes && animeData.recommendedAnimes.length > 0) {
        html += `
            <section class="anime-section">
                <h2 class="section-title">Recommended</h2>
                <div class="anime-grid">
                    ${animeData.recommendedAnimes.slice(0, 12).map(anime => renderAnimeCard(anime)).join('')}
                </div>
            </section>
        `;
    }
    
    if (animeData.relatedAnimes && animeData.relatedAnimes.length > 0) {
        html += `
            <section class="anime-section">
                <h2 class="section-title">Related Anime</h2>
                <div class="anime-grid">
                    ${animeData.relatedAnimes.slice(0, 12).map(anime => renderAnimeCard(anime)).join('')}
                </div>
            </section>
        `;
    }
    
    mainContent.innerHTML = html;
}

function renderEpisodeButtons(episodes) {
    if (!episodes || episodes.length === 0) {
        return '<p>No episodes available.</p>';
    }
    
    return episodes.map(ep => `
        <button class="episode-btn ${ep.filler ? 'filler' : ''}" 
                onclick="playEpisode('${ep.episodeId}', ${ep.episodeNo})"
                data-episode-id="${ep.episodeId}"
                title="${escapeHtml(ep.name || `Episode ${ep.episodeNo}`)}">
            ${ep.episodeNo}
        </button>
    `).join('');
}

function filterEpisodes(type, element) {
    // Update filter button states
    document.querySelectorAll('.episodes-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    if (element) {
        element.classList.add('active');
    }
    
    // For now, just show all episodes (filtering would require additional API data)
    const grid = document.getElementById('episodesGrid');
    if (grid) {
        grid.innerHTML = renderEpisodeButtons(currentEpisodes);
    }
}

// Play Episode
async function playEpisode(episodeId, episodeNo) {
    currentEpisodeId = episodeId;
    
    // Highlight selected episode
    document.querySelectorAll('.episode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.episodeId === episodeId) {
            btn.classList.add('active');
        }
    });
    
    // Show loading in player
    const playerContainer = document.getElementById('playerContainer');
    playerContainer.innerHTML = `
        <div class="player-placeholder">
            <div class="spinner"></div>
            <p>Loading episode...</p>
        </div>
    `;
    
    try {
        // Get servers
        const serversData = await fetchAPI(`/aniwatch/servers?id=${encodeURIComponent(episodeId)}`);
        
        // Update player info
        const playerInfo = document.getElementById('playerInfo');
        const episodeInfo = document.getElementById('episodeInfo');
        episodeInfo.textContent = `Episode ${episodeNo}`;
        playerInfo.style.display = 'flex';
        
        // Render server buttons
        renderServerButtons(serversData, episodeId);
        
        // Auto-select using fallback endpoint (tries all servers)
        const category = (serversData.sub && serversData.sub.length > 0) ? 'sub' : 'dub';
        if (serversData.sub.length > 0 || serversData.dub.length > 0) {
            await loadVideoSource(episodeId, AUTO_SERVER, category);
        } else {
            playerContainer.innerHTML = `
                <div class="player-placeholder">
                    <span class="player-placeholder-icon">⚠️</span>
                    <p>No video sources available for this episode.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading episode:', error);
        playerContainer.innerHTML = `
            <div class="player-placeholder">
                <span class="player-placeholder-icon">❌</span>
                <p>Failed to load episode. Please try again.</p>
            </div>
        `;
    }
    
    // Scroll to player
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
}

function renderServerButtons(serversData, episodeId) {
    const serverButtons = document.getElementById('serverButtons');
    let html = '';
    
    // Sub servers
    if (serversData.sub && serversData.sub.length > 0) {
        html += `<span style="color: var(--text-muted); margin-right: 0.5rem;">SUB:</span>`;
        serversData.sub.forEach(server => {
            html += `
                <button class="server-btn" 
                        onclick="loadVideoSource('${episodeId}', '${server.serverName}', 'sub')"
                        data-server="${server.serverName}"
                        data-category="sub">
                    ${server.serverName}
                </button>
            `;
        });
    }
    
    // Dub servers
    if (serversData.dub && serversData.dub.length > 0) {
        html += `<span style="color: var(--text-muted); margin-left: 1rem; margin-right: 0.5rem;">DUB:</span>`;
        serversData.dub.forEach(server => {
            html += `
                <button class="server-btn" 
                        onclick="loadVideoSource('${episodeId}', '${server.serverName}', 'dub')"
                        data-server="${server.serverName}"
                        data-category="dub">
                    ${server.serverName}
                </button>
            `;
        });
    }
    
    serverButtons.innerHTML = html;
}

async function loadVideoSource(episodeId, serverName, category) {
    const playerContainer = document.getElementById('playerContainer');
    
    // Highlight selected server
    document.querySelectorAll('.server-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.server === serverName && btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    playerContainer.innerHTML = `
        <div class="player-placeholder">
            <div class="spinner"></div>
            <p>Loading video source...</p>
        </div>
    `;
    
    try {
        let sourceData;
        
        // If no specific server is requested, use the fallback endpoint that tries all servers
        if (!serverName || serverName === AUTO_SERVER) {
            try {
                sourceData = await fetchAPI(`/aniwatch/episode-srcs-fallback?id=${encodeURIComponent(episodeId)}&category=${category}`);
                
                // Update UI to show which server was used
                if (sourceData.serverUsed) {
                    const serverBtn = document.querySelector(`.server-btn[data-server="${sourceData.serverUsed}"][data-category="${category}"]`);
                    if (serverBtn) {
                        document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
                        serverBtn.classList.add('active');
                    }
                }
            } catch (fallbackError) {
                console.error('Fallback endpoint failed, trying specific server:', fallbackError);
                // Fall back to trying specific server if fallback endpoint fails
                sourceData = await fetchAPI(`/aniwatch/episode-srcs?id=${encodeURIComponent(episodeId)}&server=${serverName}&category=${category}`);
            }
        } else {
            // Use specific server if requested
            sourceData = await fetchAPI(`/aniwatch/episode-srcs?id=${encodeURIComponent(episodeId)}&server=${serverName}&category=${category}`);
        }
        
        if (sourceData.sources && sourceData.sources.length > 0) {
            // Find the best source (prefer HLS/m3u8)
            const source = sourceData.sources.find(s => s.isM3U8) || sourceData.sources[0];
            
            // Create video player
            renderVideoPlayer(source.url, sourceData.subtitles || []);
        } else {
            playerContainer.innerHTML = `
                <div class="player-placeholder">
                    <span class="player-placeholder-icon">⚠️</span>
                    <p>No video source found. Try a different server.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading video source:', error);
        playerContainer.innerHTML = `
            <div class="player-placeholder">
                <span class="player-placeholder-icon">❌</span>
                <p>Failed to load video. Try a different server.</p>
            </div>
        `;
    }
}

function renderVideoPlayer(videoUrl, subtitles) {
    const playerContainer = document.getElementById('playerContainer');
    
    // Check if it's an m3u8 stream
    if (videoUrl.includes('.m3u8')) {
        // Use an iframe with a free HLS player service or fallback message
        playerContainer.innerHTML = `
            <div class="player-placeholder" style="flex-direction: column; gap: 1rem;">
                <span class="player-placeholder-icon">📺</span>
                <p>HLS Stream Available</p>
                <p style="font-size: 0.9rem; color: var(--text-muted);">
                    Stream URL: <a href="${videoUrl}" target="_blank" style="color: var(--accent-color); word-break: break-all;">${videoUrl}</a>
                </p>
                <p style="font-size: 0.8rem; color: var(--text-muted);">
                    Copy the URL and use a media player like VLC, or an HLS player extension.
                </p>
                <button class="btn btn-primary" onclick="copyToClipboard('${videoUrl}')">
                    📋 Copy Stream URL
                </button>
            </div>
        `;
    } else {
        // Direct video URL
        let tracksHtml = '';
        if (subtitles && subtitles.length > 0) {
            tracksHtml = subtitles.map((sub, index) => `
                <track kind="subtitles" src="${sub.url}" srclang="${sub.lang?.toLowerCase() || 'en'}" 
                       label="${sub.lang || 'Unknown'}" ${index === 0 ? 'default' : ''}>
            `).join('');
        }
        
        playerContainer.innerHTML = `
            <video controls autoplay>
                <source src="${videoUrl}" type="video/mp4">
                ${tracksHtml}
                Your browser does not support the video tag.
            </video>
        `;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Stream URL copied to clipboard!');
    }).catch(() => {
        // Fallback: show the URL in a prompt for manual copying
        showToast('Please copy the URL manually from the page.');
    });
}

function showToast(message) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create and show toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-color, #e94560);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 10000;
        animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Pagination
function renderPagination(currentPage, totalPages, type, query) {
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    let buttons = '';
    
    // Previous button
    buttons += `
        <button ${currentPage === 1 ? 'disabled' : ''} 
                onclick="goToPage(${currentPage - 1}, '${type}', '${query}')">
            ← Prev
        </button>
    `;
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        buttons += `
            <button class="${i === currentPage ? 'active' : ''}"
                    onclick="goToPage(${i}, '${type}', '${query}')">
                ${i}
            </button>
        `;
    }
    
    // Next button
    buttons += `
        <button ${currentPage === totalPages ? 'disabled' : ''} 
                onclick="goToPage(${currentPage + 1}, '${type}', '${query}')">
            Next →
        </button>
    `;
    
    return `<div class="pagination">${buttons}</div>`;
}

async function goToPage(page, type, query) {
    if (type === 'search') {
        showLoading();
        mainContent.innerHTML = '';
        try {
            const data = await fetchAPI(`/aniwatch/search?keyword=${encodeURIComponent(query)}&page=${page}`);
            hideLoading();
            renderSearchResults(data, query);
        } catch (error) {
            hideLoading();
            showError('Failed to load page. Please try again.');
        }
    } else if (type === 'category') {
        showCategory(query, page);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Error handling
function showError(message) {
    mainContent.innerHTML = `
        <div class="error-message">
            <h2>😔 Oops!</h2>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-primary" onclick="showHome()" style="margin-top: 1rem;">
                Go Home
            </button>
        </div>
    `;
}

// Utility: Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (spotlightInterval) {
        clearInterval(spotlightInterval);
    }
});
