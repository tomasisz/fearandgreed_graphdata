/**
 * Google Apps Script - Fear & Greed Index Fetcher
 * 
 * deployment:
 * 1. Create a new Google Sheet or Standalone Script.
 * 2. Paste this code into Code.gs
 * 3. Services -> Add Service -> BigQuery API (identifier: BigQuery)
 * 4. Update CONFIG object below with your Project ID and Dataset ID.
 * 5. Run 'setupTrigger' once to start the 6-minute schedule.
 */

const CONFIG = {
  // 请替换为您的 BigQuery 项目 ID 和数据集 ID
  PROJECT_ID: 'just-zoo-484721-q6', 
  DATASET_ID: 'market_data',
  TABLE_ID: 'market_data',
  
  // API 配置
  CNN_API_BASE: 'https://production.dataviz.cnn.io/index/fearandgreed/graphdata',
  START_YEAR: 2010,
  
  // 属性存储键名
  PROP_BACKFILL_YEAR: 'BACKFILL_YEAR',
  PROP_IS_BACKFILL_DONE: 'IS_BACKFILL_DONE'
};

function setupTrigger() {
  // 清除旧触发器
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => ScriptApp.deleteTrigger(t));
  
  // 创建新触发器：每 6 分钟执行一次 main
  ScriptApp.newTrigger('main')
    .timeBased()
    // .everyMinutes(n) supports 1, 5, 10, 15, 30.
    // Let's use 5 minutes to be typically safe/close to 6.
    .everyMinutes(5)
    .create();
    
  console.log('Trigger set up: Runs every 5 minutes.');
}

function main() {
  const now = new Date();
  console.log(`Execution started at ${now.toISOString()}`);
  
  // 1. 总是获取今天的实时数据
  const todayStr = formatDate(now);
  processDateData(todayStr, true); // true = realtime mode
  
  // 2. 检查并执行历史回溯
  processBackfillStep();
}

/**
 * 处理单次 API 请求并写入 BigQuery
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {boolean} isRealtime - 标识是否为实时更新（用于日志区分）
 */
