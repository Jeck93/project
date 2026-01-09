// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(reg => {
            console.log('✅ Service Worker registered successfully', reg);
            
            // Check if service worker is active
            if (reg.active) {
                console.log('✅ Service Worker is active');
            } else if (reg.installing) {
                console.log('🔄 Service Worker is installing...');
            } else if (reg.waiting) {
                console.log('⏳ Service Worker is waiting...');
            }
        })
        .catch(err => {
            console.error('❌ Service Worker registration failed:', err);
            console.error('Service Worker registration failed, offline functionality may be affected');
        });
}

// Initialize PWA install prompt variable globally
window.deferredPrompt = null;

// Check authentication - Secure Local only
function checkAuthentication() {
    // Check secure local authentication
    const token = localStorage.getItem('pwa_secure_token');
    const authType = localStorage.getItem('pwa_auth_type');
    
    if (token && authType === 'secure') {
        console.log('User authenticated via Secure Local');
        return true;
    }
    
    console.log('No authentication found, redirecting to login...');
    return false;
}

// Only redirect if we're on index.html and not authenticated
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Check authentication immediately
    if (!checkAuthentication()) {
        window.location.href = 'login.html';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Display username - Secure Local only
    function updateUsername() {
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            const username = localStorage.getItem('pwa_username') || 'User';
            usernameElement.textContent = username;
        }
    }
    
    // Update username immediately
    updateUsername();
    
    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Secure local logout
            localStorage.removeItem('pwa_secure_token');
            localStorage.removeItem('pwa_username');
            localStorage.removeItem('pwa_user_role');
            localStorage.removeItem('pwa_auth_type');
            localStorage.removeItem('pwa_session_start');
            window.location.href = 'login.html';
        });
    }
});

// Initialize IndexedDB with dynamic version handling
let db;
const dbName = 'LaporanKBDB';
const storeName = 'laporan';

// Pagination variables
let currentPage = 1;
let itemsPerPage = 10;
let allData = [];
let filteredData = [];

async function initializeDatabase() {
    try {
        // Check existing database version dynamically
        const databases = await indexedDB.databases();
        const existingDB = databases.find(db => db.name === dbName);
        let targetVersion = existingDB ? existingDB.version : 1;
        
        // If we need to upgrade, increment version
        if (targetVersion < 2) {
            targetVersion = 2;
        }
        
        console.log('Opening database with version:', targetVersion);
        
        const request = indexedDB.open(dbName, targetVersion);
        
        request.onerror = () => {
            console.error('Database error:', request.error);
            // Try to continue without database
            loadData();
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('✅ Database opened successfully');
            loadData();
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('🔄 Database upgrade needed, creating object store...');
            
            // Delete existing store if it exists
            if (db.objectStoreNames.contains(storeName)) {
                db.deleteObjectStore(storeName);
            }
            
            // Create new object store
            const objectStore = db.createObjectStore(storeName, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            
            // Create indexes for better search performance
            objectStore.createIndex('nama', 'nama', { unique: false });
            objectStore.createIndex('nik', 'nik', { unique: false });
            objectStore.createIndex('alamat', 'alamat', { unique: false });
            objectStore.createIndex('alatKontrasepsi', 'alatKontrasepsi', { unique: false });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            
            console.log('✅ Object store created with indexes');
        };
        
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        // Continue without database
        loadData();
    }
}

// Load data from IndexedDB
async function loadData() {
    if (!db) {
        console.log('Database not available, loading from localStorage...');
        loadFromLocalStorage();
        return;
    }
    
    try {
        const transaction = db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const request = objectStore.getAll();
        
        request.onsuccess = () => {
            allData = request.result || [];
            console.log(`✅ Loaded ${allData.length} records from IndexedDB`);
            
            // Also try to load from localStorage as backup
            const localData = JSON.parse(localStorage.getItem('laporanData') || '[]');
            if (localData.length > allData.length) {
                console.log('📦 Using localStorage data as it has more records');
                allData = localData;
            }
            
            filteredData = [...allData];
            updateDataDisplay();
            updateSummary();
        };
        
        request.onerror = () => {
            console.error('❌ Error loading data from IndexedDB:', request.error);
            loadFromLocalStorage();
        };
        
    } catch (error) {
        console.error('❌ Error in loadData:', error);
        loadFromLocalStorage();
    }
}

// Fallback to localStorage
function loadFromLocalStorage() {
    try {
        allData = JSON.parse(localStorage.getItem('laporanData') || '[]');
        filteredData = [...allData];
        console.log(`📦 Loaded ${allData.length} records from localStorage`);
        updateDataDisplay();
        updateSummary();
    } catch (error) {
        console.error('❌ Error loading from localStorage:', error);
        allData = [];
        filteredData = [];
        updateDataDisplay();
        updateSummary();
    }
}

// Export data to Excel
function exportData() {
    if (allData.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    try {
        // Prepare data for export
        const exportData = allData.map((item, index) => ({
            'No': index + 1,
            'Nama': item.nama || '',
            'NIK': item.nik || '',
            'Alamat': item.alamat || '',
            'Alat Kontrasepsi': item.alatKontrasepsi || '',
            'Tanggal Input': item.timestamp ? new Date(item.timestamp).toLocaleDateString('id-ID') : ''
        }));
        
        // Convert to CSV
        const headers = Object.keys(exportData[0]);
        const csvContent = [
            headers.join(','),
            ...exportData.map(row => 
                headers.map(header => `"${row[header]}"`).join(',')
            )
        ].join('\n');
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `laporan-ppkbd-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Data exported successfully');
        
    } catch (error) {
        console.error('❌ Export error:', error);
        alert('Terjadi kesalahan saat mengekspor data');
    }
}

// Refresh data
function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Memuat...</span>';
    }
    
    setTimeout(() => {
        loadData();
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<span class="btn-icon">🔄</span><span class="btn-text">Refresh</span>';
        }
        console.log('✅ Data refreshed');
    }, 1000);
}