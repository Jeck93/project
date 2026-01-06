// Configuration file for Google Sheets integration
const CONFIG = {
    // Google Apps Script Web App URL - Updated URL from user
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwbkVQyK7Ur1__izMxhxAkC8DJOnHKV5_qAkLfgko98M8KaT3APfrNpyq5Xq6xbzZn5/exec',
    
    // Spreadsheet ID (opsional, sudah diset di Apps Script)
    SPREADSHEET_ID: '1VxDv48i3Sx5pNBid1sZOeSCh2sNldBGJgEsUMFnud6g',
    
    // Google Drive Folder ID untuk KTP
    KTP_FOLDER_ID: '1dJuoZk9PwS4h7ktBeuRpgLKHqzrMEMVTU426qae9oqfaGWQdZPI573lM5-l2tq_crEzWT9Bb',
    
    // Retry settings
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000, // 2 seconds
    
    // Debug mode
    DEBUG: true
    ,
    // Authentication demo credentials (not secure for production)
    // Change these values to update the PWA demo login username/password
    AUTH: {
        USERNAME: 'admin',
        PASSWORD: 'admin123'
    }
};

// Export config for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}