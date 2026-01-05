/**
 * Google Apps Script untuk menerima data dari form PWA
 * Copy kode ini ke Google Apps Script Editor
 */

// ID Spreadsheet Anda
const SPREADSHEET_ID = '1VxDv48i3Sx5pNBid1sZOeSCh2sNldBGJgEsUMFnud6g';

// ID folder di Google Drive untuk menyimpan KTP (folder 'Foto KTP (File responses)')
const KTP_FOLDER_ID = '1dJuoZk9PwS4h7ktBeuRpgLKHqzrMEMVTU426qae9oqfaGWQdZPI573lM5-l2tq_crEzWT9Bb';
const KTP_FOLDER_NAME = 'Foto KTP (File responses)';

function doPost(e) {
  try {
    // Log untuk debugging
    console.log('=== DOPOST CALLED ===');
    console.log('Event object exists:', !!e);
    
    // Check if e and postData exist
    if (!e || !e.postData || !e.postData.contents) {
      console.error('Missing required data');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Invalid request: missing postData',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('Raw request data length:', e.postData.contents.length);
    
    // Parse data dari request
    let data;
    try {
      data = JSON.parse(e.postData.contents);
      console.log('Parsed data successfully');
      console.log('Action:', data ? data.action : 'undefined');
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Invalid JSON data: ' + parseError.toString(),
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Validate data object
    if (!data || typeof data !== 'object') {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false, 
          error: 'Invalid data format',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle different actions
    if (data.action === 'update') {
      return updateData(data);
    } else if (data.action === 'delete') {
      return deleteData(data);
    } else if (data.action === 'getById') {
      return getDataById(data.nikIstri);
    } else if (data.action === 'create') {
      return createData(data);
    }
    
    // Default action is create
    return createData(data);
    
  } catch (error) {
    console.error('Error in doPost:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString(),
        stack: error.stack,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create new data entry
 */
function createData(data) {
  try {
    console.log('=== CREATE DATA CALLED ===');
    
    // Validate required data
    if (!data) {
      throw new Error('No data provided for create operation');
    }
    
    console.log('Data received:', JSON.stringify(data, null, 2));
    
    // Buka spreadsheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    // Pastikan header ada (jika sheet kosong)
    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp',
        'Desa Yang Melaporkan',
        'Tanggal Pelayanan',
        'Nama Suami',
        'Umur Suami',
        'Nama Istri',
        'NIK Istri',
        'Tanggal Lahir Istri',
        'Alamat',
        'RT',
        'RW',
        'NO. HP',
        'Jenis Alkon MKJP & NON MKJP',
        'Kepesertaan KB',
        'Tempat Pelayanan',
        'Asuransi Yang di Pakai',
        'Foto KTP',
        'Alkon Sebelumnya Yang di Pakai',
        'Halaman Untuk Kepesertaan KB Baru',
        'Jenis Alkon MKJP & NON MKJP Rumus',
        'Asuransi Yang di Pakai Rumus',
        'Akseptor Hasil KIE PPKBD ( Khusus MKJP )'
      ];
      sheet.appendRow(headers);
      console.log('Headers created');
    }
    
    // Handle file upload jika ada
    let ktpFileUrl = '';
    console.log('Checking for file upload...');
    
    // Safe check for fotoKTP property
    const hasFotoKTP = data && typeof data === 'object' && 
                      (data.hasOwnProperty('Foto KTP') || data.hasOwnProperty('fotoKTP')) && 
                      (data['Foto KTP'] || data.fotoKTP);
    console.log('fotoKTP exists:', hasFotoKTP);
    
    if (hasFotoKTP) {
      const fotoKTPData = data['Foto KTP'] || data.fotoKTP;
      console.log('fotoKTP type:', typeof fotoKTPData);
      console.log('fotoKTP length:', fotoKTPData ? fotoKTPData.length : 0);
      
      if (fotoKTPData.length > 100) {
        console.log('fotoKTP first 100 chars:', fotoKTPData.substring(0, 100));
      }
      
      if (fotoKTPData.startsWith('data:image/')) {
        console.log('Valid image file detected, starting upload...');
        try {
          ktpFileUrl = uploadKTPToGoogleDrive(
            fotoKTPData, 
            data['Nama Istri'] || data.namaIstri || 'Unknown', 
            data['NIK Istri'] || data.nikIstri || 'Unknown', 
            data['Timestamp'] || data.timestamp || new Date().toISOString()
          );
          console.log('KTP uploaded successfully:', ktpFileUrl);
        } catch (error) {
          console.error('Failed to upload KTP:', error);
          ktpFileUrl = 'Upload Failed: ' + error.toString();
        }
      } else if (fotoKTPData.includes('base64,')) {
        console.log('Base64 file detected, trying to fix format...');
        try {
          let fixedData = fotoKTPData;
          if (!fixedData.startsWith('data:')) {
            fixedData = 'data:image/jpeg;base64,' + fixedData;
          }
          
          ktpFileUrl = uploadKTPToGoogleDrive(
            fixedData, 
            data['Nama Istri'] || data.namaIstri || 'Unknown', 
            data['NIK Istri'] || data.nikIstri || 'Unknown', 
            data['Timestamp'] || data.timestamp || new Date().toISOString()
          );
          console.log('KTP uploaded successfully after format fix:', ktpFileUrl);
        } catch (error) {
          console.error('Failed to upload after format fix:', error);
          ktpFileUrl = 'Format Error: ' + error.toString();
        }
      } else {
        console.log('Invalid file format detected');
        ktpFileUrl = 'Format Error: Invalid file format';
      }
    } else {
      console.log('No file to upload');
      ktpFileUrl = 'Tidak Ada';
    }
    
    // Siapkan data untuk ditambahkan ke sheet
    const rowData = [
      new Date(data['Timestamp'] || data.timestamp), // Convert to Date object
      data['Desa Yang Melaporkan'] || data.desa || '', // Desa Yang Melaporkan
      data['Tanggal Pelayanan'] || data.tanggalPelayanan || '',
      data['Nama Suami'] || data.namaSuami || '',
      data['Umur Suami'] || data.umurSuami || '',
      data['Nama Istri'] || data.namaIstri || '',
      data['NIK Istri'] || data.nikIstri || '',
      data['Tanggal Lahir Istri'] || data.tanggalLahirIstri || '',
      data['Alamat'] || data.alamat || '',
      data['RT'] || data.rt || '',
      data['RW'] || data.rw || '',
      data['NO. HP'] || data.noHP || '', // NO. HP
      data['Jenis Alkon MKJP & NON MKJP'] || data.jenisAlkon || '', // Jenis Alkon MKJP & NON MKJP
      data['Kepesertaan KB'] || data.kepesertaanKB || '',
      data['Tempat Pelayanan'] || data.tempatPelayanan || '',
      data['Asuransi Yang di Pakai'] || data.akseptorPajak || '', // Asuransi Yang di Pakai
      ktpFileUrl || (data['Foto KTP'] || data.fotoKTP ? 'Ada - Upload Gagal' : 'Tidak Ada'), // Foto KTP
      data['Alkon Sebelumnya Yang di Pakai'] || data.alkonSebelumnya || '', // Alkon Sebelumnya Yang di Pakai
      data['Halaman Untuk Kepesertaan KB Baru'] || data.kondisiBaru || '', // Halaman Untuk Kepesertaan KB Baru
      '', // Jenis Alkon MKJP & NON MKJP Rumus (empty for now)
      '', // Asuransi Yang di Pakai Rumus (empty for now)
      data['Akseptor Hasil KIE PPKBD ( Khusus MKJP )'] || data.akseptorKIE || '' // Akseptor Hasil KIE PPKBD ( Khusus MKJP )
    ];
    
    // Tambahkan data ke sheet
    const lastRow = sheet.getLastRow();
    sheet.appendRow(rowData);
    
    // Get the row number of the newly added data
    const newRowNumber = lastRow + 1;
    
    // Log success
    console.log('Data successfully added to sheet at row:', newRowNumber);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true, 
        message: 'Data berhasil disimpan',
        rowNumber: newRowNumber,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in createData:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false, 
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Update existing data
 */
function updateData(data) {
  try {
    console.log('=== UPDATE DATA CALLED ===');
    console.log('Data received:', data ? JSON.stringify(data, null, 2) : 'null/undefined');
    
    // Validate required data
    if (!data || typeof data !== 'object') {
      console.error('Invalid data for update:', data);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'No data provided for update',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data.nikIstri) {
      console.error('Missing nikIstri in data:', data);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'NIK Istri is required for update operation',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    console.log('Looking for NIK:', data.nikIstri);
    console.log('Total rows in sheet:', values.length);
    console.log('Headers:', headers);
    
    // Find NIK column dynamically
    let nikColumn = -1;
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === 'NIK Istri' || headers[j].includes('NIK')) {
        nikColumn = j;
        console.log('Found NIK column at index:', nikColumn, 'Header:', headers[j]);
        break;
      }
    }
    
    if (nikColumn === -1) {
      throw new Error('NIK column not found in spreadsheet');
    }
    
    let targetRow = -1;
    for (let i = 1; i < values.length; i++) { // Start from 1 to skip header
      console.log(`Row ${i}: NIK = "${values[i][nikColumn]}" (comparing with "${data.nikIstri}")`);
      if (String(values[i][nikColumn]) === String(data.nikIstri)) {
        targetRow = i + 1; // +1 because sheet rows are 1-indexed
        console.log('Found matching row:', targetRow);
        break;
      }
    }
    
    if (targetRow === -1) {
      throw new Error('Data tidak ditemukan untuk NIK: ' + data.nikIstri);
    }
    
    // Handle file upload if exists
    let ktpFileUrl = data.existingKtpUrl || '';
    if (data.fotoKTP && data.fotoKTP.startsWith('data:image/')) {
      try {
        ktpFileUrl = uploadKTPToGoogleDrive(data.fotoKTP, data.namaIstri, data.nikIstri, data.timestamp);
      } catch (error) {
        console.error('Failed to upload new KTP:', error);
        ktpFileUrl = data.existingKtpUrl || 'Upload Failed: ' + error.toString();
      }
    }
    
    // Prepare updated row data
    const updatedRowData = [
      new Date(data.timestamp),
      data.desa || '', // Desa Yang Melaporkan
      data.tanggalPelayanan || '',
      data.namaSuami || '',
      data.umurSuami || '',
      data.namaIstri || '',
      data.nikIstri || '',
      data.tanggalLahirIstri || '',
      data.alamat || '',
      data.rt || '',
      data.rw || '',
      data.noHP || '', // NO. HP
      data.jenisAlkon || '', // Jenis Alkon MKJP & NON MKJP
      data.kepesertaanKB || '',
      data.tempatPelayanan || '',
      data.akseptorPajak || '', // Asuransi Yang di Pakai
      ktpFileUrl, // Foto KTP
      data.alkonSebelumnya || '', // Alkon Sebelumnya Yang di Pakai
      data.kondisiBaru || '', // Halaman Untuk Kepesertaan KB Baru
      '', // Jenis Alkon MKJP & NON MKJP Rumus (empty for now)
      '', // Asuransi Yang di Pakai Rumus (empty for now)
      data.akseptorKIE || '' // Akseptor Hasil KIE PPKBD ( Khusus MKJP )
    ];
    
    // Update the row
    const range = sheet.getRange(targetRow, 1, 1, updatedRowData.length);
    range.setValues([updatedRowData]);
    
    console.log('Data successfully updated at row:', targetRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data berhasil diupdate',
        rowNumber: targetRow,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in updateData:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Delete data
 */
function deleteData(data) {
  try {
    console.log('=== DELETE DATA CALLED ===');
    console.log('Data received:', data ? JSON.stringify(data, null, 2) : 'null/undefined');
    
    // Validate required data
    if (!data || typeof data !== 'object') {
      console.error('Invalid data for delete:', data);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'No data provided for delete',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!data.nikIstri) {
      console.error('Missing nikIstri in data:', data);
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'NIK Istri is required for delete operation',
          timestamp: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    console.log('Looking for NIK to delete:', data.nikIstri);
    console.log('Headers:', headers);
    
    // Find NIK column dynamically
    let nikColumn = -1;
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === 'NIK Istri' || headers[j].includes('NIK')) {
        nikColumn = j;
        console.log('Found NIK column at index:', nikColumn, 'Header:', headers[j]);
        break;
      }
    }
    
    if (nikColumn === -1) {
      throw new Error('NIK column not found in spreadsheet');
    }
    
    let targetRow = -1;
    for (let i = 1; i < values.length; i++) { // Start from 1 to skip header
      if (String(values[i][nikColumn]) === String(data.nikIstri)) {
        targetRow = i + 1; // +1 because sheet rows are 1-indexed
        console.log('Found row to delete:', targetRow);
        break;
      }
    }
    
    if (targetRow === -1) {
      throw new Error('Data tidak ditemukan untuk NIK: ' + data.nikIstri);
    }
    
    // Delete the row
    sheet.deleteRow(targetRow);
    
    console.log('Data successfully deleted from row:', targetRow);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'Data berhasil dihapus',
        deletedRow: targetRow,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in deleteData:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all data from spreadsheet
 */
function getAllData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          data: [],
          message: 'Tidak ada data'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = values[0];
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[i][j];
      }
      row.rowNumber = i + 1; // Store row number for reference
      data.push(row);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: data,
        count: data.length
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in getAllData:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get data by NIK
 */
function getDataById(nikIstri) {
  try {
    console.log('=== GET DATA BY ID (POST) ===');
    console.log('Looking for NIK:', nikIstri);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      console.log('No data found in sheet');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: 'Data tidak ditemukan'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = values[0];
    console.log('Headers:', headers);
    
    // Find NIK column dynamically
    let nikColumn = -1;
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === 'NIK Istri' || headers[j].includes('NIK')) {
        nikColumn = j;
        console.log('Found NIK column at index:', nikColumn, 'Header:', headers[j]);
        break;
      }
    }
    
    if (nikColumn === -1) {
      console.error('NIK column not found in headers');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: 'NIK column not found in spreadsheet'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('Searching through', values.length - 1, 'rows...');
    
    for (let i = 1; i < values.length; i++) {
      const currentNik = values[i][nikColumn];
      console.log(`Row ${i}: NIK = "${currentNik}" (comparing with "${nikIstri}")`);
      
      if (String(currentNik) === String(nikIstri)) {
        console.log('Match found at row:', i + 1);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[i][j];
        }
        row.rowNumber = i + 1;
        
        console.log('Returning data:', row);
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            data: row
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    console.log('No matching NIK found');
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'Data tidak ditemukan untuk NIK: ' + nikIstri
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in getDataById:', error);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    console.log('=== DOGET CALLED ===');
    console.log('Parameters:', e.parameter);
    
    const action = e.parameter.action;
    const callback = e.parameter.callback;
    
    let result;
    
    if (action === 'getData') {
      console.log('Getting all data...');
      result = getAllDataForGet();
    } else if (action === 'getById') {
      const id = e.parameter.id;
      console.log('Getting data by ID:', id);
      result = getDataByIdForGet(id);
    } else if (action === 'update') {
      console.log('Updating data via GET...');
      result = updateDataForGet(e.parameter);
    } else {
      console.log('Default response - no action specified');
      result = {
        success: true,
        message: 'Google Apps Script untuk Laporan KB is working! ' + new Date().toISOString()
      };
    }
    
    // Handle JSONP callback
    if (callback) {
      console.log('Returning JSONP response with callback:', callback);
      const jsonpResponse = callback + '(' + JSON.stringify(result) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Regular JSON response
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doGet:', error);
    
    const errorResult = {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    const callback = e.parameter ? e.parameter.callback : null;
    
    if (callback) {
      const jsonpResponse = callback + '(' + JSON.stringify(errorResult) + ');';
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get all data for GET request (returns object instead of ContentService)
 */
function getAllDataForGet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return {
        success: true,
        data: [],
        count: 0,
        message: 'Tidak ada data'
      };
    }
    
    const headers = values[0];
    const data = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[i][j];
      }
      row.rowNumber = i + 1; // Store row number for reference
      data.push(row);
    }
    
    return {
      success: true,
      data: data,
      count: data.length
    };
      
  } catch (error) {
    console.error('Error in getAllDataForGet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get data by ID for GET request (returns object instead of ContentService)
 */
function getDataByIdForGet(nikIstri) {
  try {
    console.log('=== GET DATA BY ID FOR GET ===');
    console.log('Looking for NIK:', nikIstri);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      console.log('No data found in sheet');
      return {
        success: false,
        message: 'Data tidak ditemukan'
      };
    }
    
    const headers = values[0];
    console.log('Headers:', headers);
    
    // Find NIK column dynamically
    let nikColumn = -1;
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === 'NIK Istri' || headers[j].includes('NIK')) {
        nikColumn = j;
        console.log('Found NIK column at index:', nikColumn, 'Header:', headers[j]);
        break;
      }
    }
    
    if (nikColumn === -1) {
      console.error('NIK column not found in headers');
      return {
        success: false,
        error: 'NIK column not found in spreadsheet'
      };
    }
    
    console.log('Searching through', values.length - 1, 'rows...');
    
    for (let i = 1; i < values.length; i++) {
      const currentNik = values[i][nikColumn];
      console.log(`Row ${i}: NIK = "${currentNik}" (comparing with "${nikIstri}")`);
      
      if (String(currentNik) === String(nikIstri)) {
        console.log('Match found at row:', i + 1);
        const row = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j]] = values[i][j];
        }
        row.rowNumber = i + 1;
        
        console.log('Returning data:', row);
        return {
          success: true,
          data: row
        };
      }
    }
    
    console.log('No matching NIK found');
    return {
      success: false,
      message: 'Data tidak ditemukan untuk NIK: ' + nikIstri
    };
      
  } catch (error) {
    console.error('Error in getDataByIdForGet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Update data for GET request (returns object instead of ContentService)
 */
function updateDataForGet(params) {
  try {
    console.log('=== UPDATE DATA FOR GET ===');
    console.log('Raw parameters received:', params);
    console.log('Parameters count:', Object.keys(params).length);
    
    // Remove callback parameter from data
    const data = { ...params };
    delete data.callback;
    delete data.action;
    
    console.log('Data to update after cleanup:', data);
    console.log('NIK Istri in data (with space):', data['NIK Istri']);
    console.log('nikIstri in data (without space):', data.nikIstri);
    
    // Handle both formats: 'NIK Istri' (from convertLocalToSheets) and 'nikIstri' (direct)
    const nikIstri = data['NIK Istri'] || data.nikIstri;
    
    if (!nikIstri) {
      console.error('NIK Istri is missing from data in both formats');
      console.error('Available keys:', Object.keys(data));
      return {
        success: false,
        error: 'NIK Istri is required for update operation. Available keys: ' + Object.keys(data).join(', ')
      };
    }
    
    console.log('Using NIK for update:', nikIstri);
    
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    if (values.length <= 1) {
      return {
        success: false,
        error: 'No data found in spreadsheet'
      };
    }
    
    const headers = values[0];
    console.log('Headers:', headers);
    
    // Find NIK column
    let nikColumn = -1;
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === 'NIK Istri' || headers[j].includes('NIK')) {
        nikColumn = j;
        break;
      }
    }
    
    if (nikColumn === -1) {
      return {
        success: false,
        error: 'NIK column not found in spreadsheet'
      };
    }
    
    // Find the row to update
    let targetRow = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][nikColumn]) === String(nikIstri)) {
        targetRow = i;
        break;
      }
    }
    
    if (targetRow === -1) {
      return {
        success: false,
        error: 'Data not found for NIK: ' + nikIstri
      };
    }
    
    console.log('Found target row:', targetRow + 1);
    
    // Handle file upload if exists
    let ktpFileUrl = data.existingKtpUrl || '';
    if (data['Foto KTP'] && data['Foto KTP'].startsWith('data:image/')) {
      try {
        ktpFileUrl = uploadKTPToGoogleDrive(
          data['Foto KTP'], 
          data['Nama Istri'] || data.namaIstri, 
          nikIstri, 
          data.Timestamp || data.timestamp
        );
      } catch (error) {
        console.error('Failed to upload new KTP:', error);
        ktpFileUrl = 'Upload Failed: ' + error.toString();
      }
    } else if (data.fotoKTP && data.fotoKTP.startsWith('data:image/')) {
      try {
        ktpFileUrl = uploadKTPToGoogleDrive(
          data.fotoKTP, 
          data['Nama Istri'] || data.namaIstri, 
          nikIstri, 
          data.Timestamp || data.timestamp
        );
      } catch (error) {
        console.error('Failed to upload new KTP:', error);
        ktpFileUrl = 'Upload Failed: ' + error.toString();
      }
    }
    
    // Prepare row data for update - use the extracted nikIstri and handle both field formats
    const rowData = [
      data.Timestamp || data.timestamp || new Date().toISOString(),
      data['Desa Yang Melaporkan'] || data.desa || '',
      data['Tanggal Pelayanan'] || data.tanggalPelayanan || '',
      data['Nama Suami'] || data.namaSuami || '',
      data['Umur Suami'] || data.umurSuami || '',
      data['Nama Istri'] || data.namaIstri || '',
      nikIstri, // Use the extracted NIK
      data['Tanggal Lahir Istri'] || data.tanggalLahirIstri || '',
      data['Alamat'] || data.alamat || '',
      data['RT'] || data.rt || '',
      data['RW'] || data.rw || '',
      data['NO. HP'] || data.noHP || '',
      data['Jenis Alkon MKJP & NON MKJP'] || data.jenisAlkon || '',
      data['Kepesertaan KB'] || data.kepesertaanKB || '',
      data['Tempat Pelayanan'] || data.tempatPelayanan || '',
      data['Asuransi Yang di Pakai'] || data.akseptorPajak || '',
      ktpFileUrl,
      data['Alkon Sebelumnya Yang di Pakai'] || data.alkonSebelumnya || '',
      data['Halaman Untuk Kepesertaan KB Baru'] || data.kondisiBaru || '',
      '', // Jenis Alkon MKJP & NON MKJP Rumus (empty for now)
      '', // Asuransi Yang di Pakai Rumus (empty for now)
      data['Akseptor Hasil KIE PPKBD ( Khusus MKJP )'] || data.akseptorKIE || ''
    ];
    
    console.log('Updating row', targetRow + 1, 'with data:', rowData);
    console.log('Row data length:', rowData.length);
    console.log('Headers length:', headers.length);
    
    // Update the row
    const range = sheet.getRange(targetRow + 1, 1, 1, Math.min(rowData.length, headers.length));
    range.setValues([rowData.slice(0, headers.length)]); // Ensure we don't exceed column count
    
    console.log('Row updated successfully');
    
    return {
      success: true,
      message: 'Data berhasil diupdate',
      updatedRow: targetRow + 1,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error in updateDataForGet:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Function untuk testing - bisa dipanggil manual dari Apps Script Editor
 */
function testFunction() {
  try {
    console.log('=== TESTING DOPOST FUNCTION ===');
    
    const testData = {
      timestamp: new Date().toISOString(),
      akseptorKIE: 'Ya',
      desa: 'Sukorejo',
      tanggalPelayanan: '2024-12-14',
      namaSuami: 'Test Suami',
      umurSuami: '30',
      namaIstri: 'Test Istri',
      nikIstri: '1234567890123456',
      tanggalLahirIstri: '1990-01-01',
      alamat: 'Test Alamat',
      rt: '001',
      rw: '001',
      noHP: '08123456789',
      jenisAlkon: 'IUD',
      kepesertaanKB: 'Baru',
      kondisiBaru: 'Pasca Persalinan',
      alkonSebelumnya: '',
      tempatPelayanan: 'Puskesmas Test',
      akseptorPajak: 'BPJS',
      fotoKTP: '' // No file for basic test
    };
    
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData)
      }
    };
    
    console.log('Calling doPost with mock data...');
    const result = doPost(mockEvent);
    console.log('Test result:', result.getContent());
    console.log('=== TEST COMPLETED SUCCESSFULLY ===');
    
    return result.getContent();
    
  } catch (error) {
    console.error('=== TEST FAILED ===');
    console.error('Error:', error);
    return 'Test failed: ' + error.toString();
  }
}

/**
 * Upload KTP image to Google Drive
 */
function uploadKTPToGoogleDrive(base64Data, namaIstri, nikIstri, timestamp) {
  try {
    console.log('Starting KTP upload process...');
    console.log('Data length:', base64Data.length);
    console.log('Nama Istri:', namaIstri);
    console.log('NIK:', nikIstri);
    
    // Parse base64 data
    const base64 = base64Data.split(',')[1]; // Remove data:image/jpeg;base64, part
    const mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0]; // Extract MIME type
    
    console.log('MIME type:', mimeType);
    console.log('Base64 length:', base64.length);
    
    // Create improved filename
    const date = new Date(timestamp);
    const dateStr = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm-ss');
    
    // Clean and validate nama istri
    let cleanNama = (namaIstri || 'Unknown').toString().trim();
    if (cleanNama === '' || cleanNama === 'Unknown' || cleanNama === 'undefined' || cleanNama === 'null') {
      cleanNama = 'NoName';
    }
    
    // Limit nama length and clean special characters
    cleanNama = cleanNama
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars except spaces
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 20); // Limit to 20 characters
    
    // Clean and validate NIK
    let cleanNIK = (nikIstri || '').toString().replace(/[^0-9]/g, '');
    if (cleanNIK === '' || cleanNIK.length < 10) {
      cleanNIK = 'NoNIK_' + Date.now().toString().slice(-8); // Use timestamp as fallback
    }
    
    // Determine file extension based on MIME type
    let fileExt = 'jpg'; // default
    if (mimeType.includes('png')) fileExt = 'png';
    else if (mimeType.includes('gif')) fileExt = 'gif';
    else if (mimeType.includes('webp')) fileExt = 'webp';
    
    // Create filename with improved format: KTP_[Nama]_NIK-[NIK]_[Date].[ext]
    const fileName = `KTP_${cleanNama}_NIK-${cleanNIK}_${dateStr}.${fileExt}`;
    
    console.log('Generated filename:', fileName);
    console.log('Filename length:', fileName.length);
    
    // Convert base64 to blob with improved filename
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    
    // Get or create KTP folder
    console.log('Getting KTP folder...');
    const ktpFolder = getOrCreateKTPFolder();
    console.log('KTP folder obtained:', ktpFolder.getName());
    
    // Check for existing files with similar names to avoid duplicates
    const existingFiles = ktpFolder.getFilesByName(fileName);
    let finalFileName = fileName;
    let counter = 1;
    
    while (existingFiles.hasNext()) {
      const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      finalFileName = `${nameWithoutExt}_v${counter}${extension}`;
      counter++;
      
      // Check if this versioned name exists
      const versionedFiles = ktpFolder.getFilesByName(finalFileName);
      if (!versionedFiles.hasNext()) {
        break;
      }
    }
    
    // Update blob name if changed
    if (finalFileName !== fileName) {
      console.log('Filename updated to avoid duplicates:', finalFileName);
      blob.setName(finalFileName);
    }
    
    // Upload file to Google Drive
    console.log('Creating file in folder...');
    const file = ktpFolder.createFile(blob);
    console.log('File created with name:', finalFileName);
    
    // Set improved file description
    const formattedDate = Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    file.setDescription(`Foto KTP - Nama: ${namaIstri} | NIK: ${nikIstri} | Upload: ${formattedDate} | Size: ${Math.round(base64.length * 0.75 / 1024)} KB`);
    
    console.log('Setting file permissions...');
    // Make file accessible (anyone with link can view)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get file ID and create proper shareable URL
    const fileId = file.getId();
    console.log('File ID:', fileId);
    
    // Return direct view URL instead of /open URL
    const fileUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    console.log('File upload completed:', fileUrl);
    
    // Return file URL
    return fileUrl;
    
  } catch (error) {
    console.error('Error uploading KTP:', error);
    throw new Error('Failed to upload KTP: ' + error.toString());
  }
}

