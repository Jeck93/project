/**
 * AI Trading Analysis untuk Scalp Trading
 * Analisis teknikal real-time untuk trading jangka pendek (1-5 menit)
 */

class ScalpTradingAI {
    constructor() {
        this.indicators = new TechnicalIndicators();
        this.priceData = [];
        this.signals = [];
        this.riskLevel = 0.02; // 2% risk per trade
        this.minProfitTarget = 0.004; // 0.4% minimum profit (adjusted for higher Gold prices)
        this.stopLoss = 0.002; // 0.2% stop loss (adjusted for higher Gold prices)
    }

    /**
     * Analisis utama untuk scalp trading
     * @param {Array} candleData - Data candlestick 1 menit
     * @param {Object} orderBook - Order book data
     * @param {Object} volume - Volume data
     */
    async analyzeScalpOpportunity(candleData, orderBook, volume) {
        try {
            // Update data
            this.priceData = candleData.slice(-100); // Ambil 100 candle terakhir
            
            // Analisis multi-indikator
            const technicalSignals = await this.getTechnicalSignals();
            const volumeAnalysis = this.analyzeVolume(volume);
            const orderBookAnalysis = this.analyzeOrderBook(orderBook);
            const momentumAnalysis = this.analyzeMomentum();
            
            // Gabungkan semua sinyal
            const combinedSignal = this.combineSignals({
                technical: technicalSignals,
                volume: volumeAnalysis,
                orderBook: orderBookAnalysis,
                momentum: momentumAnalysis
            });

            return {
                signal: combinedSignal.action, // BUY, SELL, HOLD
                confidence: combinedSignal.confidence,
                entryPrice: combinedSignal.entryPrice,
                stopLoss: combinedSignal.stopLoss,
                takeProfit: combinedSignal.takeProfit,
                riskReward: combinedSignal.riskReward,
                timeframe: '1m-5m',
                analysis: combinedSignal.analysis
            };

        } catch (error) {
            console.error('Error in scalp analysis:', error);
            return { signal: 'HOLD', confidence: 0, error: error.message };
        }
    }

    /**
     * Analisis indikator teknikal untuk scalping
     */
    async getTechnicalSignals() {
        const prices = this.priceData.map(candle => candle.close);
        const highs = this.priceData.map(candle => candle.high);
        const lows = this.priceData.map(candle => candle.low);
        const volumes = this.priceData.map(candle => candle.volume);

        // Indikator scalping utama
        const ema9 = this.indicators.EMA(prices, 9);
        const ema21 = this.indicators.EMA(prices, 21);
        const rsi = this.indicators.RSI(prices, 14);
        const macd = this.indicators.MACD(prices, 12, 26, 9);
        const bb = this.indicators.BollingerBands(prices, 20, 2);
        const stoch = this.indicators.Stochastic(highs, lows, prices, 14, 3);
        
        // Analisis trend micro
        const microTrend = this.analyzeMicroTrend(prices.slice(-20));
        
        // Support/Resistance levels
        const srLevels = this.findSupportResistance(highs, lows);

        return {
            ema: {
                signal: ema9[ema9.length - 1] > ema21[ema21.length - 1] ? 'BULLISH' : 'BEARISH',
                strength: Math.abs(ema9[ema9.length - 1] - ema21[ema21.length - 1]) / prices[prices.length - 1]
            },
            rsi: {
                value: rsi[rsi.length - 1],
                signal: rsi[rsi.length - 1] > 70 ? 'OVERBOUGHT' : rsi[rsi.length - 1] < 30 ? 'OVERSOLD' : 'NEUTRAL'
            },
            macd: {
                signal: macd.histogram[macd.histogram.length - 1] > 0 ? 'BULLISH' : 'BEARISH',
                momentum: macd.histogram[macd.histogram.length - 1] - macd.histogram[macd.histogram.length - 2]
            },
            bollinger: {
                position: this.getBBPosition(prices[prices.length - 1], bb),
                squeeze: this.detectBBSqueeze(bb)
            },
            stochastic: {
                signal: stoch.k[stoch.k.length - 1] > 80 ? 'OVERBOUGHT' : stoch.k[stoch.k.length - 1] < 20 ? 'OVERSOLD' : 'NEUTRAL'
            },
            microTrend: microTrend,
            supportResistance: srLevels
        };
    }

    /**
     * Analisis volume untuk scalping
     */
    analyzeVolume(volumeData) {
        const recentVolumes = volumeData.slice(-20);
        const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
        const currentVolume = recentVolumes[recentVolumes.length - 1];
        
        const volumeSpike = currentVolume > avgVolume * 1.5;
        const volumeTrend = this.getVolumeTrend(recentVolumes);

        return {
            spike: volumeSpike,
            trend: volumeTrend,
            ratio: currentVolume / avgVolume,
            signal: volumeSpike && volumeTrend === 'INCREASING' ? 'STRONG' : 'WEAK'
        };
    }

    /**
     * Analisis order book untuk scalping
     */
    analyzeOrderBook(orderBook) {
        const bids = orderBook.bids.slice(0, 10); // Top 10 bids
        const asks = orderBook.asks.slice(0, 10); // Top 10 asks
        
        const bidVolume = bids.reduce((sum, bid) => sum + parseFloat(bid[1]), 0);
        const askVolume = asks.reduce((sum, ask) => sum + parseFloat(ask[1]), 0);
        
        const imbalance = (bidVolume - askVolume) / (bidVolume + askVolume);
        const spread = parseFloat(asks[0][0]) - parseFloat(bids[0][0]);
        const spreadPercent = (spread / parseFloat(bids[0][0])) * 100;

        return {
            imbalance: imbalance,
            spread: spreadPercent,
            signal: Math.abs(imbalance) > 0.3 ? (imbalance > 0 ? 'BUY_PRESSURE' : 'SELL_PRESSURE') : 'BALANCED',
            liquidity: bidVolume + askVolume
        };
    }

