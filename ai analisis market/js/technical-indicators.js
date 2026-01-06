/**
 * Technical Indicators Library untuk Scalp Trading
 * Implementasi indikator teknikal yang dioptimalkan untuk timeframe pendek
 */

class TechnicalIndicators {
    
    /**
     * Exponential Moving Average (EMA)
     * Lebih responsif untuk scalping dibanding SMA
     */
    EMA(prices, period) {
        const ema = [];
        const multiplier = 2 / (period + 1);
        
        // First EMA = SMA
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += prices[i];
        }
        ema[period - 1] = sum / period;
        
        // Calculate EMA
        for (let i = period; i < prices.length; i++) {
            ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
        }
        
        return ema;
    }

    /**
     * Relative Strength Index (RSI)
     * Untuk mendeteksi kondisi overbought/oversold
     */
    RSI(prices, period = 14) {
        const gains = [];
        const losses = [];
        
        // Calculate price changes
        for (let i = 1; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            gains.push(change > 0 ? change : 0);
            losses.push(change < 0 ? Math.abs(change) : 0);
        }
        
        const rsi = [];
        let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
        let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
        
        // First RSI
        let rs = avgGain / avgLoss;
        rsi[period] = 100 - (100 / (1 + rs));
        
        // Calculate subsequent RSI values
        for (let i = period + 1; i < gains.length + 1; i++) {
            avgGain = ((avgGain * (period - 1)) + gains[i - 1]) / period;
            avgLoss = ((avgLoss * (period - 1)) + losses[i - 1]) / period;
            rs = avgGain / avgLoss;
            rsi[i] = 100 - (100 / (1 + rs));
        }
        
        return rsi;
    }

    /**
     * MACD (Moving Average Convergence Divergence)
     * Untuk mendeteksi perubahan momentum
     */
    MACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
        const fastEMA = this.EMA(prices, fastPeriod);
        const slowEMA = this.EMA(prices, slowPeriod);
        
        const macdLine = [];
        for (let i = slowPeriod - 1; i < prices.length; i++) {
            macdLine.push(fastEMA[i] - slowEMA[i]);
        }
        
        const signalLine = this.EMA(macdLine, signalPeriod);
        const histogram = [];
        
        for (let i = 0; i < signalLine.length; i++) {
            if (signalLine[i] !== undefined) {
                histogram.push(macdLine[i + signalPeriod - 1] - signalLine[i]);
            }
        }
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: histogram
        };
    }

    /**
     * Bollinger Bands
     * Untuk mendeteksi volatilitas dan level support/resistance
     */
    BollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.SMA(prices, period);
        const upper = [];
        const lower = [];
        
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            const mean = sma[i];
            const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
            const standardDeviation = Math.sqrt(variance);
            
            upper.push(mean + (standardDeviation * stdDev));
            lower.push(mean - (standardDeviation * stdDev));
        }
        
        return {
            upper: upper,
            middle: sma.slice(period - 1),
            lower: lower
        };
    }

    /**
     * Stochastic Oscillator
     * Untuk momentum dan overbought/oversold conditions
     */
    Stochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
        const k = [];
        
        for (let i = kPeriod - 1; i < closes.length; i++) {
            const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
            const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
            const currentClose = closes[i];
            
            k.push(((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100);
        }
        
        const d = this.SMA(k, dPeriod);
        
        return {
            k: k,
            d: d
        };
    }

    /**
     * Simple Moving Average (SMA)
     * Helper function
     */
    SMA(prices, period) {
        const sma = [];
        
        for (let i = period - 1; i < prices.length; i++) {
            const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            sma.push(sum / period);
        }
        
        return sma;
    }

    /**
     * Average True Range (ATR)
     * Untuk mengukur volatilitas
     */
    ATR(highs, lows, closes, period = 14) {
        const trueRanges = [];
        
        for (let i = 1; i < closes.length; i++) {
            const tr1 = highs[i] - lows[i];
            const tr2 = Math.abs(highs[i] - closes[i - 1]);
            const tr3 = Math.abs(lows[i] - closes[i - 1]);
            
            trueRanges.push(Math.max(tr1, tr2, tr3));
        }
        
        return this.SMA(trueRanges, period);
    }

    /**
     * Williams %R
     * Momentum oscillator untuk scalping
     */
    WilliamsR(highs, lows, closes, period = 14) {
        const wr = [];
        
        for (let i = period - 1; i < closes.length; i++) {
            const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
            const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
            const currentClose = closes[i];
            
            wr.push(((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100);
        }
        
        return wr;
    }

    /**
     * Commodity Channel Index (CCI)
     * Untuk mendeteksi trend dan reversal
     */
    CCI(highs, lows, closes, period = 20) {
        const typicalPrices = [];
        
        for (let i = 0; i < closes.length; i++) {
            typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
        }
        
        const sma = this.SMA(typicalPrices, period);
        const cci = [];
        
        for (let i = period - 1; i < typicalPrices.length; i++) {
            const slice = typicalPrices.slice(i - period + 1, i + 1);
            const meanDeviation = slice.reduce((sum, tp) => sum + Math.abs(tp - sma[i - period + 1]), 0) / period;
            
            cci.push((typicalPrices[i] - sma[i - period + 1]) / (0.015 * meanDeviation));
        }
        
        return cci;
    }

    /**
     * Money Flow Index (MFI)
     * Volume-weighted RSI untuk scalping
     */
    MFI(highs, lows, closes, volumes, period = 14) {
        const typicalPrices = [];
        const rawMoneyFlows = [];
        
        for (let i = 0; i < closes.length; i++) {
            const tp = (highs[i] + lows[i] + closes[i]) / 3;
            typicalPrices.push(tp);
            rawMoneyFlows.push(tp * volumes[i]);
        }
        
        const mfi = [];
        
        for (let i = period; i < typicalPrices.length; i++) {
            let positiveFlow = 0;
            let negativeFlow = 0;
            
            for (let j = i - period + 1; j <= i; j++) {
                if (typicalPrices[j] > typicalPrices[j - 1]) {
                    positiveFlow += rawMoneyFlows[j];
                } else if (typicalPrices[j] < typicalPrices[j - 1]) {
                    negativeFlow += rawMoneyFlows[j];
                }
            }
            
            const moneyRatio = positiveFlow / negativeFlow;
            mfi.push(100 - (100 / (1 + moneyRatio)));
        }
        
        return mfi;
    }

    /**
     * Parabolic SAR
     * Untuk trailing stop dan trend following
     */
    ParabolicSAR(highs, lows, acceleration = 0.02, maximum = 0.2) {
        const sar = [];
        const af = [];
        const ep = [];
        
        let trend = 1; // 1 for uptrend, -1 for downtrend
        let currentAF = acceleration;
        let currentEP = highs[0];
        let currentSAR = lows[0];
        
        sar.push(currentSAR);
        af.push(currentAF);
        ep.push(currentEP);
        
        for (let i = 1; i < highs.length; i++) {
            if (trend === 1) {
                // Uptrend
                currentSAR = currentSAR + currentAF * (currentEP - currentSAR);
                
                if (lows[i] <= currentSAR) {
                    // Trend reversal
                    trend = -1;
                    currentSAR = currentEP;
                    currentEP = lows[i];
                    currentAF = acceleration;
                } else {
                    if (highs[i] > currentEP) {
                        currentEP = highs[i];
                        currentAF = Math.min(currentAF + acceleration, maximum);
                    }
                }
            } else {
                // Downtrend
                currentSAR = currentSAR + currentAF * (currentEP - currentSAR);
                
                if (highs[i] >= currentSAR) {
                    // Trend reversal
                    trend = 1;
                    currentSAR = currentEP;
                    currentEP = highs[i];
                    currentAF = acceleration;
                } else {
                    if (lows[i] < currentEP) {
                        currentEP = lows[i];
                        currentAF = Math.min(currentAF + acceleration, maximum);
                    }
                }
            }
            
            sar.push(currentSAR);
            af.push(currentAF);
            ep.push(currentEP);
        }
        
        return sar;
    }
}

// Export untuk digunakan di file lain
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TechnicalIndicators;
}