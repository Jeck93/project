/**
 * Fix Data Loading Issues - Solusi untuk masalah loading data
 * Created: 29 Dec 2024
 * 
 * Masalah yang diperbaiki:
 * 1. Data kosong/lama masih ditampilkan
 * 2. Mapping kolom tanggal pelayanan tidak tepat
 * 3. Data tidak ter-refresh dari Google Sheets
 */

console.log('🔧 Loading fix-data-loading.js...');

// Override loadData function dengan perbaikan
const originalLoadData = window.loadData;

window.loadData = async function(searchTerm = '') {
    console.log('🔧 === FIXED LOAD DATA FUNCTION ===');
    console.log('Search term:', searchTerm);
    console.log('Online status:', navigator.onLine);
    
    // Update connection status
    updateConnectionStatus('checking', 'Checking connection to Google Sheets...');
    
    // Show loading indicator
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.innerHTML = '<p class="loading">⏳ Memuat data...</p>';
    }
    
    // FORCE CLEAR OLD DATA FIRST
    console.log('🧹 Clearing old data...');
    window.allData = [];
    window.filteredData = [];
    
    // Try to load from Google Sheets first if online
    if (navigator.onLine) {
        try {
            console.log('🌐 Online - trying to load from Google Sheets...');
            await loadDataFromSheetsFixed(searchTerm);
            return;
        } catch (error) {
            console.warn('⚠️ Failed to load from Google Sheets, falling back to local data:', error);
            
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
                    loadDataFromLocalFixed(searchTerm);
                }, 3000);
                return;
            }
        }
    } else {
        console.log('📱 Offline - loading from local data only');
        updateConnectionStatus('local', 'No internet connection - using local data');
    }
    
    // Fallback to local IndexedDB data
    console.log('💾 Loading from local IndexedDB...');
    loadDataFromLocalFixed(searchTerm);
};

