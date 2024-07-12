document.addEventListener('DOMContentLoaded', function() {
    showSection('graphSection');

    // Add event listeners for navigation buttons
    document.getElementById('graphBtn').addEventListener('click', function() {
        showSection('graphSection');
    });

    document.getElementById('timerBtn').addEventListener('click', function() {
        showSection('timerSection');
    });

    document.getElementById('youtubeBtn').addEventListener('click', function() {
        showSection('youtubeSection');
    });

    document.getElementById('removeRecommendationsBtn').addEventListener('click', removeYouTubeRecommendations);

    document.getElementById('settimerBtn').addEventListener('click', setTimer);

    showUsageGraph();
});

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
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
        console.log('Retrieved usage data:', usageData);

        const labels = Object.keys(usageData);
        const data = Object.values(usageData);

        if (labels.length === 0 || data.length === 0) {
            console.log('No usage data available to display.');
            return;
        }

        const ctx = document.getElementById('usageChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Usage',
                    data: data,
                    backgroundColor: generateColors(data.length),
                    borderWidth : 20
                }]
            },
            options: {
                responsive: true,
                cutout : '90%'
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
