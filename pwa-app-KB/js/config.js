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
        // Multiple users configuration - Petugas PPKBD per Desa
        USERS: [
            // Admin Users
            { 
                username: 'admin', 
                password: 'admin123', 
                name: 'Administrator',
                email: 'admin@ppkbd.local',
                role: 'admin',
                desa: 'Pusat'
            },
            { 
                username: 'ppkbd', 
                password: 'ppkbd2024', 
                name: 'PPKBD Staff',
                email: 'ppkbd@kemendukbangga.go.id',
                role: 'staff',
                desa: 'Pusat'
            },
            
            // Petugas PPKBD per Desa Kecamatan Ulujami
            { 
                username: 'cholilah', 
                password: 'laporan123', 
                name: 'Cholilah',
                email: 'cholilah@sukorejo.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Sukorejo'
            },
            { 
                username: 'harwati', 
                password: 'laporan123', 
                name: 'Harwati',
                email: 'harwati@botekan.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Botekan'
            },
            { 
                username: 'friska', 
                password: 'laporan123', 
                name: 'Friska',
                email: 'friska@rowosari.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Rowosari'
            },
            { 
                username: 'sugiarti', 
                password: 'laporan123', 
                name: 'Sugiarti',
                email: 'sugiarti@ambowetan.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Ambowetan'
            },
            { 
                username: 'kiswati', 
                password: 'laporan123', 
                name: 'Kiswati',
                email: 'kiswati@pagergunung.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Pagergunung'
            },
            { 
                username: 'nuraini', 
                password: 'laporan123', 
                name: 'Nuraini',
                email: 'nuraini@wiyorowetan.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Wiyorowetan'
            },
            { 
                username: 'umirohwati', 
                password: 'laporan123', 
                name: 'Umirohwati',
                email: 'umirohwati@samong.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Samong'
            },
            { 
                username: 'masrurotun', 
                password: 'laporan123', 
                name: 'Masrurotun',
                email: 'masrurotun@tasikrejo.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Tasikrejo'
            },
            { 
                username: 'suwati', 
                password: 'laporan123', 
                name: 'Suwati',
                email: 'suwati@bumirejo.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Bumirejo'
            },
            { 
                username: 'turikhah', 
                password: 'laporan123', 
                name: 'Turikhah',
                email: 'turikhah@kaliprau.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Kaliprau'
            },
            { 
                username: 'fathanah', 
                password: 'laporan123', 
                name: 'Fathanah',
                email: 'fathanah@kertosari.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Kertosari'
            },
            { 
                username: 'turahati', 
                password: 'laporan123', 
                name: 'Turahati',
                email: 'turahati@pamutih.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Pamutih'
            },
            { 
                username: 'tunirah', 
                password: 'laporan123', 
                name: 'Tunirah',
                email: 'tunirah@padek.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Padek'
            },
            { 
                username: 'isrowiyah', 
                password: 'laporan123', 
                name: 'Isrowiyah',
                email: 'isrowiyah@blendung.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Blendung'
            },
            { 
                username: 'nurul', 
                password: 'laporan123', 
                name: 'Nurul',
                email: 'nurul@ketapang.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Ketapang'
            },
            { 
                username: 'kusni', 
                password: 'laporan123', 
                name: 'Kusni',
                email: 'kusni@limbangan.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Limbangan'
            },
            { 
                username: 'pujipurwati', 
                password: 'laporan123', 
                name: 'Pujipurwati',
                email: 'pujipurwati@mojo.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Mojo'
            },
            { 
                username: 'nurkhasanah', 
                password: 'laporan123', 
                name: 'Nurkhasanah',
                email: 'nurkhasanah@pesantren.ulujami.go.id',
                role: 'petugas_desa',
                desa: 'Pesantren'
            }
        ]
    }
};

// Export config for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}