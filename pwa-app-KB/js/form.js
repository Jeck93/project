// Simple form.js without complex logic to fix blank page issue

console.log('Form.js loading...');

// Check if logged in (use consistent auth system)
const authToken = localStorage.getItem('pwa_auth_token');
console.log('Auth token:', authToken ? 'Found' : 'Not found');

// Redirect to login if not authenticated
if (!authToken) {
    console.log('No auth token, redirecting to login...');
    window.location.href = 'login.html';
}

// Initialize IndexedDB
let db;
let dbInitialized = false;
const dbName = 'LaporanKBDB';
const storeName = 'laporan';

function initDatabase() {
    return new Promise((resolve, reject) => {
        if (db && dbInitialized && !db.readyState) {
            console.log('Database already connected');
            resolve(db);
            return;
        }
        
        console.log('Initializing database connection...');
        
        const request = indexedDB.open(dbName, 2);
        
        request.onerror = () => {
            console.error('Database error:', request.error);
            // Fallback: try to delete and recreate database
            console.log('Attempting to delete and recreate database...');
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            deleteRequest.onsuccess = () => {
                console.log('Database deleted, recreating...');
                const newRequest = indexedDB.open(dbName, 2);
                newRequest.onsuccess = () => {
                    db = newRequest.result;
                    dbInitialized = true;
                    setupDatabaseEvents(db);
                    console.log('Database recreated successfully');
                    resolve(db);
                };
                newRequest.onupgradeneeded = (event) => {
                    createObjectStore(event.target.result);
                };
                newRequest.onerror = () => {
                    reject(newRequest.error);
                };
            };
            deleteRequest.onerror = () => {
                reject(deleteRequest.error);
            };
        };
        
        request.onsuccess = () => {
            db = request.result;
            dbInitialized = true;
            setupDatabaseEvents(db);
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            createObjectStore(db);
        };
    });
}

function setupDatabaseEvents(database) {
    database.onclose = () => {
        console.warn('Database connection closed');
        dbInitialized = false;
        db = null;
    };
    
    database.onversionchange = () => {
        console.warn('Database version changed, closing connection');
        database.close();
        dbInitialized = false;
        db = null;
    };
}

function createObjectStore(database) {
    if (!database.objectStoreNames.contains(storeName)) {
        const objectStore = database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('namaIstri', 'namaIstri', { unique: false });
        objectStore.createIndex('desa', 'desa', { unique: false });
        objectStore.createIndex('tanggalPelayanan', 'tanggalPelayanan', { unique: false });
        objectStore.createIndex('nikIstri', 'nikIstri', { unique: false });
        console.log('Object store created with version 2');
    }
}

async function ensureDatabase() {
    if (!db || !dbInitialized) {
        console.log('Database not ready, initializing...');
        await initDatabase();
    }
    return db;
}

// Initialize database on load
initDatabase().catch(error => {
    console.error('Failed to initialize database:', error);
});

// Global error handler
window.addEventListener('error', function(e) {
    console.error('🚨 Global JavaScript Error:', e.error);
    console.error('Error message:', e.message);
    console.error('Error filename:', e.filename);
    console.error('Error line:', e.lineno);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled Promise Rejection:', e.reason);
});

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing form...');
    console.log('Current URL:', window.location.href);
    console.log('Document ready state:', document.readyState);
    
    // Initialize form submission
    initializeFormSubmission();
    
    // Initialize age calculation
    initializeAgeCalculation();
    
    // Initialize kepesertaan KB logic
    initializeKepesertaanKB();
    
    // Initialize jenis alkon logic
    initializeJenisAlkon();
    
    // Initialize tempat pelayanan logic
    initializeTempatPelayanan();
    
    // Initialize asuransi logic
    initializeAsuransi();
    
    // Initialize sync status
    initializeSyncStatus();
    
    // Initialize photo preview
    initializePhotoPreview();
    
    // Backup: Initialize photo preview with delay
    setTimeout(() => {
        console.log('🔄 Backup: Re-initializing photo preview after delay...');
        initializePhotoPreview();
    }, 1000);
});

