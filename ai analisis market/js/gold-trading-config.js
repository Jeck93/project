/**
 * Gold Trading Configuration
 * Konfigurasi khusus untuk trading XAU/USD
 */

class GoldTradingConfig {
    constructor() {
        this.symbol = 'XAUUSD';
        this.basePrice = 4325; // Updated to match TradingView price
        this.volatility = 1.5; // Reduced volatility for more realistic movement
        this.spread = 0.5; // Typical Gold spread at higher prices
        this.tickSize = 0.01; // Minimum price movement
        this.contractSize = 100; // Standard Gold contract size (oz)
        
        // Trading hours (UTC)
        this.tradingHours = {
            start: '22:00', // Sunday 22:00 UTC
            end: '21:00'    // Friday 21:00 UTC
        };
        
        // Risk parameters for Gold (updated for higher prices)
        this.riskParams = {
            maxRiskPerTrade: 0.02, // 2%
            stopLoss: 0.002, // 0.2% or ~$8-10 per oz at current prices
            takeProfit: 0.004, // 0.4% or ~$15-20 per oz at current prices
            maxDrawdown: 0.1 // 10%
        };
        
        // Technical analysis parameters optimized for Gold
        this.technicalParams = {
            rsi: {
                period: 14,
                overbought: 75, // Gold tends to trend more
                oversold: 25
            },
            macd: {
                fast: 12,
                slow: 26,
                signal: 9
            },
            ema: {
                fast: 9,
                slow: 21
            },
            bollinger: {
                period: 20,
                deviation: 2
            }
        };
        
        // Market sessions
        this.sessions = {
            asian: { start: '00:00', end: '09:00', volatility: 'low' },
            london: { start: '08:00', end: '17:00', volatility: 'high' },
            newyork: { start: '13:00', end: '22:00', volatility: 'high' },
            overlap: { start: '13:00', end: '17:00', volatility: 'highest' }
        };
    }

    /**
     * Get current market session
     */
    getCurrentSession() {
        const now = new Date();
        const utcHour = now.getUTCHours();
        
        if (utcHour >= 0 && utcHour < 9) return 'asian';
        if (utcHour >= 8 && utcHour < 17) return 'london';
        if (utcHour >= 13 && utcHour < 22) return 'newyork';
        return 'closed';
    }

    /**
     * Get volatility multiplier based on session
     */
    getVolatilityMultiplier() {
        const session = this.getCurrentSession();
        const multipliers = {
            asian: 0.7,
            london: 1.2,
            newyork: 1.1,
            closed: 0.3
        };
        return multipliers[session] || 1.0;
    }

    /**
     * Check if market is open
     */
    isMarketOpen() {
        const now = new Date();
        const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
        const hour = now.getUTCHours();
        
        // Gold markets are closed Saturday 21:00 UTC to Sunday 22:00 UTC
        if (day === 6 && hour >= 21) return false; // Saturday after 21:00
        if (day === 0 && hour < 22) return false;  // Sunday before 22:00
        
        return true;
    }

    /**
     * Generate realistic Gold price movement
     */
    generatePriceMovement(currentPrice, timeframe = 1) {
        const volatilityMultiplier = this.getVolatilityMultiplier();
        const timeMultiplier = Math.sqrt(timeframe); // Scale volatility by time
        
        // Gold tends to have trending behavior with higher volatility at current levels
        const trend = Math.sin(Date.now() / 200000) * 0.3; // Slower trend component
        const noise = (Math.random() - 0.5) * 2; // Random component
        
        const movement = (trend + noise) * this.volatility * volatilityMultiplier * timeMultiplier;
        
        return {
            open: currentPrice,
            high: currentPrice + Math.abs(movement) + Math.random() * this.volatility * 0.7,
            low: currentPrice - Math.abs(movement) - Math.random() * this.volatility * 0.7,
            close: currentPrice + movement,
            volume: this.generateVolume()
        };
    }

    /**
     * Generate realistic volume for Gold
     */
    generateVolume() {
        const session = this.getCurrentSession();
        const baseVolume = {
            asian: 5000,
            london: 15000,
            newyork: 12000,
            closed: 1000
        };
        
        const base = baseVolume[session] || 5000;
        return base + (Math.random() * base * 0.5);
    }

    /**
     * Get economic news impact (simplified)
     */
    getNewsImpact() {
        // Simulate major news events that affect Gold
        const newsEvents = [
            { type: 'fed_meeting', impact: 0.8, probability: 0.02 },
            { type: 'inflation_data', impact: 0.6, probability: 0.05 },
            { type: 'geopolitical', impact: 1.2, probability: 0.01 },
            { type: 'dollar_strength', impact: -0.7, probability: 0.03 }
        ];
        
        for (const event of newsEvents) {
            if (Math.random() < event.probability) {
                return {
                    hasNews: true,
                    type: event.type,
                    impact: event.impact,
                    direction: event.impact > 0 ? 'bullish' : 'bearish'
                };
            }
        }
        
        return { hasNews: false, impact: 0 };
    }

    /**
     * Adjust AI scoring for Gold characteristics
     */
    adjustScoreForGold(baseScore, indicators) {
        let adjustedScore = baseScore;
        
        // Gold-specific adjustments
        if (indicators.rsi) {
            // Gold can stay overbought/oversold longer
            if (indicators.rsi.value > 80) adjustedScore *= 0.8;
            if (indicators.rsi.value < 20) adjustedScore *= 0.8;
        }
        
        // Volume confirmation is less reliable for Gold
        if (indicators.volume && indicators.volume.signal === 'STRONG') {
            adjustedScore *= 1.1; // Less weight than crypto
        }
        
        // Session-based adjustments
        const session = this.getCurrentSession();
        if (session === 'overlap') {
            adjustedScore *= 1.2; // Higher confidence during overlap
        } else if (session === 'asian') {
            adjustedScore *= 0.8; // Lower confidence during Asian session
        }
        
        // News impact
        const news = this.getNewsImpact();
        if (news.hasNews) {
            adjustedScore *= (1 + news.impact * 0.3);
        }
        
        return adjustedScore;
    }

    /**
     * Get Gold-specific risk parameters
     */
    getRiskParameters(accountBalance, riskLevel) {
        const maxRisk = accountBalance * (riskLevel / 100);
        const stopLossPoints = this.basePrice * this.riskParams.stopLoss;
        const positionSize = maxRisk / stopLossPoints;
        
        return {
            maxRisk: maxRisk,
            stopLossPoints: stopLossPoints,
            positionSize: Math.min(positionSize, this.contractSize * 10), // Max 10 contracts
            riskRewardRatio: this.riskParams.takeProfit / this.riskParams.stopLoss
        };
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoldTradingConfig;
}