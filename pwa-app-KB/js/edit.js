/**
 * Edit Form JavaScript
 * Handles editing existing data entries
 */

// Check if logged in (use consistent auth system)
const authToken = localStorage.getItem('pwa_auth_token');
if (!authToken) {
    console.log('No auth token, redirecting to login...');
    window.location.href = 'login.html';
}

// Get NIK from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const nikIstri = urlParams.get('nik');

if (!nikIstri) {
    alert('❌ NIK tidak ditemukan. Kembali ke beranda.');
    window.location.href = 'index.html';
}

// Initialize IndexedDB
let db;

// Initialize database when page loads
window.addEventListener('DOMContentLoaded', async function() {
    try {
        // Try to initialize database, but don't fail if it doesn't work
        db = await window.dbUtils.initializeDB();
        console.log('Database initialized successfully');
    } catch (error) {
        console.warn('Database initialization failed, will use Google Sheets only:', error);
        db = null; // Set to null so we skip local operations
    }
    
    // Always try to load data regardless of DB status
    loadDataForEdit();
});

// Load data for editing
async function loadDataForEdit() {
    try {
        console.log('=== LOADING DATA FOR EDIT ===');
        console.log('NIK to load:', nikIstri);
        
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('editForm').style.display = 'none';
        
        let data = null;
        
        // Try to get data from local IndexedDB first (only if DB is available)
        if (db) {
            try {
                console.log('Trying to get data from local IndexedDB...');
                data = await getLocalData(nikIstri);
                console.log('Local data result:', data);
            } catch (error) {
                console.warn('Error getting local data, will try Google Sheets:', error);
            }
        }
        
        // If not found locally or DB not available, try Google Sheets
        if (!data && navigator.onLine) {
            console.log('Trying to get data from Google Sheets...');
            console.log('NIK to search:', nikIstri);
            console.log('Sheets API URL:', window.sheetsAPI.baseUrl);
            try {
                const sheetsResult = await window.sheetsAPI.getDataByNIK(nikIstri);
                console.log('Sheets result:', sheetsResult);
                
                if (sheetsResult.success && sheetsResult.data) {
                    console.log('Raw sheets data:', sheetsResult.data);
                    
                    // Log all available fields in the raw data
                    console.log('Available fields in sheets data:');
                    Object.keys(sheetsResult.data).forEach(key => {
                        console.log(`  "${key}": "${sheetsResult.data[key]}"`);
                    });
                    
                    data = window.sheetsAPI.convertSheetsToLocal(sheetsResult.data);
                    console.log('Converted data:', data);
                    console.log('Data loaded from Google Sheets successfully');
                    
                    // Log specific fields that might be missing
                    console.log('Checking specific fields:');
                    console.log('  tanggalPelayanan:', data.tanggalPelayanan);
                    console.log('  namaIstri:', data.namaIstri);
                    console.log('  nikIstri:', data.nikIstri);
                    console.log('  alamat:', data.alamat);
                    
                } else {
                    console.warn('Sheets result not successful or no data:', sheetsResult);
                }
            } catch (error) {
                console.error('Error getting data from sheets:', error);
                console.error('Error stack:', error.stack);
            }
        }
        
        if (!data) {
            throw new Error('Data tidak ditemukan di database lokal maupun Google Sheets');
        }
        
        console.log('Final data to populate form:', data);
        
        // Populate form with data
        populateForm(data);
        
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('editForm').style.display = 'block';
        
        console.log('=== FORM LOADED SUCCESSFULLY ===');
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Gagal memuat data: ' + error.message);
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}

// Get data from local IndexedDB
async function getLocalData(nikIstri) {
    if (!db) {
        throw new Error('Database not available');
    }
    
    try {
        const result = await window.dbUtils.getDataByNIK(db, nikIstri);
        console.log('Found local data:', !!result);
        
        // Convert timestamp to display format if needed
        if (result && result.timestamp) {
            console.log('Original local timestamp:', result.timestamp);
            
            // Jika timestamp dalam format ISO, convert ke display format
            if (typeof result.timestamp === 'string' && 
                !result.timestamp.includes('/') && 
                result.timestamp.includes('T') && 
                result.timestamp.includes('Z')) {
                
                console.log('Converting local ISO timestamp to display format');
                
                if (window.timestampUtils && typeof window.timestampUtils.formatTimestampForDisplay === 'function') {
                    result.timestamp = window.timestampUtils.formatTimestampForDisplay(result.timestamp);
                    console.log('✅ Converted local timestamp to display format:', result.timestamp);
                } else {
                    // Manual conversion fallback
                    try {
                        const date = new Date(result.timestamp);
                        if (!isNaN(date.getTime())) {
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            const seconds = date.getSeconds().toString().padStart(2, '0');
                            
                            result.timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                            console.log('✅ Manual conversion of local timestamp:', result.timestamp);
                        }
                    } catch (error) {
                        console.error('Manual conversion failed:', error);
                    }
                }
            } else {
                console.log('✅ Local timestamp already in display format:', result.timestamp);
            }
        }
        
        return result;
    } catch (error) {
        console.error('Error getting local data:', error);
        throw error;
    }
}

// Populate form with existing data
function populateForm(data) {
    console.log('Populating form with data:', data);
    
    // Helper function to safely set input value
    const setInputValue = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value || '';
            console.log(`Set ${elementId} = "${value || ''}"`);
        } else {
            console.warn(`Element not found: ${elementId}`);
        }
    };
    
    // Helper function to safely set radio button
    const setRadioValue = (name, value) => {
        if (value) {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                console.log(`Set radio ${name} = "${value}"`);
            } else {
                console.warn(`Radio button not found: ${name} = "${value}"`);
                // List available options for debugging
                const availableRadios = document.querySelectorAll(`input[name="${name}"]`);
                const availableValues = Array.from(availableRadios).map(r => r.value);
                console.warn(`Available options for ${name}:`, availableValues);
            }
        }
    };
    
    // Basic info
    setInputValue('desa', data.desa);
    setInputValue('tanggalPelayanan', data.tanggalPelayanan);
    
    // Husband data
    setInputValue('namaSuami', data.namaSuami);
    setInputValue('umurSuami', data.umurSuami);
    
    // Wife data
    setInputValue('namaIstri', data.namaIstri);
    setInputValue('nikIstri', data.nikIstri);
    setInputValue('tanggalLahirIstri', data.tanggalLahirIstri);
    
    // Address
    setInputValue('alamat', data.alamat);
    setInputValue('rt', data.rt);
    setInputValue('rw', data.rw);
    setInputValue('noHP', data.noHP);
    
    // Contraception data - handle radio buttons
    if (data.jenisAlkon) {
        // Check if it's a compound value (e.g., "Implant (1 Batang)")
        let mainValue = data.jenisAlkon;
        let subValue = null;
        
        if (data.jenisAlkon.includes('(') && data.jenisAlkon.includes(')')) {
            const match = data.jenisAlkon.match(/^(.+?)\s*\((.+?)\)$/);
            if (match) {
                mainValue = match[1].trim();
                subValue = match[2].trim();
            }
        }
        
        setRadioValue('jenisAlkon', mainValue);
        
        // Set sub-values after triggering the main change
        setTimeout(() => {
            handleJenisAlkonChange();
            
            if (subValue && mainValue === 'Implant') {
                setRadioValue('jenisImplant', subValue);
            }
        }, 100);
    }
    
    if (data.kepesertaanKB) {
        // Handle compound values like "Baru (Pasca Persalinan)"
        let kepesertaanValue = data.kepesertaanKB;
        let kondisiBaruValue = null;
        
        // Check if it's a compound value like "Baru (something)"
        if (kepesertaanValue.includes('Baru (') && kepesertaanValue.includes(')')) {
            const match = kepesertaanValue.match(/^Baru\s*\((.+?)\)$/);
            if (match) {
                kepesertaanValue = 'Baru';
                kondisiBaruValue = match[1].trim();
            }
        }
        
        setRadioValue('kepesertaanKB', kepesertaanValue);
        
        // Set the sub-option if needed
        if (kondisiBaruValue) {
            setTimeout(() => {
                setRadioValue('kondisiBaru', kondisiBaruValue);
                console.log(`Set kondisiBaru = "${kondisiBaruValue}"`);
            }, 150);
        }
        
        // Trigger sub-questions after setting the value
        setTimeout(() => {
            handleKepesertaanKBChange();
        }, 100);
    }
    
    // Handle kondisiBaru (sub-option for "Baru")
    if (data.kondisiBaru) {
        setTimeout(() => {
            setRadioValue('kondisiBaru', data.kondisiBaru);
            console.log(`Set kondisiBaru = "${data.kondisiBaru}"`);
        }, 200);
    }
    
    // Handle alkonSebelumnya (sub-option for "Ganti Cara")
    if (data.alkonSebelumnya) {
        setTimeout(() => {
            setRadioValue('alkonSebelumnya', data.alkonSebelumnya);
            console.log(`Set alkonSebelumnya = "${data.alkonSebelumnya}"`);
        }, 200);
    }
    
    if (data.tempatPelayanan) {
        // Handle compound values like "Lainnya (Bides)" or direct values like "Bides"
        let tempatValue = data.tempatPelayanan;
        let tempatLainnyaValue = null;
        
        // Check if it's a compound value like "Lainnya (something)"
        if (tempatValue.includes('Lainnya (') && tempatValue.includes(')')) {
            const match = tempatValue.match(/^Lainnya\s*\((.+?)\)$/);
            if (match) {
                tempatValue = 'Lainnya';
                tempatLainnyaValue = match[1].trim();
            }
        } else {
            // Check if the value is NOT one of the standard radio options
            const standardOptions = ['Puskesmas Rowosari', 'Puskesmas Mojo', 'Bidan', 'PPKBD', 'Lainnya'];
            if (!standardOptions.includes(tempatValue)) {
                // If it's not a standard option (like "Bides"), treat it as "Lainnya"
                tempatLainnyaValue = tempatValue;
                tempatValue = 'Lainnya';
            }
        }
        
        setRadioValue('tempatPelayanan', tempatValue);
        
        // Set the "Lainnya" text input if needed
        if (tempatLainnyaValue) {
            setTimeout(() => {
                const tempatLainnyaInput = document.querySelector('input[name="tempatPelayananLainnya"]');
                if (tempatLainnyaInput) {
                    tempatLainnyaInput.value = tempatLainnyaValue;
                    console.log(`Set tempatPelayananLainnya = "${tempatLainnyaValue}"`);
                }
            }, 100);
        }
        
        // Trigger sub-questions after setting the value
        setTimeout(() => {
            handleTempatPelayananChange();
        }, 100);
    }
    
    if (data.akseptorPajak) {
        setRadioValue('akseptorPajak', data.akseptorPajak);
        // Trigger sub-questions after setting the value
        setTimeout(() => {
            handleAsuransiChange();
        }, 100);
    }
    
    if (data.akseptorKIE) {
        setRadioValue('akseptorKIE', data.akseptorKIE);
    }
    
    // Store original data for reference
    window.originalData = data;
    
    console.log('Form population completed');
}

