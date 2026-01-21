import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const START_YEAR = 2010;
const DATA_FILE = path.join(__dirname, '../src/data/fear_and_greed_historical.json');
const FETCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const HISTORY_DELAY_MS = 2000; // 2 seconds between historical requests

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://edition.cnn.com/',
    'Accept': 'application/json'
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFearGreedData(dateStr) {
    const url = `https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${dateStr}`;
    try {
        console.log(`GET ${url}`);
        const response = await axios.get(url, { headers: HEADERS });
        return response.data;
    } catch (error) {
        // Only log warning, as 404/500 might be expected for old dates
        // console.warn(`Request failed for ${dateStr} status: ${(error.response?.status || error.message)}`);
        return null;
    }
}

async function loadLocalData() {
    try {
        const content = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.warn('Local data file not found or invalid. Creating new structure.');
        return {
            fear_and_greed_historical: {
                data: []
            }
        };
    }
}

async function saveLocalData(data) {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function extractDataPoints(apiResponse) {
    if (!apiResponse || !apiResponse.fear_and_greed_historical || !Array.isArray(apiResponse.fear_and_greed_historical.data)) {
        return [];
    }
    return apiResponse.fear_and_greed_historical.data.map(pt => ({
        x: pt.x,
        y: Math.round(pt.y),
        rating: pt.rating,
        score: pt.y 
    }));
}

// Ensure the local data is sorted and de-duped
function mergeAndSort(existingData, newPoints) {
    const map = new Map();
    existingData.forEach(pt => map.set(pt.x, pt));
    
    let addedCount = 0;
    for (const pt of newPoints) {
        if (!map.has(pt.x)) {
            map.set(pt.x, pt);
            existingData.push(pt);
            addedCount++;
        }
    }
    
    if (addedCount > 0) {
        existingData.sort((a, b) => a.x - b.x);
    }
    return addedCount;
}

async function fetchYearData(year) {
    // Try January 1st first
    let dateStr = `${year}-01-01`;
    let apiData = await fetchFearGreedData(dateStr);
    
    // Fallback to June 1st if Jan 1st fails (sometimes datasets act weird on boundaries)
    if (!apiData) {
        // console.log(`No data for ${year}-01-01, trying ${year}-06-01...`);
        dateStr = `${year}-06-01`;
        apiData = await fetchFearGreedData(dateStr);
    }

    if (apiData) {
        const points = extractDataPoints(apiData);
        if (points.length > 0) {
            console.log(`[Historical] Fetched ${points.length} points for ${year} request.`);
            return points;
        }
    }
    return [];
}

async function syncHistoricalData() {
    console.log('--- Historical Sync Started ---');
    let localData = await loadLocalData();
    let historyData = localData.fear_and_greed_historical.data || [];

    const currentYear = new Date().getFullYear();
    
    for (let year = START_YEAR; year <= currentYear; year++) {
        const points = await fetchYearData(year);
        
        if (points.length > 0) {
            const added = mergeAndSort(historyData, points);
            console.log(`[Historical] ${year}: Merged ${added} new points.`);
            
            if (added > 0) {
                localData.fear_and_greed_historical.data = historyData;
                await saveLocalData(localData);
            }
        } else {
            console.log(`[Historical] ${year}: No data available.`);
        }
        await sleep(HISTORY_DELAY_MS);
    }
    console.log('--- Historical Sync Completed ---');
}

async function updateRealtimeData() {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    console.log(`[Realtime] Updating for ${todayStr}...`);
    
    const apiData = await fetchFearGreedData(todayStr);
    if (!apiData) return;

    let localData = await loadLocalData();
    let historyData = localData.fear_and_greed_historical.data || [];

    const points = extractDataPoints(apiData);
    const added = mergeAndSort(historyData, points);
    
    if (added > 0) {
        console.log(`[Realtime] Added ${added} new points.`);
        localData.fear_and_greed_historical.data = historyData;
    }

    // Always update top-level current status
    if (apiData.fear_and_greed) {
         localData.fear_and_greed = {
            score: apiData.fear_and_greed.score,
            rating: apiData.fear_and_greed.rating,
            timestamp: apiData.fear_and_greed.timestamp,
            previous_close: apiData.fear_and_greed.previous_close,
            previous_1_year: apiData.fear_and_greed.previous_1_year
        };
        console.log(`[Realtime] Updated current score: ${localData.fear_and_greed.score}`);
    }
    
    await saveLocalData(localData);
}

async function main() {
    console.log('Daemon V3 Started');
    
    // Run historical sync
    await syncHistoricalData();
    
    // Run immediate update
    await updateRealtimeData();

    // Schedule loop
    setInterval(async () => {
        try {
            await updateRealtimeData();
        } catch (e) {
            console.error('Real-time loop error:', e);
        }
    }, FETCH_INTERVAL_MS);
    
    console.log(`Daemon monitoring active. Interval: ${FETCH_INTERVAL_MS/1000}s`);
}

main().catch(console.error);
