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
            
            // Log service worker registration error
            console.error('Service Worker registration failed, offline functionality may be affected');
        });
}

// Initialize PWA install prompt variable globally
window.deferredPrompt = null;

// Check authentication - prioritize Netlify Identity
function checkAuthentication() {
    // Wait for Netlify Identity to initialize
    if (typeof netlifyIdentity !== 'undefined') {
        const currentUser = netlifyIdentity.currentUser();
        if (currentUser) {
            console.log('User authenticated via Netlify Identity:', currentUser.email);
            return true;
        }
    }
    
    // Fallback to localStorage token (legacy system)
    const authToken = localStorage.getItem('pwa_auth_token');
    if (authToken) {
        console.log('User authenticated via localStorage token');
        return true;
    }
    
    console.log('No authentication found, redirecting to login...');
    return false;
}

// Only redirect if we're on index.html and not authenticated
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Wait a bit for Netlify Identity to initialize
    setTimeout(() => {
        if (!checkAuthentication()) {
            window.location.href = 'login.html';
        }
    }, 1000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Display username - prioritize Netlify Identity
    function updateUsername() {
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            let username = 'User';
            
            // Try Netlify Identity first
            if (typeof netlifyIdentity !== 'undefined') {
                const currentUser = netlifyIdentity.currentUser();
                if (currentUser) {
                    username = currentUser.user_metadata.full_name || currentUser.email;
                }
            }
            
            // Fallback to localStorage
            if (username === 'User') {
                username = localStorage.getItem('pwa_username') || 'User';
            }
            
            usernameElement.textContent = username;
        }
    }
    
    // Update username immediately and after Netlify Identity loads
    updateUsername();
    
    // Listen for Netlify Identity events
    if (typeof netlifyIdentity !== 'undefined') {
        netlifyIdentity.on('login', updateUsername);
        netlifyIdentity.on('logout', () => {
            window.location.href = 'login.html';
        });
    }

    // Logout handler - handle both auth systems
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Logout from Netlify Identity if available
            if (typeof netlifyIdentity !== 'undefined' && netlifyIdentity.currentUser()) {
                netlifyIdentity.logout();
            } else {
                // Fallback to localStorage cleanup
                localStorage.removeItem('pwa_auth_token');
                localStorage.removeItem('pwa_username');
                window.location.href = 'login.html';
            }
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
        
        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully, version:', db.version);
            loadData();
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            console.log('Database upgrade needed from version', event.oldVersion, 'to', event.newVersion);
            
            if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                objectStore.createIndex('namaIstri', 'namaIstri', { unique: false });
                objectStore.createIndex('nikIstri', 'nikIstri', { unique: false });
                objectStore.createIndex('desa', 'desa', { unique: false });
                objectStore.createIndex('tanggalPelayanan', 'tanggalPelayanan', { unique: false });
                console.log('Object store created');
            }
        };
        
    } catch (error) {
        console.error('Database initialization error:', error);
        // Continue without database
        loadData();
    }
}

// Initialize database
initializeDatabase();

// Auto-check service worker status after page load
window.addEventListener('load', () => {
    setTimeout(async () => {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration && registration.active) {
                    console.log('✅ Service Worker is running properly');
                } else {
                    console.warn('⚠️ Service Worker may not be active');
                }
            } catch (error) {
                console.error('❌ Service Worker check failed:', error);
            }
        }
    }, 2000);
});

// Load and display data
async function loadData(searchTerm = '') {
    console.log('=== LOADING DATA ===');
    console.log('Search term:', searchTerm);
    console.log('Online status:', navigator.onLine);
    console.log('Database available:', !!db);
    
    // Update connection status
    updateConnectionStatus('checking', 'Checking connection to Google Sheets...');
    
    // Show loading indicator
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.innerHTML = '<p class="loading">⏳ Memuat data...</p>';
    }
    
    // Try to load from Google Sheets first if online
    if (navigator.onLine) {
        try {
            console.log('Online - trying to load from Google Sheets...');
            await loadDataFromSheets(searchTerm);
            return;
        } catch (error) {
            console.warn('Failed to load from Google Sheets, falling back to local data:', error);
            
            // Update connection status with more user-friendly message
            const errorMsg = error.message.includes('script load error') ? 
                'Tidak dapat terhubung ke Google Sheets' : 
                error.message.includes('timeout') ? 
                'Koneksi timeout - coba lagi nanti' : 
                `Koneksi gagal: ${error.message}`;
            
            updateConnectionStatus('error', errorMsg);
            
            // Show error message briefly with action button
            if (dataTable) {
                dataTable.innerHTML = `
                    <div class="error-container">
                        <p class="error">⚠️ Gagal memuat dari Google Sheets</p>
                        <p class="error-detail">${errorMsg}</p>
                        <button onclick="retryConnection()" class="btn-primary">🔄 Coba Lagi</button>
                        <p class="info">Mencoba data lokal...</p>
                    </div>
                `;
                setTimeout(() => {
                    loadDataFromLocal(searchTerm);
                }, 3000);
                return;
            }
        }
    } else {
        console.log('Offline - loading from local data only');
        updateConnectionStatus('local', 'No internet connection - using local data');
    }
    
    // Fallback to local IndexedDB data
    console.log('Loading from local IndexedDB...');
    loadDataFromLocal(searchTerm);
}

// Retry connection function
window.retryConnection = async function() {
    console.log('🔄 Retrying connection...');
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.innerHTML = '<p class="loading">🔄 Mencoba koneksi ulang...</p>';
    }
    
    // Clear any cached errors
    if (window.sheetsAPI && window.sheetsAPI.clearCachedScripts) {
        window.sheetsAPI.clearCachedScripts();
    }
    
    // Retry loading data
    await loadData();
};