// Form event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for jenis alkon radio buttons
    const jenisAlkonRadios = document.querySelectorAll('input[name="jenisAlkon"]');
    jenisAlkonRadios.forEach(radio => {
        radio.addEventListener('change', handleJenisAlkonChange);
    });
    
    // Add event listeners for kepesertaan KB radio buttons
    const kepesertaanKBRadios = document.querySelectorAll('input[name="kepesertaanKB"]');
    kepesertaanKBRadios.forEach(radio => {
        radio.addEventListener('change', handleKepesertaanKBChange);
    });
    
    // Add event listeners for tempat pelayanan radio buttons
    const tempatPelayananRadios = document.querySelectorAll('input[name="tempatPelayanan"]');
    tempatPelayananRadios.forEach(radio => {
        radio.addEventListener('change', handleTempatPelayananChange);
    });
    
    // Add event listeners for asuransi radio buttons
    const asuransiRadios = document.querySelectorAll('input[name="akseptorPajak"]');
    asuransiRadios.forEach(radio => {
        radio.addEventListener('change', handleAsuransiChange);
    });
});

function handleKepesertaanKBChange() {
    const selectedKepesertaan = document.querySelector('input[name="kepesertaanKB"]:checked');
    const subKepesertaanBaru = document.getElementById('subKepesertaanBaru');
    const subKepesertaanGanti = document.getElementById('subKepesertaanGanti');
    
    // Hide all sub-questions first
    if (subKepesertaanBaru) subKepesertaanBaru.style.display = 'none';
    if (subKepesertaanGanti) subKepesertaanGanti.style.display = 'none';
    
    if (selectedKepesertaan) {
        const value = selectedKepesertaan.value;
        
        // Show relevant sub-question
        if (value === 'Baru' && subKepesertaanBaru) {
            subKepesertaanBaru.style.display = 'block';
        } else if (value === 'Ganti Cara' && subKepesertaanGanti) {
            subKepesertaanGanti.style.display = 'block';
        }
    }
}