/**
 * Get KTP folder in Google Drive (menggunakan folder yang sudah ada)
 */
function getOrCreateKTPFolder() {
  try {
    // Gunakan folder yang sudah ada berdasarkan ID
    const folder = DriveApp.getFolderById(KTP_FOLDER_ID);
    console.log('Using existing KTP folder:', folder.getName());
    return folder;
  } catch (error) {
    console.error('Error accessing KTP folder by ID, trying by name...', error);
    
    // Fallback: cari berdasarkan nama jika ID tidak bisa diakses
    try {
      const folders = DriveApp.getFoldersByName(KTP_FOLDER_NAME);
      
      if (folders.hasNext()) {
        const folder = folders.next();
        console.log('Found KTP folder by name:', folder.getId());
        return folder;
      } else {
        // Create new folder sebagai last resort
        const folder = DriveApp.createFolder(KTP_FOLDER_NAME);
        folder.setDescription('Folder untuk menyimpan foto KTP dari Form Laporan KB');
        console.log('Created new KTP folder:', folder.getId());
        return folder;
      }
    } catch (fallbackError) {
      console.error('Error in fallback folder access:', fallbackError);
      throw new Error('Failed to access KTP folder: ' + fallbackError.toString());
    }
  }
}

/**
 * Test function untuk upload KTP (safe version)
 */