// Load data from Google Sheets
async function loadDataFromSheets(searchTerm = '') {
    try {
        console.log('=== LOADING FROM GOOGLE SHEETS ===');
        console.log('Search term:', searchTerm);
        console.log('Sheets API URL:', window.sheetsAPI.baseUrl);
        
        const result = await window.sheetsAPI.getAllData();
        console.log('Raw result from sheets:', result);
        
        if (result && result.success) {
            const rawData = result.data || [];
            console.log('Data received from Google Sheets:', rawData.length, 'records');
            
            if (rawData.length === 0) {
                console.log('No data found in Google Sheets');
                displayData([]);
                updateSummary([]);
                updateDataSource('sheets', 0);
                return;
            }
            
            // Log first item to see structure
            if (rawData.length > 0) {
                console.log('=== FIRST RAW ITEM FROM SHEETS ===');
                console.log('Keys:', Object.keys(rawData[0]));
                console.log('Full data:', rawData[0]);
            }
            
            // Convert sheets data to local format
            let data = rawData.map((item, index) => {
                try {
                    console.log(`Converting item ${index}:`, item);
                    const converted = window.sheetsAPI.convertSheetsToLocal(item);
                    console.log(`Converted result ${index}:`, converted);
                    return converted;
                } catch (convertError) {
                    console.warn('Error converting item', index, ':', convertError, item);
                    return null;
                }
            }).filter(item => item !== null);
            
            console.log('Converted data:', data.length, 'valid records');
            
            // Filter by search term
            if (searchTerm) {
                const originalCount = data.length;
                data = data.filter(item => 
                    (item.namaIstri && typeof item.namaIstri === 'string' && item.namaIstri.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.namaSuami && typeof item.namaSuami === 'string' && item.namaSuami.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.jenisAlkon && typeof item.jenisAlkon === 'string' && item.jenisAlkon.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                console.log('Filtered data:', data.length, 'of', originalCount, 'records match search');
            }
            
            displayData(data);
            updateSummary(data);
            
            // Save fresh data to IndexedDB to replace old data
            if (data.length > 0) {
                console.log('Saving fresh data to IndexedDB...');
                try {
                    const saveResult = await saveDataToIndexedDB(data);
                    
                    if (saveResult.success) {
                        console.log(`✅ IndexedDB save successful: ${saveResult.savedCount}/${saveResult.totalCount} items`);
                        
                        if (saveResult.errorCount > 0) {
                            console.warn(`⚠️ ${saveResult.errorCount} items had errors but process continued`);
                        }
                    } else {
                        console.warn('⚠️ IndexedDB save failed, but continuing with sheets data');
                        console.warn('Error details:', saveResult.error);
                    }
                    
                } catch (indexedDBError) {
                    console.warn('⚠️ Failed to save to IndexedDB, but continuing with sheets data:', indexedDBError);
                    
                    // Show user-friendly warning based on error type
                    if (indexedDBError.name === 'ConstraintError') {
                        console.warn('💡 IndexedDB: Duplicate key detected. Consider running fixIndexedDBIssues()');
                    } else if (indexedDBError.name === 'TransactionInactiveError') {
                        console.warn('💡 IndexedDB: Transaction timeout. Try refreshing the page');
                    } else if (indexedDBError.name === 'AbortError') {
                        console.warn('💡 IndexedDB: Transaction aborted. Database might need reset');
                    } else if (indexedDBError.name === 'QuotaExceededError') {
                        console.warn('💡 IndexedDB: Storage full. Clear browser data');
                    }
                    
                    // Don't throw error, continue with sheets data
                }
            }
            
            // Update status indicator
            updateDataSource('sheets', data.length);
            
        } else {
            const errorMsg = result ? result.error : 'No response from Google Sheets';
            console.error('Invalid response from Google Sheets:', result);
            throw new Error(errorMsg || 'Invalid response from Google Sheets');
        }
    } catch (error) {
        console.error('Error loading from Google Sheets:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

// Load data from local IndexedDB
function loadDataFromLocal(searchTerm = '') {
    console.log('=== LOADING FROM LOCAL INDEXEDDB ===');
    
    if (!db) {
        console.warn('IndexedDB not available');
        displayData([]);
        updateSummary([]);
        return;
    }
    
    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
        let data = request.result;
        console.log('Raw data from IndexedDB:', data);
        console.log('Data loaded from IndexedDB:', data.length, 'records');
        
        // Filter by search term
        if (searchTerm) {
            data = data.filter(item => 
                (item.namaIstri && typeof item.namaIstri === 'string' && item.namaIstri.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.namaSuami && typeof item.namaSuami === 'string' && item.namaSuami.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.jenisAlkon && typeof item.jenisAlkon === 'string' && item.jenisAlkon.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        displayData(data);
        updateSummary(data);
        
        // Update status indicator
        updateDataSource('local', data.length);
    };
    
    request.onerror = () => {
        console.error('Error loading from IndexedDB:', request.error);
        displayData([]);
        updateSummary([]);
    };
}

// Save data to IndexedDB (replace all data)
async function saveDataToIndexedDB(data) {
    if (!db) {
        console.warn('IndexedDB not available for saving');
        return;
    }
    
    try {
        console.log('=== SAVING DATA TO INDEXEDDB ===');
        console.log('Data count:', data.length);
        
        // Validate and fix timestamps in data before saving
        const cleanedData = data.map((item, index) => {
            const cleanedItem = { ...item };
            
            // Fix timestamp if needed
            if (cleanedItem.timestamp && window.timestampUtils) {
                if (!window.timestampUtils.validateTimestamp(cleanedItem.timestamp)) {
                    console.log(`🔧 Fixing timestamp for item ${index}:`, cleanedItem.timestamp);
                    cleanedItem.timestamp = window.timestampUtils.fixTimestamp(cleanedItem.timestamp);
                }
            }
            
            // Ensure ID is unique and valid
            if (!cleanedItem.id || cleanedItem.id === null || cleanedItem.id === undefined) {
                cleanedItem.id = Date.now() + index; // Generate unique ID
                console.log(`🔧 Generated ID for item ${index}:`, cleanedItem.id);
            }
            
            return cleanedItem;
        });
        
        console.log('Clearing old data from IndexedDB...');
        
        // Clear all existing data first with proper error handling
        await new Promise((resolve, reject) => {
            const clearTransaction = db.transaction([storeName], 'readwrite');
            
            clearTransaction.oncomplete = () => {
                console.log('✅ Clear transaction completed successfully');
                resolve();
            };
            
            clearTransaction.onerror = (event) => {
                console.error('❌ Clear transaction failed:', event.target.error);
                reject(event.target.error);
            };
            
            clearTransaction.onabort = (event) => {
                console.error('❌ Clear transaction aborted:', event.target.error);
                reject(new Error('Clear transaction aborted: ' + (event.target.error || 'Unknown reason')));
            };
            
            try {
                const clearStore = clearTransaction.objectStore(storeName);
                const clearRequest = clearStore.clear();
                
                clearRequest.onerror = (event) => {
                    console.error('❌ Clear request failed:', event.target.error);
                    reject(event.target.error);
                };
            } catch (error) {
                console.error('❌ Error creating clear request:', error);
                reject(error);
            }
        });
        
        console.log('Saving', cleanedData.length, 'cleaned items to IndexedDB...');
        
        // Save data in smaller batches to prevent transaction timeout
        const batchSize = 25; // Reduced batch size for better reliability
        let savedCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < cleanedData.length; i += batchSize) {
            const batch = cleanedData.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            
            console.log(`📦 Processing batch ${batchNumber}: ${batch.length} items`);
            
            try {
                await new Promise((resolve, reject) => {
                    const saveTransaction = db.transaction([storeName], 'readwrite');
                    let batchErrors = [];
                    let completedRequests = 0;
                    const totalRequests = batch.length;
                    
                    // Set up transaction event handlers
                    saveTransaction.oncomplete = () => {
                        const successCount = totalRequests - batchErrors.length;
                        savedCount += successCount;
                        errorCount += batchErrors.length;
                        
                        if (batchErrors.length > 0) {
                            console.warn(`⚠️ Batch ${batchNumber}: ${batchErrors.length}/${totalRequests} items failed`);
                            batchErrors.forEach(error => {
                                console.warn('  - Error:', error.error.name, error.error.message, 'Item ID:', error.item.id);
                            });
                        } else {
                            console.log(`✅ Batch ${batchNumber}: All ${totalRequests} items saved successfully`);
                        }
                        
                        resolve();
                    };
                    
                    saveTransaction.onerror = (event) => {
                        console.error(`❌ Batch ${batchNumber} transaction failed:`, event.target.error);
                        errorCount += totalRequests;
                        resolve(); // Don't reject, continue with next batch
                    };
                    
                    saveTransaction.onabort = (event) => {
                        console.error(`❌ Batch ${batchNumber} transaction aborted:`, event.target.error);
                        errorCount += totalRequests;
                        resolve(); // Don't reject, continue with next batch
                    };
                    
                    try {
                        const saveStore = saveTransaction.objectStore(storeName);
                        
                        // Process each item in the batch
                        batch.forEach((item, batchIndex) => {
                            try {
                                // Use put() instead of add() to handle existing keys
                                const request = saveStore.put(item);
                                
                                request.onsuccess = () => {
                                    completedRequests++;
                                };
                                
                                request.onerror = (event) => {
                                    completedRequests++;
                                    batchErrors.push({
                                        item: item,
                                        error: event.target.error,
                                        batchIndex: batchIndex,
                                        globalIndex: i + batchIndex
                                    });
                                };
                                
                            } catch (error) {
                                completedRequests++;
                                batchErrors.push({
                                    item: item,
                                    error: error,
                                    batchIndex: batchIndex,
                                    globalIndex: i + batchIndex
                                });
                                console.error(`❌ Error processing item ${i + batchIndex}:`, error);
                            }
                        });
                        
                    } catch (error) {
                        console.error(`❌ Error setting up batch ${batchNumber}:`, error);
                        errorCount += totalRequests;
                        resolve();
                    }
                });
                
                // Small delay between batches to prevent overwhelming the browser
                if (i + batchSize < cleanedData.length) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
            } catch (error) {
                console.error(`❌ Batch ${batchNumber} processing failed:`, error);
                errorCount += batch.length;
            }
        }
        
        console.log(`✅ IndexedDB save completed: ${savedCount}/${cleanedData.length} items saved`);
        
        if (errorCount > 0) {
            console.warn(`⚠️ ${errorCount} items failed to save to IndexedDB`);
            
            // Show user-friendly message for common errors
            if (errorCount === cleanedData.length) {
                console.error('💡 All items failed - consider resetting IndexedDB');
            } else if (errorCount < cleanedData.length * 0.1) {
                console.log('💡 Minor errors - most data saved successfully');
            } else {
                console.warn('💡 Significant errors - consider clearing browser data');
            }
        }
        
        return {
            success: true,
            savedCount: savedCount,
            errorCount: errorCount,
            totalCount: cleanedData.length
        };
        
    } catch (error) {
        console.error('❌ Critical error saving to IndexedDB:', error);
        
        // Provide specific error guidance
        if (error.name === 'ConstraintError') {
            console.error('💡 Constraint Error: Duplicate keys detected. Consider resetting IndexedDB.');
        } else if (error.name === 'TransactionInactiveError') {
            console.error('💡 Transaction Timeout: Try reducing data size or clearing IndexedDB.');
        } else if (error.name === 'AbortError') {
            console.error('💡 Transaction Aborted: Database might be corrupted. Try resetting.');
        } else if (error.name === 'QuotaExceededError') {
            console.error('💡 Storage Full: Clear browser data or reduce stored data.');
        }
        
        return {
            success: false,
            error: error,
            savedCount: 0,
            errorCount: data.length,
            totalCount: data.length
        };
    }
}

// Display data in table with pagination
function displayData(data) {
    // Store data for pagination
    allData = data;
    filteredData = data;
    
    if (data.length === 0) {
        const container = document.getElementById('dataTable');
        container.innerHTML = '<p class="no-data">Belum ada data. Klik "Input Data Baru" untuk menambah data.</p>';
        document.getElementById('paginationInfo').style.display = 'none';
        return;
    }
    
    // Reset to first page when new data is loaded
    currentPage = 1;
    
    // Display paginated data
    displayPaginatedData();
}

// Display paginated data
function displayPaginatedData() {
    console.log('displayPaginatedData called, filteredData length:', filteredData.length); // Debug log
    
    const container = document.getElementById('dataTable');
    const paginationInfo = document.getElementById('paginationInfo');
    
    if (filteredData.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada data yang sesuai dengan pencarian.</p>';
        paginationInfo.style.display = 'none';
        return;
    }
    
    // Calculate pagination
    const totalItems = filteredData.length;
    const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
    
    // Adjust current page if necessary
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }
    
    // Get data for current page
    let pageData;
    if (itemsPerPage === 'all') {
        pageData = filteredData;
    } else {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        pageData = filteredData.slice(startIndex, endIndex);
    }
    
    // Build table HTML
    let html = '<div class="table-responsive"><table><thead><tr>';
    html += '<th>No</th><th>Tanggal Pelayanan</th><th>Nama Suami</th><th>Nama Istri</th><th>NIK Istri</th><th>Jenis Alat Kontrasepsi</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';
    
    pageData.forEach((item, index) => {
        const globalIndex = itemsPerPage === 'all' ? index + 1 : ((currentPage - 1) * itemsPerPage) + index + 1;
        
        // Debug logging for date issues
        if (!item.tanggalPelayanan) {
            console.warn('Missing tanggalPelayanan for item:', item);
            console.log('Item keys:', Object.keys(item));
            console.log('Full item data:', JSON.stringify(item, null, 2));
        }
        
        html += `<tr>
            <td>${globalIndex}</td>
            <td>${formatDate(item.tanggalPelayanan)}</td>
            <td>${item.namaSuami || '-'}</td>
            <td>${item.namaIstri}</td>
            <td>${item.nikIstri || '-'}</td>
            <td><span class="badge">${item.jenisAlkon}</span></td>
            <td>
                <button onclick="editData('${item.nikIstri}')" class="btn-small btn-success">✏️</button>
                <button onclick="deleteData('${item.nikIstri}')" class="btn-small btn-danger">🗑️</button>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
    
    // Update pagination info
    updatePaginationInfo(totalItems, totalPages);
}

// Update pagination info and controls
function updatePaginationInfo(totalItems, totalPages) {
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationStatus = document.getElementById('paginationStatus');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (itemsPerPage === 'all' || totalPages <= 1) {
        paginationInfo.style.display = 'none';
        return;
    }
    
    paginationInfo.style.display = 'flex';
    
    // Update status text
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationStatus.textContent = `Menampilkan ${startItem}-${endItem} dari ${totalItems} data`;
    
    // Update navigation buttons
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    // Update page numbers
    let pageNumbersHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
        pageNumbersHTML += `<span class="page-number" onclick="goToPage(1)">1</span>`;
        if (startPage > 2) {
            pageNumbersHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    // Add visible page numbers
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pageNumbersHTML += `<span class="page-number ${activeClass}" onclick="goToPage(${i})">${i}</span>`;
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbersHTML += `<span class="page-ellipsis">...</span>`;
        }
        pageNumbersHTML += `<span class="page-number" onclick="goToPage(${totalPages})">${totalPages}</span>`;
    }
    
    pageNumbers.innerHTML = pageNumbersHTML;
}

// Change items per page
window.changeItemsPerPage = function() {
    const select = document.getElementById('itemsPerPage');
    itemsPerPage = select.value === 'all' ? 'all' : parseInt(select.value);
    currentPage = 1; // Reset to first page
    displayPaginatedData();
};

// Go to specific page
window.goToPage = function(page) {
    if (page === 'prev') {
        currentPage = Math.max(1, currentPage - 1);
    } else if (page === 'next') {
        const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(filteredData.length / itemsPerPage);
        currentPage = Math.min(totalPages, currentPage + 1);
    } else {
        currentPage = parseInt(page);
    }
    displayPaginatedData();
};

// Update summary cards
function updateSummary(data) {
    document.getElementById('totalData').textContent = data.length;
    
    const mkjpTypes = ['IUD', 'MOP', 'MOW', 'Implant'];
    const mkjpCount = data.filter(item => {
        if (!item.jenisAlkon) return false;
        // Check if jenisAlkon starts with any MKJP type (to handle compound values like "Implant (1 Batang)")
        return mkjpTypes.some(type => item.jenisAlkon.startsWith(type));
    }).length;
    const nonMkjpCount = data.length - mkjpCount;
    
    document.getElementById('totalMKJP').textContent = mkjpCount;
    document.getElementById('totalNonMKJP').textContent = nonMkjpCount;
}

// View detail
window.viewDetail = function(id) {
    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.get(id);
    
    request.onsuccess = () => {
        const data = request.result;
        let detail = `
📋 DETAIL DATA LAPORAN KB

Desa: ${data.desa}
Tanggal Pelayanan: ${formatDate(data.tanggalPelayanan)}

👨 SUAMI
Nama: ${data.namaSuami}
Umur: ${data.umurSuami || '-'}

👩 ISTRI
Nama: ${data.namaIstri}
NIK: ${data.nikIstri}
Tanggal Lahir: ${data.tanggalLahirIstri ? formatDate(data.tanggalLahirIstri) : '-'}

📍 ALAMAT
${data.alamat}
RT/RW: ${data.rt}/${data.rw}
No. HP: ${data.noHP || '-'}

💊 KONTRASEPSI
Jenis Alkon: ${data.jenisAlkon}
Kepesertaan: ${data.kepesertaanKB}
Tempat Pelayanan: ${data.tempatPelayanan}
Akseptor Pajak: ${data.akseptorPajak}
Akseptor KIE PPKBD: ${data.akseptorKIE}
        `;
        alert(detail);
    };
};

// Edit data
window.editData = function(nikIstri) {
    window.location.href = `edit.html?nik=${encodeURIComponent(nikIstri)}`;
};

// Delete data
window.deleteData = async function(nikIstri) {
    if (!confirm('Yakin ingin menghapus data ini? Data akan dihapus dari Google Sheets juga.')) return;
    
    try {
        // Delete from Google Sheets if online
        let sheetsSuccess = false;
        if (navigator.onLine) {
            try {
                const result = await window.sheetsAPI.deleteData(nikIstri);
                if (result.success) {
                    sheetsSuccess = true;
                    console.log('Data deleted from Google Sheets');
                } else {
                    console.error('Failed to delete from sheets:', result.error);
                }
            } catch (error) {
                console.error('Error deleting from sheets:', error);
            }
        }
        
        // Delete from local IndexedDB
        await deleteLocalData(nikIstri);
        
        // Show success message
        if (sheetsSuccess) {
            alert('✅ Data berhasil dihapus dari aplikasi dan Google Sheets!');
        } else {
            alert('✅ Data berhasil dihapus secara lokal. Akan dihapus dari Google Sheets saat online.');
        }
        
        // Reload data
        loadData();
        
    } catch (error) {
        console.error('Error deleting data:', error);
        alert('❌ Gagal menghapus data: ' + error.message);
    }
};

// Delete data from local IndexedDB
function deleteLocalData(nikIstri) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not available'));
            return;
        }
        
        try {
            const transaction = db.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore('laporan');
            
            // Find the record first
            let getRequest;
            
            try {
                // Try to use index if it exists
                const index = objectStore.index('nikIstri');
                getRequest = index.get(nikIstri);
                console.log('Using nikIstri index to find record for delete');
            } catch (indexError) {
                console.log('nikIstri index not found, scanning all records for delete');
                // If index doesn't exist, get all records and filter
                getRequest = objectStore.getAll();
            }
            
            getRequest.onsuccess = () => {
                let data = getRequest.result;
                
                // If we got all records, filter by NIK
                if (Array.isArray(data)) {
                    data = data.find(item => item.nikIstri === nikIstri);
                }
                
                if (data) {
                    // Delete the record using its ID
                    const deleteRequest = objectStore.delete(data.id);
                    
                    deleteRequest.onsuccess = () => {
                        console.log('Data deleted from IndexedDB');
                        resolve();
                    };
                    
                    deleteRequest.onerror = () => {
                        reject(deleteRequest.error);
                    };
                } else {
                    console.log('Data not found for delete, considering it already deleted');
                    resolve(); // Data not found, consider it deleted
                }
            };
            
            getRequest.onerror = () => {
                console.error('Error finding record for delete:', getRequest.error);
                reject(getRequest.error);
            };
            
        } catch (error) {
            console.error('Transaction error in deleteLocalData:', error);
            reject(error);
        }
    });
}

// Export data to CSV
window.exportData = function() {
    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
        const data = request.result;
        
        if (data.length === 0) {
            alert('Tidak ada data untuk di-export');
            return;
        }
        
        let csv = 'No,Tanggal Pelayanan,Desa,Nama Suami,Umur Suami,Nama Istri,NIK Istri,Tanggal Lahir,Alamat,RT,RW,No HP,Jenis Alkon,Kepesertaan KB,Tempat Pelayanan,Akseptor Pajak,Akseptor KIE\n';
        
        data.forEach((item, index) => {
            csv += `${index + 1},"${item.tanggalPelayanan}","${item.desa}","${item.namaSuami}","${item.umurSuami || ''}","${item.namaIstri}","${item.nikIstri}","${item.tanggalLahirIstri || ''}","${item.alamat}","${item.rt}","${item.rw}","${item.noHP || ''}","${item.jenisAlkon}","${item.kepesertaanKB}","${item.tempatPelayanan}","${item.akseptorPajak}","${item.akseptorKIE}"\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-kb-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        alert('✅ Data berhasil di-export!');
    };
};

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            
            console.log('Search term:', searchTerm); // Debug log
            console.log('All data length:', allData.length); // Debug log
            
            // Check if data is loaded
            if (allData.length === 0) {
                console.warn('No data loaded yet, search will not work');
                return;
            }
            
            if (searchTerm === '') {
                filteredData = allData;
            } else {
                filteredData = allData.filter(item => 
                    (item.namaIstri && typeof item.namaIstri === 'string' && item.namaIstri.toLowerCase().includes(searchTerm)) ||
                    (item.namaSuami && typeof item.namaSuami === 'string' && item.namaSuami.toLowerCase().includes(searchTerm)) ||
                    (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm)) ||
                    (item.jenisAlkon && typeof item.jenisAlkon === 'string' && item.jenisAlkon.toLowerCase().includes(searchTerm))
                );
            }
            
            console.log('Filtered data length:', filteredData.length); // Debug log
            currentPage = 1; // Reset to first page when searching
            displayPaginatedData();
        });
    } else {
        console.error('Search input element not found');
    }
});

