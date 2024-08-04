const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = 4050;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cleanData = (data) => {
    try {
        JSON.parse(data);
    } catch (e) {
        throw new Error('Invalid JSON format');
    }

    const sanitizedData = data
        .replace(/<script.*?>.*?<\/script>/gi, '')
        .replace(/1.#INF/g, '0') 
        .replace(/[$<>]/g, ''); 

    return sanitizedData;
};

const getCurrentTimeInTimeZone = (timeZone) => {
    const date = new Date();
    const options = { timeZone: timeZone, hour12: false };
    const formatter = new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      ...options
    });
    const parts = formatter.formatToParts(date);
    const formatObject = parts.reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${formatObject.year}-${formatObject.month}-${formatObject.day} ${formatObject.hour}:${formatObject.minute}:${formatObject.second}`;
  };

const filterData = (data) => {
    const filteredData = {};
    const currentTime = getCurrentTimeInTimeZone('Europe/Istanbul')

    const sanitizeBoolean = (value) => {
        return typeof value === 'boolean' ? value : false;
    };

    const sanitizeInt = (value) => {
        const parsed = parseInt(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    const sanitizeString = (value) => {
        return typeof value === 'string' ? value.replace(/[$<>]/g, '') : '';
    };

    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            filteredData[key] = {
                botting: sanitizeBoolean(data[key].botting),
                connected: sanitizeBoolean(data[key].connected),
                dead: sanitizeBoolean(data[key].dead),
                tracing: sanitizeBoolean(data[key].tracing),
                drops: sanitizeInt(data[key].drops),
                exp_hour: sanitizeInt(data[key].exp_hour),
                exp: sanitizeInt(data[key].exp),
                exp_level: sanitizeInt(data[key].exp_level),
                gold: sanitizeInt(data[key].gold),
                gold_per_loop: sanitizeInt(data[key].gold_per_loop),
                hp: sanitizeInt(data[key].hp),
                hp_max: sanitizeInt(data[key].hp_max),
                job_exp: sanitizeInt(data[key].job_exp),
                job_level: sanitizeInt(data[key].job_level),
                job_level_exp: sanitizeInt(data[key].job_level_exp),
                kill_count: sanitizeInt(data[key].kill_count),
                level: sanitizeInt(data[key].level),
                mp: sanitizeInt(data[key].mp),
                mp_max: sanitizeInt(data[key].mp_max),
                sp: sanitizeInt(data[key].sp),
                sp_hour: sanitizeInt(data[key].sp_hour),
                time_to_level: sanitizeInt(data[key].time_to_level),
                traffic_counter: sanitizeInt(data[key].traffic_counter),
                x: sanitizeInt(data[key].x),
                y: sanitizeInt(data[key].y),
                death_count: sanitizeInt(data[key].death_count),
                job_name: sanitizeString(data[key].job_name),
                name: sanitizeString(data[key].name),
                server: sanitizeString(data[key].server),
                zone_name: sanitizeString(data[key].zone_name),
                guild: sanitizeString(data[key].guild),
                timestamp: currentTime
            };
        }
    }
    return filteredData;
};

app.post('/', (req, res) => {
    const rawData = req.body.data || req.body['?data'];
    if (!rawData) {
        console.error('Data is missing');
        res.status(400).send('Data is missing');
        return;
    }

    let cleanedData;
    try {
        cleanedData = cleanData(rawData);
    } catch (e) {
        console.error('Error cleaning data:', e);
        res.status(400).send('Invalid data format');
        return;
    }

    let newBodyData;
    try {
        newBodyData = JSON.parse(cleanedData);
    } catch (e) {
        console.error('Error parsing JSON', e);
        res.status(400).send('Invalid JSON format');
        return;
    }
    const filteredData = filterData(newBodyData);


    fs.readFile('data.json', 'utf8', (err, data) => {
        let existingData = [];
        if (!err && data) {
            try {
                existingData = JSON.parse(data);
            } catch (e) {
                console.error('Error parsing existing JSON data', e);
                res.status(500).send('Server error');
                return;
            }
        }

        for (const key in filteredData) {
            if (filteredData.hasOwnProperty(key)) {
                const existingIndex = existingData.findIndex(item => item.name === filteredData[key].name);
                if (existingIndex > -1) {
                    existingData[existingIndex] = filteredData[key];
                } else {
                    existingData.push(filteredData[key]);
                }
            }
        }

        fs.writeFile('data.json', JSON.stringify(existingData, null, 2), (err) => {
            if (err) {
                console.error('Error writing to data.json', err);
                res.status(500).send('Server error');
                return;
            }
            console.log('Request data saved to data.json');
            res.send('Request data received and saved');
        });
    });
});

app.get('/', (req, res) => {
    fs.readFile('data.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data.json', err);
            res.status(500).send('Server error');
            return;
        }

        let characters = [];
        try {
            characters = JSON.parse(data);
        } catch (e) {
            console.error('Error parsing data.json', e);
            res.status(500).send('Server error');
            return;
        }

        const servers = ['All', ...new Set(characters.map(c => c.server).filter(Boolean))];
        const zoneNames = ['All', ...new Set(characters.map(c => c.zone_name).filter(Boolean))];
        const guilds = ['All', ...new Set(characters.map(c => c.guild).filter(Boolean))];

        const sortOptions = [
            'level', 'gold', 'exp_hour', 'job_level', 'kill_count',
            'time_to_level', 'timestamp'
        ];

        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Character Status</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .filters {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    width: 100%;
                    margin-bottom: 20px;
                    background-color: #e0e0e0;
                    padding: 15px;
                    border-radius: 8px;
                }
                .filter-group {
                    display: flex;
                    flex-direction: column;
                    margin: 0 10px;
                }
                .card-container {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    width: 100%;
                }
                .card {
                    background-color: white;
                    border: 1px solid #ccc;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    margin: 16px;
                    padding: 16px;
                    width: calc(100% - 32px);
                    max-width: 300px;
                    text-align: center;
                    box-sizing: border-box;
                }
                .card h2 {
                    margin: 0;
                    font-size: 1.2em;
                }
                .bar {
                    height: 24px;
                    border-radius: 8px;
                    margin: 8px 0;
                    background-color: #ddd;
                    overflow: hidden;
                    position: relative;
                }
                .bar span {
                    display: block;
                    height: 100%;
                    text-align: center;
                    line-height: 24px;
                    color: white;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    z-index: 1;
                }
                .fill {
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 0;
                }
                .fill.hp {
                    background-color: red;
                }
                .fill.mp {
                    background-color: blue;
                }
                .fill.exp {
                    background-color: green;
                }
                .summary-card {
                    background-color: #f0f8ff;
                    border: 2px solid #4682b4;
                }
                select {
                    padding: 5px;
                    margin: 5px 0;
                    width: 100%;
                    max-width: 200px;
                }
                label {
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                @media (min-width: 768px) {
                    .filters {
                        flex-direction: row;
                    }
                    .filter-group {
                        flex-direction: row;
                        align-items: center;
                    }
                    label {
                        margin-right: 10px;
                        margin-bottom: 0;
                    }
                    select {
                        width: auto;
                    }
                }
            </style>
        </head>
        <body>
        <div class="filters">
            <div class="filter-group">
                <label for="serverFilter">Server:</label>
                <select id="serverFilter">
                    ${servers.map(server => `<option value="${server}">${server}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="zoneFilter">Zone:</label>
                <select id="zoneFilter">
                    ${zoneNames.map(zone => `<option value="${zone}">${zone}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="guildFilter">Guild:</label>
                <select id="guildFilter">
                    ${guilds.map(guild => `<option value="${guild}">${guild}</option>`).join('')}
                </select>
            </div>
            <div class="filter-group">
                <label for="sortBy">Sort by:</label>
                <select id="sortBy">
                    ${sortOptions.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
            </div>
        </div>
        <div class="card-container">
        <div class="card summary-card">
            <h2>Summary Information</h2>
            <p>Total Gold: <span id="totalGold">0</span></p>
            <p>Total Kill: <span id="totalKillCount">0</span></p>
            <p>Total Drops: <span id="totalDrops">0</span></p>
            <p>Online Characters: <span id="onlineCharacters">0</span></p>
            <h3> Developed by <a target="_blank" href="https://steamcommunity.com/id/santafor/">Santafor</a></h3>
        </div>
        `;

        characters.forEach(character => {
            if (character.name && character.name.trim() !== '') {
                html += `
                <div class="card" data-server="${character.server}" data-zone="${character.zone_name}" data-guild="${character.guild}" data-level="${character.level}" data-gold="${character.gold}" data-exp-hour="${character.exp_hour}" data-job-level="${character.job_level}" data-kill-count="${character.kill_count}" data-time-to-level="${character.time_to_level}" data-timestamp="${character.timestamp}" data-drops="${character.drops}">
                    <h2>${character.name} (${character.level} Lvl)</h2>
                    <div class="bar hp">
                        <div class="fill hp" style="width:${(character.hp / character.hp_max) * 100}%"></div>
                        <span>HP: ${Math.round((character.hp / character.hp_max) * 100)}%</span>
                    </div>
                    <div class="bar mp">
                        <div class="fill mp" style="width:${(character.mp / character.mp_max) * 100}%"></div>
                        <span>MP: ${Math.round((character.mp / character.mp_max) * 100)}%</span>
                    </div>
                    <div class="bar exp">
                        <div class="fill exp" style="width:${(character.exp / character.exp_level) * 100}%"></div>
                        <span>EXP: ${Math.round((character.exp / character.exp_level) * 100)}%</span>
                    </div>
                    <p>Bot: ${character.botting ? "Start" : "Stop"}</p>
                    <p>Character: ${character.connected ? "Online" : "Offline"}</p>
                    <p>EXP/hr: ${character.exp_hour}</p>
                    <p>SP/hr: ${character.sp_hour}</p>
                    <p>Kill: ${character.kill_count}</p>
                    <p>Dead: ${character.death_count}</p>
                    <p>Drops: ${character.drops}</p>
                    <p>Gold: ${character.gold.toLocaleString()}</p>
                    <p>Next level/hr: ${character.time_to_level}</p>
                    <p>${character.timestamp}</p>
                </div>
                `;
            }
        });

        html += `
            </div>
    <script>
    const cards = document.querySelectorAll('.card:not(.summary-card)');
    const serverFilter = document.getElementById('serverFilter');
    const zoneFilter = document.getElementById('zoneFilter');
    const guildFilter = document.getElementById('guildFilter');
    const sortBy = document.getElementById('sortBy');

    function updateCards() {
        const selectedServer = serverFilter.value;
        const selectedZone = zoneFilter.value;
        const selectedGuild = guildFilter.value;
        const selectedSort = sortBy.value;

        let visibleCards = Array.from(cards);

        if (selectedServer !== 'All') {
            visibleCards = visibleCards.filter(card => card.dataset.server === selectedServer);
        }
        if (selectedZone !== 'All') {
            visibleCards = visibleCards.filter(card => card.dataset.zone === selectedZone);
        }
        if (selectedGuild !== 'All') {
            visibleCards = visibleCards.filter(card => card.dataset.guild === selectedGuild);
        }

        visibleCards.sort((a, b) => {
            let aValue, bValue;

            switch (selectedSort) {
                case 'exp_hour':
                    aValue = parseFloat(a.dataset.expHour);
                    bValue = parseFloat(b.dataset.expHour);
                    return bValue - aValue; // En yüksekten en düşüğe
                case 'job_level':
                    aValue = parseInt(a.dataset.jobLevel);
                    bValue = parseInt(b.dataset.jobLevel);
                    return bValue - aValue; // En yüksekten en düşüğe
                case 'kill_count':
                    aValue = parseInt(a.dataset.killCount);
                    bValue = parseInt(b.dataset.killCount);
                    return bValue - aValue; // En yüksekten en düşüğe
                case 'time_to_level':
                    aValue = parseFloat(a.dataset.timeToLevel);
                    bValue = parseFloat(b.dataset.timeToLevel);
                    return aValue - bValue; // En düşükten en yükseğe
                case 'timestamp':
                    return new Date(b.dataset.timestamp) - new Date(a.dataset.timestamp);
                default:
                    aValue = parseFloat(a.dataset[selectedSort.replace(/_/g, '')]);
                    bValue = parseFloat(b.dataset[selectedSort.replace(/_/g, '')]);
                    return bValue - aValue; // En yüksekten en düşüğe
            }
        });

        const cardContainer = document.querySelector('.card-container');
        const summaryCard = document.querySelector('.summary-card');
        cardContainer.innerHTML = '';
        cardContainer.appendChild(summaryCard);
        visibleCards.forEach(card => cardContainer.appendChild(card));

        updateSummary(visibleCards);
    }

    function updateSummary(visibleCards) {
        let totalGold = 0;
        let totalKillCount = 0;
        let totalDrops = 0;
        let latestTimestamp = '';
        let onlineCharacters = 0;

        visibleCards.forEach(card => {
            totalGold += parseInt(card.dataset.gold);
            totalKillCount += parseInt(card.dataset.killCount);
            totalDrops += parseInt(card.dataset.drops);
            const timestamp = card.dataset.timestamp;
            if (timestamp > latestTimestamp) {
                latestTimestamp = timestamp;
                onlineCharacters = 1;
            } else if (timestamp === latestTimestamp) {
                onlineCharacters++;
            }
        });

        document.getElementById('totalGold').textContent = totalGold.toLocaleString();
        document.getElementById('totalKillCount').textContent = totalKillCount.toLocaleString();
        document.getElementById('totalDrops').textContent = totalDrops.toLocaleString();
        document.getElementById('onlineCharacters').textContent = onlineCharacters;
    }

    serverFilter.addEventListener('change', updateCards);
    zoneFilter.addEventListener('change', updateCards);
    guildFilter.addEventListener('change', updateCards);
    sortBy.addEventListener('change', updateCards);

    updateCards();
    </script>
            </body>
            </html>
            `;

            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        });
    });


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