    /**
     * Analisis momentum untuk scalping
     */
    analyzeMomentum() {
        const prices = this.priceData.map(candle => candle.close);
        const returns = [];
        
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }

        const momentum1m = returns.slice(-1)[0];
        const momentum5m = returns.slice(-5).reduce((a, b) => a + b, 0);
        const momentum15m = returns.slice(-15).reduce((a, b) => a + b, 0);

        return {
            short: momentum1m,
            medium: momentum5m,
            long: momentum15m,
            acceleration: momentum1m - momentum5m,
            signal: momentum1m > 0 && momentum5m > 0 ? 'BULLISH' : momentum1m < 0 && momentum5m < 0 ? 'BEARISH' : 'NEUTRAL'
        };
    }

    /**
     * Gabungkan semua sinyal untuk keputusan trading
     */
    combineSignals(signals) {
        let score = 0;
        let confidence = 0;
        const currentPrice = this.priceData[this.priceData.length - 1].close;

        // Scoring system
        if (signals.technical.ema.signal === 'BULLISH') score += 2;
        if (signals.technical.ema.signal === 'BEARISH') score -= 2;

        if (signals.technical.rsi.signal === 'OVERSOLD') score += 1.5;
        if (signals.technical.rsi.signal === 'OVERBOUGHT') score -= 1.5;

        if (signals.technical.macd.signal === 'BULLISH' && signals.technical.macd.momentum > 0) score += 1;
        if (signals.technical.macd.signal === 'BEARISH' && signals.technical.macd.momentum < 0) score -= 1;

        if (signals.volume.signal === 'STRONG') score += Math.sign(score) * 1;

        if (signals.orderBook.signal === 'BUY_PRESSURE') score += 0.5;
        if (signals.orderBook.signal === 'SELL_PRESSURE') score -= 0.5;

        if (signals.momentum.signal === 'BULLISH') score += 1;
        if (signals.momentum.signal === 'BEARISH') score -= 1;

        // Hitung confidence
        confidence = Math.min(Math.abs(score) / 8 * 100, 100);

        // Tentukan action
        let action = 'HOLD';
        if (score >= 3 && confidence >= 60) action = 'BUY';
        if (score <= -3 && confidence >= 60) action = 'SELL';

        // Hitung entry, stop loss, dan take profit
        const entryPrice = currentPrice;
        const stopLoss = action === 'BUY' ? 
            entryPrice * (1 - this.stopLoss) : 
            entryPrice * (1 + this.stopLoss);
        const takeProfit = action === 'BUY' ? 
            entryPrice * (1 + this.minProfitTarget) : 
            entryPrice * (1 - this.minProfitTarget);

        return {
            action: action,
            confidence: confidence,
            entryPrice: entryPrice,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            riskReward: Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss),
            analysis: {
                score: score,
                technical: signals.technical,
                volume: signals.volume,
                orderBook: signals.orderBook,
                momentum: signals.momentum
            }
        };
    }

    /**
     * Analisis micro trend (trend dalam 20 candle terakhir)
     */
    analyzeMicroTrend(prices) {
        const slope = this.calculateSlope(prices);
        const strength = Math.abs(slope) * 1000; // Normalize
        
        return {
            direction: slope > 0 ? 'UP' : slope < 0 ? 'DOWN' : 'SIDEWAYS',
            strength: strength,
            signal: strength > 0.5 ? (slope > 0 ? 'STRONG_UP' : 'STRONG_DOWN') : 'WEAK'
        };
    }

    /**
     * Deteksi support dan resistance levels
     */
    findSupportResistance(highs, lows) {
        const levels = [];
        const lookback = 20;
        
        for (let i = lookback; i < highs.length - lookback; i++) {
            // Resistance level
            if (highs[i] === Math.max(...highs.slice(i - lookback, i + lookback))) {
                levels.push({ type: 'RESISTANCE', price: highs[i], strength: 1 });
            }
            
            // Support level
            if (lows[i] === Math.min(...lows.slice(i - lookback, i + lookback))) {
                levels.push({ type: 'SUPPORT', price: lows[i], strength: 1 });
            }
        }

        return levels.slice(-5); // Return 5 most recent levels
    }

    /**
     * Helper functions
     */
    calculateSlope(prices) {
        const n = prices.length;
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = prices.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * prices[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    getBBPosition(price, bb) {
        const upper = bb.upper[bb.upper.length - 1];
        const lower = bb.lower[bb.lower.length - 1];
        const middle = bb.middle[bb.middle.length - 1];
        
        if (price > upper) return 'ABOVE_UPPER';
        if (price < lower) return 'BELOW_LOWER';
        if (price > middle) return 'UPPER_HALF';
        return 'LOWER_HALF';
    }

    detectBBSqueeze(bb) {
        const bandwidth = bb.upper.map((upper, i) => 
            (upper - bb.lower[i]) / bb.middle[i]
        );
        const currentBW = bandwidth[bandwidth.length - 1];
        const avgBW = bandwidth.slice(-20).reduce((a, b) => a + b, 0) / 20;
        
        return currentBW < avgBW * 0.8;
    }

    getVolumeTrend(volumes) {
        const recent = volumes.slice(-5);
        const older = volumes.slice(-10, -5);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        return recentAvg > olderAvg * 1.1 ? 'INCREASING' : 
               recentAvg < olderAvg * 0.9 ? 'DECREASING' : 'STABLE';
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScalpTradingAI;
}