// Format date
function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date:', dateString);
            return '-';
        }
        return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return '-';
    }
}

// PWA Install prompt handlers
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.style.display = 'inline-block';
    }
});

// Install button click handler (jika ada di halaman)
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                const { outcome } = await window.deferredPrompt.userChoice;
                console.log(`User response: ${outcome}`);
                window.deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });
    }
});

// Update data source indicator
function updateDataSource(source, count) {
    const dataSourceElement = document.getElementById('dataSource');
    if (dataSourceElement) {
        if (source === 'sheets') {
            dataSourceElement.innerHTML = `☁️ Google Sheets (${count} data)`;
            dataSourceElement.className = 'data-source online';
            updateConnectionStatus('connected', 'Connected to Google Sheets');
        } else {
            dataSourceElement.innerHTML = `📱 Data Lokal (${count} data)`;
            dataSourceElement.className = 'data-source local';
            updateConnectionStatus('local', 'Using local data');
        }
    }
    
    // Debug: Log sample data to console
    if (allData.length > 0) {
        console.log('Sample data item:', allData[0]);
        console.log('All data keys:', Object.keys(allData[0]));
    }
}

// Update connection status indicator
function updateConnectionStatus(status, message) {
    const indicator = document.getElementById('connectionIndicator');
    const text = document.getElementById('connectionText');
    
    if (indicator && text) {
        switch (status) {
            case 'connected':
                indicator.textContent = '🟢';
                text.textContent = 'Online';
                break;
            case 'local':
                indicator.textContent = '🟡';
                text.textContent = 'Offline';
                break;
            case 'error':
                indicator.textContent = '🔴';
                text.textContent = 'Error';
                break;
            case 'checking':
                indicator.textContent = '🔄';
                text.textContent = 'Checking...';
                break;
            default:
                indicator.textContent = '❓';
                text.textContent = 'Unknown';
        }
        
        // Set title for tooltip
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            statusElement.title = message || text.textContent;
        }
    }
}