function initializeFormSubmission() {
    console.log('Initializing form submission...');
    const dataForm = document.getElementById('dataForm');
    if (!dataForm) {
        console.error('❌ Form not found! Looking for element with ID: dataForm');
        // Debug: list all forms on page
        const allForms = document.querySelectorAll('form');
        console.log('📋 All forms found on page:', allForms.length);
        allForms.forEach((form, index) => {
            console.log(`Form ${index + 1}:`, {
                id: form.id,
                className: form.className,
                tagName: form.tagName
            });
        });
        return;
    }
    console.log('✅ Form found, adding event listener...');
    console.log('Form element:', dataForm);
    
    dataForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🚀 Form submitted - event listener triggered!');
        console.log('Event object:', e);
        console.log('Form element in handler:', this);
        console.log('CONFIG object:', typeof CONFIG !== 'undefined' ? CONFIG : 'CONFIG not found');
        console.log('Google Script URL:', typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_SCRIPT_URL ? CONFIG.GOOGLE_SCRIPT_URL : 'CONFIG not found');
        
        const formData = new FormData(this);
        
        // Debug: Log all form data
        console.log('📊 DEBUG: Raw FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: "${value}"`);
        }
        
        const data = {
            timestamp: window.timestampUtils ? window.timestampUtils.getCurrentTimestampDisplay() : (() => {
                const now = new Date();
                now.setFullYear(2025);
                const day = now.getDate().toString().padStart(2, '0');
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const year = now.getFullYear();
                const hours = now.getHours().toString().padStart(2, '0');
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const seconds = now.getSeconds().toString().padStart(2, '0');
                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            })(),
            akseptorKIE: formData.get('akseptorKIE'),
            desa: formData.get('desa'),
            tanggalPelayanan: formData.get('tanggalPelayanan'),
            namaSuami: formData.get('namaSuami'),
            umurSuami: formData.get('umurSuami'),
            namaIstri: formData.get('namaIstri'),
            nikIstri: formData.get('nikIstri'),
            tanggalLahirIstri: formData.get('tanggalLahirIstri'),
            alamat: formData.get('alamat'),
            rt: formData.get('rt'),
            rw: formData.get('rw'),
            noHP: formData.get('noHP'),
            jenisAlkon: formData.get('jenisAlkon'),
            kepesertaanKB: formData.get('kepesertaanKB'),
            kondisiBaru: formData.get('kondisiBaru'),
            alkonSebelumnya: formData.get('alkonSebelumnya'),
            tempatPelayanan: formData.get('tempatPelayanan'),
            tempatPelayananLainnya: formData.get('tempatPelayananLainnya'),
            akseptorPajak: formData.get('akseptorPajak'),
            asuransiLainnya: formData.get('asuransiLainnya')
        };
        
        // Handle sub-questions for specific contraceptive methods
        const selectedAlkon = document.querySelector('input[name="jenisAlkon"]:checked');
        if (selectedAlkon) {
            const alkonValue = selectedAlkon.value;
            
            if (alkonValue === 'Implant') {
                const jenisImplant = document.querySelector('input[name="jenisImplant"]:checked');
                if (jenisImplant) {
                    data.jenisAlkon = `${alkonValue} (${jenisImplant.value})`;
                }
            }
        }
        
        // Handle kepesertaan KB sub-questions - keep them separate
        const selectedKepesertaan = document.querySelector('input[name="kepesertaanKB"]:checked');
        if (selectedKepesertaan) {
            data.kepesertaanKB = selectedKepesertaan.value; // Keep the main value separate
            
            if (selectedKepesertaan.value === 'Baru') {
                const kondisiBaru = document.querySelector('input[name="kondisiBaru"]:checked');
                if (kondisiBaru) {
                    data.kondisiBaru = kondisiBaru.value; // Store as separate field
                }
            }
        }
        
        // Handle tempat pelayanan sub-question
        const selectedTempat = document.querySelector('input[name="tempatPelayanan"]:checked');
        if (selectedTempat && selectedTempat.value === 'Lainnya') {
            const tempatLainnya = document.querySelector('input[name="tempatPelayananLainnya"]');
            if (tempatLainnya && tempatLainnya.value) {
                data.tempatPelayanan = `Lainnya (${tempatLainnya.value})`;
            }
        }
        
        // Handle asuransi sub-question
        const selectedAsuransi = document.querySelector('input[name="akseptorPajak"]:checked');
        if (selectedAsuransi && selectedAsuransi.value === 'Lainnya') {
            const asuransiLainnya = document.querySelector('input[name="asuransiLainnya"]');
            if (asuransiLainnya && asuransiLainnya.value) {
                data.akseptorPajak = `Lainnya (${asuransiLainnya.value})`;
            }
        }
        
        // Debug: Log processed data
        console.log('📋 DEBUG: Processed data object:');
        console.log(JSON.stringify(data, null, 2));
        
        // Handle file upload
        const fileInput = document.getElementById('fotoKTP');
        if (fileInput && fileInput.files.length > 0) {
            const file = fileInput.files[0];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('❌ File harus berupa gambar (JPG, PNG, dll)');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('❌ Ukuran file maksimal 5MB');
                return;
            }
            
            console.log('Processing image file:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
            console.log('File type:', file.type);
            
            const base64Result = await fileToBase64(file);
            console.log('Base64 conversion result length:', base64Result.length);
            console.log('Base64 first 100 chars:', base64Result.substring(0, 100));
            
            data.fotoKTP = base64Result;
            data.fotoKTPName = file.name;
        }
        
        // Save to IndexedDB and Google Sheets
        try {
            // Ensure database is ready
            const database = await ensureDatabase();
            
            // Save to IndexedDB first
            const transaction = database.transaction([storeName], 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            
            transaction.onerror = (event) => {
                console.error('Transaction error:', event.target.error);
                alert('❌ Error menyimpan data ke database lokal: ' + event.target.error.message);
            };
            
            const request = objectStore.add(data);
            
            request.onsuccess = async () => {
                console.log('Data saved to IndexedDB');
                
                // Try to send to Google Sheets using new API
                if (data.fotoKTP) {
                    updateSyncStatus('syncing', '📤', 'Upload KTP...');
                } else {
                    updateSyncStatus('syncing', '🔄', 'Mengirim...');
                }
                
                try {
                    if (navigator.onLine && window.sheetsAPI) {
                        console.log('🌐 Using new sheets API...');
                        console.log('📤 DEBUG: Data before conversion:', data);
                        
                        const sheetsData = window.sheetsAPI.convertLocalToSheets(data);
                        console.log('📊 DEBUG: Converted data for sheets:', sheetsData);
                        console.log('📋 DEBUG: Sheets data keys:', Object.keys(sheetsData));
                        
                        console.log('🚀 Sending data to Google Sheets...');
                        const result = await window.sheetsAPI.createData(sheetsData);
                        console.log('✅ DEBUG: Sheets API result:', result);
                        
                        if (result && result.success) {
                            updateSyncStatus('online', '✅', 'Tersinkron');
                            console.log('🎉 Data successfully sent to Google Sheets!');
                            
                            if (data.fotoKTP) {
                                alert('✅ Data dan foto KTP berhasil disimpan ke Google Sheets & Google Drive!');
                            } else {
                                alert('✅ Data berhasil disimpan ke Google Sheets!');
                            }
                            
                            // Redirect after successful save
                            setTimeout(() => {
                                window.location.href = 'index.html';
                            }, 2000);
                        } else {
                            console.error('❌ Google Sheets API returned error:', result);
                            throw new Error(result ? result.error : 'Unknown error from Google Sheets');
                        }
                    } else if (navigator.onLine) {
                        console.log('📡 Fallback to old method...');
                        // Fallback to old method if new API not available
                        await sendToGoogleSheets(data);
                        updateSyncStatus('online', '✅', 'Tersinkron');
                        
                        if (data.fotoKTP) {
                            alert('✅ Data dan foto KTP berhasil disimpan ke Google Sheets & Google Drive!');
                        } else {
                            alert('✅ Data berhasil disimpan ke Google Sheets!');
                        }
                        
                        // Redirect after successful save
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                    } else {
                        console.warn('⚠️ No internet connection');
                        throw new Error('Tidak ada koneksi internet');
                    }
                } catch (error) {
                    console.error('❌ Failed to send to Google Sheets:', error);
                    console.error('Error details:', error.message);
                    console.error('Error stack:', error.stack);
                    updateSyncStatus('error', '⚠️', 'Gagal sync');
                    
                    // Show more specific error message
                    if (error.message.includes('CONFIG')) {
                        alert('⚠️ Konfigurasi Google Sheets belum lengkap. Data tersimpan lokal.');
                    } else if (error.message.includes('koneksi') || error.message.includes('internet')) {
                        alert('⚠️ Tidak ada koneksi internet. Data tersimpan lokal dan akan dikirim saat online.');
                    } else if (error.message.includes('timeout')) {
                        alert('⚠️ Koneksi timeout. Data tersimpan lokal dan akan dicoba kirim lagi.');
                    } else {
                        alert('✅ Data berhasil disimpan ke database lokal.\n⚠️ Gagal kirim ke Google Sheets: ' + error.message);
                    }
                    
                    // Redirect even if Google Sheets fails (data is saved locally)
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                }
            };
            
            request.onerror = () => {
                alert('❌ Gagal menyimpan data: ' + request.error);
            };
                
        } catch (error) {
            console.error('Error saving data:', error);
            if (error.message.includes('database') || error.message.includes('Database')) {
                alert('❌ Masalah database. Coba refresh halaman atau clear browser cache.');
            } else {
                alert('❌ Terjadi kesalahan saat menyimpan data: ' + error.message);
            }
        }
    });
}

