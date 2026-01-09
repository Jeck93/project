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
        PASSWORD: 'admin123',
        // Multiple users configuration
        USERS: [
            { 
                username: 'admin', 
                password: 'admin123', 
                name: 'Administrator',
                email: 'admin@ppkbd.local',
                role: 'admin'
            },
            { 
                username: 'ppkbd', 
                password: 'ppkbd2024', 
                name: 'PPKBD Staff',
                email: 'ppkbd@kemendukbangga.go.id',
                role: 'staff'
            },
            { 
                username: 'user1', 
                password: 'user123', 
                name: 'User Demo',
                email: 'user1@demo.local',
                role: 'user'
            },
            { 
                username: 'kecamatan', 
                password: 'kec2024', 
                name: 'Petugas Kecamatan',
                email: 'kecamatan@ulujami.go.id',
                role: 'operator'
            }
        ]
    }
};

// Export config for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}