// Refresh data
window.refreshData = async function() {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.innerHTML;
    
    try {
        refreshBtn.innerHTML = '⏳ Loading...';
        refreshBtn.disabled = true;
        
        // Clear search
        document.getElementById('searchInput').value = '';
        
        // Force reload from Google Sheets (bypass cache and local data)
        console.log('=== FORCE REFRESH FROM GOOGLE SHEETS ===');
        console.log('🔍 DEBUG: Current SheetsAPI URL:', window.sheetsAPI ? window.sheetsAPI.baseUrl : 'SheetsAPI not initialized');
        console.log('🔍 DEBUG: CONFIG URL:', typeof CONFIG !== 'undefined' ? CONFIG.GOOGLE_SCRIPT_URL : 'CONFIG not found');
        console.log('🔍 DEBUG: localStorage URL:', localStorage.getItem('googleScriptUrl'));
        
        // Reinitialize SheetsAPI to ensure we use the latest config
        if (window.SheetsAPI) {
            console.log('🔧 Reinitializing SheetsAPI to ensure latest config...');
            window.sheetsAPI = new SheetsAPI();
            console.log('✅ SheetsAPI reinitialized with URL:', window.sheetsAPI.baseUrl);
        }
        
        if (!navigator.onLine) {
            throw new Error('Tidak ada koneksi internet untuk refresh dari Google Sheets');
        }
        
        // Force load from sheets with connection recovery
        await loadDataFromSheetsWithRecovery();
        
        console.log('Data refreshed successfully from Google Sheets');
        alert('✅ Data berhasil di-refresh dari Google Sheets!');
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        
        // Show user-friendly error with recovery options
        const errorMessage = error.message || 'Unknown error occurred';
        
        if (errorMessage.includes('script load error') || errorMessage.includes('JSONP')) {
            // Show connection recovery dialog
            const userChoice = confirm(
                `❌ Koneksi ke Google Sheets gagal.\n\n` +
                `Error: ${errorMessage}\n\n` +
                `Klik OK untuk mencoba perbaikan otomatis, atau Cancel untuk menggunakan data lokal.`
            );
            
            if (userChoice) {
                try {
                    refreshBtn.innerHTML = '🔧 Recovering...';
                    await attemptConnectionRecovery();
                    
                    // Try again after recovery
                    refreshBtn.innerHTML = '⏳ Retrying...';
                    await loadDataFromSheets();
                    
                    alert('✅ Koneksi berhasil dipulihkan dan data di-refresh!');
                } catch (recoveryError) {
                    console.error('Recovery failed:', recoveryError);
                    alert(`❌ Perbaikan gagal: ${recoveryError.message}\n\nMenggunakan data lokal...`);
                    loadDataFromLocal();
                }
            } else {
                loadDataFromLocal();
            }
        } else {
            alert('❌ Gagal refresh data: ' + errorMessage);
            // Fallback to local data
            console.log('Falling back to local data...');
            loadDataFromLocal();
        }
        
    } finally {
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
    }
};

