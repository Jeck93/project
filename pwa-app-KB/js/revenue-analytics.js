// Basic Analytics & Tracking System (No Ads)

class BasicAnalytics {
    constructor() {
        this.analyticsKey = 'basicAnalytics';
        this.sessionStart = Date.now();
        this.pageViews = 0;
        
        this.init();
    }

    init() {
        this.trackPageView();
        this.setupPerformanceTracking();
        this.startSessionTracking();
    }

    // Track page views
    trackPageView() {
        this.pageViews++;
        
        const analytics = this.getAnalytics();
        analytics.totalPageViews = (analytics.totalPageViews || 0) + 1;
        analytics.dailyPageViews = analytics.dailyPageViews || {};
        
        const today = new Date().toISOString().split('T')[0];
        analytics.dailyPageViews[today] = (analytics.dailyPageViews[today] || 0) + 1;
        
        this.saveAnalytics(analytics);
        
        console.log('Page view tracked:', document.title);
    }

    // Track performance metrics
    setupPerformanceTracking() {
        // Track page load time
        window.addEventListener('load', () => {
            const loadTime = performance.now();
            this.trackMetric('pageLoadTime', loadTime);
        });

        // Track user engagement
        let engagementTime = 0;
        let lastActivity = Date.now();
        
        ['click', 'scroll', 'keypress'].forEach(event => {
            document.addEventListener(event, () => {
                const now = Date.now();
                if (now - lastActivity < 30000) { // Count if activity within 30 seconds
                    engagementTime += now - lastActivity;
                }
                lastActivity = now;
            });
        });

        // Save engagement time on page unload
        window.addEventListener('beforeunload', () => {
            this.trackMetric('engagementTime', engagementTime);
        });
    }

    // Track custom metrics
    trackMetric(name, value) {
        const analytics = this.getAnalytics();
        analytics.metrics = analytics.metrics || {};
        analytics.metrics[name] = analytics.metrics[name] || [];
        analytics.metrics[name].push({
            value: value,
            timestamp: Date.now()
        });
        
        this.saveAnalytics(analytics);
    }

    // Generate daily report
    generateDailyReport() {
        const analytics = this.getAnalytics();
        const today = new Date().toISOString().split('T')[0];
        
        const report = {
            date: today,
            pageViews: analytics.dailyPageViews?.[today] || 0,
            totalPageViews: analytics.totalPageViews || 0,
            averageLoadTime: this.getAverageMetric(analytics, 'pageLoadTime'),
            averageEngagement: this.getAverageMetric(analytics, 'engagementTime')
        };
        
        return report;
    }

    // Get average metric value
    getAverageMetric(analytics, metricName) {
        if (!analytics.metrics || !analytics.metrics[metricName]) {
            return 0;
        }
        
        const values = analytics.metrics[metricName];
        const sum = values.reduce((acc, entry) => acc + entry.value, 0);
        return (sum / values.length).toFixed(2);
    }

    // Start session tracking
    startSessionTracking() {
        // Track session duration
        setInterval(() => {
            const sessionDuration = Date.now() - this.sessionStart;
            this.trackMetric('sessionDuration', sessionDuration);
        }, 60000); // Update every minute
    }

    // Export data for analysis
    exportAnalytics() {
        const analytics = this.getAnalytics();
        const report = this.generateDailyReport();
        
        const exportData = {
            summary: report,
            detailed: analytics,
            exportDate: new Date().toISOString()
        };
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Get analytics data from localStorage
    getAnalytics() {
        try {
            return JSON.parse(localStorage.getItem(this.analyticsKey) || '{}');
        } catch (error) {
            console.error('Error reading analytics:', error);
            return {};
        }
    }

    // Save analytics data to localStorage
    saveAnalytics(data) {
        try {
            localStorage.setItem(this.analyticsKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving analytics:', error);
        }
    }

    // Clear old data (keep last 30 days)
    cleanupOldData() {
        const analytics = this.getAnalytics();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Clean up daily page views
        if (analytics.dailyPageViews) {
            Object.keys(analytics.dailyPageViews).forEach(date => {
                if (new Date(date) < thirtyDaysAgo) {
                    delete analytics.dailyPageViews[date];
                }
            });
        }
        
        // Clean up metrics
        if (analytics.metrics) {
            Object.keys(analytics.metrics).forEach(metric => {
                analytics.metrics[metric] = analytics.metrics[metric].filter(
                    entry => entry.timestamp > thirtyDaysAgo.getTime()
                );
            });
        }
        
        this.saveAnalytics(analytics);
    }
}

// Initialize basic analytics
const basicAnalytics = new BasicAnalytics();

// Cleanup old data daily
setInterval(() => {
    basicAnalytics.cleanupOldData();
}, 24 * 60 * 60 * 1000); // Once per day

// Export functions for global use
window.basicAnalytics = basicAnalytics;