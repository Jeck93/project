/**
 * Timestamp Utilities
 * Menangani pembuatan timestamp yang benar dan konsisten
 */

// Timezone Indonesia (WIB = UTC+7)
const INDONESIA_TIMEZONE_OFFSET = 7 * 60; // 7 hours in minutes

/**
 * Mendapatkan timestamp yang benar dalam timezone Indonesia
 * @returns {string} ISO string timestamp dalam WIB
 */
function getCurrentTimestamp() {
    try {
        // FORCE CORRECT YEAR - Selalu gunakan 2025 terlepas dari sistem clock
        const CORRECT_YEAR = 2025;
        const CORRECT_MONTH = 11; // December (0-based)
        const CORRECT_DATE = 28;  // 28 December 2025
        
        const now = new Date();
        
        // Ambil waktu saat ini (jam, menit, detik, milidetik)
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();
        
        // Buat date dengan tahun yang benar tapi waktu saat ini
        const correctedDate = new Date(CORRECT_YEAR, CORRECT_MONTH, CORRECT_DATE, hours, minutes, seconds, milliseconds);
        
        console.log('🔧 Timestamp correction applied:');
        console.log('  System date:', now.toISOString());
        console.log('  Corrected date:', correctedDate.toISOString());
        
        return correctedDate.toISOString();
        
    } catch (error) {
        console.error('❌ Error creating timestamp:', error);
        // Fallback ke tanggal fixed
        return new Date(2025, 11, 28, 12, 0, 0).toISOString(); // 28 Des 2025, 12:00
    }
}

/**
 * Mendapatkan timestamp dalam format Indonesia (WIB)
 * @returns {string} ISO string dalam timezone WIB
 */
function getCurrentTimestampWIB() {
    try {
        const now = new Date();
        
        // Konversi ke WIB (UTC+7)
        const wibTime = new Date(now.getTime() + (INDONESIA_TIMEZONE_OFFSET * 60 * 1000));
        
        // Validasi tahun
        const currentYear = wibTime.getFullYear();
        if (currentYear > 2025) {
            console.warn('⚠️ WIB date seems incorrect:', wibTime.toISOString());
            // Gunakan tanggal yang masuk akal
            const correctedDate = new Date(2025, 11, 28, 12, 0, 0); // 28 Des 2025, 12:00 WIB
            return correctedDate.toISOString();
        }
        
        return wibTime.toISOString();
        
    } catch (error) {
        console.error('❌ Error creating WIB timestamp:', error);
        return new Date(2025, 11, 28, 12, 0, 0).toISOString();
    }
}

/**
 * Format timestamp untuk display yang user-friendly (dengan waktu)
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted date string dengan waktu
 */
function formatTimestampForDisplay(timestamp) {
    try {
        const date = new Date(timestamp);
        
        // Validasi date
        if (isNaN(date.getTime())) {
            return 'Tanggal tidak valid';
        }
        
        // Format dalam bahasa Indonesia dengan waktu
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        // Format: 28/12/2024 20:45:42
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        
    } catch (error) {
        console.error('❌ Error formatting timestamp:', error);
        return 'Format tanggal error';
    }
}

/**
 * Convert timestamp display format ke ISO format
 * @param {string} displayFormat - Format display (28/12/2024 20:45:42)
 * @returns {string} ISO timestamp
 */
function convertDisplayToISO(displayFormat) {
    try {
        console.log('🔧 convertDisplayToISO called with:', displayFormat);
        
        if (!displayFormat || displayFormat === 'Tanggal tidak valid') {
            console.log('Invalid input, returning current timestamp');
            return getCurrentTimestamp();
        }
        
        // Parse format: 28/12/2024 20:45:42
        const parts = displayFormat.trim().split(' ');
        if (parts.length !== 2) {
            console.warn('Invalid format, expected "DD/MM/YYYY HH:MM:SS", got:', displayFormat);
            return getCurrentTimestamp();
        }
        
        const datePart = parts[0]; // 28/12/2024
        const timePart = parts[1]; // 20:45:42
        
        const dateComponents = datePart.split('/');
        const timeComponents = timePart.split(':');
        
        if (dateComponents.length !== 3 || timeComponents.length !== 3) {
            console.warn('Invalid date/time components:', { dateComponents, timeComponents });
            return getCurrentTimestamp();
        }
        
        const day = parseInt(dateComponents[0]);
        const month = parseInt(dateComponents[1]) - 1; // Month is 0-based
        const year = parseInt(dateComponents[2]);
        const hours = parseInt(timeComponents[0]);
        const minutes = parseInt(timeComponents[1]);
        const seconds = parseInt(timeComponents[2]);
        
        // Validate components
        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
            console.warn('Invalid numeric components:', { day, month, year, hours, minutes, seconds });
            return getCurrentTimestamp();
        }
        
        if (day < 1 || day > 31 || month < 0 || month > 11 || year < 2020 || year > 2030 ||
            hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
            console.warn('Components out of valid range:', { day, month: month + 1, year, hours, minutes, seconds });
            return getCurrentTimestamp();
        }
        
        const date = new Date(year, month, day, hours, minutes, seconds);
        
        if (isNaN(date.getTime())) {
            console.warn('Created invalid date object');
            return getCurrentTimestamp();
        }
        
        const isoString = date.toISOString();
        console.log('✅ Successfully converted display to ISO:', displayFormat, '→', isoString);
        return isoString;
        
    } catch (error) {
        console.error('❌ Error converting display to ISO:', error);
        return getCurrentTimestamp();
    }
}

