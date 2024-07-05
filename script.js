document.addEventListener('DOMContentLoaded', function() {
    // Show the graph section by default
    showSection('graphSection');

    // Bind click event for Remove Recommendations button
    document.getElementById('removeRecommendationsBtn').addEventListener('click', removeYouTubeRecommendations);

    // Display usage graph on popup load
    showUsageGraph();
});

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

function setTimer() {
    const website = document.getElementById('website').value;
    const dailyLimit = document.getElementById('dailyLimit').value;
    const sessionLimit = document.getElementById('sessionLimit').value;

    if (!website) {
        alert('Please enter a website.');
        return;
    }

    alert(`Website: ${website}\nDaily Limit: ${dailyLimit} minutes\nSession Limit: ${sessionLimit} minutes`);

    // Store the timer settings
    chrome.storage.local.get({ timers: {} }, function(result) {
        const timers = result.timers;
        timers[website] = { dailyLimit, sessionLimit };
        chrome.storage.local.set({ timers });
    });
}

function removeYouTubeRecommendations() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'removeRecommendations' }, function(response) {
            console.log(response);
        });
    });
}

function showUsageGraph() {
    chrome.storage.local.get(['usageData'], function(result) {
        const usageData = result.usageData || {};

        const labels = Object.keys(usageData);
        const data = Object.values(usageData);

        const ctx = document.getElementById('usageChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Usage',
                    data: data,
                    backgroundColor: generateColors(data.length),
                }]
            },
            options: {
                responsive: true
            }
        });
    });
}

function generateColors(num) {
    const colors = [];
    for (let i = 0; i < num; i++) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
    return colors;
}