// Fixed version of loadDataFromSheets
async function loadDataFromSheetsFixed(searchTerm = '') {
    try {
        console.log('🔧 === FIXED LOAD FROM GOOGLE SHEETS ===');
        console.log('Search term:', searchTerm);
        console.log('Sheets API URL:', window.sheetsAPI.baseUrl);
        
        const result = await window.sheetsAPI.getAllData();
        console.log('Raw result from sheets:', result);
        
        if (result && result.success) {
            const rawData = result.data || [];
            console.log('Data received from Google Sheets:', rawData.length, 'records');
            
            if (rawData.length === 0) {
                console.log('No data found in Google Sheets');
                displayDataFixed([]);
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
            
            // Convert sheets data to local format with enhanced mapping
            let data = rawData.map((item, index) => {
                try {
                    console.log(`Converting item ${index}:`, item);
                    const converted = convertSheetsToLocalFixed(item);
                    console.log(`Converted result ${index}:`, converted);
                    return converted;
                } catch (convertError) {
                    console.warn('Error converting item', index, ':', convertError, item);
                    return null;
                }
            }).filter(item => item !== null);
            
            console.log('Converted data:', data.length, 'valid records');
            
            // FILTER OUT EMPTY ROWS - This is the key fix!
            console.log('🔧 Filtering out empty rows...');
            const originalCount = data.length;
            data = data.filter(item => {
                // Check if this is a meaningful record
                const hasName = item.namaIstri && item.namaIstri.trim() !== '' && item.namaIstri !== '-';
                const hasNIK = item.nikIstri && item.nikIstri.trim() !== '' && item.nikIstri !== '-';
                const hasAlkon = item.jenisAlkon && item.jenisAlkon.trim() !== '' && item.jenisAlkon !== '-';
                const hasDate = item.tanggalPelayanan && item.tanggalPelayanan !== 'No Date Found' && item.tanggalPelayanan !== '';
                
                // A valid record should have at least name OR NIK AND alkon
                const isValid = (hasName || hasNIK) && hasAlkon;
                
                if (!isValid) {
                    console.log('🗑️ Filtering out empty/invalid row:', item);
                }
                
                return isValid;
            });
            
            console.log(`✅ Filtered data: ${data.length} valid records (removed ${originalCount - data.length} empty rows)`);
            
            // Filter by search term
            if (searchTerm) {
                const searchCount = data.length;
                data = data.filter(item => 
                    (item.namaIstri && typeof item.namaIstri === 'string' && item.namaIstri.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.namaSuami && typeof item.namaSuami === 'string' && item.namaSuami.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (item.jenisAlkon && typeof item.jenisAlkon === 'string' && item.jenisAlkon.toLowerCase().includes(searchTerm.toLowerCase()))
                );
                console.log('Filtered data by search:', data.length, 'of', searchCount, 'records match search');
            }
            
            displayDataFixed(data);
            updateSummary(data);
            
            // Save fresh data to IndexedDB to replace old data
            if (data.length > 0) {
                console.log('💾 Saving fresh data to IndexedDB...');
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

// Fixed version of loadDataFromLocal
function loadDataFromLocalFixed(searchTerm = '') {
    console.log('🔧 === FIXED LOAD FROM LOCAL INDEXEDDB ===');
    
    if (!db) {
        console.warn('IndexedDB not available');
        displayDataFixed([]);
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
        
        // FILTER OUT EMPTY ROWS from local data too
        console.log('🔧 Filtering out empty rows from local data...');
        const originalCount = data.length;
        data = data.filter(item => {
            // Check if this is a meaningful record
            const hasName = item.namaIstri && item.namaIstri.trim() !== '' && item.namaIstri !== '-';
            const hasNIK = item.nikIstri && item.nikIstri.trim() !== '' && item.nikIstri !== '-';
            const hasAlkon = item.jenisAlkon && item.jenisAlkon.trim() !== '' && item.jenisAlkon !== '-';
            
            // A valid record should have at least name OR NIK AND alkon
            const isValid = (hasName || hasNIK) && hasAlkon;
            
            if (!isValid) {
                console.log('🗑️ Filtering out empty/invalid local row:', item);
            }
            
            return isValid;
        });
        
        console.log(`✅ Filtered local data: ${data.length} valid records (removed ${originalCount - data.length} empty rows)`);
        
        // Filter by search term
        if (searchTerm) {
            data = data.filter(item => 
                (item.namaIstri && typeof item.namaIstri === 'string' && item.namaIstri.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.namaSuami && typeof item.namaSuami === 'string' && item.namaSuami.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.nikIstri && String(item.nikIstri).toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.jenisAlkon && typeof item.jenisAlkon === 'string' && item.jenisAlkon.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        displayDataFixed(data);
        updateSummary(data);
        
        // Update status indicator
        updateDataSource('local', data.length);
    };
    
    request.onerror = () => {
        console.error('Error loading from IndexedDB:', request.error);
        displayDataFixed([]);
        updateSummary([]);
    };
}

// Enhanced convertSheetsToLocal with better column mapping
function convertSheetsToLocalFixed(sheetsItem) {
    console.log('🔧 === ENHANCED SHEETS TO LOCAL CONVERSION ===');
    console.log('Raw sheets item:', sheetsItem);
    console.log('Available columns:', Object.keys(sheetsItem));
    
    // Helper function to find column by multiple possible names
    const findColumn = (possibleNames, item) => {
        for (const name of possibleNames) {
            if (item[name] !== undefined && item[name] !== null && item[name] !== '') {
                console.log(`✅ Found column "${name}":`, item[name]);
                return item[name];
            }
        }
        console.log(`❌ Column not found in any of:`, possibleNames);
        return '';
    };
    
    // Helper function to format date for HTML input
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return '';
        
        try {
            let date;
            
            if (dateValue instanceof Date) {
                date = dateValue;
            } else if (typeof dateValue === 'string') {
                const trimmedValue = dateValue.trim();
                
                // Handle various date formats
                if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}T/)) {
                    date = new Date(trimmedValue);
                } else if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    date = new Date(trimmedValue + 'T00:00:00');
                } else if (trimmedValue.includes('/')) {
                    const parts = trimmedValue.split('/');
                    if (parts.length === 3) {
                        // Assume DD/MM/YYYY format
                        date = new Date(parts[2], parts[1] - 1, parts[0]);
                    }
                } else if (trimmedValue.includes('-')) {
                    const parts = trimmedValue.split('-');
                    if (parts.length === 3) {
                        if (parts[0].length === 4) {
                            // YYYY-MM-DD format
                            date = new Date(parts[0], parts[1] - 1, parts[2]);
                        } else {
                            // DD-MM-YYYY format
                            date = new Date(parts[2], parts[1] - 1, parts[0]);
                        }
                    }
                } else {
                    date = new Date(dateValue);
                }
            } else if (typeof dateValue === 'number') {
                date = new Date(dateValue);
            }
            
            if (date && !isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (error) {
            console.error('Error formatting date:', dateValue, error);
        }
        
        return '';
    };
    
    // Enhanced column mapping with more possibilities
    const converted = {
        id: sheetsItem.rowNumber || Date.now(),
        timestamp: (() => {
            const rawTimestamp = findColumn(['Timestamp', 'timestamp', 'Waktu', 'Time'], sheetsItem);
            
            if (!rawTimestamp) {
                return window.timestampUtils ? 
                    window.timestampUtils.getCurrentTimestampDisplay() : 
                    new Date().toLocaleString('id-ID');
            }
            
            // If already in display format, keep it
            if (typeof rawTimestamp === 'string' && rawTimestamp.includes('/') && rawTimestamp.includes(':')) {
                return rawTimestamp;
            }
            
            // Convert to display format
            if (window.timestampUtils && typeof window.timestampUtils.formatTimestampForDisplay === 'function') {
                return window.timestampUtils.formatTimestampForDisplay(rawTimestamp);
            } else {
                try {
                    const date = new Date(rawTimestamp);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleString('id-ID');
                    }
                } catch (error) {
                    console.error('Timestamp conversion failed:', error);
                }
            }
            
            return rawTimestamp;
        })(),
        
        // Enhanced date mapping with more column name possibilities
        tanggalPelayanan: (() => {
            const possibleDateColumns = [
                'Tanggal Pelayanan',
                'tanggal pelayanan',
                'Tanggal_Pelayanan',
                'TanggalPelayanan',
                'Tanggal',
                'Date',
                'tanggal',
                'Tgl Pelayanan',
                'Tgl_Pelayanan',
                'TglPelayanan',
                'Waktu Pelayanan',
                'Tanggal Layanan',
                'Service Date',
                'Pelayanan Date',
                'Tanggal Input',
                'Input Date',
                // Add more variations with spaces and special characters
                'Tanggal Pelayanan ',
                ' Tanggal Pelayanan',
                'Tanggal\nPelayanan',
                'Tanggal Pelayanan\n'
            ];
            
            console.log('🔍 Searching for date column...');
            
            // First try exact matches
            for (const colName of possibleDateColumns) {
                if (sheetsItem[colName] !== undefined && sheetsItem[colName] !== null && sheetsItem[colName] !== '') {
                    console.log(`✅ Found date in column "${colName}":`, sheetsItem[colName]);
                    return formatDateForInput(sheetsItem[colName]);
                }
            }
            
            // Then try fuzzy matching
            const allKeys = Object.keys(sheetsItem);
            for (const key of allKeys) {
                const lowerKey = key.toLowerCase().trim();
                if ((lowerKey.includes('tanggal') || lowerKey.includes('date') || lowerKey.includes('pelayanan')) && 
                    sheetsItem[key] !== undefined && sheetsItem[key] !== null && sheetsItem[key] !== '') {
                    console.log(`✅ Found date in similar column "${key}":`, sheetsItem[key]);
                    return formatDateForInput(sheetsItem[key]);
                }
            }
            
            // Finally, look for any date-like values
            for (const key of allKeys) {
                const value = sheetsItem[key];
                if (value && typeof value === 'string') {
                    if (value.match(/^\d{4}-\d{2}-\d{2}$/) || 
                        value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || 
                        value.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
                        console.log(`✅ Found date-like value in "${key}":`, value);
                        return formatDateForInput(value);
                    }
                }
            }
            
            console.error('❌ No date column found! Available columns:', allKeys);
            return '';
        })(),
        
        // Other fields with enhanced mapping
        desa: findColumn(['Desa Yang Melaporkan', 'Desa', 'desa', 'Village'], sheetsItem),
        namaSuami: findColumn(['Nama Suami', 'nama suami', 'NamaSuami', 'Husband Name'], sheetsItem),
        umurSuami: findColumn(['Umur Suami', 'umur suami', 'UmurSuami', 'Husband Age'], sheetsItem),
        namaIstri: findColumn(['Nama Istri', 'nama istri', 'NamaIstri', 'Wife Name'], sheetsItem),
        nikIstri: findColumn(['NIK Istri', 'nik istri', 'NIKIstri', 'Wife NIK'], sheetsItem),
        tanggalLahirIstri: formatDateForInput(findColumn(['Tanggal Lahir Istri', 'tanggal lahir istri', 'TanggalLahirIstri', 'Wife Birth Date'], sheetsItem)),
        alamat: findColumn(['Alamat', 'alamat', 'Address'], sheetsItem),
        rt: findColumn(['RT', 'rt'], sheetsItem),
        rw: findColumn(['RW', 'rw'], sheetsItem),
        noHP: findColumn(['NO. HP', 'No HP', 'no hp', 'NoHP', 'Phone'], sheetsItem),
        jenisAlkon: findColumn(['Jenis Alkon MKJP & NON MKJP', 'Jenis Alkon', 'jenis alkon', 'JenisAlkon', 'Contraceptive Type'], sheetsItem),
        kepesertaanKB: findColumn(['Kepesertaan KB', 'kepesertaan kb', 'KepesertaanKB', 'KB Membership'], sheetsItem),
        tempatPelayanan: findColumn(['Tempat Pelayanan', 'tempat pelayanan', 'TempatPelayanan', 'Service Place'], sheetsItem),
        akseptorPajak: findColumn(['Asuransi Yang di Pakai', 'Asuransi', 'asuransi', 'Insurance', 'Akseptor Pajak'], sheetsItem),
        akseptorKIE: findColumn(['Akseptor Hasil KIE PPKBD\n( Khusus MKJP )', 'Akseptor KIE', 'Akseptor Hasil KIE PPKBD ( Khusus MKJP )', 'akseptor kie'], sheetsItem),
        fotoKTP: findColumn(['Foto KTP', 'foto ktp', 'FotoKTP', 'KTP Photo'], sheetsItem),
        fotoKTPUrl: findColumn(['Foto KTP', 'foto ktp', 'FotoKTP', 'KTP Photo'], sheetsItem)
    };
    
    console.log('✅ Enhanced conversion result:', converted);
    return converted;
}

// Fixed display function that handles empty data better
function displayDataFixed(data) {
    console.log('🔧 === FIXED DISPLAY DATA ===');
    console.log('Data to display:', data.length, 'records');
    
    // Store data for pagination
    window.allData = data;
    window.filteredData = data;
    
    if (data.length === 0) {
        const container = document.getElementById('dataTable');
        container.innerHTML = '<p class="no-data">Belum ada data. Klik "Input Data Baru" untuk menambah data.</p>';
        document.getElementById('paginationInfo').style.display = 'none';
        return;
    }
    
    // Reset to first page when new data is loaded
    currentPage = 1;
    
    // Display paginated data
    displayPaginatedDataFixed();
}

// Fixed pagination display
function displayPaginatedDataFixed() {
    console.log('🔧 displayPaginatedDataFixed called, filteredData length:', window.filteredData.length);
    
    const container = document.getElementById('dataTable');
    const paginationInfo = document.getElementById('paginationInfo');
    
    if (window.filteredData.length === 0) {
        container.innerHTML = '<p class="no-data">Tidak ada data yang sesuai dengan pencarian.</p>';
        paginationInfo.style.display = 'none';
        return;
    }
    
    // Calculate pagination
    const totalItems = window.filteredData.length;
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
        pageData = window.filteredData;
    } else {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        pageData = window.filteredData.slice(startIndex, endIndex);
    }
    
    // Build table HTML with enhanced validation
    let html = '<div class="table-responsive"><table><thead><tr>';
    html += '<th>No</th><th>Tanggal Pelayanan</th><th>Nama Suami</th><th>Nama Istri</th><th>NIK Istri</th><th>Jenis Alat Kontrasepsi</th><th>Aksi</th>';
    html += '</tr></thead><tbody>';
    
    pageData.forEach((item, index) => {
        const globalIndex = itemsPerPage === 'all' ? index + 1 : ((currentPage - 1) * itemsPerPage) + index + 1;
        
        // Enhanced validation and display
        const tanggalPelayanan = item.tanggalPelayanan && item.tanggalPelayanan !== 'No Date Found' ? 
            formatDate(item.tanggalPelayanan) : 
            '<span style="color: #ff6b6b;">Tanggal tidak valid</span>';
        
        const namaSuami = item.namaSuami && item.namaSuami.trim() !== '' ? item.namaSuami : '-';
        const namaIstri = item.namaIstri && item.namaIstri.trim() !== '' ? item.namaIstri : '<span style="color: #ff6b6b;">Nama tidak ada</span>';
        const nikIstri = item.nikIstri && item.nikIstri.trim() !== '' ? item.nikIstri : '-';
        const jenisAlkon = item.jenisAlkon && item.jenisAlkon.trim() !== '' ? item.jenisAlkon : '<span style="color: #ff6b6b;">Alkon tidak ada</span>';
        
        html += `<tr>
            <td>${globalIndex}</td>
            <td>${tanggalPelayanan}</td>
            <td>${namaSuami}</td>
            <td>${namaIstri}</td>
            <td>${nikIstri}</td>
            <td><span class="badge">${jenisAlkon}</span></td>
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

// Add debug function to check current data
window.debugCurrentData = function() {
    console.log('=== DEBUG CURRENT DATA ===');
    console.log('allData length:', window.allData ? window.allData.length : 'undefined');
    console.log('filteredData length:', window.filteredData ? window.filteredData.length : 'undefined');
    
    if (window.allData && window.allData.length > 0) {
        console.log('First item in allData:', window.allData[0]);
        console.log('Sample of all data:');
        window.allData.slice(0, 5).forEach((item, index) => {
            console.log(`Item ${index}:`, {
                namaIstri: item.namaIstri,
                nikIstri: item.nikIstri,
                jenisAlkon: item.jenisAlkon,
                tanggalPelayanan: item.tanggalPelayanan
            });
        });
    }
    
    // Check for empty rows
    if (window.allData) {
        const emptyRows = window.allData.filter(item => {
            const hasName = item.namaIstri && item.namaIstri.trim() !== '' && item.namaIstri !== '-';
            const hasNIK = item.nikIstri && item.nikIstri.trim() !== '' && item.nikIstri !== '-';
            const hasAlkon = item.jenisAlkon && item.jenisAlkon.trim() !== '' && item.jenisAlkon !== '-';
            return !(hasName || hasNIK) || !hasAlkon;
        });
        
        console.log('Empty/invalid rows found:', emptyRows.length);
        if (emptyRows.length > 0) {
            console.log('Sample empty rows:', emptyRows.slice(0, 3));
        }
    }
};

// Add quick fix function
window.quickFixDataLoading = async function() {
    console.log('🔧 === QUICK FIX DATA LOADING ===');
    
    try {
        // Clear all data first
        window.allData = [];
        window.filteredData = [];
        
        // Clear search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Force reload with fixed functions
        await window.loadData();
        
        console.log('✅ Quick fix completed!');
        alert('✅ Data loading berhasil diperbaiki!\n\nData kosong telah dihapus dan data terbaru dimuat dari Google Sheets.');
        
    } catch (error) {
        console.error('❌ Quick fix failed:', error);
        alert('❌ Quick fix gagal: ' + error.message);
    }
};

// Override the original displayData and displayPaginatedData functions
if (window.displayData) {
    window.displayData = displayDataFixed;
}

if (window.displayPaginatedData) {
    window.displayPaginatedData = displayPaginatedDataFixed;
}

console.log('✅ fix-data-loading.js loaded successfully!');
console.log('💡 Available debug functions:');
console.log('  - debugCurrentData() - Check current data state');
console.log('  - quickFixDataLoading() - Quick fix for data loading issues');