/**
 * Load data from sheets with automatic connection recovery
 */
async function loadDataFromSheetsWithRecovery() {
    try {
        await loadDataFromSheets();
    } catch (error) {
        console.log('Initial load failed, attempting recovery...');
        
        if (error.message.includes('script load error') || error.message.includes('JSONP')) {
            // Attempt automatic recovery
            await attemptConnectionRecovery();
            
            // Retry after recovery
            await loadDataFromSheets();
        } else {
            throw error;
        }
    }
}

/**
 * Attempt connection recovery using the ConnectionRecovery tool
 */
async function attemptConnectionRecovery() {
    if (!window.ConnectionRecovery || !window.sheetsAPI) {
        throw new Error('Connection recovery tools not available');
    }
    
    console.log('🔧 Starting connection recovery process...');
    
    const recovery = new ConnectionRecovery(window.sheetsAPI);
    const result = await recovery.diagnoseAndRecover();
    
    if (!result.success) {
        console.error('Connection recovery failed:', result);
        
        // Generate detailed error report
        const report = recovery.generateErrorReport();
        console.error('Detailed error report:', report);
        
        // Show recommendations to user
        if (result.recommendations && result.recommendations.length > 0) {
            const highPriorityRecs = result.recommendations
                .filter(rec => rec.priority === 'HIGH')
                .map(rec => `• ${rec.issue}: ${rec.solutions[0]}`)
                .join('\n');
            
            if (highPriorityRecs) {
                throw new Error(`Connection recovery failed.\n\nRecommended actions:\n${highPriorityRecs}`);
            }
        }
        
        throw new Error(result.error || 'Connection recovery failed');
    }
    
    console.log('✅ Connection recovery successful:', result.message);
    return result;
}

