// API Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://aninescraper.vercel.app';

// State Management
let currentVideoId = null;
let currentVideoData = null;
let searchResults = [];
let currentSpotifyData = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const tabs = document.getElementById('tabs');
const searchResultsSection = document.getElementById('searchResults');
const videoInfoSection = document.getElementById('videoInfo');
const resultsGrid = document.getElementById('resultsGrid');

// Video Info Elements
const videoThumbnail = document.getElementById('videoThumbnail');
const videoDuration = document.getElementById('videoDuration');
const videoTitle = document.getElementById('videoTitle');
const channelName = document.getElementById('channelName');
const videoViews = document.getElementById('videoViews');
const videoLikes = document.getElementById('videoLikes');
const videoDate = document.getElementById('videoDate');
const videoDescription = document.getElementById('videoDescription');
const qualitySelect = document.getElementById('qualitySelect');
const downloadBtn = document.getElementById('downloadBtn');
const streamBtn = document.getElementById('streamBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const downloadInfo = document.getElementById('downloadInfo');

// Spotify Elements
const spotifyInfoSection = document.getElementById('spotifyInfo');
const spotifyArt = document.getElementById('spotifyArt');
const spotifyTitle = document.getElementById('spotifyTitle');
const spotifyArtist = document.getElementById('spotifyArtist');
const spotifyDuration = document.getElementById('spotifyDuration');
const spotifyDownloadBtn = document.getElementById('spotifyDownloadBtn');
const spotifyPreviewBtn = document.getElementById('spotifyPreviewBtn');
const spotifyDownloadInfo = document.getElementById('spotifyDownloadInfo');
const spotifyYoutubeMatch = document.getElementById('spotifyYoutubeMatch');
const spotifyTrackList = document.getElementById('spotifyTrackList');
const spotifyTracks = document.getElementById('spotifyTracks');

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
downloadBtn.addEventListener('click', handleDownload);
streamBtn.addEventListener('click', handleStream);
copyLinkBtn.addEventListener('click', handleCopyLink);
spotifyDownloadBtn.addEventListener('click', handleSpotifyDownload);
spotifyPreviewBtn.addEventListener('click', handleSpotifyPreview);

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
    });
});

// Utility Functions
function showLoading() {
    loading.classList.remove('hidden');
    hideError();
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    hideLoading();
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Show/hide sections
    searchResultsSection.classList.add('hidden');
    videoInfoSection.classList.add('hidden');
    spotifyInfoSection.classList.add('hidden');

    if (tab === 'search') {
        searchResultsSection.classList.remove('hidden');
    } else if (tab === 'video') {
        videoInfoSection.classList.remove('hidden');
    } else if (tab === 'spotify') {
        spotifyInfoSection.classList.remove('hidden');
    }
}

function extractVideoId(input) {
    // Check if it's a YouTube URL
    const urlPatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/\s]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of urlPatterns) {
        const match = input.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function isSpotifyUrl(input) {
    return /^https?:\/\/(open\.)?spotify\.com\/(track|album|playlist)\//.test(input);
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        const years = Math.floor(diffDays / 365);
        return years === 1 ? '1 year ago' : `${years} years ago`;
    }
}