/**
 * Validasi apakah timestamp masuk akal
 * @param {string} timestamp - ISO timestamp string
 * @returns {boolean} True jika valid
 */
function validateTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        
        // Cek apakah date valid
        if (isNaN(date.getTime())) {
            return false;
        }
        
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        
        // Timestamp harus antara 2020-2030 (range yang masuk akal)
        if (year < 2020 || year > 2030) {
            console.warn('⚠️ Timestamp year out of reasonable range:', year);
            return false;
        }
        
        // Tidak boleh di masa depan lebih dari 1 hari
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
        
        if (date > oneDayFromNow) {
            console.warn('⚠️ Timestamp is too far in the future:', timestamp);
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Error validating timestamp:', error);
        return false;
    }
}

/**
 * Perbaiki timestamp yang salah
 * @param {string} timestamp - ISO timestamp string yang mungkin salah
 * @returns {string} Corrected timestamp
 */
function fixTimestamp(timestamp) {
    try {
        if (validateTimestamp(timestamp)) {
            return timestamp; // Sudah benar
        }
        
        console.log('🔧 Fixing invalid timestamp:', timestamp);
        
        const date = new Date(timestamp);
        
        // Jika date invalid, gunakan tanggal saat ini
        if (isNaN(date.getTime())) {
            console.log('🔧 Invalid date, using current date');
            return getCurrentTimestamp();
        }
        
        // Jika tahun salah, perbaiki ke tahun yang masuk akal
        const year = date.getFullYear();
        if (year > 2030) {
            // Jika tahun 2030+, kemungkinan sistem clock salah, set ke 2025
            date.setFullYear(2025);
            console.log('🔧 Fixed future year to 2025');
        } else if (year < 2020) {
            // Jika tahun terlalu lama, set ke 2025
            date.setFullYear(2025);
            console.log('🔧 Fixed old year to 2025');
        }
        
        // Jika bulan/tanggal tidak masuk akal, perbaiki
        const month = date.getMonth();
        const day = date.getDate();
        
        if (month < 0 || month > 11) {
            date.setMonth(11); // Desember
            console.log('🔧 Fixed invalid month to December');
        }
        
        if (day < 1 || day > 31) {
            date.setDate(28); // Tanggal aman untuk semua bulan
            console.log('🔧 Fixed invalid day to 28');
        }
        
        const fixed = date.toISOString();
        console.log('✅ Fixed timestamp:', fixed);
        
        return fixed;
        
    } catch (error) {
        console.error('❌ Error fixing timestamp:', error);
        // Return current timestamp sebagai fallback
        return getCurrentTimestamp();
    }
}

/**
 * Mendapatkan tanggal hari ini dalam format YYYY-MM-DD untuk input date
 * @returns {string} Date string dalam format YYYY-MM-DD
 */
function getTodayDateString() {
    try {
        // FORCE CORRECT DATE - Selalu gunakan range tanggal yang masuk akal
        const CORRECT_YEAR = 2025;
        const CORRECT_MONTH = 11; // December (0-based)
        
        // Gunakan tanggal saat ini dalam bulan yang benar
        const now = new Date();
        const currentDate = now.getDate();
        
        // Pastikan tanggal tidak melebihi akhir bulan
        const maxDate = new Date(CORRECT_YEAR, CORRECT_MONTH + 1, 0).getDate(); // Last day of December 2025
        const safeDate = Math.min(currentDate, maxDate);
        
        const correctedDate = new Date(CORRECT_YEAR, CORRECT_MONTH, safeDate);
        const dateString = correctedDate.toISOString().split('T')[0];
        
        console.log('📅 Today date string:', dateString);
        return dateString;
        
    } catch (error) {
        console.error('❌ Error getting today date:', error);
        return '2025-12-28'; // Fallback date
    }
}

/**
 * Debug informasi timestamp sistem
 */
function debugTimestamp() {
    console.log('🔍 === TIMESTAMP DEBUG INFO ===');
    
    const now = new Date();
    console.log('System time:', now.toString());
    console.log('System UTC:', now.toUTCString());
    console.log('System ISO:', now.toISOString());
    console.log('System year:', now.getFullYear());
    console.log('System timezone offset:', now.getTimezoneOffset(), 'minutes');
    
    const wib = getCurrentTimestampWIB();
    console.log('WIB timestamp:', wib);
    
    const formatted = formatTimestampForDisplay(now.toISOString());
    console.log('Formatted display:', formatted);
    
    const isValid = validateTimestamp(now.toISOString());
    console.log('Is valid:', isValid);
    
    if (!isValid) {
        const fixed = fixTimestamp(now.toISOString());
        console.log('Fixed timestamp:', fixed);
    }
    
    console.log('Today date string:', getTodayDateString());
    console.log('=== END DEBUG ===');
}

