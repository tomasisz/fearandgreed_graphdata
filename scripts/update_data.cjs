const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const URL = 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata/2026-01-20';
const TARGET_FILE = path.join(__dirname, '../src/data/fear_and_greed_historical.json');

// Helper to download data
const fetchData = (url) => {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.cnn.com/',
                'Accept': 'application/json'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
};

const updateData = async () => {
    try {
        console.log(`Fetching data from ${URL}...`);
        const newData = await fetchData(URL);
        
        if (!newData.fear_and_greed || !newData.fear_and_greed.timestamp) {
            throw new Error('Invalid data structure received from API');
        }

        console.log('Reading local historical file...');
        let localData = [];
        try {
            if (fs.existsSync(TARGET_FILE)) {
                const fileContent = fs.readFileSync(TARGET_FILE, 'utf8');
                // The file might theoretically store the whole object or just the array.
                // Based on previous context, we treat it as the full structure.
                const json = JSON.parse(fileContent);
                // If the file is the full structure, we want to update fear_and_greed_historical.data
                // But wait, the file name is fear_and_greed_historical.json.
                // Let's assume it matches the CNN structure: { fear_and_greed_historical: { data: [...] } }
                localData = json; 
            }
        } catch (e) {
            console.warn('Could not read local file, starting fresh.', e);
        }

        // Prepare the new data point
        const newPoint = {
            x: new Date(newData.fear_and_greed.timestamp).getTime(),
            y: Math.round(newData.fear_and_greed.score),
            rating: newData.fear_and_greed.rating,
            score: newData.fear_and_greed.score // Keep original precision if needed
        };

        console.log('New data point:', newPoint);

        // Merge logic
        // We need to find where to insert/update this point in localData.fear_and_greed_historical.data
        if (!localData.fear_and_greed_historical) {
            localData.fear_and_greed_historical = { data: [] };
        }
        
        const historyArray = localData.fear_and_greed_historical.data;
        
        // Remove existing entry for the same day/timestamp if strictly matching or just append?
        // Let's append and sort, filtering duplicates by distinct timestamp
        const existingIndex = historyArray.findIndex(p => p.x === newPoint.x);
        
        if (existingIndex !== -1) {
            console.log('Update existing data point.');
            historyArray[existingIndex] = newPoint;
        } else {
            console.log('Appending new data point.');
            historyArray.push(newPoint);
        }

        // Sort by time
        historyArray.sort((a, b) => a.x - b.x);

        // Update sub-indicators as well if needed?
        // User request specifically mentioned "2026-01-20为开盘日期，写入到 fear_and_greed_historical.json中".
        // The historical json usually contains the main index history. 
        // We should also persist the sub-indicators history if the file structure supports it.
        // Let's check if the file has keys for sub-indicators.
        
        // For now, let's just write everything back.
        fs.writeFileSync(TARGET_FILE, JSON.stringify(localData, null, 2));
        console.log(`Successfully updated ${TARGET_FILE}`);

    } catch (error) {
        console.error('Error updating data:', error);
        process.exit(1);
    }
};

updateData();