function testKTPUpload() {
  try {
    console.log('=== TESTING KTP UPLOAD ===');
    
    // This is a dummy base64 image for testing
    const testBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    const url = uploadKTPToGoogleDrive(testBase64, 'Test User KTP', '1234567890123456', new Date().toISOString());
    console.log('=== KTP UPLOAD TEST SUCCESSFUL ===');
    console.log('File URL:', url);
    return url;
    
  } catch (error) {
    console.error('=== KTP UPLOAD TEST FAILED ===');
    console.error('Error:', error);
    return 'Upload test failed: ' + error.toString();
  }
}

/**
 * Test function untuk mengecek akses folder
 */
function testFolderAccess() {
  try {
    const folder = getOrCreateKTPFolder();
    console.log('Folder access successful:');
    console.log('- Name:', folder.getName());
    console.log('- ID:', folder.getId());
    console.log('- URL:', folder.getUrl());
    return {
      success: true,
      name: folder.getName(),
      id: folder.getId(),
      url: folder.getUrl()
    };
  } catch (error) {
    console.error('Folder access failed:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Debug function untuk test upload dengan logging detail
 */
function debugKTPUpload() {
  console.log('=== DEBUG KTP UPLOAD START ===');
  
  // Test folder access first
  try {
    console.log('1. Testing folder access...');
    const folderResult = testFolderAccess();
    console.log('Folder test result:', folderResult);
    
    if (!folderResult.success) {
      return 'Folder access failed: ' + folderResult.error;
    }
    
    console.log('2. Testing file upload...');
    const testBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
    
    const url = uploadKTPToGoogleDrive(testBase64, 'Debug Test User', '9999999999999999', new Date().toISOString());
    console.log('3. Upload successful:', url);
    
    console.log('=== DEBUG KTP UPLOAD SUCCESS ===');
    return 'Upload successful: ' + url;
    
  } catch (error) {
    console.error('=== DEBUG KTP UPLOAD FAILED ===');
    console.error('Error:', error);e.error('Error:', error);
    console.error('Error stack:', error.stack);
    return 'Upload failed: ' + error.toString();
  }
}

/**
 * Test complete form submission dengan file upload
 */
function testCompleteFormWithKTP() {
  try {
    console.log('=== TESTING COMPLETE FORM WITH KTP ===');
    
    const testData = {
      timestamp: new Date().toISOString(),
      akseptorKIE: 'Ya',
      desa: 'Sukorejo',
      tanggalPelayanan: '2024-12-15',
      namaSuami: 'Test Suami Complete',
      umurSuami: '30',
      namaIstri: 'Test Istri Complete',
      nikIstri: '1234567890123456',
      tanggalLahirIstri: '1990-01-01',
      alamat: 'Test Alamat Complete',
      rt: '001',
      rw: '001',
      noHP: '08123456789',
      jenisAlkon: 'IUD',
      kepesertaanKB: 'Baru',
      kondisiBaru: 'Pasca Persalinan',
      alkonSebelumnya: '',
      tempatPelayanan: 'Puskesmas Test',
      akseptorPajak: 'BPJS',
      fotoKTP: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A'
    };
    
    const mockEvent = {
      postData: {
        contents: JSON.stringify(testData)
      }
    };
    
    console.log('Calling doPost with KTP data...');
    const result = doPost(mockEvent);
    console.log('=== COMPLETE TEST SUCCESSFUL ===');
    console.log('Result:', result.getContent());
    
    return result.getContent();
    
  } catch (error) {
    console.error('=== COMPLETE TEST FAILED ===');
    console.error('Error:', error);
    return 'Complete test failed: ' + error.toString();
  }
}

/**
 * Test update function
 */
function testUpdateData() {
  try {
    console.log('=== TESTING UPDATE DATA ===');
    
    const updateData = {
      action: 'update',
      timestamp: new Date().toISOString(),
      akseptorKIE: 'Ya',
      desa: 'Sukorejo Updated',
      tanggalPelayanan: '2024-12-17',
      namaSuami: 'Test Suami Updated',
      umurSuami: '31',
      namaIstri: 'Test Istri Updated',
      nikIstri: '1234567890123456', // Must match existing NIK
      tanggalLahirIstri: '1990-01-01',
      alamat: 'Test Alamat Updated',
      rt: '002',
      rw: '002',
      noHP: '08123456789',
      jenisAlkon: 'Implant',
      kepesertaanKB: 'Lama',
      kondisiBaru: '',
      alkonSebelumnya: 'IUD',
      tempatPelayanan: 'Puskesmas Test Updated',
      akseptorPajak: 'BPJS'
    };
    
    const mockEvent = {
      postData: {
        contents: JSON.stringify(updateData)
      }
    };
    
    console.log('Calling doPost with update data...');
    const result = doPost(mockEvent);
    console.log('=== UPDATE TEST SUCCESSFUL ===');
    console.log('Result:', result.getContent());
    
    return result.getContent();
    
  } catch (error) {
    console.error('=== UPDATE TEST FAILED ===');
    console.error('Error:', error);
    return 'Update test failed: ' + error.toString();
  }
}

/**
 * Test delete function
 */
function testDeleteData() {
  try {
    console.log('=== TESTING DELETE DATA ===');
    
    const deleteData = {
      action: 'delete',
      nikIstri: '1234567890123456' // Must match existing NIK
    };
    
    const mockEvent = {
      postData: {
        contents: JSON.stringify(deleteData)
      }
    };
    
    console.log('Calling doPost with delete data...');
    const result = doPost(mockEvent);
    console.log('=== DELETE TEST SUCCESSFUL ===');
    console.log('Result:', result.getContent());
    
    return result.getContent();
    
  } catch (error) {
    console.error('=== DELETE TEST FAILED ===');
    console.error('Error:', error);
    return 'Delete test failed: ' + error.toString();
  }
}

/**
 * Test all CRUD operations in sequence
 */
function testAllCRUD() {
  try {
    console.log('=== TESTING ALL CRUD OPERATIONS ===');
    
    // 1. Test Create
    console.log('1. Testing CREATE...');
    const createResult = testCompleteFormWithKTP();
    console.log('Create result:', createResult);
    
    // 2. Test Update
    console.log('2. Testing UPDATE...');
    const updateResult = testUpdateData();
    console.log('Update result:', updateResult);
    
    // 3. Test Read
    console.log('3. Testing READ...');
    const readResult = getAllData();
    console.log('Read result:', readResult.getContent());
    
    // Note: Skip delete test to preserve data
    console.log('=== ALL CRUD TESTS COMPLETED ===');
    
    return 'All CRUD tests completed successfully';
    
  } catch (error) {
    console.error('=== CRUD TESTS FAILED ===');
    console.error('Error:', error);
    return 'CRUD tests failed: ' + error.toString();
  }
}