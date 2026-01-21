import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CONFIGURATION
const START_YEAR = 2010;
const HISTORY_DELAY_MS = 2000;
// !!! IMPORTANT: Replace this with your actual deployed Web App URL !!!
// Must end with /exec
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxQNg9J6H3N-Giv_38u5iKMGC5-XrxkdIHFP9V_hXgNoHHN03TYuLXQ_kB_CbEahKyh1A/exec'; 

// HEADERS: Complete browser mimic to bypass 418
const HEADERS = {
    'authority': 'production.dataviz.cnn.io',
    'accept': '*/*',
    'accept-encoding': 'gzip, deflate, br, zstd',
    'accept-language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
    'cache-control': 'no-cache',
    'dnt': '1',
    'origin': 'https://www.cnn.com',
    'pragma': 'no-cache',
    'priority': 'u=1, i',
    'referer': 'https://www.cnn.com/',
    'sec-ch-ua': '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'cross-site',
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36'
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchFearGreedData(dateStr) {
    const url = `https://production.dataviz.cnn.io/index/fearandgreed/graphdata/${dateStr}`;
    try {
        console.log(`[Fetch] GET ${url}`);
        const response = await axios.get(url, { headers: HEADERS });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.warn(`[Fetch] Failed for ${dateStr} status: ${error.response.status}`);
        } else {
            console.error(`[Fetch] Error fetching ${dateStr}: ${error.message}`);
        }
        return null;
    }
}

function extractRows(apiResponse) {
    if (!apiResponse || !apiResponse.fear_and_greed_historical || !Array.isArray(apiResponse.fear_and_greed_historical.data)) {
        return [];
    }
    const nowTs = Date.now() / 1000;
    return apiResponse.fear_and_greed_historical.data.map(pt => ({
        timestamp: pt.x / 1000, 
        score: pt.y,
        rating: pt.rating,
        fetched_at: nowTs
    }));
}

async function uploadToGAS(rows) {
    if (rows.length === 0) return;
    
    console.log(`[Proxy] Sending ${rows.length} rows to GAS...`);
    
    // Chunking to avoid GAS Payload limits (post size limit is usually around 10MB, safe to send 1-2k rows)
    const chunkSize = 1000;
    
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        
        try {
            // Need to follow redirects for GAS Web App
            const response = await axios.post(GAS_WEB_APP_URL, { rows: chunk }, {
                headers: { 'Content-Type': 'application/json' },
                maxRedirects: 5
            });
            
            if (response.data && response.data.success) {
                console.log(`[Proxy] Chunk ${Math.floor(i/chunkSize)+1} success: ${response.data.message}`);
            } else {
                console.error(`[Proxy] Error:`, response.data);
            }
        } catch (e) {
            console.error(`[Proxy] HTTP Request Failed:`, e.message);
            if (e.response) {
                 console.error(`Status: ${e.response.status}, Data:`, e.response.data);
            }
        }
    }
}

async function fetchYearData(year) {
    // Strategy: Fetch Jan 1st. If that fails, try June 1st.
    let dateStr = `${year}-01-01`;
    let apiData = await fetchFearGreedData(dateStr);
    
    if (!apiData) {
        dateStr = `${year}-06-01`;
        apiData = await fetchFearGreedData(dateStr);
    }
    
    if (apiData) {
        return extractRows(apiData);
    }
    return [];
}

async function main() {
    console.log(`Starting Sync to BigQuery (via Proxy)...`);

    // 1. Fetch Today (Realtime)
    const todayStr = new Date().toISOString().split('T')[0];
    console.log(`--- Processing Today: ${todayStr} ---`);
    const todayData = await fetchFearGreedData(todayStr); // brings ~2 years of data usually
    
    if (todayData) {
        const rows = extractRows(todayData);
        await uploadToGAS(rows);
    }
    
    // 2. Historical Backfill
    console.log('--- Starting Year-by-Year Backfill ---');
    const currentYear = new Date().getFullYear();
    
    for (let year = currentYear; year >= START_YEAR; year--) {
        console.log(`Processing Year: ${year}`);
        const rows = await fetchYearData(year);
        
        if (rows.length > 0) {
            await uploadToGAS(rows);
        } else {
            console.log(`No data found for ${year}.`);
        }
        await sleep(HISTORY_DELAY_MS);
    }
    
    console.log('Done.');
}

main().catch(console.error);