// Debug functions for testing (console only)
window.testGoogleConnection = async function() {
    console.log('🔄 Testing Google connection...');
    
    try {
        // Test service worker first
        let swStatus = '❓ Unknown';
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                if (registration.active) {
                    swStatus = '✅ Active';
                } else if (registration.installing) {
                    swStatus = '🔄 Installing';
                } else if (registration.waiting) {
                    swStatus = '⏳ Waiting';
                } else {
                    swStatus = '❌ Not Active';
                }
            } else {
                swStatus = '❌ Not Registered';
            }
        } else {
            swStatus = '❌ Not Supported';
        }
        
        // Test Google connection
        const result = await window.sheetsAPI.testConnectionJSONP();
        
        if (result.success) {
            console.log('✅ Google Connection successful!');
            console.log('Service Worker:', swStatus);
            console.log('Google Apps Script: Responding correctly');
            alert('✅ Connection test successful!');
        } else {
            console.error('❌ Google Connection failed:', result.error);
            console.log('Service Worker:', swStatus);
            alert('❌ Connection test failed: ' + result.error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        alert('❌ Test failed: ' + error.message);
    }
};

window.clearAllCache = function() {
    // Clear localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.includes('sheets') || key.includes('cache') || key.includes('data')) {
            localStorage.removeItem(key);
        }
    });
    
    // Clear IndexedDB
    if (db) {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        objectStore.clear();
    }
    
    alert('✅ Cache cleared! Refreshing page...');
    setTimeout(() => window.location.reload(), 1000);
};