function handleTempatPelayananChange() {
    const selectedTempat = document.querySelector('input[name="tempatPelayanan"]:checked');
    const subTempatLainnya = document.getElementById('subTempatPelayananLainnya');
    
    // Hide sub-question first
    if (subTempatLainnya) subTempatLainnya.style.display = 'none';
    
    if (selectedTempat && selectedTempat.value === 'Lainnya' && subTempatLainnya) {
        subTempatLainnya.style.display = 'block';
    }
}

function handleAsuransiChange() {
    const selectedAsuransi = document.querySelector('input[name="akseptorPajak"]:checked');
    const subAsuransiLainnya = document.getElementById('subAsuransiLainnya');
    
    // Hide sub-question first
    if (subAsuransiLainnya) subAsuransiLainnya.style.display = 'none';
    
    if (selectedAsuransi && selectedAsuransi.value === 'Lainnya' && subAsuransiLainnya) {
        subAsuransiLainnya.style.display = 'block';
    }
}

function handleJenisAlkonChange() {
    const selectedAlkon = document.querySelector('input[name="jenisAlkon"]:checked');
    const implantSubQuestion = document.getElementById('implantSubQuestion');
    
    // Hide all sub-questions first
    if (implantSubQuestion) implantSubQuestion.style.display = 'none';
    
    if (selectedAlkon) {
        const value = selectedAlkon.value;
        
        // Show relevant sub-question
        if (value === 'Implant' && implantSubQuestion) {
            implantSubQuestion.style.display = 'block';
        }
    }
}

        
        // Update in Google Sheets if online
        let sheetsSuccess = false;
        if (navigator.onLine) {
            try {
                console.log('Converting data for sheets...');
                const sheetsData = window.sheetsAPI.convertLocalToSheets(data);
                console.log('Converted sheets data:', sheetsData);
                
                // Test connection first
                console.log('Testing Google Sheets connection...');
                const connectionTest = await window.sheetsAPI.testConnectionJSONP();
                if (!connectionTest.success) {
                    throw new Error('Koneksi ke Google Sheets gagal: ' + connectionTest.error);
                }
                
                console.log('Calling updateData...');
                const result = await window.sheetsAPI.updateData(sheetsData);
                console.log('Update result received:', result);
                
                if (result && result.success) {
                    sheetsSuccess = true;
                    console.log('✅ Data updated in Google Sheets successfully');
                } else {
                    console.error('❌ Failed to update in sheets:', result ? result.error : 'No result');
                    
                    // Try retry mechanism
                    console.log('Attempting retry...');
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                    
                    const retryResult = await window.sheetsAPI.updateData(sheetsData);
                    if (retryResult && retryResult.success) {
                        sheetsSuccess = true;
                        console.log('✅ Data updated in Google Sheets on retry');
                    } else {
                        throw new Error(retryResult ? retryResult.error : 'Update failed after retry');
                    }
                }
            } catch (error) {
                console.error('❌ Error updating sheets:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                
                // Store error details for user
                window.lastSyncError = {
                    message: error.message,
                    timestamp: new Date().toISOString(),
                    data: sheetsData
                };
            }
        } else {
            console.log('⚠️ Offline - skipping Google Sheets update');
        }
        
        // Update in local IndexedDB (only if DB is available)
        if (db) {
            try {
                await updateLocalData(data);
                console.log('Data updated in local IndexedDB');
            } catch (error) {
                console.warn('Failed to update local data, but continuing:', error);
            }
        }
        
        // Show success message
        if (sheetsSuccess) {
            alert('✅ Data berhasil diupdate dan disinkronkan ke Google Sheets!');
            // Redirect back to home
            window.location.href = 'index.html';
        } else {
            // Check if we're online but still failed
            if (navigator.onLine) {
                let errorMsg = '⚠️ Data berhasil diupdate secara lokal, tetapi gagal disinkronkan ke Google Sheets.\n\n';
                
                if (window.lastSyncError) {
                    errorMsg += 'Detail error: ' + window.lastSyncError.message + '\n\n';
                }
                
                errorMsg += 'Kemungkinan penyebab:\n';
                errorMsg += '• Koneksi internet tidak stabil\n';
                errorMsg += '• Google Apps Script sedang sibuk\n';
                errorMsg += '• Data terlalu besar\n\n';
                errorMsg += 'Solusi:\n';
                errorMsg += '• Periksa koneksi internet\n';
                errorMsg += '• Coba refresh halaman dan edit lagi\n';
                errorMsg += '• Kurangi ukuran data jika terlalu besar\n';
                errorMsg += '• Coba lagi dalam beberapa menit';
                
                alert(errorMsg);
                
                // Show sync error panel
                const syncErrorPanel = document.getElementById('syncErrorPanel');
                if (syncErrorPanel) {
                    syncErrorPanel.style.display = 'block';
                    syncErrorPanel.scrollIntoView({ behavior: 'smooth' });
                }
                
                // Reset button
                const submitBtn = e.target.querySelector('button[type="submit"]');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                
            } else {
                alert('✅ Data berhasil diupdate secara lokal. Akan disinkronkan ke Google Sheets saat online.');
                // Redirect back to home
                window.location.href = 'index.html';
            }
        }
        
    } catch (error) {
        console.error('Error updating data:', error);
        alert('❌ Gagal mengupdate data: ' + error.message);
        
        // Reset button
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Update data in local IndexedDB
async function updateLocalData(data) {
    if (!db) {
        throw new Error('Database not available');
    }
    
    try {
        // Ensure timestamp is in display format before saving to IndexedDB
        if (data.timestamp) {
            console.log('Checking timestamp format before saving to IndexedDB:', data.timestamp);
            
            // If timestamp is in ISO format, convert to display format
            if (typeof data.timestamp === 'string' && 
                !data.timestamp.includes('/') && 
                data.timestamp.includes('T') && 
                data.timestamp.includes('Z')) {
                
                console.log('⚠️ Converting ISO timestamp to display format for IndexedDB');
                
                if (window.timestampUtils && typeof window.timestampUtils.formatTimestampForDisplay === 'function') {
                    data.timestamp = window.timestampUtils.formatTimestampForDisplay(data.timestamp);
                    console.log('✅ Converted timestamp for IndexedDB:', data.timestamp);
                } else {
                    // Manual conversion fallback
                    try {
                        const date = new Date(data.timestamp);
                        if (!isNaN(date.getTime())) {
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            const seconds = date.getSeconds().toString().padStart(2, '0');
                            
                            data.timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                            console.log('✅ Manual conversion for IndexedDB:', data.timestamp);
                        }
                    } catch (error) {
                        console.error('Manual conversion failed:', error);
                    }
                }
            } else {
                console.log('✅ Timestamp already in display format for IndexedDB:', data.timestamp);
            }
        }
        
        const result = await window.dbUtils.updateData(db, data, nikIstri);
        console.log('Data updated in IndexedDB successfully');
        return result;
    } catch (error) {
        console.error('Error updating local data:', error);
        throw error;
    }
}

// Convert file to base64 with optional compression
function fileToBase64(file, maxSizeKB = 2048) {
    return new Promise((resolve, reject) => {
        console.log('=== FILE TO BASE64 CONVERSION ===');
        console.log('Original file size:', (file.size / 1024).toFixed(2) + 'KB');
        
        // If file is already small enough, convert directly
        if (file.size <= maxSizeKB * 1024) {
            console.log('✅ File size OK, converting directly...');
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                console.log('✅ Direct conversion completed');
                resolve(reader.result);
            };
            reader.onerror = error => {
                console.error('❌ Direct conversion failed:', error);
                reject(error);
            };
            return;
        }
        
        // File is too large, try to compress
        console.log('⚠️ File too large, attempting compression...');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            console.log('Original dimensions:', img.width, 'x', img.height);
            
            // Calculate new dimensions (max 1200px width/height)
            let { width, height } = img;
            const maxDimension = 1200;
            
            if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                    height = (height * maxDimension) / width;
                    width = maxDimension;
                } else {
                    width = (width * maxDimension) / height;
                    height = maxDimension;
                }
            }
            
            console.log('Compressed dimensions:', width, 'x', height);
            
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Try different quality levels
            const tryCompress = (quality) => {
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                const compressedSize = compressedDataUrl.length * 0.75; // Approximate size
                
                console.log(`Quality ${quality}: ${(compressedSize / 1024).toFixed(2)}KB`);
                
                if (compressedSize <= maxSizeKB * 1024 || quality <= 0.3) {
                    console.log('✅ Compression completed at quality:', quality);
                    resolve(compressedDataUrl);
                } else {
                    // Try lower quality
                    tryCompress(quality - 0.1);
                }
            };
            
            // Start with 80% quality
            tryCompress(0.8);
        };
        
        img.onerror = () => {
            console.error('❌ Image load failed for compression');
            reject(new Error('Gagal memuat gambar untuk kompresi'));
        };
        
        // Load image for compression
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
        };
        reader.onerror = error => {
            console.error('❌ FileReader error:', error);
            reject(error);
        };
        reader.readAsDataURL(file);
    });
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    errorText.textContent = message;
    errorDiv.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Function to retry sync manually
