/**
 * Scalp Trading Dashboard Controller - Clean Version
 * Simplified untuk demo analysis tool
 */

class ScalpTradingDashboard {
    constructor() {
        this.scalpAI = new ScalpTradingAI();
        this.goldConfig = new GoldTradingConfig();
        this.trendRegression = new TrendRegression();
        this.chart = null;
        this.currentPair = 'XAUUSD';
        this.timeframe = '1';
        this.signalHistory = [];
        this.priceData = [];
        this.orderBookData = { bids: [], asks: [] };
        this.simulationInterval = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.initChart();
        this.startGoldDataSimulation();
        this.startAnalysisLoop();
        this.updateConnectionStatus();
    }

    setupEventListeners() {
        // Chart controls
        document.getElementById('timeframeSelect').addEventListener('change', (e) => this.changeTimeframe(e.target.value));
        document.getElementById('toggleIndicators').addEventListener('click', () => this.toggleIndicators());
        document.getElementById('refreshChart').addEventListener('click', () => this.refreshChart());
    }

    initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: 'XAU/USD',
                    data: [],
                    borderColor: {
                        up: '#00ff88',    // Green for bullish candles
                        down: '#ff4444',  // Red for bearish candles
                        unchanged: '#999' // Gray for unchanged
                    },
                    backgroundColor: {
                        up: 'rgba(0, 255, 136, 0.8)',
                        down: 'rgba(255, 68, 68, 0.8)',
                        unchanged: 'rgba(153, 153, 153, 0.8)'
                    }
                }, {
                    label: 'EMA 9',
                    type: 'line',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }, {
                    label: 'EMA 21',
                    type: 'line',
                    data: [],
                    borderColor: '#4ecdc4',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }, {
                    label: 'Regression Line',
                    type: 'line',
                    data: [],
                    borderColor: '#ff9500',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    borderDash: [5, 5]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'XAU/USD - Gold Candlestick Analysis',
                        color: '#fff',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            displayFormats: {
                                minute: 'HH:mm'
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#aaa'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#aaa',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = 'Connected';
        statusElement.className = 'status-connected';
    }

    startGoldDataSimulation() {
        // Start with current real market price (close to TradingView)
        this.simulateGoldData();
    }

    simulateGoldData() {
        // Clear existing interval
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        
        // Initialize with realistic Gold price close to TradingView
        let currentPrice = 4325; // Close to real TradingView price
        let candleStartTime = new Date();
        let currentCandle = null;
        
        // Simulasi data XAU/USD dengan proper candlestick formation
        this.simulationInterval = setInterval(() => {
            const now = new Date();
            
            // Check if we need to start a new candle (every minute)
            const minutesPassed = Math.floor((now - candleStartTime) / 60000);
            
            if (minutesPassed >= 1 || currentCandle === null) {
                // Close previous candle and start new one
                if (currentCandle) {
                    this.priceData.push(currentCandle);
                    if (this.priceData.length > 100) {
                        this.priceData.shift();
                    }
                }
                
                // Start new candle
                candleStartTime = now;
                currentCandle = {
                    time: new Date(candleStartTime),
                    open: currentPrice,
                    high: currentPrice,
                    low: currentPrice,
                    close: currentPrice,
                    volume: 0
                };
            }
            
            // Generate tick movement within current candle
            const priceMovement = this.goldConfig.generatePriceMovement(currentPrice, 1);
            
            // Limit price movement to stay close to real market
            const maxDeviation = 20; // Max $20 deviation from base
            const basePrice = 4325;
            
            let newPrice = priceMovement.close;
            
            // Keep price within realistic range of TradingView price
            if (Math.abs(newPrice - basePrice) > maxDeviation) {
                newPrice = basePrice + (Math.random() - 0.5) * maxDeviation;
            }
            
            // Update current candle with new tick
            if (currentCandle) {
                currentCandle.high = Math.max(currentCandle.high, newPrice);
                currentCandle.low = Math.min(currentCandle.low, newPrice);
                currentCandle.close = newPrice;
                currentCandle.volume += Math.random() * 100 + 50; // Add tick volume
            }
            
            // Update current price for next iteration
            currentPrice = newPrice;
            
            // Generate realistic Gold order book
            this.orderBookData = this.generateGoldOrderBook(currentPrice);
            
            // Update chart and UI
            this.updateChart();
            this.updateMarketData(currentCandle || {
                time: now,
                open: currentPrice,
                high: currentPrice,
                low: currentPrice,
                close: currentPrice,
                volume: 1000
            });
            this.updateOrderBook();
            this.updateMarketSession();
            
        }, 1000); // Update setiap detik (tick simulation)
    }

    generateGoldOrderBook(currentPrice) {
        const bids = [];
        const asks = [];
        const spread = this.goldConfig.spread;
        
        // Generate more realistic order book levels
        for (let i = 0; i < 10; i++) {
            const bidPrice = currentPrice - spread/2 - (i * 0.1);
            const askPrice = currentPrice + spread/2 + (i * 0.1);
            
            bids.push([
                bidPrice.toFixed(2),
                (Math.random() * 50 + 20).toFixed(2) // 20-70 volume range
            ]);
            
            asks.push([
                askPrice.toFixed(2),
                (Math.random() * 50 + 20).toFixed(2) // 20-70 volume range
            ]);
        }
        
        return { bids, asks };
    }

    async startAnalysisLoop() {
        setInterval(async () => {
            if (this.priceData.length >= 50) {
                try {
                    const analysis = await this.scalpAI.analyzeScalpOpportunity(
                        this.priceData,
                        this.orderBookData,
                        this.priceData.map(d => d.volume)
                    );
                    
                    this.updateSignalDisplay(analysis);
                    this.updateTechnicalIndicators(analysis.analysis);
                    this.addToSignalHistory(analysis);
                    
                } catch (error) {
                    console.error('Analysis error:', error);
                }
            }
        }, 5000); // Analisis setiap 5 detik
    }

    updateChart() {
        if (!this.chart || this.priceData.length === 0) return;
        
        // Prepare candlestick data
        const candlestickData = this.priceData.map(candle => ({
            x: candle.time,
            o: candle.open,
            h: candle.high,
            l: candle.low,
            c: candle.close
        }));
        
        // Update candlestick dataset
        this.chart.data.datasets[0].data = candlestickData;
        
        // Update EMA lines jika ada data cukup
        if (this.priceData.length >= 21) {
            const closes = this.priceData.map(candle => candle.close);
            const indicators = new TechnicalIndicators();
            
            const ema9 = indicators.EMA(closes, 9);
            const ema21 = indicators.EMA(closes, 21);
            
            // Create EMA data points with timestamps
            const ema9Data = ema9.map((value, index) => ({
                x: this.priceData[index + closes.length - ema9.length].time,
                y: value
            }));
            
            const ema21Data = ema21.map((value, index) => ({
                x: this.priceData[index + closes.length - ema21.length].time,
                y: value
            }));
            
            this.chart.data.datasets[1].data = ema9Data;
            this.chart.data.datasets[2].data = ema21Data;
            
            // Add regression line if enough data
            if (this.priceData.length >= 20) {
                const regression = this.trendRegression.calculateLinearRegression(closes, 20);
                if (regression) {
                    const regressionData = regression.line.map((value, index) => ({
                        x: this.priceData[index + closes.length - regression.line.length].time,
                        y: value
                    }));
                    this.chart.data.datasets[3].data = regressionData;
                }
            }
        }
        
        this.chart.update('none');
    }

    updateSignalDisplay(analysis) {
        const signalAction = document.getElementById('signalAction');
        const signalConfidence = document.getElementById('signalConfidence');
        const entryPrice = document.getElementById('entryPrice');
        const stopLoss = document.getElementById('stopLoss');
        const takeProfit = document.getElementById('takeProfit');
        const riskReward = document.getElementById('riskReward');
        
        signalAction.textContent = analysis.signal;
        signalAction.className = `signal-action ${analysis.signal.toLowerCase()}`;
        
        signalConfidence.textContent = `${analysis.confidence.toFixed(1)}%`;
        entryPrice.textContent = analysis.entryPrice ? `$${analysis.entryPrice.toFixed(2)}` : '-';
        stopLoss.textContent = analysis.stopLoss ? `$${analysis.stopLoss.toFixed(2)}` : '-';
        takeProfit.textContent = analysis.takeProfit ? `$${analysis.takeProfit.toFixed(2)}` : '-';
        riskReward.textContent = analysis.riskReward ? analysis.riskReward.toFixed(2) : '-';
    }

    updateTechnicalIndicators(analysis) {
        if (!analysis || !analysis.technical) return;
        
        // RSI
        const rsiValue = document.getElementById('rsiValue');
        const rsiSignal = document.getElementById('rsiSignal');
        if (analysis.technical.rsi) {
            rsiValue.textContent = analysis.technical.rsi.value.toFixed(1);
            rsiSignal.textContent = analysis.technical.rsi.signal;
            rsiSignal.className = `indicator-signal ${analysis.technical.rsi.signal.toLowerCase()}`;
        }
        
        // MACD
        const macdValue = document.getElementById('macdValue');
        const macdSignal = document.getElementById('macdSignal');
        if (analysis.technical.macd) {
            macdValue.textContent = analysis.technical.macd.momentum > 0 ? '↑' : '↓';
            macdSignal.textContent = analysis.technical.macd.signal;
            macdSignal.className = `indicator-signal ${analysis.technical.macd.signal.toLowerCase()}`;
        }
        
        // EMA
        const emaValue = document.getElementById('emaValue');
        const emaSignal = document.getElementById('emaSignal');
        if (analysis.technical.ema) {
            emaValue.textContent = (analysis.technical.ema.strength * 100).toFixed(2) + '%';
            emaSignal.textContent = analysis.technical.ema.signal;
            emaSignal.className = `indicator-signal ${analysis.technical.ema.signal.toLowerCase()}`;
        }
        
        // Volume
        const volumeValue = document.getElementById('volumeValue');
        const volumeSignal = document.getElementById('volumeSignal');
        if (analysis.volume) {
            volumeValue.textContent = analysis.volume.ratio.toFixed(2) + 'x';
            volumeSignal.textContent = analysis.volume.signal;
            volumeSignal.className = `indicator-signal ${analysis.volume.signal.toLowerCase()}`;
        }
    }

    updateMarketData(candle) {
        const symbol = '$';
        const decimals = 2;
        
        // Use candle close price for current price
        document.getElementById('currentPrice').textContent = `${symbol}${candle.close.toFixed(decimals)}`;
        
        if (this.priceData.length >= 2) {
            const prevPrice = this.priceData[this.priceData.length - 2].close;
            const change = ((candle.close - prevPrice) / prevPrice * 100);
            const changeElement = document.getElementById('priceChange');
            changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.style.color = change >= 0 ? '#00ff88' : '#ff4444';
        }
        
        // Generate more realistic volume for Gold market
        const goldVolume = Math.random() * 50000 + 25000; // 25K-75K range
        document.getElementById('volume24h').textContent = this.formatVolume(goldVolume);
        
        const spread = this.orderBookData.asks.length > 0 && this.orderBookData.bids.length > 0 ?
            (parseFloat(this.orderBookData.asks[0][0]) - parseFloat(this.orderBookData.bids[0][0])) : 0;
        document.getElementById('spread').textContent = `${symbol}${spread.toFixed(decimals)}`;
    }

    updateOrderBook() {
        const asksList = document.getElementById('asksList');
        const bidsList = document.getElementById('bidsList');
        
        asksList.innerHTML = '';
        bidsList.innerHTML = '';
        
        // Update asks (sell orders)
        this.orderBookData.asks.slice(0, 5).forEach(ask => {
            const div = document.createElement('div');
            div.className = 'order-item';
            div.innerHTML = `
                <span class="ask-price">$${ask[0]}</span>
                <span>${ask[1]}</span>
            `;
            asksList.appendChild(div);
        });
        
        // Update bids (buy orders)
        this.orderBookData.bids.slice(0, 5).forEach(bid => {
            const div = document.createElement('div');
            div.className = 'order-item';
            div.innerHTML = `
                <span class="bid-price">$${bid[0]}</span>
                <span>${bid[1]}</span>
            `;
            bidsList.appendChild(div);
        });
    }

    updateMarketSession() {
        const session = this.goldConfig.getCurrentSession();
        const isOpen = this.goldConfig.isMarketOpen();
        const volatilityMultiplier = this.goldConfig.getVolatilityMultiplier();
        
        // Update session indicators
        document.getElementById('sessionValue').textContent = session.toUpperCase();
        document.getElementById('sessionSignal').textContent = isOpen ? 'OPEN' : 'CLOSED';
        document.getElementById('sessionSignal').className = `indicator-signal ${isOpen ? 'bullish' : 'bearish'}`;
        
        // Update trend regression analysis
        if (this.priceData.length >= 20) {
            const prices = this.priceData.map(candle => candle.close);
            const regressionAnalysis = this.trendRegression.generateRegressionSignals(prices, 20);
            const multiTimeframe = this.trendRegression.multiTimeframeRegression(prices);
            
            if (regressionAnalysis) {
                // Update regression indicator
                document.getElementById('regressionValue').textContent = regressionAnalysis.summary.trend;
                document.getElementById('regressionSignal').textContent = regressionAnalysis.summary.strength;
                document.getElementById('regressionSignal').className = `indicator-signal ${
                    regressionAnalysis.summary.trend === 'UPTREND' ? 'bullish' : 
                    regressionAnalysis.summary.trend === 'DOWNTREND' ? 'bearish' : 'neutral'
                }`;
                
                // Update alignment indicator
                document.getElementById('alignmentValue').textContent = `${multiTimeframe.alignment}%`;
                document.getElementById('alignmentSignal').textContent = multiTimeframe.consensus;
                document.getElementById('alignmentSignal').className = `indicator-signal ${
                    multiTimeframe.consensus === 'BULLISH_CONSENSUS' ? 'bullish' : 
                    multiTimeframe.consensus === 'BEARISH_CONSENSUS' ? 'bearish' : 'neutral'
                }`;
            }
        }
    }

    addToSignalHistory(analysis) {
        const historyItem = {
            time: new Date(),
            signal: analysis.signal,
            price: analysis.entryPrice,
            confidence: analysis.confidence,
            result: 'PENDING'
        };
        
        this.signalHistory.unshift(historyItem);
        if (this.signalHistory.length > 50) {
            this.signalHistory.pop();
        }
        
        this.updateSignalHistoryTable();
    }

    updateSignalHistoryTable() {
        const tbody = document.querySelector('#signalHistory tbody');
        tbody.innerHTML = '';
        
        this.signalHistory.slice(0, 10).forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.time.toLocaleTimeString()}</td>
                <td><span class="indicator-signal ${item.signal.toLowerCase()}">${item.signal}</span></td>
                <td>$${item.price ? item.price.toFixed(2) : '-'}</td>
                <td>${item.confidence.toFixed(1)}%</td>
                <td>${item.result}</td>
            `;
            tbody.appendChild(row);
        });
    }

    changeTimeframe(timeframe) {
        this.timeframe = timeframe;
        console.log(`Switched to ${timeframe} minute timeframe`);
    }

    toggleIndicators() {
        if (this.chart) {
            const datasets = this.chart.data.datasets;
            datasets[1].hidden = !datasets[1].hidden; // EMA 9
            datasets[2].hidden = !datasets[2].hidden; // EMA 21
            datasets[3].hidden = !datasets[3].hidden; // Regression Line
            this.chart.update();
        }
    }

    refreshChart() {
        if (this.chart) {
            this.chart.update();
        }
    }

    formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(2) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(2) + 'K';
        }
        return volume.toFixed(2);
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ScalpTradingDashboard();
});