// Online/Offline status
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (navigator.onLine) {
        statusElement.textContent = '🟢 Online';
        if (refreshBtn) refreshBtn.style.display = 'inline-block';
        
        // Auto refresh data when coming online
        setTimeout(() => {
            loadData();
        }, 1000);
    } else {
        statusElement.textContent = '🔴 Offline';
        if (refreshBtn) refreshBtn.style.display = 'inline-block'; // Still show refresh for local data
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// Utility function to show all available columns
window.showAllColumns = async function() {
    try {
        const result = await window.sheetsAPI.getAllData();
        
        if (result && result.success && result.data && result.data.length > 0) {
            const firstRecord = result.data[0];
            const keys = Object.keys(firstRecord);
            
            let message = `SEMUA KOLOM DI GOOGLE SHEETS (${keys.length} kolom):\n\n`;
            
            keys.forEach((key, index) => {
                const value = firstRecord[key];
                const preview = String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '');
                message += `${index + 1}. "${key}"\n   Contoh: "${preview}"\n\n`;
            });
            
            // Show in console for easy copying
            console.log('=== ALL COLUMNS ===');
            console.log(message);
            
            // Show in alert (might be truncated)
            alert(message);
            
        } else {
            alert('❌ Tidak bisa mengambil data dari Google Sheets');
        }
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
};

// ===== FUNGSI PERBAIKAN INDEXEDDB =====

/**
 * Bersihkan dan reset IndexedDB jika terjadi masalah
 */
async function resetIndexedDB() {
    console.log('🔄 Resetting IndexedDB...');
    
    try {
        if (db) {
            db.close();
        }
        
        // Delete the database
        await new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            
            deleteRequest.onsuccess = () => {
                console.log('✅ IndexedDB deleted successfully');
                resolve();
            };
            
            deleteRequest.onerror = () => {
                console.error('❌ Failed to delete IndexedDB:', deleteRequest.error);
                reject(deleteRequest.error);
            };
            
            deleteRequest.onblocked = () => {
                console.warn('⚠️ IndexedDB deletion blocked, close all tabs and try again');
                reject(new Error('Database deletion blocked'));
            };
        });
        
        // Reinitialize the database
        db = null;
        await initializeDatabase();
        
        console.log('✅ IndexedDB reset completed');
        return true;
        
    } catch (error) {
        console.error('❌ Error resetting IndexedDB:', error);
        return false;
    }
}

/**
 * Diagnosa masalah IndexedDB
 */
async function diagnoseIndexedDB() {
    console.log('🔍 === DIAGNOSA INDEXEDDB ===');
    
    let report = '🔍 LAPORAN DIAGNOSA INDEXEDDB\n\n';
    
    // 1. Check IndexedDB support
    report += '1️⃣ DUKUNGAN BROWSER:\n';
    if ('indexedDB' in window) {
        report += '✅ IndexedDB didukung browser\n';
    } else {
        report += '❌ IndexedDB tidak didukung browser\n';
        alert(report);
        return;
    }
    
    // 2. Check database connection
    report += '\n2️⃣ KONEKSI DATABASE:\n';
    if (db) {
        report += '✅ Database terhubung\n';
        report += 'Nama: ' + db.name + '\n';
        report += 'Versi: ' + db.version + '\n';
    } else {
        report += '❌ Database tidak terhubung\n';
    }
    
    // 3. Check object store
    if (db) {
        report += '\n3️⃣ OBJECT STORE:\n';
        try {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            report += '✅ Object store tersedia: ' + storeName + '\n';
            report += 'Key path: ' + (store.keyPath || 'auto-increment') + '\n';
            
            // Count records
            const countRequest = store.count();
            await new Promise((resolve, reject) => {
                countRequest.onsuccess = () => {
                    report += 'Jumlah record: ' + countRequest.result + '\n';
                    resolve();
                };
                countRequest.onerror = () => {
                    report += '❌ Error counting records: ' + countRequest.error + '\n';
                    resolve();
                };
            });
            
        } catch (error) {
            report += '❌ Error accessing object store: ' + error.message + '\n';
        }
    }
    
    // 4. Test write operation
    if (db) {
        report += '\n4️⃣ TEST OPERASI TULIS:\n';
        try {
            const testData = {
                id: 'test_' + Date.now(),
                timestamp: new Date().toISOString(),
                test: true
            };
            
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            await new Promise((resolve, reject) => {
                const request = store.put(testData);
                
                request.onsuccess = () => {
                    report += '✅ Test write berhasil\n';
                    
                    // Clean up test data
                    const deleteRequest = store.delete(testData.id);
                    deleteRequest.onsuccess = () => resolve();
                    deleteRequest.onerror = () => resolve();
                };
                
                request.onerror = () => {
                    report += '❌ Test write gagal: ' + request.error + '\n';
                    resolve();
                };
            });
            
        } catch (error) {
            report += '❌ Error test write: ' + error.message + '\n';
        }
    }
    
    // 5. Storage quota info
    report += '\n5️⃣ STORAGE INFO:\n';
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
            const estimate = await navigator.storage.estimate();
            const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
            const quotaMB = (estimate.quota / 1024 / 1024).toFixed(2);
            
            report += 'Storage used: ' + usedMB + 'MB\n';
            report += 'Storage quota: ' + quotaMB + 'MB\n';
            report += 'Usage: ' + ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%\n';
        } catch (error) {
            report += '❌ Error getting storage info: ' + error.message + '\n';
        }
    } else {
        report += '⚠️ Storage API tidak tersedia\n';
    }
    
    // 6. Recommendations
    report += '\n💡 REKOMENDASI:\n';
    
    if (!db) {
        report += '• Refresh halaman untuk reinisialisasi database\n';
        report += '• Periksa apakah browser mendukung IndexedDB\n';
    }
    
    report += '• Tutup tab lain yang menggunakan aplikasi ini\n';
    report += '• Clear browser cache jika masalah berlanjut\n';
    report += '• Gunakan browser terbaru untuk kompatibilitas optimal\n';
    
    console.log(report);
    alert(report);
    
    return report;
}

/**
 * Perbaiki masalah IndexedDB secara otomatis
 */