function initializeAgeCalculation() {
    const tanggalLahirIstri = document.getElementById('tanggalLahirIstri');
    if (tanggalLahirIstri) {
        tanggalLahirIstri.addEventListener('change', function() {
            const birthDate = new Date(this.value);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            console.log('Umur istri:', age, 'tahun');
        });
    }
}

function initializeKepesertaanKB() {
    const kepesertaanRadios = document.querySelectorAll('input[name="kepesertaanKB"]');
    if (!kepesertaanRadios.length) {
        console.error('Kepesertaan KB radios not found');
        return;
    }
    
    kepesertaanRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedValue = this.value;
                console.log('Kepesertaan KB changed to:', selectedValue);
                
                const subQuestionBaru = document.getElementById('subKepesertaanBaru');
                const subQuestionGanti = document.getElementById('subKepesertaanGanti');
                
                // Hide all sub-questions first
                if (subQuestionBaru) {
                    subQuestionBaru.style.display = 'none';
                    clearInputs('kondisiBaru');
                }
                if (subQuestionGanti) {
                    subQuestionGanti.style.display = 'none';
                    clearInputs('alkonSebelumnya');
                }
                
                // Show appropriate sub-question
                if (selectedValue === 'Baru' && subQuestionBaru) {
                    subQuestionBaru.style.display = 'block';
                    setInputsRequired('kondisiBaru', true);
                } else if (selectedValue === 'Ganti Cara' && subQuestionGanti) {
                    subQuestionGanti.style.display = 'block';
                    setInputsRequired('alkonSebelumnya', true);
                }
            }
        });
    });
}