window.retrySyncToSheets = async function() {
    if (!window.lastSyncError || !window.lastSyncError.data) {
        alert('❌ Tidak ada data yang perlu disinkronkan ulang.');
        return;
    }
    
    if (!navigator.onLine) {
        alert('❌ Tidak ada koneksi internet. Periksa koneksi dan coba lagi.');
        return;
    }
    
    try {
        console.log('🔄 Retrying sync to Google Sheets...');
        console.log('Data to sync:', window.lastSyncError.data);
        
        // Test connection first
        const connectionTest = await window.sheetsAPI.testConnectionJSONP();
        if (!connectionTest.success) {
            throw new Error('Koneksi ke Google Sheets gagal: ' + connectionTest.error);
        }
        
        // Try to update
        const result = await window.sheetsAPI.updateData(window.lastSyncError.data);
        
        if (result && result.success) {
            alert('✅ Data berhasil disinkronkan ke Google Sheets!');
            // Clear the error
            delete window.lastSyncError;
            // Hide sync error panel
            const syncErrorPanel = document.getElementById('syncErrorPanel');
            if (syncErrorPanel) {
                syncErrorPanel.style.display = 'none';
            }
        } else {
            throw new Error(result ? result.error : 'Update failed');
        }
        
    } catch (error) {
        console.error('❌ Retry sync failed:', error);
        alert('❌ Gagal menyinkronkan data: ' + error.message + '\n\nCoba lagi dalam beberapa menit atau periksa koneksi internet.');
    }
};

