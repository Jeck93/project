/**
 * Connection Status Fix - Missing Functions
 * Created: 9 Jan 2025
 * 
 * Fixes missing updateConnectionStatus and updateDataSource functions
 * that are causing ReferenceError in fix-data-loading.js
 */

console.log('🔧 Loading connection-status-fix.js...');

// Define missing updateConnectionStatus function
window.updateConnectionStatus = function(status, message) {
    console.log('📡 Connection Status Update:', status, message);
    
    const connectionIndicator = document.getElementById('connectionIndicator');
    const connectionText = document.getElementById('connectionText');
    
    if (!connectionIndicator || !connectionText) {
        console.warn('Connection status elements not found in DOM');
        return;
    }
    
    // Update indicator icon and text based on status
    switch (status) {
        case 'checking':
            connectionIndicator.textContent = '🔄';
            connectionText.textContent = message || 'Checking...';
            connectionIndicator.style.color = '#ffa500';
            break;
            
        case 'online':
        case 'sheets':
            connectionIndicator.textContent = '🌐';
            connectionText.textContent = message || 'Online - Google Sheets';
            connectionIndicator.style.color = '#4CAF50';
            break;
            
        case 'local':
        case 'offline':
            connectionIndicator.textContent = '📱';
            connectionText.textContent = message || 'Offline - Local Data';
            connectionIndicator.style.color = '#2196F3';
            break;
            
        case 'error':
            connectionIndicator.textContent = '⚠️';
            connectionText.textContent = message || 'Connection Error';
            connectionIndicator.style.color = '#f44336';
            break;
            
        default:
            connectionIndicator.textContent = '❓';
            connectionText.textContent = message || 'Unknown Status';
            connectionIndicator.style.color = '#9e9e9e';
    }
};

// Define missing updateDataSource function
window.updateDataSource = function(source, count) {
    console.log('📊 Data Source Update:', source, count);
    
    const dataSourceElement = document.getElementById('dataSource');
    
    if (!dataSourceElement) {
        console.warn('Data source element not found in DOM');
        return;
    }
    
    // Update data source indicator
    switch (source) {
        case 'sheets':
            dataSourceElement.innerHTML = `🌐 Google Sheets (${count} data)`;
            dataSourceElement.style.color = '#4CAF50';
            break;
            
        case 'local':
            dataSourceElement.innerHTML = `📱 Data Lokal (${count} data)`;
            dataSourceElement.style.color = '#2196F3';
            break;
            
        case 'error':
            dataSourceElement.innerHTML = `⚠️ Error Loading Data`;
            dataSourceElement.style.color = '#f44336';
            break;
            
        default:
            dataSourceElement.innerHTML = `📊 Data (${count || 0})`;
            dataSourceElement.style.color = '#666';
    }
};

// Define missing updateDataDisplay function
window.updateDataDisplay = function() {
    console.log('🖥️ updateDataDisplay called');
    
    // Use the optimized display function if available
    if (typeof window.displayDataOptimized === 'function') {
        window.displayDataOptimized(window.filteredData || []);
    } else if (typeof window.displayDataFixed === 'function') {
        window.displayDataFixed(window.filteredData || []);
    } else if (typeof window.displayData === 'function') {
        window.displayData(window.filteredData || []);
    } else {
        console.warn('No display function available');
        const container = document.getElementById('dataTable');
        if (container) {
            container.innerHTML = '<p class="no-data">Display function not available</p>';
        }
    }
};

// Define missing updateSummary function
window.updateSummary = function(data) {
    console.log('📊 updateSummary called with', data?.length || 0, 'records');
    
    const summaryData = data || window.filteredData || [];
    
    // Update total count
    const totalElement = document.querySelector('.summary-card .number');
    if (totalElement) {
        totalElement.textContent = summaryData.length;
    }
    
    // Count MKJP vs Non-MKJP
    let mkjpCount = 0;
    let nonMkjpCount = 0;
    
    summaryData.forEach(item => {
        const alkon = (item.jenisAlkon || '').toLowerCase();
        if (alkon.includes('mkjp') || alkon.includes('iud') || alkon.includes('implant') || alkon.includes('steril')) {
            mkjpCount++;
        } else {
            nonMkjpCount++;
        }
    });
    
    // Update MKJP count
    const mkjpElement = document.querySelector('.summary-card:nth-child(2) .number');
    if (mkjpElement) {
        mkjpElement.textContent = mkjpCount;
    }
    
    // Update Non-MKJP count
    const nonMkjpElement = document.querySelector('.summary-card:nth-child(3) .number');
    if (nonMkjpElement) {
        nonMkjpElement.textContent = nonMkjpCount;
    }
    
    console.log(`📊 Summary updated: Total=${summaryData.length}, MKJP=${mkjpCount}, Non-MKJP=${nonMkjpCount}`);
};

