/**
 * Google Apps Script Backend for Typing Master Leaderboard
 * 
 * Setup Instructions:
 * 1. Create a new Google Sheet.
 * 2. Rename the first sheet to 'Leaderboard'.
 * 3. Set the first row (Header) as: 'Username', 'WPM', 'Accuracy', 'Date'.
 * 4. Tools > Script editor.
 * 5. Paste this code into Code.gs.
 * 6. Deploy > New deployment > Select 'Web app'.
 * 7. Set 'Who has access' to 'Anyone'.
 * 8. Copy the Web App URL and paste it into the frontend configuration.
 */

const SPREADSHEET_ID = '1RE0HxHBxbNvINSyCDEjqdK9EoLzR2xIiNUmBaaZbmz0'; // User provided ID
const SHEET_NAME = 'Leaderboard';

function doGet(e) {
  Logger.log('Received GET request');
  return handleRequest(e);
}

function doPost(e) {
  Logger.log('Received POST request');
  if (e && e.postData) {
      Logger.log('PostData: ' + e.postData.contents);
  }
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // const doc = SpreadsheetApp.getActiveSpreadsheet(); // Ensure script is bound or use openById
    // If SPREADSHEET_ID is still placeholder, try to use active spreadsheet (if bound)
    let doc;
    if (SPREADSHEET_ID === 'YOUR_SPREADSHEET_ID_HERE') {
         try {
             doc = SpreadsheetApp.getActiveSpreadsheet();
         } catch (e) {
             Logger.log('Error getting active spreadsheet: ' + e);
         }
    } else {
         doc = SpreadsheetApp.openById(SPREADSHEET_ID);
    }
    
    if (!doc) {
        Logger.log('Spreadsheet not found');
        return responseJSON({ status: 'error', message: 'Spreadsheet not found. Please set SPREADSHEET_ID.' });
    }

    const sheet = doc.getSheetByName(SHEET_NAME);
    if (!sheet) {
      Logger.log('Sheet "Leaderboard" not found');
      return responseJSON({ status: 'error', message: 'Sheet not found' });
    }

    // Handle POST: Add or Delete score
    if (e && e.postData && e.postData.contents) {
      const data = JSON.parse(e.postData.contents);
      const action = data.action || 'add';
      
      Logger.log('Processing action: ' + action);

      if (action === 'delete') {
          const targetDateStr = data.date; 
          if (!targetDateStr) return responseJSON({ status: 'error', message: 'Missing date for deletion' });

          const range = sheet.getDataRange();
          const values = range.getValues();
          
          for (let i = values.length - 1; i >= 1; i--) { 
             const rowDate = new Date(values[i][3]).toISOString();
             if (rowDate === targetDateStr) {
                 sheet.deleteRow(i + 1);
                 Logger.log('Deleted row ' + (i + 1));
                 return responseJSON({ status: 'success', message: 'Row deleted' });
             }
          }
          Logger.log('Row to delete not found');
          return responseJSON({ status: 'error', message: 'Row not found' });
      }

      if (action === 'delete_user') {
          const targetUser = data.username;
          if (!targetUser) return responseJSON({ status: 'error', message: 'Missing username for deletion' });
          
          const range = sheet.getDataRange();
          const values = range.getValues();
          let deletedCount = 0;

          // Loop backwards to delete multiple rows safely
          for (let i = values.length - 1; i >= 1; i--) { 
             if (values[i][0] == targetUser) { // Column 0 is Username
                 sheet.deleteRow(i + 1);
                 deletedCount++;
             }
          }
          
          Logger.log('Deleted ' + deletedCount + ' rows for user: ' + targetUser);
          return responseJSON({ status: 'success', message: 'Deleted ' + deletedCount + ' rows' });
      }

      // Default: Add
      const { username, wpm, accuracy, difficulty, isWin, score } = data;
      
      if (!username || wpm === undefined || accuracy === undefined) {
        Logger.log('Missing fields in insert');
        return responseJSON({ status: 'error', message: 'Missing fields' });
      }

      // Column 5 (Index 4) is Difficulty, Column 6 (Index 5) is isWin, Column 7 (Index 6) is Score
      sheet.appendRow([
        username, 
        wpm, 
        accuracy, 
        new Date(), 
        difficulty || 'Medium',
        isWin !== undefined ? isWin : true,
        score || 0 // Store score
      ]);
      Logger.log('Inserted new score for ' + username);
      return responseJSON({ status: 'success', message: 'Score added' });
    }

    // Handle GET: Fetch leaderboard
    const rows = sheet.getDataRange().getValues();
    const headers = rows.shift(); 
    
    const leaderboard = rows.map(row => ({
      username: row[0],
      wpm: row[1],
      accuracy: row[2],
      date: new Date(row[3]).toISOString(),
      difficulty: row[4] || 'Unknown',
      isWin: row[5] !== undefined ? row[5] : true,
      score: row[6] !== undefined ? row[6] : 0 // Fetch score
    }));

    leaderboard.sort((a, b) => b.wpm - a.wpm);
    Logger.log('Returning ' + leaderboard.length + ' rows');
    
    return responseJSON({ status: 'success', data: leaderboard.slice(0, 50) });

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return responseJSON({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= TEST FUNCTION =================
function testInsertData() {
  const testNames = ['Skywalker', 'Neo', 'Trinity', 'Morpheus'];
  const name = testNames[Math.floor(Math.random() * testNames.length)];
  const wpm = Math.floor(Math.random() * 60) + 40; // 40-100
  const accuracy = Math.floor(Math.random() * 10) + 90; // 90-100

  Logger.log('Starting Test Insert...');
  
  // Mock event object
  const e = {
    postData: {
      contents: JSON.stringify({
        action: 'add',
        username: '[TEST] ' + name,
        wpm: wpm,
        accuracy: accuracy
      })
    }
  };

  const result = doPost(e);
  Logger.log('Test Result: ' + result.getContent());
}

