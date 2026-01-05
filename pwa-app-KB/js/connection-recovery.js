/**
 * Connection Recovery and Diagnostic Tool
 * Provides advanced troubleshooting and recovery mechanisms for JSONP connection issues
 */

class ConnectionRecovery {
    constructor(sheetsAPI) {
        this.sheetsAPI = sheetsAPI;
        this.diagnosticResults = {};
        this.recoveryAttempts = 0;
        this.maxRecoveryAttempts = 5;
    }

    /**
     * Comprehensive connection diagnosis and recovery
     */
    async diagnoseAndRecover() {
        console.log('🔧 === STARTING CONNECTION DIAGNOSIS AND RECOVERY ===');
        
        try {
            // Step 1: Basic connectivity check
            console.log('📡 Step 1: Basic connectivity check...');
            const connectivityResult = await this.checkBasicConnectivity();
            this.diagnosticResults.connectivity = connectivityResult;
            
            if (!connectivityResult.success) {
                throw new Error('Basic connectivity failed: ' + connectivityResult.error);
            }
            
            // Step 2: Google Apps Script URL validation
            console.log('🔍 Step 2: URL validation...');
            const urlResult = await this.validateGoogleAppsScriptUrl();
            this.diagnosticResults.urlValidation = urlResult;
            
            // Step 3: JSONP functionality test
            console.log('📡 Step 3: JSONP functionality test...');
            const jsonpResult = await this.testJSONPFunctionality();
            this.diagnosticResults.jsonp = jsonpResult;
            
            if (jsonpResult.success) {
                console.log('✅ Connection diagnosis successful - JSONP is working');
                return { success: true, message: 'Connection recovered successfully' };
            }
            
            // Step 4: Recovery attempts
            console.log('🛠️ Step 4: Attempting connection recovery...');
            const recoveryResult = await this.attemptRecovery();
            
            return recoveryResult;
            
        } catch (error) {
            console.error('❌ Diagnosis and recovery failed:', error);
            return {
                success: false,
                error: error.message,
                diagnostics: this.diagnosticResults,
                recommendations: this.generateRecommendations()
            };
        }
    }