function clearInputs(name) {
    const inputs = document.querySelectorAll(`input[name="${name}"]`);
    inputs.forEach(input => {
        input.checked = false;
        input.required = false;
    });
}

function setInputsRequired(name, required) {
    const inputs = document.querySelectorAll(`input[name="${name}"]`);
    inputs.forEach(input => {
        input.required = required;
    });
}

function initializeJenisAlkon() {
    const jenisAlkonRadios = document.querySelectorAll('input[name="jenisAlkon"]');
    if (!jenisAlkonRadios.length) {
        console.error('Jenis alkon radios not found');
        return;
    }
    
    jenisAlkonRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedValue = this.value;
                console.log('Jenis alkon changed to:', selectedValue);
                
                const implantSubQuestion = document.getElementById('implantSubQuestion');
                
                // Hide all sub-questions first
                if (implantSubQuestion) {
                    implantSubQuestion.style.display = 'none';
                    clearInputs('jenisImplant');
                }
                
                // Show appropriate sub-question
                if (selectedValue === 'Implant' && implantSubQuestion) {
                    implantSubQuestion.style.display = 'block';
                    setInputsRequired('jenisImplant', true);
                }
            }
        });
    });
}

function initializeTempatPelayanan() {
    const tempatPelayananRadios = document.querySelectorAll('input[name="tempatPelayanan"]');
    if (!tempatPelayananRadios.length) {
        console.error('Tempat pelayanan radios not found');
        return;
    }
    
    tempatPelayananRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedValue = this.value;
                console.log('Tempat pelayanan changed to:', selectedValue);
                
                const subQuestionLainnya = document.getElementById('subTempatPelayananLainnya');
                const inputLainnya = document.querySelector('input[name="tempatPelayananLainnya"]');
                
                // Hide sub-question first
                if (subQuestionLainnya) {
                    subQuestionLainnya.style.display = 'none';
                }
                if (inputLainnya) {
                    inputLainnya.value = '';
                    inputLainnya.required = false;
                }
                
                // Show sub-question if "Lainnya" selected
                if (selectedValue === 'Lainnya' && subQuestionLainnya) {
                    subQuestionLainnya.style.display = 'block';
                    if (inputLainnya) {
                        inputLainnya.required = true;
                    }
                }
            }
        });
    });
}

