/**
 * Trend Regression Analysis
 * Linear regression untuk mendeteksi trend direction dan strength
 */

class TrendRegression {
    constructor() {
        this.regressionPeriod = 20; // Default period untuk regression
    }

    /**
     * Calculate Linear Regression Line
     * @param {Array} prices - Array of price data
     * @param {number} period - Regression period
     */
    calculateLinearRegression(prices, period = this.regressionPeriod) {
        if (prices.length < period) return null;
        
        const recentPrices = prices.slice(-period);
        const n = recentPrices.length;
        
        // Create x values (time index)
        const x = Array.from({length: n}, (_, i) => i);
        const y = recentPrices;
        
        // Calculate regression coefficients
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        // Linear regression formula: y = mx + b
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared (correlation strength)
        const yMean = sumY / n;
        const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const residualSumSquares = y.reduce((sum, yi, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);
        
        const rSquared = 1 - (residualSumSquares / totalSumSquares);
        
        // Generate regression line points
        const regressionLine = x.map(xi => slope * xi + intercept);
        
        return {
            slope: slope,
            intercept: intercept,
            rSquared: rSquared,
            line: regressionLine,
            strength: this.calculateTrendStrength(slope, rSquared),
            direction: this.getTrendDirection(slope),
            angle: Math.atan(slope) * (180 / Math.PI) // Convert to degrees
        };
    }

    /**
     * Calculate trend strength based on slope and R-squared
     */
    calculateTrendStrength(slope, rSquared) {
        const slopeStrength = Math.abs(slope) * 1000; // Normalize slope
        const correlationStrength = rSquared * 100; // R-squared as percentage
        
        // Combined strength score
        const combinedStrength = (slopeStrength * 0.6) + (correlationStrength * 0.4);
        
        if (combinedStrength > 80) return 'VERY_STRONG';
        if (combinedStrength > 60) return 'STRONG';
        if (combinedStrength > 40) return 'MODERATE';
        if (combinedStrength > 20) return 'WEAK';
        return 'VERY_WEAK';
    }

    /**
     * Get trend direction from slope
     */
    getTrendDirection(slope) {
        const threshold = 0.001; // Minimum slope untuk consider as trend
        
        if (slope > threshold) return 'UPTREND';
        if (slope < -threshold) return 'DOWNTREND';
        return 'SIDEWAYS';
    }

    /**
     * Calculate regression channels (support/resistance)
     */
    calculateRegressionChannels(prices, period = this.regressionPeriod, deviation = 2) {
        const regression = this.calculateLinearRegression(prices, period);
        if (!regression) return null;
        
        const recentPrices = prices.slice(-period);
        const n = recentPrices.length;
        
        // Calculate standard deviation from regression line
        const deviations = recentPrices.map((price, i) => {
            const predicted = regression.line[i];
            return Math.abs(price - predicted);
        });
        
        const avgDeviation = deviations.reduce((a, b) => a + b, 0) / n;
        const stdDeviation = Math.sqrt(
            deviations.reduce((sum, dev) => sum + Math.pow(dev - avgDeviation, 2), 0) / n
        );
        
        // Create upper and lower channels
        const upperChannel = regression.line.map(point => point + (stdDeviation * deviation));
        const lowerChannel = regression.line.map(point => point - (stdDeviation * deviation));
        
        return {
            regression: regression.line,
            upper: upperChannel,
            lower: lowerChannel,
            deviation: stdDeviation,
            currentPosition: this.getCurrentChannelPosition(
                recentPrices[recentPrices.length - 1],
                regression.line[regression.line.length - 1],
                stdDeviation
            )
        };
    }

    /**
     * Determine current price position within regression channel
     */
    getCurrentChannelPosition(currentPrice, regressionValue, stdDeviation) {
        const distance = (currentPrice - regressionValue) / stdDeviation;
        
        if (distance > 2) return 'ABOVE_UPPER';
        if (distance > 1) return 'UPPER_HALF';
        if (distance > -1) return 'MIDDLE';
        if (distance > -2) return 'LOWER_HALF';
        return 'BELOW_LOWER';
    }

    /**
     * Generate trading signals based on regression analysis
     */
    generateRegressionSignals(prices, period = this.regressionPeriod) {
        const regression = this.calculateLinearRegression(prices, period);
        const channels = this.calculateRegressionChannels(prices, period);
        
        if (!regression || !channels) return null;
        
        const currentPrice = prices[prices.length - 1];
        const signals = [];
        
        // Trend following signals
        if (regression.direction === 'UPTREND' && regression.strength === 'STRONG') {
            if (channels.currentPosition === 'LOWER_HALF' || channels.currentPosition === 'MIDDLE') {
                signals.push({
                    type: 'BUY',
                    reason: 'Strong uptrend + price near regression line',
                    confidence: Math.min(regression.rSquared * 100, 90)
                });
            }
        }
        
        if (regression.direction === 'DOWNTREND' && regression.strength === 'STRONG') {
            if (channels.currentPosition === 'UPPER_HALF' || channels.currentPosition === 'MIDDLE') {
                signals.push({
                    type: 'SELL',
                    reason: 'Strong downtrend + price near regression line',
                    confidence: Math.min(regression.rSquared * 100, 90)
                });
            }
        }
        
        // Mean reversion signals
        if (channels.currentPosition === 'ABOVE_UPPER') {
            signals.push({
                type: 'SELL',
                reason: 'Price above upper regression channel',
                confidence: 70
            });
        }
        
        if (channels.currentPosition === 'BELOW_LOWER') {
            signals.push({
                type: 'BUY',
                reason: 'Price below lower regression channel',
                confidence: 70
            });
        }
        
        return {
            regression: regression,
            channels: channels,
            signals: signals,
            summary: {
                trend: regression.direction,
                strength: regression.strength,
                angle: regression.angle.toFixed(2),
                correlation: (regression.rSquared * 100).toFixed(1),
                position: channels.currentPosition
            }
        };
    }

    /**
     * Calculate multiple timeframe regression analysis
     */
    multiTimeframeRegression(prices) {
        const timeframes = [10, 20, 50]; // Short, medium, long term
        const results = {};
        
        timeframes.forEach(period => {
            const analysis = this.generateRegressionSignals(prices, period);
            if (analysis) {
                results[`${period}period`] = analysis.summary;
            }
        });
        
        // Determine overall trend consensus
        const trends = Object.values(results).map(r => r.trend);
        const trendConsensus = this.getTrendConsensus(trends);
        
        return {
            timeframes: results,
            consensus: trendConsensus,
            alignment: this.calculateTrendAlignment(results)
        };
    }

    /**
     * Get trend consensus from multiple timeframes
     */
    getTrendConsensus(trends) {
        const uptrends = trends.filter(t => t === 'UPTREND').length;
        const downtrends = trends.filter(t => t === 'DOWNTREND').length;
        const sideways = trends.filter(t => t === 'SIDEWAYS').length;
        
        if (uptrends > downtrends && uptrends > sideways) return 'BULLISH_CONSENSUS';
        if (downtrends > uptrends && downtrends > sideways) return 'BEARISH_CONSENSUS';
        return 'MIXED_SIGNALS';
    }

    /**
     * Calculate trend alignment score
     */
    calculateTrendAlignment(results) {
        const trends = Object.values(results).map(r => r.trend);
        const uniqueTrends = [...new Set(trends)];
        
        if (uniqueTrends.length === 1) return 100; // Perfect alignment
        if (uniqueTrends.length === 2) return 60;  // Partial alignment
        return 30; // Poor alignment
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrendRegression;
}