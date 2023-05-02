const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const path = require('path');

// Starter Code Setup
const SPREADSHEET_ID = "1xaezHCJHqY5J6B7eKmG-PhZdxgTall7PwEoQmjPlI1U"

// Set up authentication
const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'privateSetting.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Create a new instance of the Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// Create Express app
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static pages on the base URL, on the root path
app.use(express.static('public'));

app.get('/', function (req, res) {
    res.header('Access-Control-Allow-Origin', '*');
    res.sendFile('index.html');
});

// Handle GET requests on "/api"
async function onGet(req, res) {
    try {
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sayfa1!A1:B2',
        }
        )

        const rows = result.data.values;
        res.json({ data: rows });

    } catch (err) {
        console.error(err);
        res.status(500).send('Google API Server error on GET');
    }

}

app.get('/api', onGet)

//Handle Post 
async function onPost(req, res) {
    try {
      const requestBody = req.body;
      const keys = Object.keys(requestBody);
      const values = Object.values(requestBody);
  
      const result = await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sayfa1!A1',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [values],
        },
      });
  
      const updatedRange = result.data.updates.updatedRange;
  
      res.json({
        status: 'success',
        message: `Added new row to ${updatedRange}`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to add new row to the spreadsheet',
      });
    }
  }
  

app.post('/api', onPost);

// Handle PUT requests
app.put('/api/:columnName/:value', (req, res) => {
    const columnName = req.params.columnName;
    const value = req.params.value;
    const updateData = req.body;
  
    // Check if columnName exists in the spreadsheet
    if (!columnExists(columnName)) {
      res.status(400).json({ message: 'Invalid column name' });
      return;
    }
  
    // Find the first row that matches the given parameter
    const rowToUpdate = findRow(columnName, value);
  
    if (!rowToUpdate) {
      res.status(200).json({ message: 'No matching row found' });
      return;
    }
  
    // Update the row with the values from the message body
    for (const [key, val] of Object.entries(updateData)) {
      const colIndex = getColumnIndex(key);
      rowToUpdate[colIndex] = val;
    }
  
    // Save the updated data to the spreadsheet
    saveData();
  
    res.status(200).json({ message: 'success' });
  });
  

// Handle DELETE requests
async function onDelete(req, res) {
    const { column, value } = req.params;
  
    try {
      // Get the data in the sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sayfa1',
      });
  
      // Find the row to delete
      const rows = response.data.values;
      const headers = rows[0];
      const columnIndex = headers.indexOf(column);
      let rowIndex = -1;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[columnIndex] === value) {
          rowIndex = i;
          break;
        }
      }
  
      // If the row is found, delete it
      if (rowIndex !== -1) {
        const range = `Sayfa1!A${rowIndex + 1}`;
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range,
        });
      }
  
      // Send success response
      res.status(200).json({ message: 'success.' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Google API Server error on DELETE');
    }
  }
  
app.delete('/api', onDelete);

//HANDLE PATCH 
app.patch('/api/:column/:value', (req, res) => {
    const column = req.params.column;
    const value = req.params.value;
    const updates = req.body;
    let updated = false;
  
    for (let i = 0; i < spreadsheet.length; i++) {
      const row = spreadsheet[i];
      if (row[column] === value) {
        Object.assign(row, updates);
        updated = true;
        break;
      }
    }
  
    if (updated) {
      res.send('success');
    } else {
      res.send('No rows found to update.');
    }
  });
  
const port = process.env.PORT || 3000;
const ip = "localhost";
app.listen(port, ip, () => {
    console.log(`CENG 3502 Midterm Project Server running at http://${ip}:${port}`);
  });