    /**
     * Check basic internet connectivity
     */
    async checkBasicConnectivity() {
        try {
            console.log('Testing basic internet connectivity...');
            
            // Test multiple endpoints for reliability
            const testEndpoints = [
                'https://www.google.com/favicon.ico',
                'https://www.googleapis.com/favicon.ico',
                'https://script.google.com/favicon.ico'
            ];
            
            let successCount = 0;
            const results = [];
            
            for (const endpoint of testEndpoints) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch(endpoint, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    successCount++;
                    results.push({ endpoint, success: true });
                    console.log(`✅ ${endpoint}: OK`);
                    
                } catch (error) {
                    results.push({ endpoint, success: false, error: error.message });
                    console.log(`❌ ${endpoint}: ${error.message}`);
                }
            }
            
            const connectivityRatio = successCount / testEndpoints.length;
            
            if (connectivityRatio >= 0.5) {
                return {
                    success: true,
                    ratio: connectivityRatio,
                    results: results,
                    message: `Connectivity OK (${successCount}/${testEndpoints.length} endpoints accessible)`
                };
            } else {
                return {
                    success: false,
                    ratio: connectivityRatio,
                    results: results,
                    error: `Poor connectivity (${successCount}/${testEndpoints.length} endpoints accessible)`
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate Google Apps Script URL
     */
    async validateGoogleAppsScriptUrl() {
        try {
            console.log('Validating Google Apps Script URL...');
            
            const url = this.sheetsAPI.baseUrl;
            console.log('Testing URL:', url);
            
            // Basic URL format validation
            if (!url || typeof url !== 'string') {
                return { success: false, error: 'URL is empty or invalid' };
            }
            
            if (!url.includes('script.google.com')) {
                return { success: false, error: 'URL is not a Google Apps Script URL' };
            }
            
            if (!url.includes('/exec')) {
                return { success: false, error: 'URL does not end with /exec (may not be deployed as Web App)' };
            }
            
            // Try to access the URL directly
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);
                
                const response = await fetch(url, {
                    method: 'GET',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                return {
                    success: true,
                    message: 'URL is accessible',
                    responseType: response.type,
                    status: response.status || 'opaque'
                };
                
            } catch (fetchError) {
                return {
                    success: false,
                    error: 'URL is not accessible: ' + fetchError.message,
                    suggestion: 'Check if Google Apps Script is deployed correctly'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test JSONP functionality with enhanced diagnostics
     */
    async testJSONPFunctionality() {
        try {
            console.log('Testing JSONP functionality...');
            
            const result = await this.sheetsAPI.testConnectionJSONP();
            
            if (result.success) {
                return {
                    success: true,
                    message: 'JSONP functionality working correctly',
                    data: result.data
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'JSONP test failed',
                    suggestion: 'Check Google Apps Script doGet function'
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                suggestion: 'JSONP request failed - check script deployment and permissions'
            };
        }
    }

    /**
     * Attempt various recovery methods
     */
    async attemptRecovery() {
        console.log('🛠️ Starting recovery attempts...');
        
        const recoveryMethods = [
            { name: 'Clear Cache and Retry', method: this.recoveryClearCache.bind(this) },
            { name: 'Alternative URL Format', method: this.recoveryAlternativeUrl.bind(this) },
            { name: 'Force Script Reload', method: this.recoveryForceReload.bind(this) },
            { name: 'Bypass Cache', method: this.recoveryBypassCache.bind(this) },
            { name: 'Extended Timeout', method: this.recoveryExtendedTimeout.bind(this) }
        ];
        
        for (const recovery of recoveryMethods) {
            if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
                console.log('❌ Maximum recovery attempts reached');
                break;
            }
            
            try {
                console.log(`🔧 Attempting: ${recovery.name}...`);
                this.recoveryAttempts++;
                
                const result = await recovery.method();
                
                if (result.success) {
                    console.log(`✅ Recovery successful with: ${recovery.name}`);
                    return {
                        success: true,
                        method: recovery.name,
                        message: 'Connection recovered successfully',
                        attempts: this.recoveryAttempts
                    };
                } else {
                    console.log(`❌ Recovery failed with: ${recovery.name} - ${result.error}`);
                }
                
            } catch (error) {
                console.log(`❌ Recovery method failed: ${recovery.name} - ${error.message}`);
            }
            
            // Wait between attempts
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        return {
            success: false,
            error: 'All recovery methods failed',
            attempts: this.recoveryAttempts,
            recommendations: this.generateRecommendations()
        };
    }

    /**
     * Recovery method: Clear cache and retry
     */
    async recoveryClearCache() {
        try {
            console.log('Clearing cache and retrying...');
            
            // Clear JSONP scripts
            this.sheetsAPI.clearCachedScripts();
            
            // Clear localStorage
            localStorage.removeItem('googleScriptUrl');
            
            // Clear browser cache if possible
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Reinitialize SheetsAPI
            this.sheetsAPI = new SheetsAPI();
            
            // Test connection
            const result = await this.sheetsAPI.testConnectionJSONP();
            return result;
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Recovery method: Try alternative URL format
     */
    async recoveryAlternativeUrl() {
        try {
            console.log('Trying alternative URL format...');
            
            const originalUrl = this.sheetsAPI.baseUrl;
            
            // Try different URL variations
            const alternatives = [
                originalUrl + '?v=' + Date.now(),
                originalUrl.replace('/exec', '/dev'),
                originalUrl + '&gid=0',
                originalUrl + '?usp=sharing'
            ];
            
            for (const altUrl of alternatives) {
                try {
                    this.sheetsAPI.baseUrl = altUrl;
                    const result = await this.sheetsAPI.testConnectionJSONP();
                    
                    if (result.success) {
                        // Save working URL
                        localStorage.setItem('googleScriptUrl', altUrl);
                        return { success: true, workingUrl: altUrl };
                    }
                } catch (error) {
                    console.log(`Alternative URL failed: ${altUrl}`);
                }
            }
            
            // Restore original URL
            this.sheetsAPI.baseUrl = originalUrl;
            return { success: false, error: 'No alternative URLs worked' };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Recovery method: Force script reload
     */
    async recoveryForceReload() {
        try {
            console.log('Forcing script reload...');
            
            // Remove all existing scripts
            const scripts = document.querySelectorAll('script[src*="script.google.com"]');
            scripts.forEach(script => {
                if (script.parentNode) {
                    script.parentNode.removeChild(script);
                }
            });
            
            // Clear all JSONP callbacks
            Object.keys(window).forEach(key => {
                if (key.startsWith('jsonp_callback_')) {
                    delete window[key];
                }
            });
            
            // Wait a moment
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Test connection
            const result = await this.sheetsAPI.testConnectionJSONP();
            return result;
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Recovery method: Bypass cache
     */
    async recoveryBypassCache() {
        try {
            console.log('Bypassing cache...');
            
            const originalUrl = this.sheetsAPI.baseUrl;
            const cacheBustUrl = originalUrl + (originalUrl.includes('?') ? '&' : '?') + '_cb=' + Date.now() + Math.random();
            
            this.sheetsAPI.baseUrl = cacheBustUrl;
            
            const result = await this.sheetsAPI.testConnectionJSONP();
            
            if (result.success) {
                // Keep the cache-busted URL
                localStorage.setItem('googleScriptUrl', cacheBustUrl);
                return { success: true };
            } else {
                // Restore original URL
                this.sheetsAPI.baseUrl = originalUrl;
                return { success: false, error: 'Cache bypass failed' };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Recovery method: Extended timeout
     */
    async recoveryExtendedTimeout() {
        try {
            console.log('Testing with extended timeout...');
            
            // This would require modifying the JSONP timeout, which is handled in the main function
            // For now, just test if a longer wait helps
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const result = await this.sheetsAPI.testConnectionJSONP();
            return result;
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Generate recommendations based on diagnostic results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (!this.diagnosticResults.connectivity?.success) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Network',
                issue: 'Internet connectivity problems',
                solutions: [
                    'Check your internet connection',
                    'Try a different network (mobile hotspot)',
                    'Disable VPN if active',
                    'Check firewall settings'
                ]
            });
        }
        
        if (!this.diagnosticResults.urlValidation?.success) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Configuration',
                issue: 'Google Apps Script URL problems',
                solutions: [
                    'Verify the Google Apps Script URL is correct',
                    'Check if the script is deployed as Web App',
                    'Ensure permissions are set to "Anyone"',
                    'Republish the script to latest version'
                ]
            });
        }
        
        if (!this.diagnosticResults.jsonp?.success) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Browser',
                issue: 'JSONP functionality problems',
                solutions: [
                    'Clear browser cache and cookies',
                    'Disable browser extensions temporarily',
                    'Try incognito/private browsing mode',
                    'Update your browser to latest version'
                ]
            });
        }
        
        // General recommendations
        recommendations.push({
            priority: 'LOW',
            category: 'General',
            issue: 'General troubleshooting',
            solutions: [
                'Wait a few minutes and try again',
                'Contact your administrator',
                'Use the debug-connection.html tool',
                'Check Google Apps Script execution logs'
            ]
        });
        
        return recommendations;
    }

    /**
     * Generate user-friendly error report
     */
    generateErrorReport() {
        const report = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: this.sheetsAPI.baseUrl,
            diagnostics: this.diagnosticResults,
            recoveryAttempts: this.recoveryAttempts,
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ConnectionRecovery = ConnectionRecovery;
}