// API Functions
async function searchYouTube(query) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/youtube/search?query=${encodeURIComponent(query)}&limit=12&type=video`);
        
        if (!response.ok) {
            throw new Error('Failed to search videos');
        }

        const data = await response.json();
        hideLoading();
        return data.results || [];
    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to search videos. Please try again.');
        return [];
    }
}

async function getVideoInfo(videoId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/youtube/info/${videoId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            if (response.status === 429 || (errorData.error && errorData.error.includes('bot detection'))) {
                throw new Error('YouTube bot detection is active. The server may need cookie configuration.');
            }
            throw new Error(errorData.error || 'Failed to get video information');
        }

        const data = await response.json();
        hideLoading();
        
        // Show notice if backend had to fall back
        if (data.notice) {
            console.log('Backend notice:', data.notice);
        }
        
        return data;
    } catch (error) {
        console.error('Video info error:', error);
        showError(error.message || 'Failed to get video information. Please try again.');
        return null;
    }
}

// Event Handlers
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter a search term or video URL');
        return;
    }

    hideError();

    // Check if it's a Spotify URL
    if (isSpotifyUrl(query)) {
        await loadSpotifyInfo(query);
        tabs.style.display = 'flex';
        switchTab('spotify');
        return;
    }

    // Check if it's a video URL/ID
    const videoId = extractVideoId(query);
    if (videoId) {
        // Direct video info
        await loadVideoInfo(videoId);
        tabs.style.display = 'flex';
        switchTab('video');
    } else {
        // Search for videos
        searchResults = await searchYouTube(query);
        displaySearchResults(searchResults);
        tabs.style.display = 'flex';
        switchTab('search');
    }
}

function displaySearchResults(results) {
    resultsGrid.innerHTML = '';

    if (!results || results.length === 0) {
        resultsGrid.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No results found. Try a different search term.</p>';
        return;
    }

    results.forEach(result => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.onclick = () => loadVideoInfo(result.id);

        card.innerHTML = `
            <img src="${result.thumbnail}" alt="${result.title}" class="result-thumbnail">
            <div class="result-info">
                <div class="result-title">${result.title}</div>
                <div class="result-channel">${result.channelName || 'Unknown'}</div>
                <div class="result-meta">
                    ${result.duration ? `<span>${result.duration}</span>` : ''}
                    ${result.views ? `<span>${formatNumber(result.views)} views</span>` : ''}
                </div>
            </div>
        `;

        resultsGrid.appendChild(card);
    });
}

async function loadVideoInfo(videoId) {
    currentVideoId = videoId;
    currentVideoData = await getVideoInfo(videoId);

    if (!currentVideoData) {
        return;
    }

    // Update thumbnail
    videoThumbnail.src = currentVideoData.thumbnail;
    videoDuration.textContent = currentVideoData.duration ? formatDuration(currentVideoData.duration) : '';

    // Update metadata
    videoTitle.textContent = currentVideoData.title;
    channelName.textContent = currentVideoData.author.name;
    videoViews.innerHTML = `👁️ ${formatNumber(currentVideoData.stats.views)} views`;
    videoLikes.innerHTML = currentVideoData.stats.likes 
        ? `👍 ${formatNumber(currentVideoData.stats.likes)} likes`
        : '';
    videoDate.innerHTML = currentVideoData.uploadDate 
        ? `📅 ${formatDate(currentVideoData.uploadDate)}`
        : '';

    // Update description (truncated)
    const descText = (currentVideoData.description || '').substring(0, 500);
    videoDescription.textContent = descText + ((currentVideoData.description || '').length > 500 ? '...' : '');

    // Show notice if backend had limited capabilities
    if (currentVideoData.notice) {
        downloadInfo.classList.remove('hidden');
        downloadInfo.querySelector('.info-text').textContent = `ℹ️ ${currentVideoData.notice}`;
    }

    // Show video info section
    videoInfoSection.classList.remove('hidden');
    tabs.style.display = 'flex';
    switchTab('video');
}

async function handleDownload() {
    if (!currentVideoId) {
        showError('No video selected');
        return;
    }

    const quality = qualitySelect.value;
    const downloadUrl = `${API_BASE}/youtube/download/${currentVideoId}?quality=${quality}`;
    
    // Disable button and show progress
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<span class="btn-icon">⏳</span> Downloading...';
    downloadInfo.classList.remove('hidden');
    downloadInfo.querySelector('.info-text').textContent = '⏳ Preparing download... This may take a moment.';

    try {
        const response = await fetch(downloadUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Download failed (HTTP ${response.status})`);
        }

        // Get filename from Content-Disposition header if available
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${currentVideoData?.title || 'video'}.mp4`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
            if (match) {
                filename = match[1];
            }
        }

        // Stream the response into a blob
        const blob = await response.blob();

        // Create a temporary download link and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        downloadInfo.querySelector('.info-text').textContent = '🎉 Download complete! Check your browser downloads.';
    } catch (error) {
        console.error('Download error:', error);
        const msg = error.message || 'Unknown error';
        if (msg.includes('bot detection') || msg.includes('429')) {
            downloadInfo.querySelector('.info-text').textContent = '❌ YouTube bot detection active. The server needs YOUTUBE_COOKIE to be configured. Try again later or contact the administrator.';
        } else {
            downloadInfo.querySelector('.info-text').textContent = `❌ Download failed: ${msg}`;
        }
    } finally {
        // Re-enable button
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<span class="btn-icon">⬇️</span> Download Now';

        // Hide info after 5 seconds
        setTimeout(() => {
            downloadInfo.classList.add('hidden');
        }, 5000);
    }
}

function handleStream() {
    if (!currentVideoId) {
        showError('No video selected');
        return;
    }

    const quality = qualitySelect.value;
    const streamUrl = `${API_BASE}/youtube/stream/${currentVideoId}?quality=${quality}`;
    
    // Open in new tab
    window.open(streamUrl, '_blank');
}

function handleCopyLink() {
    if (!currentVideoId) {
        showError('No video selected');
        return;
    }

    const quality = qualitySelect.value;
    const downloadUrl = `${API_BASE}/youtube/download/${currentVideoId}?quality=${quality}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(downloadUrl).then(() => {
        downloadInfo.classList.remove('hidden');
        downloadInfo.querySelector('.info-text').textContent = '✅ Download link copied to clipboard!';

        setTimeout(() => {
            downloadInfo.classList.add('hidden');
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        showError('Failed to copy link to clipboard');
    });
}

// --- Spotify Functions ---

async function loadSpotifyInfo(spotifyUrl) {
    try {
        showLoading();

        // Get track info + YouTube match from backend
        const response = await fetch(`${API_BASE}/spotify/search?url=${encodeURIComponent(spotifyUrl)}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to get Spotify track info');
        }

        const data = await response.json();
        hideLoading();
        currentSpotifyData = data;

        // Update UI
        spotifyArt.src = data.track.image || '';
        spotifyTitle.textContent = data.track.title;
        spotifyArtist.textContent = data.track.artist;

        if (data.track.duration) {
            const durationSec = Math.floor(data.track.duration / 1000);
            spotifyDuration.textContent = `Duration: ${formatDuration(durationSec)}`;
        } else {
            spotifyDuration.textContent = '';
        }

        // Show YouTube match info
        if (data.youtubeVideoId) {
            spotifyYoutubeMatch.classList.remove('hidden');
            spotifyYoutubeMatch.querySelector('.match-text').textContent =
                `✅ Found on YouTube: "${data.youtubeVideoTitle}"`;
            spotifyDownloadBtn.disabled = false;
        } else {
            spotifyYoutubeMatch.classList.remove('hidden');
            spotifyYoutubeMatch.querySelector('.match-text').textContent =
                '⚠️ Could not find a matching YouTube video for download';
            spotifyDownloadBtn.disabled = true;
        }

        // Show/hide preview button based on preview availability
        if (data.track.previewUrl) {
            spotifyPreviewBtn.disabled = false;
        } else {
            spotifyPreviewBtn.disabled = true;
        }

        spotifyInfoSection.classList.remove('hidden');
    } catch (error) {
        console.error('Spotify info error:', error);
        showError(error.message || 'Failed to get Spotify track information');
    }
}

async function handleSpotifyDownload() {
    if (!currentSpotifyData || !currentSpotifyData.track) {
        showError('No Spotify track selected');
        return;
    }

    const spotifyUrl = currentSpotifyData.track.spotifyUrl || searchInput.value.trim();
    const downloadUrl = `${API_BASE}/spotify/download?url=${encodeURIComponent(spotifyUrl)}`;

    spotifyDownloadBtn.disabled = true;
    spotifyDownloadBtn.innerHTML = '<span class="btn-icon">⏳</span> Downloading...';
    spotifyDownloadInfo.classList.remove('hidden');
    spotifyDownloadInfo.querySelector('.info-text').textContent =
        '⏳ Searching YouTube and preparing audio download... This may take a moment.';

    try {
        const response = await fetch(downloadUrl);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Download failed (HTTP ${response.status})`);
        }

        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `${currentSpotifyData.track.artist} - ${currentSpotifyData.track.title}.m4a`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
            if (match) {
                filename = match[1];
            }
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        spotifyDownloadInfo.querySelector('.info-text').textContent =
            '🎉 Download complete! Check your browser downloads.';
    } catch (error) {
        console.error('Spotify download error:', error);
        spotifyDownloadInfo.querySelector('.info-text').textContent =
            `❌ Download failed: ${error.message || 'Unknown error'}`;
    } finally {
        spotifyDownloadBtn.disabled = false;
        spotifyDownloadBtn.innerHTML = '<span class="btn-icon">⬇️</span> Download Audio';

        setTimeout(() => {
            spotifyDownloadInfo.classList.add('hidden');
        }, 5000);
    }
}

function handleSpotifyPreview() {
    if (!currentSpotifyData || !currentSpotifyData.track || !currentSpotifyData.track.previewUrl) {
        showError('No preview available for this track');
        return;
    }

    window.open(currentSpotifyData.track.previewUrl, '_blank');
}

// Initialize
console.log('Media Downloader initialized');
console.log('API Base:', API_BASE);