// Function to diagnose sync issues
window.diagnoseSyncIssue = async function() {
    console.log('🔍 Diagnosing sync issues...');
    
    let diagnosis = '🔍 DIAGNOSIS MASALAH SINKRONISASI\n\n';
    
    // Check internet connection
    if (navigator.onLine) {
        diagnosis += '✅ Koneksi Internet: Online\n';
    } else {
        diagnosis += '❌ Koneksi Internet: Offline\n';
        alert(diagnosis + '\n❌ Tidak ada koneksi internet. Periksa koneksi dan coba lagi.');
        return;
    }
    
    // Test Google Sheets connection
    try {
        diagnosis += '🔄 Testing Google Sheets connection...\n';
        const connectionTest = await window.sheetsAPI.testConnectionJSONP();
        
        if (connectionTest.success) {
            diagnosis += '✅ Google Sheets: Terhubung\n';
        } else {
            diagnosis += '❌ Google Sheets: ' + connectionTest.error + '\n';
        }
    } catch (error) {
        diagnosis += '❌ Google Sheets: Error - ' + error.message + '\n';
    }
    
    // Check last sync error
    if (window.lastSyncError) {
        diagnosis += '\n📋 DETAIL ERROR TERAKHIR:\n';
        diagnosis += 'Waktu: ' + new Date(window.lastSyncError.timestamp).toLocaleString('id-ID') + '\n';
        diagnosis += 'Pesan: ' + window.lastSyncError.message + '\n';
        
        // Check data size
        if (window.lastSyncError.data) {
            const dataStr = JSON.stringify(window.lastSyncError.data);
            diagnosis += 'Ukuran Data: ' + (dataStr.length / 1024).toFixed(2) + ' KB\n';
        }
    } else {
        diagnosis += '\n✅ Tidak ada error sinkronisasi yang tersimpan\n';
    }
    
    diagnosis += '\n💡 SARAN PERBAIKAN:\n';
    diagnosis += '• Pastikan koneksi internet stabil\n';
    diagnosis += '• Kurangi ukuran data jika terlalu besar (max 2MB)\n';
    diagnosis += '• Coba refresh halaman dan edit ulang\n';
    diagnosis += '• Tunggu beberapa menit jika Google Apps Script sibuk\n';
    
    alert(diagnosis);
    console.log(diagnosis);
};

