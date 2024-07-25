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
function generateColors(length) {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#7FFF00', '#00FA9A', '#FF5733', '#6E2C00',
        '#0074D9', '#7FDBFF', '#39CCCC', '#3D9970', '#B10DC9',
        '#85144b', '#FFDC00', '#FF851B', '#2ECC40', '#FF4136',
        '#001f3f', '#39CCCC', '#01FF70', '#F012BE', '#7FDBFF',
        '#85144b', '#B10DC9', '#111111', '#AAAAAA', '#DDDDDD',
        '#001f3f', '#AAAAAA', '#39CCCC', '#85144b', '#B10DC9',
        '#111111', '#AAAAAA', '#DDDDDD', '#001f3f', '#39CCCC',
        '#85144b', '#B10DC9', '#111111', '#AAAAAA', '#DDDDDD',
        '#001f3f', '#39CCCC', '#85144b', '#B10DC9', '#111111'
    ];
    return colors.slice(0, length);
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