function processDateData(dateStr, isRealtime) {
  const url = `${CONFIG.CNN_API_BASE}/${dateStr}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://edition.cnn.com/',
    'Accept': 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };
  
  try {
    const response = UrlFetchApp.fetch(url, { headers: headers, muteHttpExceptions: true });
    const code = response.getResponseCode();
    
    if (code !== 200) {
      console.warn(`[${isRealtime?'Realtime':'Backfill'}] API Error ${code} for ${url}`);
      return false;
    }
    
    const json = JSON.parse(response.getContentText());
    
    // 解析 historical 数组
    // 该 API 返回的 chunks 通常包含约 1-2 年的数据
    const historyData = json.fear_and_greed_historical && json.fear_and_greed_historical.data;
    
    if (!historyData || !Array.isArray(historyData)) {
      console.warn('No historical data found in response.');
      return false;
    }
    
    // 转换为 BigQuery 行格式
    const rows = historyData.map(pt => {
      return {
        timestamp: pt.x / 1000, // BigQuery TIMESTAMP uses seconds or micors string. Streaming API standard is usually JSON value.
        // For 'insertAll', timestamp fields can be strings "YYYY-MM-DD HH:MM:SS" or numbers (epoch seconds).
        // Let's use string format or epoch seconds.
        score: pt.y,
        rating: pt.rating,
        fetched_at: new Date().getTime() / 1000
      };
    });
    
    // 插入 BigQuery
    if (rows.length > 0) {
      insertToBigQuery(rows);
      console.log(`[${isRealtime?'Realtime':'Backfill'}] Inserted ${rows.length} rows from request ${dateStr}`);
      return true;
    }
    
  } catch (e) {
    console.error(`Exception fetching ${dateStr}: ${e.toString()}`);
    return false;
  }
}

/**
 * 执行一步历史回溯
 */
function processBackfillStep() {
  const props = PropertiesService.getScriptProperties();
  const isDone = props.getProperty(CONFIG.PROP_IS_BACKFILL_DONE);
  
  if (isDone === 'true') {
    // console.log('Backfill already completed.');
    return;
  }
  
  let currentYear = parseInt(props.getProperty(CONFIG.PROP_BACKFILL_YEAR));
  if (isNaN(currentYear)) {
    currentYear = new Date().getFullYear(); // 默认从今年开始往回
  }
  
  if (currentYear < CONFIG.START_YEAR) {
    console.log('Backfill finished reached 2010.');
    props.setProperty(CONFIG.PROP_IS_BACKFILL_DONE, 'true');
    return;
  }
  
  console.log(`Backfilling for year: ${currentYear}`);
  
  // 构造请求日期：该年的 1 月 1 日 (API 会返回该日期之前的一段时间数据)
  // 注意：API 返回的数据通常是截止到请求日期的。所以要获取 2024 全年，可能需要请求 2025-01-01?
  // 根据之前经验，请求 2021-01-01 返回了 2021 之前的数据 points? 
  // 让脚本简单化：每年请求一次 "-01-01" 和 "-06-01" 覆盖整年 
  
  // 尝试 01-01
  const success1 = processDateData(`${currentYear}-01-01`, false);
  // 休息一下防止超速
  Utilities.sleep(2000); 
  // 尝试 06-01 (作为补充)
  const success2 = processDateData(`${currentYear}-06-01`, false);
  
  // 更新年份指针
  props.setProperty(CONFIG.PROP_BACKFILL_YEAR, (currentYear - 1).toString());
}

/**
 * 批量写入 BigQuery
 */
function insertToBigQuery(rows) {
  const chunkSize = 500; // BigQuery limit per request is usually higher, but 500 is safe
  
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    
    const insertRows = chunk.map(row => ({
      insertId: row.timestamp.toString(), // 即便有轻微重复，利用 timestamp 做 dedup id 尝试去重
      json: {
        timestamp: row.timestamp,
        score: row.score,
        rating: row.rating,
        fetched_at: row.fetched_at
      }
    }));
    
    try {
      BigQuery.Tabledata.insertAll(
        { rows: insertRows, skipInvalidRows: true },
        CONFIG.PROJECT_ID,
        CONFIG.DATASET_ID,
        CONFIG.TABLE_ID
      );
    } catch (e) {
      console.error('BigQuery Insert Error:', e);
      // Log more details if possible
    }
  }
}

function formatDate(date) {
  return Utilities.formatDate(date, 'GMT', 'yyyy-MM-dd');
}

/**
 * 初始化表结构 (如果表不存在或需要重建)
 * 请先在 BigQuery 界面删除旧表，然后运行此函数
 */
function createTable() {
  const tableId = CONFIG.TABLE_ID;
  const datasetId = CONFIG.DATASET_ID;
  const projectId = CONFIG.PROJECT_ID;

  const schema = {
    fields: [
      { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: '数据点的时间戳 (UTC)' },
      { name: 'score', type: 'FLOAT', mode: 'REQUIRED', description: '恐慌贪婪指数分数 (0-100)' },
      { name: 'rating', type: 'STRING', mode: 'NULLABLE', description: '评级文本' },
      { name: 'fetched_at', type: 'TIMESTAMP', mode: 'NULLABLE', description: '抓取写入时间' }
    ]
  };

  const tableResource = {
    tableReference: {
      projectId: projectId,
      datasetId: datasetId,
      tableId: tableId
    },
    schema: schema,
    timePartitioning: {
      type: 'DAY',
      field: 'timestamp'
    },
    clustering: {
      fields: ['timestamp']
    }
  };

  try {
    const table = BigQuery.Tables.insert(tableResource, projectId, datasetId);
    console.log('Table created successfully: ' + table.id);
  } catch (e) {
    console.error('Error creating table: ' + e.message);
  }
}

/**
 * 测试函数：验证 BigQuery 数据是否写入成功
 * 请在编辑器工具栏选择 "runTestQuery" 并运行
 */
function runTestQuery() {
  const tableRef = `${CONFIG.PROJECT_ID}.${CONFIG.DATASET_ID}.${CONFIG.TABLE_ID}`;
  console.log(`Testing query against table: ${tableRef}`);
  
  try {
    // 1. Check Total Count
    const countSql = `SELECT count(*) as total FROM \`${tableRef}\``;
    const countJob = BigQuery.Jobs.query({ query: countSql, useLegacySql: false }, CONFIG.PROJECT_ID);
    const totalRows = countJob.rows ? countJob.rows[0].f[0].v : 0;
    console.log(`Total Rows in DB: ${totalRows}`);
    
    // 2. Fetch Latest 5 Entries
    const previewSql = `SELECT timestamp, score, rating, fetched_at FROM \`${tableRef}\` ORDER BY timestamp DESC LIMIT 5`;
    const previewJob = BigQuery.Jobs.query({ query: previewSql, useLegacySql: false }, CONFIG.PROJECT_ID);
    
    console.log('--- Latest 5 Data Points ---');
    if (previewJob.rows) {
      previewJob.rows.forEach(row => {
        // Timestamp is returned as epoch float in seconds
        const ts = new Date(parseFloat(row.f[0].v) * 1000).toISOString(); 
        const score = row.f[1].v;
        const rating = row.f[2].v;
        console.log(`[${ts}] Score: ${score} (${rating})`);
      });
    } else {
      console.log('No data found.');
    }
  } catch (e) {
    console.error('Query failed: ' + e.message);
  }
}