// Function to convert old Google Drive URLs to new format
window.convertGoogleDriveUrl = function(url) {
    if (!url || !url.includes('drive.google.com')) {
        return url;
    }
    
    let fileId = null;
    
    // Extract file ID from various formats
    if (url.includes('/open?id=')) {
        fileId = url.split('/open?id=')[1].split('&')[0];
    } else if (url.includes('/file/d/')) {
        fileId = url.split('/file/d/')[1].split('/')[0];
    } else if (url.includes('id=')) {
        fileId = url.split('id=')[1].split('&')[0];
    }
    
    if (fileId) {
        // Return thumbnail URL for better compatibility
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
    }
    
    return url;
};

// Function to test if Google Drive URL is accessible
window.testGoogleDriveAccess = async function(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(false), 5000);
    });
};

    
    // 5. Test Google Sheets connection
    report += '\n5️⃣ PEMERIKSAAN GOOGLE SHEETS:\n';
    try {
        report += '🔄 Testing koneksi...\n';
        const connectionTest = await window.sheetsAPI.testConnectionJSONP();
        if (connectionTest.success) {
            report += '✅ Koneksi Google Sheets berhasil\n';
        } else {
            report += '❌ Koneksi Google Sheets gagal: ' + connectionTest.error + '\n';
        }
    } catch (error) {
        report += '❌ Error testing koneksi: ' + error.message + '\n';
    }
    
    // 6. Check for previous errors
    report += '\n6️⃣ PEMERIKSAAN ERROR:\n';
    if (window.lastSyncError) {
        report += '⚠️ Ada error sinkronisasi sebelumnya:\n';
        report += 'Waktu: ' + new Date(window.lastSyncError.timestamp).toLocaleString('id-ID') + '\n';
        report += 'Pesan: ' + window.lastSyncError.message + '\n';
    } else {
        report += '✅ Tidak ada error sinkronisasi tersimpan\n';
    }
    
    // 7. Recommendations
    report += '\n💡 REKOMENDASI:\n';
    
    if (!navigator.onLine) {
        report += '• Periksa koneksi internet\n';
    }
    
    if (fileInput && fileInput.files[0] && fileInput.files[0].size > 2 * 1024 * 1024) {
        report += '• Kompres foto sebelum upload (max 2MB)\n';
    }
    
    if (!window.originalData) {
        report += '• Refresh halaman dan coba lagi\n';
    }
    
    report += '• Pastikan foto dalam format JPG/PNG\n';
    report += '• Coba upload foto yang lebih kecil dulu\n';
    report += '• Gunakan koneksi WiFi yang stabil\n';
    
    console.log(report);
    alert(report);
    
    return report;
};

/**
 * Test kompresi foto
 */
window.resetEditForm = function() {
    console.log('🔄 Resetting edit form...');
    
    // Clear form
    const form = document.getElementById('editForm');
    if (form) {
        form.reset();
    }
    
    // Hide previews if present
    const ktpPreview = document.getElementById('ktpPreview');
    if (ktpPreview) {
        ktpPreview.style.display = 'none';
    }
    
    // Clear errors
    delete window.lastSyncError;
    
    // Hide error panels
    const syncErrorPanel = document.getElementById('syncErrorPanel');
    if (syncErrorPanel) {
        syncErrorPanel.style.display = 'none';
    }
    
    console.log('✅ Form reset completed');
    alert('✅ Form berhasil direset. Silakan muat ulang data.');
    
    // Reload data
    loadDataForEdit();
};

// ===== TIMESTAMP UTILS HELPER FUNCTIONS =====

/**
 * Tunggu sampai timestampUtils tersedia dengan enhanced retry mechanism
 */
