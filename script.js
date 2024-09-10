document.addEventListener('DOMContentLoaded', function() {
    showSection('graphSection');

    // Add event listeners for navigation buttons
    document.getElementById('graphBtn').addEventListener('click', () => showSection('graphSection'));
    document.getElementById('timerBtn').addEventListener('click', () => showSection('timerSection'));
    document.getElementById('youtubeBtn').addEventListener('click', () => showSection('youtubeSection'));

    document.getElementById('removeRecommendationsBtn').addEventListener('click', toggleYouTubeRecommendations);
    document.getElementById('settimerBtn').addEventListener('click', setTimer);

    showUsageGraph();
    loadBlockedWebsites();
});

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = section.id === sectionId ? 'block' : 'none';
    });
}

function setTimer() {
    const website = document.getElementById('website').value.toLowerCase();
    const dailyLimit = parseInt(document.getElementById('dailyLimit').value);
    const sessionLimit = parseInt(document.getElementById('sessionLimit').value);

    if (!website || isNaN(dailyLimit) || isNaN(sessionLimit)) {
        alert('Please enter valid website and time limits.');
        return;
    }

    chrome.storage.local.get({ blockedWebsites: {} }, function(result) {
        const blockedWebsites = result.blockedWebsites;
        blockedWebsites[website] = { dailyLimit, sessionLimit };
        chrome.storage.local.set({ blockedWebsites }, function() {
            loadBlockedWebsites();
            alert(`Timer set for ${website}`);
        });
    });
}

function loadBlockedWebsites() {
    chrome.storage.local.get({ blockedWebsites: {} }, function(result) {
        const blockedWebsites = result.blockedWebsites;
        const blockedList = document.getElementById('blockedWebsites');
        blockedList.innerHTML = '';

        for (const [website, limits] of Object.entries(blockedWebsites)) {
            const listItem = document.createElement('li');
            listItem.textContent = `${website} - Daily: ${limits.dailyLimit}min, Session: ${limits.sessionLimit}min`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.onclick = () => deleteBlockedWebsite(website);
            
            listItem.appendChild(deleteBtn);
            blockedList.appendChild(listItem);
        }
    });
}

function deleteBlockedWebsite(website) {
    chrome.storage.local.get({ blockedWebsites: {} }, function(result) {
        const blockedWebsites = result.blockedWebsites;
        delete blockedWebsites[website];
        chrome.storage.local.set({ blockedWebsites }, loadBlockedWebsites);
    });
}

function toggleYouTubeRecommendations() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleRecommendations' }, function(response) {
            console.log(response);
        });
    });
}

function showUsageGraph() {
    chrome.storage.local.get(['usageData'], function(result) {
        const usageData = result.usageData || {};
        console.log('Retrieved usage data:', usageData);

        // Filter labels and data based on the desired format (e.g., labels containing a '.')
        const filteredEntries = Object.entries(usageData).filter(([label, value]) => label.includes('.'));
        const filteredLabels = filteredEntries.map(([label, value]) => label);
        const filteredData = filteredEntries.map(([label, value]) => value);

        if (filteredLabels.length === 0 || filteredData.length === 0) {
            console.log('No usage data available to display.');
            return;
        }

        // Calculate the total usage time
        const totalUsage = filteredData.reduce((a, b) => a + b, 0);
        const totalHours = Math.floor(totalUsage / 60);
        const totalMinutes = totalUsage % 60;
        const totalTimeText = `${totalHours} hrs ${totalMinutes} mins`;

        // Get context for the chart
        const ctx = document.getElementById('usageChart').getContext('2d');

        // Create the doughnut chart
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: filteredLabels,
                datasets: [{
                    label: 'Usage',
                    data: filteredData,
                    backgroundColor: generateColors(filteredData.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                cutout: '80%', // Adjust the cutout percentage to match the style
                plugins: {
                    legend: {
                        display: false, // Hiding the legend
                    },
                    tooltip: {
                        enabled: true // Enable tooltips for hover
                    },
                    // Custom plugin to display text in the center
                    centerText: {
                        display: true,
                        text: totalTimeText,
                        subText: 'TODAY'
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const centerTextPlugin = chart.config.options.plugins.centerText;
                    if (centerTextPlugin.display && centerTextPlugin.text) {
                        drawCenterText(chart, centerTextPlugin.text, centerTextPlugin.subText);
                    }
                }
            }]
        });
        document.getElementById('chartLegend').innerHTML = generateLegendHTML(chart);
    });
}

// Custom function to draw text in the center
function drawCenterText(chart, text, subText) {
    const width = chart.width,
          height = chart.height - (chart.legend.height),
          ctx = chart.ctx;
    ctx.save();

    // Draw subtext (TODAY)
    let fontSize = 20; // Fixed font size for "TODAY"
    ctx.font = fontSize + "px sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black"; // Set text color to black
    let textX = Math.round((width - ctx.measureText(subText).width) / 2);
    let textY = height / 2 - 20; // Adjust position above the main text
    ctx.fillText(subText, textX, textY);

    // Draw main text (total time)
    fontSize = 28; // Fixed font size for total time
    ctx.font = fontSize + "px sans-serif";
    textX = Math.round((width - ctx.measureText(text).width) / 2);
    textY = height / 2 + 8; // Adjust position below the subtext
    ctx.fillText(text, textX, textY);

    ctx.restore();
}

// Example generateColors function
function generateDynamicColors(count) {
    const hueStep = 360 / count;
    return Array.from({ length: count }, (_, i) => {
        const hue = i * hueStep;
        return `hsl(${hue}, 70%, 60%)`;
    });
}

// Custom function to generate HTML for the legend
function generateLegendHTML(chart) {
    const legendHTML = chart.data.labels.map((label, index) => {
        const color = chart.data.datasets[0].backgroundColor[index];
        return `<div style="display: flex; align-items: center; margin-bottom: 5px; padding: 3px; font-family: 'Helvetica, Arial, sans-serif'; font-size: 14px;">
                    <div style="width: 15px; height: 15px; background-color: ${color}; margin-right: 5px; border-radius: 50%;"></div>
                    <span style="color: #333; font-style: normal;">${label}</span>
                </div>`;
    }).join('');
    return legendHTML;
}
