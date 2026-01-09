/**
 * Performance Fix for Data Loading
 * Created: 9 Jan 2025
 * 
 * Optimizes data loading performance and fixes slow loading issues
 */

console.log('🚀 Loading performance-fix.js...');

// Performance optimization settings
const PERFORMANCE_CONFIG = {
    // Timeout settings
    SHEETS_TIMEOUT: 8000,        // 8 seconds for Google Sheets
    JSONP_TIMEOUT: 6000,         // 6 seconds for JSONP requests
    RETRY_DELAY: 2000,           // 2 seconds between retries
    
    // Batch processing
    BATCH_SIZE: 100,             // Process data in batches of 100
    BATCH_DELAY: 10,             // 10ms delay between batches
    
    // Cache settings
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes cache
    
    // UI update throttling
    UI_UPDATE_THROTTLE: 100      // 100ms throttle for UI updates
};

// Performance monitoring
const performanceMonitor = {
    startTime: null,
    loadingSteps: [],
    
    start(step) {
        this.startTime = performance.now();
        this.loadingSteps = [];
        this.addStep(step || 'Loading started');
    },
    
    addStep(step) {
        const now = performance.now();
        const elapsed = this.startTime ? now - this.startTime : 0;
        this.loadingSteps.push({
            step,
            timestamp: now,
            elapsed: Math.round(elapsed)
        });
        console.log(`⏱️ ${step}: ${Math.round(elapsed)}ms`);
    },
    
    end(step) {
        this.addStep(step || 'Loading completed');
        const totalTime = this.loadingSteps[this.loadingSteps.length - 1].elapsed;
        console.log(`🏁 Total loading time: ${totalTime}ms`);
        return totalTime;
    },
    
    getReport() {
        return {
            totalTime: this.loadingSteps[this.loadingSteps.length - 1]?.elapsed || 0,
            steps: this.loadingSteps
        };
    }
};

// Optimized data processing with batching
function processDataInBatches(data, processor, batchSize = PERFORMANCE_CONFIG.BATCH_SIZE) {
    return new Promise((resolve) => {
        const results = [];
        let currentIndex = 0;
        
        function processBatch() {
            const batch = data.slice(currentIndex, currentIndex + batchSize);
            
            if (batch.length === 0) {
                resolve(results);
                return;
            }
            
            // Process current batch
            const batchResults = batch.map(processor).filter(item => item !== null);
            results.push(...batchResults);
            
            currentIndex += batchSize;
            
            // Schedule next batch with small delay to prevent blocking
            if (currentIndex < data.length) {
                setTimeout(processBatch, PERFORMANCE_CONFIG.BATCH_DELAY);
            } else {
                resolve(results);
            }
        }
        
        processBatch();
    });
}

// Throttled UI update function
const throttledUIUpdate = (() => {
    let timeout = null;
    let lastUpdate = 0;
    
    return function(updateFunction) {
        const now = Date.now();
        
        if (now - lastUpdate >= PERFORMANCE_CONFIG.UI_UPDATE_THROTTLE) {
            updateFunction();
            lastUpdate = now;
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                updateFunction();
                lastUpdate = Date.now();
            }, PERFORMANCE_CONFIG.UI_UPDATE_THROTTLE);
        }
    };
})();

// Enhanced loadData function with performance optimizations
const originalLoadDataFunction = window.loadData;