function waitForTimestampUtils(timeout = 10000) {
    return new Promise((resolve, reject) => {
        console.log('🔧 Waiting for timestampUtils...');
        
        // Check if already available
        if (window.timestampUtils && typeof window.timestampUtils.getEditTimestamp === 'function') {
            console.log('✅ timestampUtils already available');
            resolve(window.timestampUtils);
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 20; // 20 attempts over 10 seconds
        const checkInterval = timeout / maxAttempts;
        
        const checkAvailability = () => {
            attempts++;
            console.log(`🔍 Checking timestampUtils availability (attempt ${attempts}/${maxAttempts})`);
            
            if (window.timestampUtils && typeof window.timestampUtils.getEditTimestamp === 'function') {
                console.log('✅ timestampUtils found and ready');
                resolve(window.timestampUtils);
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('❌ timestampUtils not available after maximum attempts');
                console.log('🔄 Attempting to reload timestamp-utils.js...');
                
                // Try to reload the script
                reloadTimestampUtils()
                    .then(() => {
                        // Give it one more chance after reload
                        setTimeout(() => {
                            if (window.timestampUtils && typeof window.timestampUtils.getEditTimestamp === 'function') {
                                console.log('✅ timestampUtils available after reload');
                                resolve(window.timestampUtils);
                            } else {
                                console.error('❌ timestampUtils still not available after reload');
                                reject(new Error('timestampUtils not available after reload'));
                            }
                        }, 1000);
                    })
                    .catch(reloadError => {
                        console.error('❌ Failed to reload timestampUtils:', reloadError);
                        reject(new Error('timestampUtils not available and reload failed'));
                    });
                return;
            }
            
            // Continue checking
            setTimeout(checkAvailability, checkInterval);
        };
        
        // Start checking
        setTimeout(checkAvailability, 100); // Start after 100ms
    });
}

/**
 * Reload timestamp-utils.js script
 */
function reloadTimestampUtils() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Reloading timestamp-utils.js...');
        
        try {
            // Remove existing script if any
            const existingScripts = document.querySelectorAll('script[src*="timestamp-utils"]');
            existingScripts.forEach(script => {
                console.log('🗑️ Removing existing timestamp-utils script');
                script.remove();
            });
            
            // Create new script element
            const script = document.createElement('script');
            script.src = 'js/timestamp-utils.js?t=' + Date.now(); // Cache busting
            script.async = false; // Ensure synchronous loading
            
            script.onload = () => {
                console.log('✅ timestamp-utils.js reloaded successfully');
                
                // Wait a bit for the script to execute
                setTimeout(() => {
                    if (window.timestampUtils && typeof window.timestampUtils.getEditTimestamp === 'function') {
                        console.log('✅ timestampUtils functions available after reload');
                        resolve();
                    } else {
                        console.error('❌ timestampUtils functions still not available after reload');
                        reject(new Error('Functions not available after script reload'));
                    }
                }, 500);
            };
            
            script.onerror = (error) => {
                console.error('❌ Failed to reload timestamp-utils.js:', error);
                reject(new Error('Script reload failed'));
            };
            
            // Add to head
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('❌ Error in reloadTimestampUtils:', error);
            reject(error);
        }
    });
}

/**
 * Safe timestamp handling dengan enhanced fallback - return format display
 */
async function getSafeTimestamp(originalTimestamp = null) {
    try {
        console.log('🔧 getSafeTimestamp called with:', originalTimestamp);
        
        // Try to get timestampUtils with enhanced waiting
        let timestampUtils;
        try {
            timestampUtils = await waitForTimestampUtils(5000); // Increased timeout
            console.log('✅ timestampUtils obtained successfully');
        } catch (error) {
            console.warn('⚠️ timestampUtils not available, using manual fallback:', error.message);
            return getManualTimestamp(originalTimestamp);
        }
        
        let result;
        if (originalTimestamp) {
            result = timestampUtils.getEditTimestamp(originalTimestamp);
            console.log('✅ Got edit timestamp from utils:', result);
        } else {
            result = timestampUtils.getCurrentTimestampDisplay();
            console.log('✅ Got current timestamp display from utils:', result);
        }
        
        // Pastikan hasilnya dalam format display
        if (result && typeof result === 'string' && result.includes('/') && result.includes(':')) {
            console.log('✅ Timestamp is in correct display format:', result);
            return result;
        } else {
            console.warn('⚠️ Timestamp not in display format, converting:', result);
            // Jika tidak dalam format display, convert
            if (result && !isNaN(new Date(result).getTime())) {
                const date = new Date(result);
                if (date.getFullYear() > 2025) {
                    date.setFullYear(2025);
                }
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                
                const displayFormat = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                console.log('🔧 Converted to display format:', displayFormat);
                return displayFormat;
            }
        }
        
        return result;
        
    } catch (error) {
        console.warn('⚠️ Error in getSafeTimestamp, using manual fallback:', error.message);
        return getManualTimestamp(originalTimestamp);
    }
}

/**
 * Manual timestamp generation when timestampUtils is not available
 */