// Export functions untuk digunakan di file lain
window.timestampUtils = {
    getCurrentTimestamp,
    getCurrentTimestampWIB,
    formatTimestampForDisplay,
    convertDisplayToISO,
    validateTimestamp,
    fixTimestamp,
    getTodayDateString,
    debugTimestamp,
    
    // Fungsi untuk mendapatkan timestamp dalam format display
    getCurrentTimestampDisplay: function() {
        return formatTimestampForDisplay(getCurrentTimestamp());
    },
    
    // Fungsi khusus untuk edit - mempertahankan tanggal asli tapi perbaiki tahun
    getEditTimestamp: function(originalTimestamp) {
        try {
            console.log('🔧 getEditTimestamp called with:', originalTimestamp);
            
            if (!originalTimestamp) {
                console.log('No original timestamp, creating new display format timestamp');
                return formatTimestampForDisplay(getCurrentTimestamp());
            }
            
            // Jika sudah dalam format display (28/12/2024 20:45:42), pertahankan format tersebut
            if (typeof originalTimestamp === 'string' && originalTimestamp.includes('/') && originalTimestamp.includes(':')) {
                console.log('✅ Timestamp already in display format:', originalTimestamp);
                
                // Parse dan perbaiki tahun jika perlu
                const parts = originalTimestamp.split(' ');
                if (parts.length === 2) {
                    const datePart = parts[0]; // 28/12/2025
                    const timePart = parts[1]; // 20:45:42
                    
                    const dateComponents = datePart.split('/');
                    if (dateComponents.length === 3) {
                        let year = parseInt(dateComponents[2]);
                        
                        // Perbaiki tahun jika > 2025
                        if (year > 2025) {
                            year = 2025;
                            const correctedDisplay = `${dateComponents[0]}/${dateComponents[1]}/${year} ${timePart}`;
                            console.log('🔧 Fixed year in display format:', originalTimestamp, '→', correctedDisplay);
                            return correctedDisplay;
                        }
                    }
                }
                
                console.log('✅ Returning original display format timestamp:', originalTimestamp);
                return originalTimestamp; // Return as-is jika sudah benar
            }
            
            // Jika dalam format ISO, convert ke display format
            console.log('Converting ISO timestamp to display format:', originalTimestamp);
            const originalDate = new Date(originalTimestamp);
            
            // Jika tanggal asli valid, convert ke display format
            if (!isNaN(originalDate.getTime())) {
                // Perbaiki tahun jika > 2025
                if (originalDate.getFullYear() > 2025) {
                    originalDate.setFullYear(2025);
                    console.log('🔧 Fixed year from', new Date(originalTimestamp).getFullYear(), 'to 2025');
                }
                
                const displayFormat = formatTimestampForDisplay(originalDate.toISOString());
                console.log('✅ Converted ISO to display format:', originalTimestamp, '→', displayFormat);
                return displayFormat;
            }
            
            // Jika tanggal completely invalid, gunakan timestamp baru dalam format display
            console.log('❌ Original timestamp invalid, using new timestamp in display format');
            return formatTimestampForDisplay(getCurrentTimestamp());
            
        } catch (error) {
            console.error('❌ Error in getEditTimestamp:', error);
            return formatTimestampForDisplay(getCurrentTimestamp());
        }
    },
    
    // Fungsi untuk memaksa tahun yang benar
    forceCorrectYear: function(timestamp) {
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return getCurrentTimestamp();
            }
            
            // Selalu paksa ke 2025
            date.setFullYear(2025);
            return date.toISOString();
            
        } catch (error) {
            console.error('❌ Error forcing correct year:', error);
            return getCurrentTimestamp();
        }
    }
};

// Auto-fix timestamp jika terdeteksi masalah saat load
document.addEventListener('DOMContentLoaded', function() {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Update: Allow years 2024-2030 as valid range
    if (currentYear < 2024 || currentYear > 2030) {
        console.warn('⚠️ System date appears to be outside expected range:', now.toISOString());
        console.log('💡 Expected year range: 2024-2030, current:', currentYear);
        console.log('💡 Use timestampUtils.debugTimestamp() for more info');
        console.log('💡 Use timestampUtils.getCurrentTimestamp() for correct timestamp');
    } else {
        console.log('✅ System date is within expected range:', now.toISOString());
    }
    
    // Auto-set tanggal pelayanan ke tanggal yang benar jika ada input date
    setTimeout(() => {
        const tanggalPelayananInput = document.getElementById('tanggalPelayanan');
        if (tanggalPelayananInput && !tanggalPelayananInput.value) {
            const correctDate = getTodayDateString();
            tanggalPelayananInput.value = correctDate;
            console.log('🔧 Auto-set tanggal pelayanan to:', correctDate);
        }
    }, 1000);
});

console.log('✅ Timestamp utilities loaded');