window.loadData = async function(searchTerm = '') {
    console.log('🚀 === PERFORMANCE OPTIMIZED LOAD DATA ===');
    performanceMonitor.start('Data loading started');
    
    // Show loading immediately
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.innerHTML = '<div class="loading-container"><p class="loading">⏳ Memuat data...</p><div class="loading-progress"><div class="progress-bar"></div></div></div>';
    }
    
    try {
        // Update connection status
        updateConnectionStatus('checking', 'Checking connection...');
        performanceMonitor.addStep('Connection status updated');
        
        // Clear old data immediately
        window.allData = [];
        window.filteredData = [];
        performanceMonitor.addStep('Old data cleared');
        
        // Check online status with timeout
        const isOnline = navigator.onLine;
        performanceMonitor.addStep(`Online status checked: ${isOnline}`);
        
        if (isOnline) {
            try {
                // Try Google Sheets with timeout
                console.log('🌐 Attempting Google Sheets connection...');
                updateConnectionStatus('checking', 'Connecting to Google Sheets...');
                
                const sheetsPromise = loadDataFromSheetsOptimized(searchTerm);
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Google Sheets timeout')), PERFORMANCE_CONFIG.SHEETS_TIMEOUT);
                });
                
                await Promise.race([sheetsPromise, timeoutPromise]);
                performanceMonitor.end('Google Sheets loading completed');
                return;
                
            } catch (error) {
                console.warn('⚠️ Google Sheets failed, falling back to local:', error.message);
                performanceMonitor.addStep(`Google Sheets failed: ${error.message}`);
                
                updateConnectionStatus('error', 'Google Sheets gagal, menggunakan data lokal');
                
                // Show fallback message briefly
                if (dataTable) {
                    dataTable.innerHTML = `
                        <div class="fallback-container">
                            <p class="warning">⚠️ Tidak dapat terhubung ke Google Sheets</p>
                            <p class="info">Menggunakan data lokal...</p>
                            <div class="loading-progress"><div class="progress-bar"></div></div>
                        </div>
                    `;
                }
                
                // Wait a moment then load local data
                setTimeout(() => {
                    loadDataFromLocalOptimized(searchTerm);
                }, 1500);
                return;
            }
        } else {
            console.log('📱 Offline mode - loading local data');
            updateConnectionStatus('offline', 'Offline - menggunakan data lokal');
            performanceMonitor.addStep('Offline mode detected');
        }
        
        // Load from local storage
        await loadDataFromLocalOptimized(searchTerm);
        performanceMonitor.end('Local data loading completed');
        
    } catch (error) {
        console.error('❌ Critical error in loadData:', error);
        performanceMonitor.addStep(`Critical error: ${error.message}`);
        
        updateConnectionStatus('error', 'Error loading data');
        
        if (dataTable) {
            dataTable.innerHTML = `
                <div class="error-container">
                    <p class="error">❌ Gagal memuat data</p>
                    <p class="error-detail">${error.message}</p>
                    <button onclick="retryConnection()" class="btn-primary">🔄 Coba Lagi</button>
                </div>
            `;
        }
        
        performanceMonitor.end('Loading failed');
    }
};