/**
 * 测试函数：手动插入一条测试数据到 BigQuery (Batch Load)
 */
function runInsertTest() {
  console.log('Starting Batch Load Test...');
  
  // 构造一条模拟数据 (使用当前时间)
  const testRows = [{
    timestamp: new Date().getTime() / 1000,
    score: 88.8,
    rating: 'TEST_BATCH_LOAD_GREED',
    fetched_at: new Date().getTime() / 1000
  }];
  
  try {
    insertToBigQuery(testRows);
    console.log('✅ Batch load job submitted successfully. Data may take a few seconds to appear.');
  } catch (e) {
    console.error('❌ Batch load failed:', e);
  }
}

/**
 * Web App 入口：提供 HTTP 接口查询数据
 * 部署为 Web App 后，外部可通过 URL 访问接口
 */
function doGet(e) {
  const tableRef = `${CONFIG.PROJECT_ID}.${CONFIG.DATASET_ID}.${CONFIG.TABLE_ID}`;
  const limit = e.parameter.limit ? parseInt(e.parameter.limit) : 365; // 默认查询最近一年
  
  const result = {
    success: true,
    data: [],
    error: null,
    meta: {
      fetched_at: new Date().toISOString()
    }
  };
  
  try {
    const sql = `
      SELECT timestamp, score, rating 
      FROM \`${tableRef}\` 
      ORDER BY timestamp DESC 
      LIMIT ${limit}
    `;
    
    // Run Query
    const queryJob = BigQuery.Jobs.query({ query: sql, useLegacySql: false }, CONFIG.PROJECT_ID);
    
    if (queryJob.rows) {
      result.data = queryJob.rows.map(row => {
        return {
          x: parseFloat(row.f[0].v) * 1000, // Timestamp in ms
          y: parseFloat(row.f[1].v),        // Score
          rating: row.f[2].v
        };
      });
    }
    
  } catch (err) {
    result.success = false;
    result.error = err.toString();
    console.error('doGet API Error:', err);
  }

    // 3. Construct Compatible Response
    // We need 'fear_and_greed' (latest) and 'fear_and_greed_historical' (history)
    
    if (result.data && result.data.length > 0) {
       const latest = result.data[0]; // Ordered by timestamp DESC
       
       const structuredResponse = {
         fear_and_greed: {
           score: latest.y,
           rating: latest.rating,
           timestamp: new Date(latest.x).toISOString(),
           previous_close: 0, // Not stored in BQ currently
           previous_1_year: 0 // Not stored
         },
         fear_and_greed_historical: {
           timestamp: Date.now(),
           score: latest.y,
           rating: latest.rating,
           data: result.data.slice().reverse().map(item => ({ // Re-reverse to ASC for historical if needed, or keep DESC? 
             // Usually historical data is ASC. Let's make it ASC. 
             // Wait, the API usually returns ASC? Let's check api.ts sort.
             // api.ts sorts: .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
             // So order doesn't strictly matter for api.ts, but standard API is usually ASC.
             // Our query was DESC. So let's reverse it.
             x: item.x,
             y: item.y,
             rating: item.rating,
             score: item.y // Include 'score' as alias for 'y' for compatibility
           }))
         },
         // Sub-indicators are not yet in BQ, omitting or sending empty structure if strictly needed
       };
       return ContentService.createTextOutput(JSON.stringify(structuredResponse))
         .setMimeType(ContentService.MimeType.JSON);
    } else {
       // Return empty valid structure
       return ContentService.createTextOutput(JSON.stringify({
         fear_and_greed: {},
         fear_and_greed_historical: { data: [] }
       })).setMimeType(ContentService.MimeType.JSON);
    }
}

/**
 * Web App 接收端：接收本地脚本 POST 的数据并写入 BQ
 */
function doPost(e) {
  const result = { success: true, message: '', error: null };
  
  try {
    const postData = JSON.parse(e.postData.contents);
    const rows = postData.rows;
    
    if (!rows || !Array.isArray(rows)) {
      throw new Error('Invalid data format. Expected { rows: [] }');
    }
    
    console.log(`Received ${rows.length} rows via POST.`);
    insertToBigQuery(rows);
    result.message = `Successfully inserted ${rows.length} rows.`;
    
  } catch (err) {
    result.success = false;
    result.error = err.toString();
    console.error('doPost Error:', err);
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
