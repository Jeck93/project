/**
 * Google Sheets API Integration
 * Handles CRUD operations with Google Sheets
 */

class SheetsAPI {
    constructor() {
        // FORCE USE CONFIG URL - Updated 2024-12-29 to fix refresh issue
        const configUrl = (typeof CONFIG !== 'undefined' && CONFIG.GOOGLE_SCRIPT_URL) ? CONFIG.GOOGLE_SCRIPT_URL : null;
        const savedUrl = localStorage.getItem('googleScriptUrl');
        const fallbackUrl = 'https://script.google.com/macros/s/AKfycbwbkVQyK7Ur1__izMxhxAkC8DJOnHKV5_qAkLfgko98M8KaT3APfrNpyq5Xq6xbzZn5/exec';
        
        // ALWAYS prioritize CONFIG over localStorage to prevent old URL issues
        this.baseUrl = configUrl || fallbackUrl;
        
        // Force clear old localStorage if it doesn't match config
        if (configUrl && savedUrl && savedUrl !== configUrl) {
            console.warn('🔧 FIXING: localStorage has old URL, clearing and updating...');
            console.log('Old URL in localStorage:', savedUrl);
            console.log('New URL from CONFIG:', configUrl);
            localStorage.removeItem('googleScriptUrl');
            localStorage.setItem('googleScriptUrl', configUrl);
        }
        
        // IMPORTANT: Ensure URL always ends with /exec, not /dev
        if (this.baseUrl.includes('/dev')) {
            console.warn('⚠️ Detected /dev URL, fixing to /exec');
            this.baseUrl = this.baseUrl.replace('/dev', '/exec');
        }
        
        // Update localStorage to match config if different
        if (configUrl && savedUrl !== configUrl) {
            localStorage.setItem('googleScriptUrl', configUrl);
            console.log('Updated localStorage URL to match config:', configUrl);
        }
        
        console.log('SheetsAPI initialized with URL:', this.baseUrl);
        this.isOnline = navigator.onLine;
        this.lastConnectionTest = null;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('Connection restored');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('Connection lost');
        });
    }

    /**
     * Enhanced connection test with detailed diagnostics
     */
    async testConnectionDetailed() {
        console.log('🔍 === DETAILED CONNECTION TEST ===');
        console.log('Testing URL:', this.baseUrl);
        
        const results = {
            url: this.baseUrl,
            timestamp: new Date().toISOString(),
            tests: {}
        };
        
        // Test 1: Basic URL validation
        try {
            const url = new URL(this.baseUrl);
            results.tests.urlValidation = {
                success: true,
                protocol: url.protocol,
                hostname: url.hostname,
                pathname: url.pathname
            };
            console.log('✅ URL validation passed');
        } catch (error) {
            results.tests.urlValidation = {
                success: false,
                error: error.message
            };
            console.error('❌ URL validation failed:', error.message);
        }
        
        // Test 2: Network connectivity
        try {
            console.log('🔄 Testing network connectivity...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('https://www.google.com/favicon.ico', {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            results.tests.networkConnectivity = {
                success: true,
                message: 'Network connectivity OK'
            };
            console.log('✅ Network connectivity OK');
        } catch (error) {
            results.tests.networkConnectivity = {
                success: false,
                error: error.message
            };
            console.error('❌ Network connectivity failed:', error.message);
        }
        
        // Test 3: Google Apps Script accessibility
        try {
            console.log('🔄 Testing Google Apps Script accessibility...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                mode: 'no-cors',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            results.tests.gasAccessibility = {
                success: true,
                responseType: response.type,
                status: response.status || 'opaque'
            };
            console.log('✅ Google Apps Script accessible');
        } catch (error) {
            results.tests.gasAccessibility = {
                success: false,
                error: error.message
            };
            console.error('❌ Google Apps Script accessibility failed:', error.message);
        }
        
        // Test 4: JSONP test call
        try {
            console.log('🔄 Testing JSONP functionality...');
            const jsonpResult = await this.testConnectionJSONP();
            results.tests.jsonpFunctionality = jsonpResult;
            
            if (jsonpResult.success) {
                console.log('✅ JSONP functionality OK');
            } else {
                console.error('❌ JSONP functionality failed:', jsonpResult.error);
            }
        } catch (error) {
            results.tests.jsonpFunctionality = {
                success: false,
                error: error.message
            };
            console.error('❌ JSONP test failed:', error.message);
        }
        
        // Test 5: Simple data fetch test
        try {
            console.log('🔄 Testing simple data fetch...');
            const dataResult = await this.getAllDataJSONP();
            results.tests.dataFetch = {
                success: dataResult.success,
                dataCount: dataResult.data ? dataResult.data.length : 0,
                message: dataResult.success ? 'Data fetch successful' : dataResult.error
            };
            
            if (dataResult.success) {
                console.log('✅ Data fetch successful, records:', dataResult.data ? dataResult.data.length : 0);
            } else {
                console.error('❌ Data fetch failed:', dataResult.error);
            }
        } catch (error) {
            results.tests.dataFetch = {
                success: false,
                error: error.message
            };
            console.error('❌ Data fetch test failed:', error.message);
        }
        
        console.log('🔍 === CONNECTION TEST RESULTS ===');
        console.log(results);
        
        // Generate summary
        const passedTests = Object.values(results.tests).filter(test => test.success).length;
        const totalTests = Object.keys(results.tests).length;
        
        console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! Connection should work.');
        } else {
            console.log('⚠️ Some tests failed. Check individual test results above.');
        }
        
        return results;
    }

    /**
     * Quick connection test using JSONP
     */
    async testConnectionJSONP() {
        return new Promise((resolve, reject) => {
            const callbackName = 'test_connection_' + Date.now();
            let timeoutId;
            
            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                if (window[callbackName]) delete window[callbackName];
                const script = document.getElementById(callbackName);
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            };
            
            // Create callback
            window[callbackName] = function(data) {
                cleanup();
                console.log('JSONP connection test successful:', data);
                resolve({ success: true, data: data });
            };
            
            // Set timeout
            timeoutId = setTimeout(() => {
                cleanup();
                console.error('JSONP connection test timeout');
                resolve({ success: false, error: 'Connection timeout' });
            }, 10000);
            
            // Create script
            const script = document.createElement('script');
            script.id = callbackName;
            script.onerror = (error) => {
                cleanup();
                console.error('JSONP connection test failed:', error);
                resolve({ success: false, error: 'Script load error' });
            };
            
            script.src = `${this.baseUrl}?action=test&callback=${callbackName}`;
            document.head.appendChild(script);
        });
    }

    /**
     * Make request with better error handling and CORS fallback
     */
    async makeRequest(url, options = {}) {
        // Check if we're online
        if (!navigator.onLine) {
            throw new Error('Tidak ada koneksi internet');
        }

        console.log('Making request to:', url);
        console.log('Request method:', options.method || 'GET');

        // For GET requests, try CORS first
        if (!options.method || options.method === 'GET') {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'cors',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('GET Response data:', result);
                    return result;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
            } catch (error) {
                console.error('GET request failed:', error);
                throw error;
            }
        }

        // For POST requests, try CORS first, then fallback to no-cors
        if (options.method === 'POST') {
            try {
                console.log('Trying CORS mode for POST request...');
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);
                
                const response = await fetch(url, {
                    method: 'POST',
                    mode: 'cors',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: options.body
                });
                
                clearTimeout(timeoutId);
                
                console.log('POST Response status:', response.status);
                console.log('POST Response type:', response.type);
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('POST Response data:', result);
                    return result;
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
            } catch (error) {
                console.error('CORS POST request failed:', error);
                
                // If CORS fails, try no-cors as fallback
                console.log('Falling back to no-cors mode...');
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000);
                    
                    const response = await fetch(url, {
                        method: 'POST',
                        mode: 'no-cors',
                        signal: controller.signal,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: options.body
                    });
                    
                    clearTimeout(timeoutId);
                    
                    // With no-cors, we can't read the response
                    console.log('POST request sent (no-cors mode)');
                    return { 
                        success: true, 
                        message: 'Data sent successfully (no-cors mode - cannot read response)',
                        timestamp: new Date().toISOString()
                    };
                    
                } catch (noCorsError) {
                    console.error('No-cors POST also failed:', noCorsError);
                    throw error; // Throw the original CORS error
                }
            }
        }

        throw new Error('Unsupported request method');
    }

    /**
     * Get all data from Google Sheets with enhanced error handling and retry mechanism
     */
    async getAllData() {
        try {
            console.log('Getting all data from Google Sheets...');
            
            // First, try a quick connection test to validate the URL
            console.log('🔍 Pre-flight connection test...');
            try {
                const testResult = await this.testConnectionJSONP();
                if (!testResult.success) {
                    console.warn('⚠️ Pre-flight test failed, but continuing with data fetch...');
                }
            } catch (testError) {
                console.warn('⚠️ Pre-flight test error:', testError.message);
            }
            
            // Try JSONP approach with enhanced retry mechanism
            let lastError;
            const maxRetries = 3;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📡 Attempt ${attempt}/${maxRetries}: Getting data via JSONP...`);
                    
                    const result = await this.getAllDataJSONP();
                    
                    if (result && result.success) {
                        console.log(`✅ Data retrieved successfully on attempt ${attempt}`);
                        return result;
                    } else {
                        throw new Error(result ? result.error : 'No data returned');
                    }
                    
                } catch (error) {
                    console.error(`❌ Attempt ${attempt} failed:`, error.message);
                    lastError = error;
                    
                    // If it's a script load error, try some fixes
                    if (error.message.includes('script load error')) {
                        console.log('🔧 Detected script load error, trying fixes...');
                        
                        // Try alternative approaches before retry
                        if (attempt < maxRetries) {
                            const delay = attempt * 2000; // Increasing delay
                            console.log(`⏳ Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                            
                            // Try to clear any cached scripts
                            this.clearCachedScripts();
                            
                            // Try alternative URL format if available
                            if (attempt === 2) {
                                console.log('🔄 Trying alternative URL format...');
                                await this.tryAlternativeUrl();
                            }
                        }
                    } else if (error.message.includes('timeout')) {
                        console.log('⏰ Timeout detected, extending timeout for next attempt...');
                        if (attempt < maxRetries) {
                            const delay = attempt * 3000; // Longer delay for timeout
                            console.log(`⏳ Waiting ${delay}ms before retry...`);
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } else {
                        // For other errors, don't retry
                        console.log('❌ Non-retryable error detected, stopping retries');
                        break;
                    }
                }
            }
            
            // If all retries failed, provide comprehensive error information
            const errorMessage = `Failed to get data after ${maxRetries} attempts. Last error: ${lastError.message}`;
            console.error('❌ All retry attempts failed:', errorMessage);
            
            // Provide specific troubleshooting based on error type
            if (lastError.message.includes('script load error')) {
                const troubleshootingMessage = `${errorMessage}\n\n🔧 TROUBLESHOOTING STEPS:\n\n1. ✅ CHECK GOOGLE APPS SCRIPT:\n   • Open: ${this.baseUrl}\n   • Verify it loads in browser\n   • Check deployment status\n\n2. 🔐 CHECK PERMISSIONS:\n   • Script permissions: "Anyone"\n   • Execution: "Me (your account)"\n   • Access: "Anyone with link"\n\n3. 🌐 CHECK NETWORK:\n   • Internet connection stable\n   • No firewall blocking Google\n   • Try different network/device\n\n4. 🔧 QUICK FIXES:\n   • Clear browser cache (Ctrl+F5)\n   • Disable browser extensions\n   • Try incognito/private mode\n   • Use debug tool: debug-connection.html\n\n5. 📞 GET HELP:\n   • Contact administrator\n   • Provide this error message\n   • Include browser console logs`;
                
                throw new Error(troubleshootingMessage);
            } else if (lastError.message.includes('timeout')) {
                throw new Error(`${errorMessage}\n\n🔧 TIMEOUT SOLUTIONS:\n1. Check internet connection speed\n2. Try again in a few minutes\n3. Google Apps Script may be overloaded\n4. Contact administrator if problem persists\n5. Use debug tool for detailed analysis`);
            } else {
                throw new Error(`${errorMessage}\n\n🔧 GENERAL SOLUTIONS:\n1. Refresh the page (Ctrl+F5)\n2. Check browser console for details\n3. Try debug-connection.html tool\n4. Contact administrator with error details`);
            }
            
        } catch (error) {
            console.error('Error getting data from sheets:', error);
            throw error;
        }
    }

    /**
     * Clear any cached JSONP scripts that might be causing issues
     */
    clearCachedScripts() {
        try {
            console.log('🧹 Clearing cached JSONP scripts...');
            
            // Remove any existing JSONP scripts
            const scripts = document.querySelectorAll('script[id*="jsonp_callback"]');
            scripts.forEach(script => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                    console.log('Removed cached script:', script.id);
                }
            });
            
            // Clear any global callback functions
            Object.keys(window).forEach(key => {
                if (key.startsWith('jsonp_callback_')) {
                    delete window[key];
                    console.log('Cleared callback function:', key);
                }
            });
            
            console.log('✅ Script cache cleared');
        } catch (error) {
            console.warn('Warning: Failed to clear script cache:', error);
        }
    }

    /**
     * Try alternative URL formats or configurations
     */
    async tryAlternativeUrl() {
        try {
            console.log('🔄 Trying alternative URL configurations...');
            
            // Store original URL
            const originalUrl = this.baseUrl;
            
            // Try with different URL parameters (REMOVED /dev endpoint as it's invalid)
            const alternatives = [
                originalUrl + (originalUrl.includes('?') ? '&' : '?') + 'v=' + Date.now(), // Cache busting
                originalUrl + (originalUrl.includes('?') ? '&' : '?') + 'gid=0', // Try with sheet ID
                originalUrl.replace('/dev', '/exec'), // Fix /dev back to /exec if somehow changed
            ];
            
            for (const altUrl of alternatives) {
                try {
                    console.log(`Testing alternative URL: ${altUrl.substring(0, 100)}...`);
                    
                    // Temporarily change URL
                    this.baseUrl = altUrl;
                    
                    // Quick test
                    const testResult = await this.testConnectionJSONP();
                    
                    if (testResult.success) {
                        console.log('✅ Alternative URL works:', altUrl);
                        // Keep the working URL
                        localStorage.setItem('googleScriptUrl', altUrl);
                        return true;
                    }
                } catch (error) {
                    console.log('❌ Alternative URL failed:', error.message);
                }
            }
            
            // Restore original URL if no alternatives worked
            this.baseUrl = originalUrl;
            console.log('⚠️ No alternative URLs worked, restored original');
            return false;
            
        } catch (error) {
            console.warn('Warning: Alternative URL test failed:', error);
            return false;
        }
    }



    /**
     * Get data using JSONP approach with enhanced error handling
     */
    async getAllDataJSONP() {
        return new Promise((resolve, reject) => {
            // Create a unique callback name
            const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            
            console.log('Starting JSONP request with callback:', callbackName);
            console.log('Request URL:', `${this.baseUrl}?action=getData&callback=${callbackName}`);
            
            // Set timeout first
            let timeoutId;
            let script;
            
            // Cleanup function
            let cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                if (window[callbackName]) {
                    delete window[callbackName];
                }
            };
            
            // Create the callback function
            window[callbackName] = function(data) {
                console.log('JSONP callback received data:', data);
                console.log('Data type:', typeof data);
                console.log('Data success:', data ? data.success : 'undefined');
                
                cleanup();
                
                // Validate response
                if (data && typeof data === 'object') {
                    if (data.success) {
                        resolve(data);
                    } else {
                        reject(new Error(data.error || 'Unknown error from server'));
                    }
                } else {
                    reject(new Error('Invalid response format'));
                }
            };
            
            // Create script element
            script = document.createElement('script');
            
            // Enhanced URL construction with error handling
            try {
                const url = new URL(this.baseUrl);
                url.searchParams.set('action', 'getData');
                url.searchParams.set('callback', callbackName);
                url.searchParams.set('_t', Date.now()); // Cache busting
                
                script.src = url.toString();
                console.log('✅ URL constructed successfully:', script.src.substring(0, 100) + '...');
            } catch (urlError) {
                console.error('❌ URL construction failed:', urlError);
                cleanup();
                reject(new Error('Invalid Google Apps Script URL: ' + this.baseUrl));
                return;
            }
            
            // Handle errors with detailed diagnostics
            script.onerror = (error) => {
                console.error('🚨 JSONP SCRIPT ERROR DETAILS:');
                console.error('Error event:', error);
                console.error('Failed URL:', script.src);
                console.error('Script element:', script);
                console.error('Current baseUrl:', this.baseUrl);
                
                // Enhanced diagnostics
                console.error('🔍 ENHANCED DIAGNOSTIC INFORMATION:');
                console.error('1. Network Status:', navigator.onLine ? 'Online' : 'Offline');
                console.error('2. User Agent:', navigator.userAgent);
                console.error('3. Current Time:', new Date().toISOString());
                console.error('4. Script Load Time:', Date.now());
                console.error('5. Callback Name:', callbackName);
                
                // Check URL accessibility
                if (script.src.includes('script.google.com')) {
                    console.error('📋 GOOGLE APPS SCRIPT CHECKLIST:');
                    console.error('   ✓ URL format looks correct (script.google.com)');
                    console.error('   ? Is the script deployed as Web App?');
                    console.error('   ? Are permissions set correctly?');
                    console.error('   ? Is the script published to the latest version?');
                    console.error('   ? Is the script owner account active?');
                    console.error('   ? Are there any Google service outages?');
                } else {
                    console.error('❌ URL does not appear to be a Google Apps Script URL');
                }
                
                // Try to provide more specific error information
                console.error('🛠️ IMMEDIATE TROUBLESHOOTING STEPS:');
                console.error('1. Open this URL in a new tab:', script.src.replace(/[&?]callback=[^&]*/, ''));
                console.error('2. Check if it returns JSON data');
                console.error('3. Verify Google Apps Script deployment');
                console.error('4. Check browser network tab for details');
                
                cleanup();
                reject(new Error('JSONP request failed - script load error. The Google Apps Script may be inaccessible. Check console for detailed diagnostics.'));
            };
            
            script.onload = () => {
                console.log('✅ JSONP script loaded successfully');
                // Note: onload doesn't guarantee the callback was called
                // The actual success/failure is determined by the callback function
            };
            
            // Set timeout with more detailed error message
            timeoutId = setTimeout(() => {
                console.error('⏰ JSONP REQUEST TIMEOUT DETAILS:');
                console.error('Request URL:', script.src);
                console.error('Timeout after: 20 seconds');
                console.error('Callback name:', callbackName);
                console.error('Script loaded:', script.readyState || 'unknown');
                console.error('Network status:', navigator.onLine ? 'Online' : 'Offline');
                
                console.error('🔍 TIMEOUT ANALYSIS:');
                console.error('Possible causes:');
                console.error('1. Google Apps Script is taking too long to respond');
                console.error('2. Network connectivity issues or slow connection');
                console.error('3. Google Apps Script is not properly configured');
                console.error('4. Server overload or maintenance');
                console.error('5. Large dataset causing processing delays');
                console.error('6. Google Apps Script execution quota exceeded');
                
                console.error('💡 TIMEOUT SOLUTIONS:');
                console.error('1. Check internet connection speed');
                console.error('2. Try again in a few minutes');
                console.error('3. Contact administrator to check script performance');
                console.error('4. Consider reducing data size or adding pagination');
                
                cleanup();
                reject(new Error('JSONP request timeout - Google Apps Script tidak merespons dalam 20 detik. Periksa koneksi internet dan coba lagi.'));
            }, 20000); // Increased timeout to 20 seconds
            
            // Add script to DOM with error handling
            try {
                console.log('Adding JSONP script to DOM...');
                
                // Ensure document.head exists
                if (!document.head) {
                    console.error('❌ document.head not available');
                    cleanup();
                    reject(new Error('Document head not available for script injection'));
                    return;
                }
                
                document.head.appendChild(script);
                console.log('✅ Script added to DOM successfully');
                
                // Additional verification
                setTimeout(() => {
                    if (script.parentNode) {
                        console.log('✅ Script still in DOM after 1 second');
                    } else {
                        console.warn('⚠️ Script removed from DOM unexpectedly');
                    }
                }, 1000);
                
            } catch (domError) {
                console.error('❌ Failed to add script to DOM:', domError);
                cleanup();
                reject(new Error('Failed to add script to DOM: ' + domError.message));
            }
        });
    }

    /**
     * Get data by NIK using JSONP (more reliable with Google Apps Script)
     */
    async getDataByNIK(nikIstri) {
        try {
            console.log('Getting data by NIK:', nikIstri);
            console.log('Using JSONP approach...');
            
            return new Promise((resolve, reject) => {
                const callbackName = 'jsonp_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const timeoutId = setTimeout(() => {
                    cleanup();
                    reject(new Error('Request timeout'));
                }, 30000);
                
                // Create callback function
                window[callbackName] = function(data) {
                    cleanup();
                    console.log('JSONP response received:', data);
                    resolve(data);
                };
                
                // Cleanup function
                const cleanup = () => {
                    clearTimeout(timeoutId);
                    delete window[callbackName];
                    if (script && script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                };
                
                // Create script tag for JSONP
                const script = document.createElement('script');
                script.onerror = () => {
                    cleanup();
                    reject(new Error('Failed to load script'));
                };
                
                const url = `${this.baseUrl}?action=getById&id=${encodeURIComponent(nikIstri)}&callback=${callbackName}`;
                console.log('JSONP URL:', url);
                script.src = url;
                
                document.head.appendChild(script);
            });
            
        } catch (error) {
            console.error('Error getting data by NIK:', error);
            throw error;
        }
    }

    /**
     * Create new data entry
     */
    async createData(formData) {
        try {
            const payload = {
                action: 'create',
                ...formData,
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
                })()
            };

            const result = await this.makeRequest(this.baseUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            return result;
        } catch (error) {
            console.error('Error creating data:', error);
            throw error;
        }
    }

    /**
     * Update data using JSONP approach (CORS-safe)
     */
    async updateDataJSONP(formData) {
        try {
            console.log('SheetsAPI.updateDataJSONP called with data:', formData);
            
            return new Promise((resolve, reject) => {
                const callbackName = 'jsonp_update_callback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                let timeoutId;
                
                const cleanup = () => {
                    if (timeoutId) clearTimeout(timeoutId);
                    if (window[callbackName]) delete window[callbackName];
                    const script = document.getElementById(callbackName);
                    if (script && script.parentNode) {
                        script.parentNode.removeChild(script);
                    }
                };
                
                // Set timeout
                timeoutId = setTimeout(() => {
                    console.error('JSONP update request timeout after 30 seconds');
                    cleanup();
                    reject(new Error('Update request timeout - Google Apps Script tidak merespons'));
                }, 30000); // Longer timeout for update operations
                
                // Create callback function
                window[callbackName] = function(data) {
                    console.log('JSONP update response received:', data);
                    cleanup();
                    
                    if (data && data.success) {
                        resolve(data);
                    } else {
                        reject(new Error(data ? data.error : 'Update failed - no response data'));
                    }
                };
                
                // Prepare data for URL encoding
                const updateData = {
                    action: 'update',
                    ...formData,
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
                    callback: callbackName
                };
                
                console.log('Prepared update data:', updateData);
                
                // Build URL with parameters - handle special characters properly
                const params = new URLSearchParams();
                Object.keys(updateData).forEach(key => {
                    const value = updateData[key];
                    if (value !== null && value !== undefined && value !== '') {
                        // Convert to string and handle special characters
                        params.append(key, String(value));
                    }
                });
                
                const url = `${this.baseUrl}?${params.toString()}`;
                console.log('JSONP update URL length:', url.length);
                console.log('JSONP update URL (first 500 chars):', url.substring(0, 500));
                
                // Check URL length (Google Apps Script has URL length limits)
                if (url.length > 8000) {
                    cleanup();
                    
                    // Try without photo if URL is too long
                    if (updateData.fotoKTP) {
                        console.warn('URL too long with photo, trying without photo...');
                        const updateDataWithoutPhoto = { ...updateData };
                        delete updateDataWithoutPhoto.fotoKTP;
                        
                        const paramsWithoutPhoto = new URLSearchParams();
                        Object.keys(updateDataWithoutPhoto).forEach(key => {
                            const value = updateDataWithoutPhoto[key];
                            if (value !== null && value !== undefined && value !== '') {
                                paramsWithoutPhoto.append(key, String(value));
                            }
                        });
                        
                        const urlWithoutPhoto = `${this.baseUrl}?${paramsWithoutPhoto.toString()}`;
                        
                        if (urlWithoutPhoto.length > 8000) {
                            reject(new Error('Data terlalu besar untuk diupdate via JSONP. Coba kurangi panjang teks di field lainnya.'));
                            return;
                        }
                        
                        // Retry without photo
                        const script = document.createElement('script');
                        script.id = callbackName + '_retry';
                        script.onerror = (error) => {
                            console.error('JSONP update script error (without photo):', error);
                            cleanup();
                            reject(new Error('JSONP update request failed - script load error'));
                        };
                        
                        script.onload = () => {
                            console.log('JSONP update script loaded successfully (without photo)');
                        };
                        
                        script.src = urlWithoutPhoto;
                        console.log('Retrying JSONP update without photo...');
                        document.head.appendChild(script);
                        
                        // Show warning to user
                        setTimeout(() => {
                            if (window.alert) {
                                alert('⚠️ Foto KTP tidak dapat diupdate karena ukuran terlalu besar. Data lainnya berhasil diupdate.');
                            }
                        }, 1000);
                        
                        return;
                    }
                    
                    reject(new Error('Data terlalu besar untuk diupdate via JSONP. Coba kurangi ukuran data.'));
                    return;
                }
                
                // Create script tag for JSONP
                const script = document.createElement('script');
                script.id = callbackName;
                script.onerror = (error) => {
                    console.error('JSONP update script error:', error);
                    console.error('Failed URL:', url.substring(0, 200) + '...');
                    cleanup();
                    reject(new Error('JSONP update request failed - script load error. Periksa koneksi internet dan coba lagi.'));
                };
                
                script.onload = () => {
                    console.log('JSONP update script loaded successfully');
                };
                
                script.src = url;
                console.log('Adding JSONP update script to DOM...');
                document.head.appendChild(script);
            });
            
        } catch (error) {
            console.error('Error in updateDataJSONP:', error);
            throw error;
        }
    }

    /**
     * Update existing data (now uses JSONP to avoid CORS issues)
     */
    async updateData(formData) {
        try {
            console.log('SheetsAPI.updateData called, using JSONP approach...');
            return await this.updateDataJSONP(formData);
        } catch (error) {
            console.error('Error updating data:', error);
            throw error;
        }
    }

    /**
     * Delete data by NIK
     */
    async deleteData(nikIstri) {
        try {
            console.log('SheetsAPI.deleteData called with NIK:', nikIstri);
            
            const payload = {
                action: 'delete',
                nikIstri: nikIstri
            };

            console.log('Delete payload:', payload);

            const result = await this.makeRequest(this.baseUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            console.log('Delete result:', result);
            return result;
        } catch (error) {
            console.error('Error deleting data:', error);
            throw error;
        }
    }

    /**
     * Sync local IndexedDB with Google Sheets
     */
    async syncWithSheets() {
        try {
            console.log('Starting sync with Google Sheets...');
            
            // Get data from Google Sheets
            const sheetsResult = await this.getAllData();
            
            if (!sheetsResult.success) {
                throw new Error(sheetsResult.error || 'Failed to get data from sheets');
            }

            // Clear local IndexedDB and populate with sheets data
            if (window.db) {
                const transaction = window.db.transaction(['laporan'], 'readwrite');
                const objectStore = transaction.objectStore('laporan');
                
                // Clear existing data
                await new Promise((resolve, reject) => {
                    const clearRequest = objectStore.clear();
                    clearRequest.onsuccess = () => resolve();
                    clearRequest.onerror = () => reject(clearRequest.error);
                });

                // Add sheets data to IndexedDB
                const sheetsData = sheetsResult.data || [];
                for (const item of sheetsData) {
                    // Convert sheets data to local format
                    const localData = this.convertSheetsToLocal(item);
                    
                    await new Promise((resolve, reject) => {
                        const addRequest = objectStore.add(localData);
                        addRequest.onsuccess = () => resolve();
                        addRequest.onerror = () => reject(addRequest.error);
                    });
                }

                console.log(`Synced ${sheetsData.length} records from Google Sheets`);
                return { success: true, count: sheetsData.length };
            }
            
            throw new Error('IndexedDB not available');
            
        } catch (error) {
            console.error('Error syncing with sheets:', error);
            throw error;
        }
    }

    /**
     * Convert Google Sheets data format to local IndexedDB format
     */
    convertSheetsToLocal(sheetsItem) {
        console.log('Converting sheets data to local format:', sheetsItem);
        
        // Helper function to format date for HTML input
        const formatDateForInput = (dateValue) => {
            if (!dateValue) {
                console.log('formatDateForInput: Empty date value');
                return '';
            }
            
            console.log('formatDateForInput: Processing date value:', dateValue, 'Type:', typeof dateValue);
            
            try {
                let date;
                
                // If it's already a Date object
                if (dateValue instanceof Date) {
                    date = dateValue;
                    console.log('formatDateForInput: Date object detected');
                } 
                // If it's a string, try to parse it
                else if (typeof dateValue === 'string') {
                    const trimmedValue = dateValue.trim();
                    console.log('formatDateForInput: String value (trimmed):', trimmedValue);
                    
                    // Handle ISO datetime format (like "2025-11-07T17:00:00.000Z")
                    if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
                        date = new Date(trimmedValue);
                        console.log('formatDateForInput: ISO datetime format detected');
                    }
                    // Handle YYYY-MM-DD format (most common from Google Sheets)
                    else if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        date = new Date(trimmedValue + 'T00:00:00');
                        console.log('formatDateForInput: YYYY-MM-DD format detected');
                    }
                    // Handle various date formats
                    else if (trimmedValue.includes('/')) {
                        // Handle MM/DD/YYYY or DD/MM/YYYY format
                        const parts = trimmedValue.split('/');
                        if (parts.length === 3) {
                            // Assume DD/MM/YYYY format (common in Indonesia)
                            date = new Date(parts[2], parts[1] - 1, parts[0]);
                            console.log('formatDateForInput: DD/MM/YYYY format detected');
                        }
                    } else if (trimmedValue.includes('-')) {
                        // Handle DD-MM-YYYY format (like "15-05-1980")
                        const parts = trimmedValue.split('-');
                        if (parts.length === 3) {
                            // Check if it's DD-MM-YYYY or YYYY-MM-DD
                            if (parts[0].length === 4) {
                                // YYYY-MM-DD format
                                date = new Date(parts[0], parts[1] - 1, parts[2]);
                                console.log('formatDateForInput: YYYY-MM-DD format detected');
                            } else {
                                // DD-MM-YYYY format
                                date = new Date(parts[2], parts[1] - 1, parts[0]);
                                console.log('formatDateForInput: DD-MM-YYYY format detected');
                            }
                        }
                    } else {
                        date = new Date(trimmedValue);
                        console.log('formatDateForInput: Generic Date() parsing');
                    }
                } 
                // Handle number (timestamp)
                else if (typeof dateValue === 'number') {
                    date = new Date(dateValue);
                    console.log('formatDateForInput: Number timestamp detected');
                } else {
                    console.warn('formatDateForInput: Unexpected date value type:', typeof dateValue, dateValue);
                    return '';
                }
                
                // Check if date is valid
                if (isNaN(date.getTime())) {
                    console.warn('formatDateForInput: Invalid date value:', dateValue);
                    return '';
                }
                
                // Format as YYYY-MM-DD for HTML input
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                
                const result = `${year}-${month}-${day}`;
                console.log('formatDateForInput: Final result:', result);
                return result;
            } catch (error) {
                console.error('Error formatting date:', dateValue, error);
                return '';
            }
        };
        
        console.log('=== CONVERTING SHEETS ITEM ===');
        console.log('Raw sheets item:', sheetsItem);
        console.log('Available columns:', Object.keys(sheetsItem));
        
        const converted = {
            id: sheetsItem.rowNumber || Date.now(), // Use row number as ID
            timestamp: (() => {
                let rawTimestamp = sheetsItem.Timestamp;
                console.log('Processing timestamp from sheets:', rawTimestamp);
                
                if (!rawTimestamp) {
                    console.log('No timestamp from sheets, using current');
                    return window.timestampUtils ? 
                        window.timestampUtils.getCurrentTimestampDisplay() : 
                        (() => {
                            const now = new Date();
                            now.setFullYear(2025);
                            const day = now.getDate().toString().padStart(2, '0');
                            const month = (now.getMonth() + 1).toString().padStart(2, '0');
                            const year = now.getFullYear();
                            const hours = now.getHours().toString().padStart(2, '0');
                            const minutes = now.getMinutes().toString().padStart(2, '0');
                            const seconds = now.getSeconds().toString().padStart(2, '0');
                            return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                        })();
                }
                
                // Jika sudah dalam format display, pertahankan
                if (typeof rawTimestamp === 'string' && rawTimestamp.includes('/') && rawTimestamp.includes(':')) {
                    console.log('Timestamp already in display format:', rawTimestamp);
                    return rawTimestamp;
                }
                
                // Jika dalam format ISO, convert ke display format
                if (window.timestampUtils && typeof window.timestampUtils.formatTimestampForDisplay === 'function') {
                    const displayFormat = window.timestampUtils.formatTimestampForDisplay(rawTimestamp);
                    console.log('Converted sheets timestamp to display format:', rawTimestamp, '→', displayFormat);
                    return displayFormat;
                } else {
                    // Manual conversion fallback
                    try {
                        const date = new Date(rawTimestamp);
                        if (!isNaN(date.getTime())) {
                            const day = date.getDate().toString().padStart(2, '0');
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const year = date.getFullYear();
                            const hours = date.getHours().toString().padStart(2, '0');
                            const minutes = date.getMinutes().toString().padStart(2, '0');
                            const seconds = date.getSeconds().toString().padStart(2, '0');
                            
                            const displayFormat = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                            console.log('Manual conversion to display format:', rawTimestamp, '→', displayFormat);
                            return displayFormat;
                        }
                    } catch (error) {
                        console.error('Manual timestamp conversion failed:', error);
                    }
                }
                
                // Fallback - return as-is or fixed timestamp
                return window.timestampUtils ? 
                    window.timestampUtils.formatTimestampForDisplay(window.timestampUtils.fixTimestamp(rawTimestamp)) : 
                    (() => {
                        try {
                            const date = new Date(rawTimestamp);
                            if (!isNaN(date.getTime())) {
                                const day = date.getDate().toString().padStart(2, '0');
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const year = date.getFullYear();
                                const hours = date.getHours().toString().padStart(2, '0');
                                const minutes = date.getMinutes().toString().padStart(2, '0');
                                const seconds = date.getSeconds().toString().padStart(2, '0');
                                return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
                            }
                        } catch (error) {
                            console.error('Fallback timestamp conversion failed:', error);
                        }
                        return rawTimestamp;
                    })();
            })(),
            akseptorKIE: sheetsItem['Akseptor Hasil KIE PPKBD\n( Khusus MKJP )'] || sheetsItem['Akseptor KIE'] || sheetsItem['Akseptor Hasil KIE PPKBD ( Khusus MKJP )'] || '',
            desa: sheetsItem['Desa Yang Melaporkan'] || sheetsItem.Desa || '',
            tanggalPelayanan: (() => {
                // Try multiple possible column names
                const possibleKeys = [
                    'Tanggal Pelayanan',
                    'tanggal pelayanan', 
                    'Tanggal_Pelayanan',
                    'TanggalPelayanan',
                    'Tanggal',
                    'Date',
                    'tanggal',
                    'Tanggal Pelayanan ', // with trailing space
                    ' Tanggal Pelayanan', // with leading space
                    'Tanggal\nPelayanan', // with newline
                    'Tanggal Pelayanan\n', // with trailing newline
                    'Tgl Pelayanan',
                    'Tgl_Pelayanan',
                    'TglPelayanan',
                    'Waktu Pelayanan',
                    'Tanggal Layanan',
                    'Tanggal Service',
                    'Service Date',
                    'Pelayanan Date',
                    'Tanggal Input',
                    'Input Date'
                ];
                
                let rawDate = null;
                let foundKey = null;
                
                // First, log all available keys for debugging
                console.log('=== DEBUGGING TANGGAL PELAYANAN ===');
                console.log('All available keys in sheetsItem:', Object.keys(sheetsItem));
                console.log('Full sheetsItem data:', sheetsItem);
                
                // Check each possible key
                for (const key of possibleKeys) {
                    console.log(`Checking key "${key}":`, sheetsItem[key]);
                    if (sheetsItem[key] !== undefined && sheetsItem[key] !== null && sheetsItem[key] !== '') {
                        rawDate = sheetsItem[key];
                        foundKey = key;
                        console.log(`✅ Found date with key "${key}":`, rawDate);
                        break;
                    }
                }
                
                // If not found in predefined keys, search for any key containing "tanggal" or "date"
                if (!foundKey) {
                    console.log('Date not found in predefined keys, searching for similar keys...');
                    const allKeys = Object.keys(sheetsItem);
                    for (const key of allKeys) {
                        const lowerKey = key.toLowerCase().trim();
                        if ((lowerKey.includes('tanggal') || lowerKey.includes('date') || lowerKey.includes('pelayanan')) && 
                            sheetsItem[key] !== undefined && sheetsItem[key] !== null && sheetsItem[key] !== '') {
                            rawDate = sheetsItem[key];
                            foundKey = key;
                            console.log(`✅ Found date with similar key "${key}":`, rawDate);
                            break;
                        }
                    }
                }
                
                // If still not found, try to find any column that looks like a date
                if (!foundKey) {
                    console.log('Still no date found, checking for date-like values...');
                    const allKeys = Object.keys(sheetsItem);
                    for (const key of allKeys) {
                        const value = sheetsItem[key];
                        if (value && typeof value === 'string') {
                            // Check if value looks like a date (YYYY-MM-DD, DD/MM/YYYY, etc.)
                            if (value.match(/^\d{4}-\d{2}-\d{2}$/) || 
                                value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/) || 
                                value.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
                                rawDate = value;
                                foundKey = key;
                                console.log(`✅ Found date-like value in column "${key}":`, rawDate);
                                break;
                            }
                        }
                    }
                }
                
                console.log('Final date search result - Found key:', foundKey, 'Raw date:', rawDate);
                
                if (!foundKey) {
                    console.error('❌ No date column found! Available keys:', Object.keys(sheetsItem));
                    console.error('Available keys with values:');
                    Object.keys(sheetsItem).forEach(key => {
                        console.error(`  "${key}": "${sheetsItem[key]}" (${typeof sheetsItem[key]})`);
                    });
                    
                    // Try to suggest possible date columns
                    const suggestions = Object.keys(sheetsItem).filter(key => {
                        const lowerKey = key.toLowerCase();
                        return lowerKey.includes('tanggal') || lowerKey.includes('date') || 
                               lowerKey.includes('waktu') || lowerKey.includes('tgl') ||
                               lowerKey.includes('time') || lowerKey.includes('pelayanan');
                    });
                    
                    if (suggestions.length > 0) {
                        console.warn('💡 Possible date column suggestions:', suggestions);
                    }
                    
                    return 'No Date Found';
                }
                
                const formattedDate = formatDateForInput(rawDate);
                console.log('Formatted date result:', formattedDate);
                
                if (!formattedDate && rawDate) {
                    console.warn('Failed to format date:', rawDate, 'for item:', sheetsItem);
                }
                return formattedDate;
            })(),
            namaSuami: sheetsItem['Nama Suami'] || '',
            umurSuami: sheetsItem['Umur Suami'] || '',
            namaIstri: sheetsItem['Nama Istri'] || '',
            nikIstri: sheetsItem['NIK Istri'] || '',
            tanggalLahirIstri: formatDateForInput(sheetsItem['Tanggal Lahir Istri']),
            alamat: sheetsItem.Alamat || '',
            rt: sheetsItem.RT || '',
            rw: sheetsItem.RW || '',
            noHP: sheetsItem['NO. HP'] || sheetsItem['No HP'] || '',
            jenisAlkon: sheetsItem['Jenis Alkon MKJP & NON MKJP'] || sheetsItem['Jenis Alkon'] || '',
            kepesertaanKB: sheetsItem['Kepesertaan KB'] || '',
            kondisiBaru: sheetsItem['Halaman Untuk Kepesertaan KB Baru'] || sheetsItem['Kondisi Baru'] || '',
            alkonSebelumnya: sheetsItem['Alkon Sebelumnya Yang di Pakai'] || sheetsItem['Alkon Sebelumnya'] || '',
            tempatPelayanan: sheetsItem['Tempat Pelayanan'] || '',
            akseptorPajak: sheetsItem['Asuransi Yang di Pakai'] || sheetsItem.Asuransi || sheetsItem['Akseptor Pajak'] || '',
            fotoKTPUrl: sheetsItem['Foto KTP'] || sheetsItem['Foto KTP (URL)'] || '',
            fotoKTP: sheetsItem['Foto KTP'] || sheetsItem['Foto KTP (URL)'] || '' // Tambahan untuk konsistensi
        };
        
        console.log('Converted data:', converted);
        return converted;
    }

    /**
     * Convert local IndexedDB format to Google Sheets format
     */
    convertLocalToSheets(localItem) {
        console.log('🔧 convertLocalToSheets called with:', localItem);
        
        // Convert timestamp display format ke ISO jika perlu
        let timestamp = localItem.timestamp;
        
        if (timestamp && typeof timestamp === 'string') {
            console.log('Processing timestamp:', timestamp);
            
            // Jika dalam format display (28/12/2024 20:45:42), convert ke ISO
            if (timestamp.includes('/') && timestamp.includes(':')) {
                console.log('Timestamp is in display format, converting to ISO for Sheets');
                
                if (window.timestampUtils && typeof window.timestampUtils.convertDisplayToISO === 'function') {
                    const originalTimestamp = timestamp;
                    timestamp = window.timestampUtils.convertDisplayToISO(timestamp);
                    console.log('🔧 Converting display timestamp to ISO for Sheets:', originalTimestamp, '→', timestamp);
                } else {
                    console.warn('timestampUtils.convertDisplayToISO not available, manual conversion');
                    // Manual conversion fallback
                    try {
                        const parts = timestamp.split(' ');
                        if (parts.length === 2) {
                            const datePart = parts[0]; // 28/12/2024
                            const timePart = parts[1]; // 20:45:42
                            
                            const dateComponents = datePart.split('/');
                            const timeComponents = timePart.split(':');
                            
                            if (dateComponents.length === 3 && timeComponents.length === 3) {
                                const day = parseInt(dateComponents[0]);
                                const month = parseInt(dateComponents[1]) - 1;
                                const year = parseInt(dateComponents[2]);
                                const hours = parseInt(timeComponents[0]);
                                const minutes = parseInt(timeComponents[1]);
                                const seconds = parseInt(timeComponents[2]);
                                
                                const date = new Date(year, month, day, hours, minutes, seconds);
                                if (!isNaN(date.getTime())) {
                                    timestamp = date.toISOString();
                                    console.log('🔧 Manual conversion successful:', timestamp);
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Manual conversion failed:', error);
                    }
                }
            } else {
                console.log('Timestamp appears to be in ISO format already:', timestamp);
            }
        }
        
        const sheetsData = {
            'Timestamp': timestamp,
            'Desa Yang Melaporkan': localItem.desa,
            'Tanggal Pelayanan': localItem.tanggalPelayanan,
            'Nama Suami': localItem.namaSuami,
            'Umur Suami': localItem.umurSuami,
            'Nama Istri': localItem.namaIstri,
            'NIK Istri': localItem.nikIstri,
            'Tanggal Lahir Istri': localItem.tanggalLahirIstri,
            'Alamat': localItem.alamat,
            'RT': localItem.rt,
            'RW': localItem.rw,
            'NO. HP': localItem.noHP,
            'Jenis Alkon MKJP & NON MKJP': localItem.jenisAlkon,
            'Kepesertaan KB': localItem.kepesertaanKB,
            'Tempat Pelayanan': localItem.tempatPelayanan + (localItem.tempatPelayananLainnya ? ' - ' + localItem.tempatPelayananLainnya : ''),
            'Asuransi Yang di Pakai': localItem.akseptorPajak + (localItem.asuransiLainnya ? ' - ' + localItem.asuransiLainnya : ''),
            'Foto KTP': localItem.fotoKTP || localItem.fotoKTPUrl || '',
            'Alkon Sebelumnya Yang di Pakai': localItem.alkonSebelumnya || '',
            'Halaman Untuk Kepesertaan KB Baru': localItem.kondisiBaru || '',
            'Akseptor Hasil KIE PPKBD ( Khusus MKJP )': localItem.akseptorKIE || ''
            // Note: 'Jenis Alkon MKJP & NON MKJP Rumus' dan 'Asuransi Yang di Pakai Rumus' 
            // tidak diisi karena merupakan rumus pribadi Anda
        };
        
        console.log('✅ Converted local data to sheets format:', sheetsData);
        return sheetsData;
    }
}

// Create global instance
window.sheetsAPI = new SheetsAPI();