// Optimized Google Sheets loading
async function loadDataFromSheetsOptimized(searchTerm = '') {
    console.log('🌐 === OPTIMIZED GOOGLE SHEETS LOADING ===');
    performanceMonitor.addStep('Starting Google Sheets request');
    
    try {
        // Check if sheetsAPI is available
        if (!window.sheetsAPI) {
            throw new Error('Google Sheets API not available');
        }
        
        // Make the request with timeout
        const result = await window.sheetsAPI.getAllData();
        performanceMonitor.addStep('Google Sheets response received');
        
        if (!result || !result.success) {
            throw new Error(result?.error || 'Invalid response from Google Sheets');
        }
        
        const rawData = result.data || [];
        console.log(`📊 Received ${rawData.length} records from Google Sheets`);
        performanceMonitor.addStep(`Raw data received: ${rawData.length} records`);
        
        if (rawData.length === 0) {
            console.log('📭 No data in Google Sheets');
            displayDataOptimized([]);
            updateSummary([]);
            updateDataSource('sheets', 0);
            updateConnectionStatus('online', 'Google Sheets connected - no data');
            return;
        }
        
        // Process data in batches for better performance
        console.log('🔄 Processing data in batches...');
        updateConnectionStatus('checking', 'Processing data...');
        
        const processedData = await processDataInBatches(rawData, (item, index) => {
            try {
                return convertSheetsToLocalOptimized(item);
            } catch (error) {
                console.warn(`Error processing item ${index}:`, error);
                return null;
            }
        });
        
        performanceMonitor.addStep(`Data processed: ${processedData.length} valid records`);
        
        // Filter out empty records
        const validData = processedData.filter(item => {
            const hasName = item.namaIstri && item.namaIstri.trim() !== '' && item.namaIstri !== '-';
            const hasNIK = item.nikIstri && item.nikIstri.trim() !== '' && item.nikIstri !== '-';
            const hasAlkon = item.jenisAlkon && item.jenisAlkon.trim() !== '' && item.jenisAlkon !== '-';
            return (hasName || hasNIK) && hasAlkon;
        });
        
        console.log(`✅ Filtered to ${validData.length} valid records`);
        performanceMonitor.addStep(`Data filtered: ${validData.length} valid records`);
        
        // Apply search filter if provided
        let finalData = validData;
        if (searchTerm) {
            finalData = validData.filter(item => 
                (item.namaIstri && item.namaIstri.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.namaSuami && item.namaSuami.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.jenisAlkon && item.jenisAlkon.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            performanceMonitor.addStep(`Search applied: ${finalData.length} matching records`);
        }
        
        // Display data with throttled updates
        await displayDataOptimized(finalData);
        updateSummary(finalData);
        updateDataSource('sheets', finalData.length);
        updateConnectionStatus('online', `Google Sheets - ${finalData.length} data`);
        
        // Save to IndexedDB in background (non-blocking)
        if (validData.length > 0) {
            setTimeout(() => {
                saveDataToIndexedDBOptimized(validData);
            }, 100);
        }
        
        performanceMonitor.addStep('Display completed');
        
    } catch (error) {
        console.error('❌ Optimized Google Sheets loading failed:', error);
        throw error;
    }
}

// Optimized local data loading
async function loadDataFromLocalOptimized(searchTerm = '') {
    console.log('📱 === OPTIMIZED LOCAL DATA LOADING ===');
    performanceMonitor.addStep('Starting local data loading');
    
    try {
        let data = [];
        
        // Try IndexedDB first
        if (db) {
            try {
                data = await new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], 'readonly');
                    const objectStore = transaction.objectStore(storeName);
                    const request = objectStore.getAll();
                    
                    request.onsuccess = () => resolve(request.result || []);
                    request.onerror = () => reject(request.error);
                });
                
                console.log(`📊 Loaded ${data.length} records from IndexedDB`);
                performanceMonitor.addStep(`IndexedDB data loaded: ${data.length} records`);
                
            } catch (error) {
                console.warn('IndexedDB failed, trying localStorage:', error);
                data = [];
            }
        }
        
        // Fallback to localStorage
        if (data.length === 0) {
            try {
                data = JSON.parse(localStorage.getItem('laporanData') || '[]');
                console.log(`📦 Loaded ${data.length} records from localStorage`);
                performanceMonitor.addStep(`localStorage data loaded: ${data.length} records`);
            } catch (error) {
                console.error('localStorage failed:', error);
                data = [];
            }
        }
        
        // Filter valid data
        const validData = data.filter(item => {
            const hasName = item.namaIstri && item.namaIstri.trim() !== '' && item.namaIstri !== '-';
            const hasNIK = item.nikIstri && item.nikIstri.trim() !== '' && item.nikIstri !== '-';
            const hasAlkon = item.jenisAlkon && item.jenisAlkon.trim() !== '' && item.jenisAlkon !== '-';
            return (hasName || hasNIK) && hasAlkon;
        });
        
        performanceMonitor.addStep(`Data filtered: ${validData.length} valid records`);
        
        // Apply search filter
        let finalData = validData;
        if (searchTerm) {
            finalData = validData.filter(item => 
                (item.namaIstri && item.namaIstri.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.namaSuami && item.namaSuami.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.jenisAlkon && item.jenisAlkon.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            performanceMonitor.addStep(`Search applied: ${finalData.length} matching records`);
        }
        
        // Display data
        await displayDataOptimized(finalData);
        updateSummary(finalData);
        updateDataSource('local', finalData.length);
        updateConnectionStatus('local', `Data lokal - ${finalData.length} data`);
        
        performanceMonitor.addStep('Local display completed');
        
    } catch (error) {
        console.error('❌ Optimized local loading failed:', error);
        throw error;
    }
}

// Optimized data conversion
function convertSheetsToLocalOptimized(sheetsItem) {
    // Use the existing conversion function but with error handling
    if (typeof window.convertSheetsToLocalFixed === 'function') {
        return window.convertSheetsToLocalFixed(sheetsItem);
    }
    
    // Fallback basic conversion
    return {
        id: sheetsItem.rowNumber || Date.now() + Math.random(),
        timestamp: new Date().toLocaleString('id-ID'),
        namaIstri: sheetsItem['Nama Istri'] || sheetsItem.namaIstri || '',
        nikIstri: sheetsItem['NIK Istri'] || sheetsItem.nikIstri || '',
        jenisAlkon: sheetsItem['Jenis Alkon MKJP & NON MKJP'] || sheetsItem.jenisAlkon || '',
        tanggalPelayanan: sheetsItem['Tanggal Pelayanan'] || sheetsItem.tanggalPelayanan || '',
        namaSuami: sheetsItem['Nama Suami'] || sheetsItem.namaSuami || '',
        alamat: sheetsItem['Alamat'] || sheetsItem.alamat || ''
    };
}