async function fixIndexedDBIssues() {
    console.log('🔧 Attempting to fix IndexedDB issues...');
    
    try {
        // Step 1: Diagnose current state
        console.log('Step 1: Diagnosing current state...');
        await diagnoseIndexedDB();
        
        // Step 2: Try to reset database
        console.log('Step 2: Resetting database...');
        const resetSuccess = await resetIndexedDB();
        
        if (resetSuccess) {
            console.log('✅ IndexedDB issues fixed successfully');
            alert('✅ Masalah IndexedDB berhasil diperbaiki!\n\nSilakan refresh halaman untuk memuat data terbaru.');
            return true;
        } else {
            console.log('❌ Failed to fix IndexedDB issues');
            alert('❌ Gagal memperbaiki masalah IndexedDB.\n\nSilakan:\n• Refresh halaman\n• Clear browser cache\n• Coba browser lain');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error fixing IndexedDB:', error);
        alert('❌ Error saat memperbaiki IndexedDB: ' + error.message);
        return false;
    }
}

// Expose functions to global scope for debugging
window.resetIndexedDB = resetIndexedDB;
window.diagnoseIndexedDB = diagnoseIndexedDB;
window.fixIndexedDBIssues = fixIndexedDBIssues;
// ===== QUICK FIX FUNCTIONS FOR USERS =====

/**
 * Quick fix untuk masalah IndexedDB yang sering terjadi
 */
window.quickFixIndexedDB = async function() {
    console.log('🔧 === QUICK FIX INDEXEDDB ===');
    
    try {
        // Step 1: Reset IndexedDB
        console.log('Step 1: Resetting IndexedDB...');
        const resetSuccess = await resetIndexedDB();
        
        if (!resetSuccess) {
            throw new Error('Failed to reset IndexedDB');
        }
        
        // Step 2: Reload data from sheets
        console.log('Step 2: Reloading data from Google Sheets...');
        await loadDataFromSheets();
        
        console.log('✅ Quick fix completed successfully!');
        alert('✅ Masalah IndexedDB berhasil diperbaiki!\n\nData telah dimuat ulang dari Google Sheets.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Quick fix failed:', error);
        alert('❌ Quick fix gagal: ' + error.message + '\n\nSilakan refresh halaman atau clear browser cache.');
        return false;
    }
};

/**
 * Fix timestamp untuk data yang sudah ada
 */
window.fixExistingTimestamps = function() {
    console.log('🔧 === FIXING EXISTING TIMESTAMPS ===');
    
    if (!window.allData || window.allData.length === 0) {
        console.log('No data to fix');
        return;
    }
    
    let fixedCount = 0;
    
    window.allData.forEach((item, index) => {
        if (item.timestamp && window.timestampUtils) {
            if (!window.timestampUtils.validateTimestamp(item.timestamp)) {
                const oldTimestamp = item.timestamp;
                item.timestamp = window.timestampUtils.fixTimestamp(item.timestamp);
                console.log(`Fixed item ${index}: ${oldTimestamp} → ${item.timestamp}`);
                fixedCount++;
            }
        }
    });
    
    console.log(`✅ Fixed ${fixedCount} timestamps`);
    
    if (fixedCount > 0) {
        // Re-display data with fixed timestamps
        displayData(window.allData);
        updateSummary(window.allData);
        
        alert(`✅ Berhasil memperbaiki ${fixedCount} timestamp yang salah.\n\nData sekarang menggunakan tanggal yang benar.`);
    } else {
        alert('✅ Semua timestamp sudah benar, tidak ada yang perlu diperbaiki.');
    }
};

/**
 * Emergency reset - clear everything and start fresh
 */
window.emergencyReset = async function() {
    const confirm = window.confirm(
        '⚠️ EMERGENCY RESET\n\n' +
        'Ini akan:\n' +
        '• Hapus semua data lokal (IndexedDB)\n' +
        '• Clear cache aplikasi\n' +
        '• Muat ulang data dari Google Sheets\n\n' +
        'Data di Google Sheets tidak akan terpengaruh.\n\n' +
        'Lanjutkan?'
    );
    
    if (!confirm) {
        return false;
    }
    
    try {
        console.log('🚨 === EMERGENCY RESET ===');
        
        // Clear IndexedDB
        if (db) {
            db.close();
        }
        
        await new Promise((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
            deleteRequest.onblocked = () => {
                alert('⚠️ Reset diblokir. Tutup semua tab aplikasi ini dan coba lagi.');
                reject(new Error('Database deletion blocked'));
            };
        });
        
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        console.log('✅ Emergency reset completed');
        alert('✅ Emergency reset berhasil!\n\nHalaman akan dimuat ulang...');
        
        // Reload page
        window.location.reload();
        
        return true;
        
    } catch (error) {
        console.error('❌ Emergency reset failed:', error);
        alert('❌ Emergency reset gagal: ' + error.message + '\n\nCoba tutup semua tab dan buka aplikasi lagi.');
        return false;
    }
};

// Add quick access buttons in debug mode
document.addEventListener('DOMContentLoaded', function() {
    // Check if in debug mode or if there are persistent errors
    const hasIndexedDBErrors = localStorage.getItem('indexeddb_errors') === 'true';
    const isDebugMode = window.location.search.includes('debug=true') || hasIndexedDBErrors;
    
    if (isDebugMode) {
        console.log('🔧 Adding quick fix buttons...');
        
        const quickFixPanel = document.createElement('div');
        quickFixPanel.innerHTML = `
            <div style="position: fixed; bottom: 10px; right: 10px; background: #fff; border: 2px solid #ff6b6b; border-radius: 8px; padding: 15px; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); max-width: 250px;">
                <h4 style="margin: 0 0 10px 0; color: #ff6b6b; font-size: 14px;">🔧 Quick Fix Tools</h4>
                <button onclick="quickFixIndexedDB()" style="width: 100%; margin: 3px 0; padding: 8px; font-size: 11px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔄 Fix IndexedDB
                </button>
                <button onclick="fixExistingTimestamps()" style="width: 100%; margin: 3px 0; padding: 8px; font-size: 11px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🕐 Fix Timestamps
                </button>
                <button onclick="diagnoseIndexedDB()" style="width: 100%; margin: 3px 0; padding: 8px; font-size: 11px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🔍 Diagnose
                </button>
                <button onclick="emergencyReset()" style="width: 100%; margin: 3px 0; padding: 8px; font-size: 11px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    🚨 Emergency Reset
                </button>
                <button onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin: 3px 0; padding: 5px; font-size: 10px; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    ✕ Close
                </button>
            </div>
        `;
        document.body.appendChild(quickFixPanel);
    }
    
    // Monitor for IndexedDB errors and show quick fix if needed
    let errorCount = 0;
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        if (message.includes('IndexedDB') || message.includes('ConstraintError') || message.includes('TransactionInactiveError')) {
            errorCount++;
            if (errorCount >= 3) {
                localStorage.setItem('indexeddb_errors', 'true');
                console.log('💡 Multiple IndexedDB errors detected. Use quickFixIndexedDB() to resolve.');
            }
        }
        originalConsoleError.apply(console, args);
    };
});