// Define missing formatDate function
window.formatDate = function(dateValue) {
    if (!dateValue) return '-';
    
    try {
        let date;
        
        // Handle different date formats
        if (dateValue instanceof Date) {
            date = dateValue;
        } else if (typeof dateValue === 'string') {
            const trimmedValue = dateValue.trim();
            
            // Handle YYYY-MM-DD format
            if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(trimmedValue + 'T00:00:00');
            } 
            // Handle DD/MM/YYYY format
            else if (trimmedValue.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
                const parts = trimmedValue.split('/');
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
            // Handle DD-MM-YYYY format
            else if (trimmedValue.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
                const parts = trimmedValue.split('-');
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
            // Try parsing as-is
            else {
                date = new Date(dateValue);
            }
        } else {
            date = new Date(dateValue);
        }
        
        // Check if date is valid
        if (date && !isNaN(date.getTime())) {
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    } catch (error) {
        console.warn('Error formatting date:', dateValue, error);
    }
    
    return dateValue || '-';
};

// Define missing saveDataToIndexedDB function
window.saveDataToIndexedDB = async function(data) {
    console.log('💾 saveDataToIndexedDB called with', data?.length || 0, 'records');
    
    if (!db) {
        return { success: false, error: 'IndexedDB not available' };
    }
    
    if (!data || data.length === 0) {
        return { success: true, savedCount: 0, totalCount: 0, errorCount: 0 };
    }
    
    try {
        let savedCount = 0;
        let errorCount = 0;
        const totalCount = data.length;
        
        // Process in batches to avoid blocking
        const batchSize = 50;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            try {
                await new Promise((resolve, reject) => {
                    const transaction = db.transaction([storeName], 'readwrite');
                    const objectStore = transaction.objectStore(storeName);
                    
                    transaction.oncomplete = () => {
                        savedCount += batch.length;
                        resolve();
                    };
                    
                    transaction.onerror = () => {
                        errorCount += batch.length;
                        reject(transaction.error);
                    };
                    
                    // Add each item in the batch
                    batch.forEach(item => {
                        try {
                            objectStore.put(item);
                        } catch (error) {
                            console.warn('Error adding item to IndexedDB:', error, item);
                            errorCount++;
                        }
                    });
                });
                
                // Small delay between batches
                if (i + batchSize < data.length) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
            } catch (batchError) {
                console.warn('Batch save error:', batchError);
                errorCount += batch.length;
            }
        }
        
        const result = {
            success: savedCount > 0,
            savedCount,
            totalCount,
            errorCount
        };
        
        console.log('💾 IndexedDB save result:', result);
        return result;
        
    } catch (error) {
        console.error('❌ saveDataToIndexedDB failed:', error);
        return {
            success: false,
            error: error.message,
            savedCount: 0,
            totalCount: data.length,
            errorCount: data.length
        };
    }
};

// Add retry connection function for error recovery
window.retryConnection = async function() {
    console.log('🔄 Retrying connection...');
    
    const retryBtn = document.querySelector('button[onclick="retryConnection()"]');
    if (retryBtn) {
        retryBtn.disabled = true;
        retryBtn.textContent = '🔄 Mencoba...';
    }
    
    try {
        // Update status to checking
        updateConnectionStatus('checking', 'Mencoba koneksi ulang...');
        
        // Clear any cached data
        if (window.allData) {
            window.allData = [];
        }
        if (window.filteredData) {
            window.filteredData = [];
        }
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to load data again
        if (typeof window.loadData === 'function') {
            await window.loadData();
        } else {
            throw new Error('loadData function not available');
        }
        
        console.log('✅ Connection retry successful');
        
    } catch (error) {
        console.error('❌ Connection retry failed:', error);
        updateConnectionStatus('error', 'Retry gagal: ' + error.message);
    } finally {
        if (retryBtn) {
            retryBtn.disabled = false;
            retryBtn.textContent = '🔄 Coba Lagi';
        }
    }
};

// Initialize connection status on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing connection status...');
    
    // Set initial status
    if (navigator.onLine) {
        updateConnectionStatus('checking', 'Checking connection...');
    } else {
        updateConnectionStatus('offline', 'No internet connection');
    }
    
    // Listen for online/offline events
    window.addEventListener('online', function() {
        console.log('📡 Browser went online');
        updateConnectionStatus('checking', 'Connection restored, checking...');
        
        // Auto-retry loading data when connection is restored
        setTimeout(() => {
            if (typeof window.loadData === 'function') {
                window.loadData();
            }
        }, 1000);
    });
    
    window.addEventListener('offline', function() {
        console.log('📱 Browser went offline');
        updateConnectionStatus('offline', 'No internet connection');
    });
});

console.log('✅ connection-status-fix.js loaded successfully!');