// Optimized display function
async function displayDataOptimized(data) {
    console.log('🖥️ === OPTIMIZED DATA DISPLAY ===');
    
    // Store data globally
    window.allData = data;
    window.filteredData = data;
    
    const container = document.getElementById('dataTable');
    if (!container) {
        console.error('Data table container not found');
        return;
    }
    
    if (data.length === 0) {
        container.innerHTML = '<p class="no-data">Belum ada data. Klik "Input Data Baru" untuk menambah data.</p>';
        document.getElementById('paginationInfo').style.display = 'none';
        return;
    }
    
    // Reset pagination
    currentPage = 1;
    
    // Use throttled update for better performance
    throttledUIUpdate(() => {
        if (typeof window.displayPaginatedDataFixed === 'function') {
            window.displayPaginatedDataFixed();
        } else if (typeof window.displayPaginatedData === 'function') {
            window.displayPaginatedData();
        } else {
            // Fallback display
            displayDataFallback(data);
        }
    });
}

// Fallback display function
function displayDataFallback(data) {
    const container = document.getElementById('dataTable');
    const displayData = data.slice(0, 50); // Limit to first 50 for performance
    
    let html = '<div class="table-responsive"><table><thead><tr>';
    html += '<th>No</th><th>Nama Istri</th><th>NIK Istri</th><th>Jenis Alkon</th><th>Tanggal</th>';
    html += '</tr></thead><tbody>';
    
    displayData.forEach((item, index) => {
        html += `<tr>
            <td>${index + 1}</td>
            <td>${item.namaIstri || '-'}</td>
            <td>${item.nikIstri || '-'}</td>
            <td>${item.jenisAlkon || '-'}</td>
            <td>${item.tanggalPelayanan || '-'}</td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    
    if (data.length > 50) {
        html += `<p class="info">Menampilkan 50 dari ${data.length} data. Gunakan pencarian untuk filter data.</p>`;
    }
    
    container.innerHTML = html;
}

// Optimized IndexedDB save (non-blocking)
async function saveDataToIndexedDBOptimized(data) {
    if (!db || !data || data.length === 0) return;
    
    try {
        console.log('💾 Saving data to IndexedDB in background...');
        
        // Process in smaller batches to avoid blocking
        const batchSize = 50;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            await new Promise((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const objectStore = transaction.objectStore(storeName);
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
                
                batch.forEach(item => {
                    objectStore.put(item);
                });
            });
            
            // Small delay between batches
            if (i + batchSize < data.length) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        console.log('✅ IndexedDB save completed');
        
    } catch (error) {
        console.warn('⚠️ IndexedDB save failed:', error);
    }
}

// Performance debugging function
window.debugPerformance = function() {
    console.log('=== PERFORMANCE DEBUG ===');
    const report = performanceMonitor.getReport();
    console.log('Performance Report:', report);
    
    // Check data sizes
    console.log('Data sizes:');
    console.log('- allData:', window.allData?.length || 0);
    console.log('- filteredData:', window.filteredData?.length || 0);
    
    // Check DOM elements
    console.log('DOM elements:');
    console.log('- dataTable:', !!document.getElementById('dataTable'));
    console.log('- connectionStatus:', !!document.getElementById('connectionStatus'));
    console.log('- dataSource:', !!document.getElementById('dataSource'));
    
    return report;
};

// Add CSS for loading animations
const loadingCSS = `
<style>
.loading-container, .fallback-container, .error-container {
    text-align: center;
    padding: 40px 20px;
}

.loading-progress {
    width: 100%;
    height: 4px;
    background: #f0f0f0;
    border-radius: 2px;
    overflow: hidden;
    margin: 20px 0;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #2196F3);
    animation: loading-progress 2s infinite;
}

@keyframes loading-progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.warning {
    color: #ff9800;
    font-weight: bold;
}

.info {
    color: #2196F3;
    margin: 10px 0;
}

.error {
    color: #f44336;
    font-weight: bold;
}

.error-detail {
    color: #666;
    font-size: 0.9em;
    margin: 10px 0;
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', loadingCSS);

console.log('✅ performance-fix.js loaded successfully!');
console.log('💡 Available debug functions:');
console.log('  - debugPerformance() - Check performance metrics');