function getManualTimestamp(originalTimestamp = null) {
    console.log('🔧 Using manual timestamp generation');
    
    try {
        if (originalTimestamp) {
            // Jika sudah format display, pertahankan
            if (typeof originalTimestamp === 'string' && originalTimestamp.includes('/') && originalTimestamp.includes(':')) {
                console.log('✅ Original timestamp already in display format:', originalTimestamp);
                
                // Perbaiki tahun jika perlu
                const parts = originalTimestamp.split(' ');
                if (parts.length === 2) {
                    const datePart = parts[0];
                    const timePart = parts[1];
                    const dateComponents = datePart.split('/');
                    if (dateComponents.length === 3) {
                        let year = parseInt(dateComponents[2]);
                        if (year > 2025) {
                            year = 2025;
                            const corrected = `${dateComponents[0]}/${dateComponents[1]}/${year} ${timePart}`;
                            console.log('🔧 Fixed year in manual fallback:', originalTimestamp, '→', corrected);
                            return corrected;
                        }
                    }
                }
                return originalTimestamp;
            }
            
            // Convert dari ISO ke display format
            const originalDate = new Date(originalTimestamp);
            if (!isNaN(originalDate.getTime())) {
                if (originalDate.getFullYear() > 2025) {
                    originalDate.setFullYear(2025);
                }
                // Return format display: 28/12/2025 20:45:42
                const day = originalDate.getDate().toString().padStart(2, '0');
                const month = (originalDate.getMonth() + 1).toString().padStart(2, '0');
                const year = originalDate.getFullYear();
                const hours = originalDate.getHours().toString().padStart(2, '0');
                const minutes = originalDate.getMinutes().toString().padStart(2, '0');
                const seconds = originalDate.getSeconds().toString().padStart(2, '0');
                
                const displayFormat = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                console.log('🔧 Manual converted ISO to display:', originalTimestamp, '→', displayFormat);
                return displayFormat;
            }
        }
        
        // Fallback untuk timestamp baru - format display
        const now = new Date();
        now.setFullYear(2025);
        now.setMonth(11);
        now.setDate(28);
        
        const day = now.getDate().toString().padStart(2, '0');
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        
        const fallbackTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        console.log('🔧 Manual fallback new timestamp in display format:', fallbackTimestamp);
        return fallbackTimestamp;
        
    } catch (error) {
        console.error('❌ Error in manual timestamp generation:', error);
        // Ultimate fallback
        return '28/12/2025 12:00:00';
    }
}

/**
 * Initialize timestamp utils dengan enhanced retry mechanism
 */
function initializeTimestampUtils() {
    console.log('🔧 Initializing timestamp utils...');
    
    return new Promise((resolve, reject) => {
        // Check if already available
        if (window.timestampUtils && typeof window.timestampUtils.getEditTimestamp === 'function') {
            console.log('✅ Timestamp utils already available');
            resolve();
            return;
        }
        
        console.log('⚠️ timestampUtils not immediately available, attempting initialization...');
        
        // Try multiple initialization strategies
        const initStrategies = [
            // Strategy 1: Wait for existing script to load
            () => waitForTimestampUtils(3000),
            
            // Strategy 2: Reload script if waiting fails
            () => reloadTimestampUtils().then(() => waitForTimestampUtils(2000)),
            
            // Strategy 3: Force reload with different cache buster
            () => {
                console.log('🔄 Trying force reload with different cache buster...');
                return reloadTimestampUtilsForce().then(() => waitForTimestampUtils(2000));
            }
        ];
        
        let currentStrategy = 0;
        
        const tryNextStrategy = () => {
            if (currentStrategy >= initStrategies.length) {
                console.error('❌ All initialization strategies failed');
                // Don't reject, resolve anyway to allow fallback mechanisms
                console.log('🔄 Continuing with fallback mechanisms...');
                resolve();
                return;
            }
            
            const strategy = initStrategies[currentStrategy];
            currentStrategy++;
            
            console.log(`🔄 Trying initialization strategy ${currentStrategy}/${initStrategies.length}`);
            
            strategy()
                .then(() => {
                    console.log(`✅ Strategy ${currentStrategy} succeeded`);
                    resolve();
                })
                .catch(error => {
                    console.warn(`⚠️ Strategy ${currentStrategy} failed:`, error.message);
                    tryNextStrategy();
                });
        };
        
        // Start with first strategy
        tryNextStrategy();
    });
}

/**
 * Force reload timestamp-utils.js with different approach
 */
function reloadTimestampUtilsForce() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Force reloading timestamp-utils.js...');
        
        try {
            // Clear any existing timestampUtils
            if (window.timestampUtils) {
                delete window.timestampUtils;
                console.log('🗑️ Cleared existing timestampUtils');
            }
            
            // Remove all existing timestamp-utils scripts
            const existingScripts = document.querySelectorAll('script[src*="timestamp-utils"]');
            existingScripts.forEach(script => {
                console.log('🗑️ Removing existing script:', script.src);
                script.remove();
            });
            
            // Create new script with unique cache buster
            const script = document.createElement('script');
            const cacheBuster = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            script.src = `js/timestamp-utils.js?force=${cacheBuster}`;
            script.async = false;
            
            script.onload = () => {
                console.log('✅ Force reload completed');
                setTimeout(() => {
                    resolve();
                }, 1000); // Give more time for script execution
            };
            
            script.onerror = (error) => {
                console.error('❌ Force reload failed:', error);
                reject(new Error('Force reload failed'));
            };
            
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('❌ Error in force reload:', error);
            reject(error);
        }
    });
}

// Initialize saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeTimestampUtils().then(() => {
        console.log('🔧 Timestamp utils initialization completed');
    });
});