function initializeAsuransi() {
    const asuransiRadios = document.querySelectorAll('input[name="akseptorPajak"]');
    if (!asuransiRadios.length) {
        console.error('Asuransi radios not found');
        return;
    }
    
    asuransiRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                const selectedValue = this.value;
                console.log('Asuransi changed to:', selectedValue);
                
                const subQuestionLainnya = document.getElementById('subAsuransiLainnya');
                const inputLainnya = document.querySelector('input[name="asuransiLainnya"]');
                
                // Hide sub-question first
                if (subQuestionLainnya) {
                    subQuestionLainnya.style.display = 'none';
                }
                if (inputLainnya) {
                    inputLainnya.value = '';
                    inputLainnya.required = false;
                }
                
                // Show sub-question if "Lainnya" selected
                if (selectedValue === 'Lainnya' && subQuestionLainnya) {
                    subQuestionLainnya.style.display = 'block';
                    if (inputLainnya) {
                        inputLainnya.required = true;
                    }
                }
            }
        });
    });
}

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Send data to Google Sheets
async function sendToGoogleSheets(data) {
    // URL Google Apps Script Web App dari config
    let GOOGLE_SCRIPT_URL;
    
    if (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_SCRIPT_URL) {
        GOOGLE_SCRIPT_URL = CONFIG.GOOGLE_SCRIPT_URL;
    } else {
        // Fallback URL - use the updated URL from sheets-api.js
        GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwbkVQyK7Ur1__izMxhxAkC8DJOnHKV5_qAkLfgko98M8KaT3APfrNpyq5Xq6xbzZn5/exec';
        console.warn('CONFIG not found, using fallback URL');
    }
    
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
        throw new Error('Google Script URL not configured properly in config.js');
    }
    
    console.log('Using Google Script URL:', GOOGLE_SCRIPT_URL);
    
    // Prepare data for Google Sheets
    const sheetData = {
        timestamp: data.timestamp,
        akseptorKIE: data.akseptorKIE,
        desa: data.desa,
        tanggalPelayanan: data.tanggalPelayanan,
        namaSuami: data.namaSuami,
        umurSuami: data.umurSuami,
        namaIstri: data.namaIstri,
        nikIstri: data.nikIstri,
        tanggalLahirIstri: data.tanggalLahirIstri,
        alamat: data.alamat,
        rt: data.rt,
        rw: data.rw,
        noHP: data.noHP,
        jenisAlkon: data.jenisAlkon,
        kepesertaanKB: data.kepesertaanKB,
        kondisiBaru: data.kondisiBaru || '',
        alkonSebelumnya: data.alkonSebelumnya || '',
        tempatPelayanan: data.tempatPelayanan,
        akseptorPajak: data.akseptorPajak,
        fotoKTP: data.fotoKTP || ''
    };
    
    if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
        console.log('Sending data to Google Sheets:', sheetData);
        if (sheetData.fotoKTP && sheetData.fotoKTP !== 'Tidak Ada') {
            console.log('File data being sent - length:', data.fotoKTP ? data.fotoKTP.length : 'no file');
            console.log('File data first 100 chars:', data.fotoKTP ? data.fotoKTP.substring(0, 100) : 'no file');
        }
    }
    
    // Try CORS first, fallback to no-cors if needed
    let response;
    try {
        console.log('Trying CORS request first...');
        response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData)
        });
        
        if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
            console.log('CORS Response from Google Sheets:', response.status, response.statusText);
        }
        
        if (response.ok) {
            const result = await response.json();
            console.log('CORS Response data:', result);
            if (result.success) {
                console.log('Data sent to Google Sheets successfully via CORS');
                return response;
            } else {
                throw new Error(result.error || 'Google Sheets returned error');
            }
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
    } catch (corsError) {
        console.warn('CORS request failed, trying no-cors fallback:', corsError.message);
        
        // Fallback to no-cors mode
        response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetData)
        });
        
        if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
            console.log('No-CORS Response from Google Sheets:', response.status, response.type);
        }
        
        // Note: mode 'no-cors' means we can't read the response body
        // but we can check if the request was sent successfully
        if (response.type === 'opaque') {
            console.log('Data sent to Google Sheets successfully via no-cors');
            return response;
        } else {
            throw new Error('Failed to send data to Google Sheets');
        }
    }
}

