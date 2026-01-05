/**
 * Script untuk membersihkan cache dan memastikan menggunakan URL yang benar
 * Jalankan script ini di browser console untuk membersihkan cache
 */

// URL dan ID yang benar (sesuai yang diberikan user)
const CORRECT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbkVQyK7Ur1__izMxhxAkC8DJOnHKV5_qAkLfgko98M8KaT3APfrNpyq5Xq6xbzZn5/exec';
const CORRECT_SPREADSHEET_ID = '1VxDv48i3Sx5pNBid1sZOeSCh2sNldBGJgEsUMFnud6g';

console.log('🧹 === MEMBERSIHKAN CACHE DAN MEMPERBAIKI URL ===');

// 1. Bersihkan localStorage
console.log('1. Membersihkan localStorage...');
const oldUrl = localStorage.getItem('googleScriptUrl');
console.log('URL lama di localStorage:', oldUrl);

localStorage.removeItem('googleScriptUrl');
localStorage.setItem('googleScriptUrl', CORRECT_SCRIPT_URL);

console.log('✅ localStorage dibersihkan dan diperbarui dengan URL yang benar');
console.log('URL baru di localStorage:', localStorage.getItem('googleScriptUrl'));

// 2. Bersihkan IndexedDB cache
console.log('2. Membersihkan IndexedDB cache...');
if ('indexedDB' in window) {
    try {
        // Hapus database lama jika ada
        const deleteReq = indexedDB.deleteDatabase('KBDataDB');
        deleteReq.onsuccess = () => {
            console.log('✅ IndexedDB cache dibersihkan');
        };
        deleteReq.onerror = () => {
            console.log('⚠️ Gagal membersihkan IndexedDB, tapi tidak masalah');
        };
    } catch (error) {
        console.log('⚠️ Error membersihkan IndexedDB:', error);
    }
}

// 3. Bersihkan session storage
console.log('3. Membersihkan sessionStorage...');
sessionStorage.clear();
console.log('✅ sessionStorage dibersihkan');

// 4. Update CONFIG jika tersedia
console.log('4. Memperbarui CONFIG...');
if (typeof CONFIG !== 'undefined') {
    CONFIG.GOOGLE_SCRIPT_URL = CORRECT_SCRIPT_URL;
    CONFIG.SPREADSHEET_ID = CORRECT_SPREADSHEET_ID;
    console.log('✅ CONFIG diperbarui');
    console.log('CONFIG.GOOGLE_SCRIPT_URL:', CONFIG.GOOGLE_SCRIPT_URL);
    console.log('CONFIG.SPREADSHEET_ID:', CONFIG.SPREADSHEET_ID);
} else {
    console.log('⚠️ CONFIG tidak ditemukan, mungkin belum dimuat');
}

// 5. Reinitialize SheetsAPI jika tersedia
console.log('5. Reinitialize SheetsAPI...');
if (typeof window.sheetsAPI !== 'undefined') {
    // Buat instance baru dengan URL yang benar
    window.sheetsAPI = new SheetsAPI();
    console.log('✅ SheetsAPI diinisialisasi ulang');
    console.log('SheetsAPI baseUrl:', window.sheetsAPI.baseUrl);
} else {
    console.log('⚠️ SheetsAPI belum tersedia, akan diinisialisasi saat halaman dimuat');
}

// 6. Test koneksi ke URL yang benar
console.log('6. Testing koneksi ke URL yang benar...');
async function testConnection() {
    try {
        const testUrl = CORRECT_SCRIPT_URL + '?action=test&callback=testCallback&_t=' + Date.now();
        console.log('Testing URL:', testUrl);
        
        // Buat script tag untuk test JSONP
        const script = document.createElement('script');
        script.src = testUrl;
        
        // Timeout untuk test
        const timeout = setTimeout(() => {
            console.log('❌ Test timeout - URL mungkin tidak valid atau Google Apps Script belum di-deploy');
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        }, 10000);
        
        // Callback untuk test
        window.testCallback = function(data) {
            clearTimeout(timeout);
            console.log('✅ Test berhasil! Response:', data);
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window.testCallback;
        };
        
        script.onerror = () => {
            clearTimeout(timeout);
            console.log('❌ Test gagal - Script load error');
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
            delete window.testCallback;
        };
        
        document.head.appendChild(script);
        
    } catch (error) {
        console.error('❌ Error testing connection:', error);
    }
}

testConnection();

console.log('🎉 === PEMBERSIHAN CACHE SELESAI ===');
console.log('');
console.log('📋 LANGKAH SELANJUTNYA:');
console.log('1. Refresh halaman (Ctrl+F5 atau Cmd+Shift+R)');
console.log('2. Coba klik tombol Refresh di aplikasi');
console.log('3. Jika masih bermasalah, pastikan Google Apps Script sudah di-deploy dengan benar');
console.log('');
console.log('🔗 URL yang seharusnya digunakan:');
console.log(CORRECT_SCRIPT_URL);
console.log('');
console.log('📊 Spreadsheet ID yang seharusnya digunakan:');
console.log(CORRECT_SPREADSHEET_ID);