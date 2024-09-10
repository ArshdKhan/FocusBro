let removeRecommendations = true;

function removeYouTubeRecommendations() {
    if (!removeRecommendations) return;

    // Remove recommendations from home page
    const homePageRecommendations = document.querySelector('ytd-rich-grid-renderer');
    if (homePageRecommendations) homePageRecommendations.style.display = 'none';

    // Remove recommendations from watch page
    const watchPageRecommendations = document.querySelector('#secondary');
    if (watchPageRecommendations) watchPageRecommendations.style.display = 'none';

    // Force theater mode
    const theaterMode = document.querySelector('.ytp-size-button');
    if (theaterMode && theaterMode.title.includes('Theater mode')) {
        theaterMode.click();
    }

    // Expand video to full width
    const video = document.querySelector('#player-container-inner');
    if (video) video.style.width = '100%';
}

function addSearchBarToHomePage() {
    const existingSearchBar = document.querySelector('#search');
    if (existingSearchBar) return;

    const searchBar = document.createElement('div');
    searchBar.innerHTML = `
        <input type="text" id="focusbro-search" placeholder="Search YouTube">
        <button id="focusbro-search-btn">Search</button>
    `;
    document.body.insertBefore(searchBar, document.body.firstChild);

    document.getElementById('focusbro-search-btn').addEventListener('click', () => {
        const query = document.getElementById('focusbro-search').value;
        window.location.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    });
}

function init() {
    removeYouTubeRecommendations();
    addSearchBarToHomePage();

    // Create a MutationObserver to handle dynamic content loading
    const observer = new MutationObserver(removeYouTubeRecommendations);
    observer.observe(document.body, { childList: true, subtree: true });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleRecommendations') {
        removeRecommendations = !removeRecommendations;
        removeYouTubeRecommendations();
        sendResponse({ status: 'Recommendations toggled' });
    }
});

init();