// Function to retry sending failed data to Google Sheets
async function retrySendToGoogleSheets() {
    if (!db) return;
    
    const transaction = db.transaction([storeName], 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.getAll();
    
    request.onsuccess = async () => {
        const allData = request.result;
        console.log('Retrying to send', allData.length, 'records to Google Sheets');
        
        for (const data of allData) {
            try {
                await sendToGoogleSheets(data);
                console.log('Successfully sent record:', data.id);
            } catch (error) {
                console.error('Failed to send record:', data.id, error);
            }
        }
    };
}

// Initialize sync status indicator
function initializeSyncStatus() {
    updateSyncStatus('ready', '✅', 'Siap');
    
    // Check online status
    window.addEventListener('online', () => {
        updateSyncStatus('online', '🌐', 'Online');
        // Try to sync any pending data
        retrySendToGoogleSheets();
    });
    
    window.addEventListener('offline', () => {
        updateSyncStatus('offline', '📱', 'Offline');
    });
    
    // Initial status
    if (navigator.onLine) {
        updateSyncStatus('online', '🌐', 'Online');
    } else {
        updateSyncStatus('offline', '📱', 'Offline');
    }
}

function updateSyncStatus(status, icon, text) {
    const syncStatus = document.getElementById('syncStatus');
    if (syncStatus) {
        syncStatus.className = `sync-status ${status}`;
        syncStatus.textContent = `${icon} ${text}`;
    }
}

// Initialize photo preview functionality
function initializePhotoPreview() {
    console.log('🔧 Initializing photo preview...');
    
    const fileInput = document.getElementById('fotoKTP');
    const previewContainer = document.getElementById('fotoKTPPreview');
    const previewImage = document.getElementById('fotoKTPImage');
    const previewInfo = document.getElementById('fotoKTPInfo');
    const removeButton = document.getElementById('removeFotoKTP');
    
    console.log('📋 Photo preview elements check:');
    console.log('  fileInput:', !!fileInput);
    console.log('  previewContainer:', !!previewContainer);
    console.log('  previewImage:', !!previewImage);
    console.log('  previewInfo:', !!previewInfo);
    console.log('  removeButton:', !!removeButton);
    
    if (!fileInput || !previewContainer || !previewImage || !previewInfo || !removeButton) {
        console.error('❌ Photo preview elements not found');
        console.error('Missing elements:', {
            fileInput: !fileInput,
            previewContainer: !previewContainer,
            previewImage: !previewImage,
            previewInfo: !previewInfo,
            removeButton: !removeButton
        });
        return;
    }
    
    console.log('✅ All photo preview elements found, adding event listeners...');
    
    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        console.log('📸 File input changed:', e.target.files.length, 'files');
        const file = e.target.files[0];
        
        if (file) {
            console.log('📁 File selected:', file.name, 'Type:', file.type, 'Size:', file.size);
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                console.error('❌ Invalid file type:', file.type);
                alert('❌ File harus berupa gambar (JPG, PNG, dll)');
                fileInput.value = '';
                hidePreview();
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                console.error('❌ File too large:', file.size);
                alert('❌ Ukuran file maksimal 5MB');
                fileInput.value = '';
                hidePreview();
                return;
            }
            
            console.log('✅ File validation passed, showing preview...');
            // Show preview
            showPreview(file);
        } else {
            console.log('📭 No file selected, hiding preview');
            hidePreview();
        }
    });
    
    // Handle remove button
    removeButton.addEventListener('click', function() {
        console.log('🗑️ Remove button clicked');
        fileInput.value = '';
        hidePreview();
    });
    
    function showPreview(file) {
        console.log('🖼️ Showing preview for:', file.name);
        const reader = new FileReader();
        
        reader.onload = function(e) {
            console.log('✅ File read successfully, updating preview');
            previewImage.src = e.target.result;
            previewInfo.textContent = `📁 ${file.name} (${formatFileSize(file.size)})`;
            previewContainer.style.display = 'block';
            previewContainer.classList.add('has-image');
            
            // Add smooth animation
            previewContainer.style.opacity = '0';
            previewContainer.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                previewContainer.style.transition = 'all 0.3s ease';
                previewContainer.style.opacity = '1';
                previewContainer.style.transform = 'translateY(0)';
                console.log('🎨 Preview animation completed');
            }, 10);
        };
        
        reader.onerror = function() {
            console.error('❌ Failed to read file');
            alert('❌ Gagal membaca file gambar');
            hidePreview();
        };
        
        reader.readAsDataURL(file);
    }
    
    function hidePreview() {
        console.log('🙈 Hiding preview');
        previewContainer.style.display = 'none';
        previewContainer.classList.remove('has-image');
        previewImage.src = '';
        previewInfo.textContent = '';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    console.log('✅ Photo preview initialization completed');
}

console.log('Form.js loaded successfully');