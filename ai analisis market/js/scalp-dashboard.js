/**
 * Scalp Trading Dashboard Controller
 * Mengelola UI dan integrasi dengan AI Trading Analysis
 */

class ScalpTradingDashboard {
    constructor() {
        this.scalpAI = new ScalpTradingAI();
        this.goldConfig = new GoldTradingConfig();
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

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = 'Connected';
        statusElement.className = 'status-connected';
    }

    startGoldDataSimulation() {
        // Start simulation immediately
        this.simulateGoldData();
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
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'XAU/USD Price',
                    data: [],
                    borderColor: '#FFD700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1
                }, {
                    label: 'EMA 9',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0,
                    hidden: false
                }, {
                    label: 'EMA 21',
                    data: [],
                    borderColor: '#4ecdc4',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0,
                    hidden: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'XAU/USD - Gold Price Movement',
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
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 4
                    }
                }
            }
        });
    }

    async connectWebSocket() {
        if (!this.useRealData) {
            this.simulateGoldData();
            this.updateConnectionStatus(true, 'SIMULATION');
            return;
        }
        
        try {
            // Coba koneksi ke data provider untuk Gold/Forex
            await this.connectToForexAPI();
        } catch (error) {
            console.error('Real data connection failed, using simulation:', error);
            // Fallback ke simulasi jika koneksi real gagal
            this.simulateGoldData();
            this.updateConnectionStatus(true, 'SIMULATION');
        }
    }

    async connectToForexAPI() {
        // Menggunakan Alpha Vantage atau Twelve Data untuk Gold/Forex data
        // Untuk demo, kita gunakan simulasi yang realistis untuk Gold
        console.log('Attempting to connect to Forex/Gold data provider...');
        
        // Simulasi delay koneksi
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Untuk production, ganti dengan real API
        throw new Error('Real API not configured - using simulation');
    }

    async connectToBinance() {
        const symbol = this.currentPair.toLowerCase();
        const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_1m/${symbol}@ticker/${symbol}@depth10`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('Connected to Binance WebSocket');
            this.updateConnectionStatus(true, 'BINANCE');
        };
        
        this.websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleBinanceData(data);
            } catch (error) {
                console.error('Error parsing WebSocket data:', error);
            }
        };
        
        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus(false);
            // Fallback ke simulasi
            setTimeout(() => {
                this.simulateWebSocketData();
                this.updateConnectionStatus(true, 'SIMULATION');
            }, 2000);
        };
        
        this.websocket.onclose = () => {
            console.log('WebSocket connection closed');
            this.updateConnectionStatus(false);
            // Auto reconnect setelah 5 detik
            setTimeout(() => this.connectWebSocket(), 5000);
        };
        
        // Timeout untuk koneksi
        setTimeout(() => {
            if (this.websocket.readyState !== WebSocket.OPEN) {
                this.websocket.close();
                throw new Error('Connection timeout');
            }
        }, 10000);
    }

    handleBinanceData(data) {
        if (data.e === 'kline') {
            // Kline/Candlestick data
            const kline = data.k;
            const candle = {
                time: new Date(kline.t),
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                volume: parseFloat(kline.v)
            };
            
            // Update hanya jika candle sudah closed atau ini candle terbaru
            if (kline.x || this.priceData.length === 0) {
                this.priceData.push(candle);
                if (this.priceData.length > 100) {
                    this.priceData.shift();
                }
            } else {
                // Update candle terakhir jika belum closed
                if (this.priceData.length > 0) {
                    this.priceData[this.priceData.length - 1] = candle;
                }
            }
            
            this.updateChart();
            this.updateMarketData(candle);
            
        } else if (data.e === '24hrTicker') {
            // 24hr ticker data
            this.update24hrStats(data);
            
        } else if (data.e === 'depthUpdate') {
            // Order book depth update
            this.updateOrderBookFromBinance(data);
        }
    }

    update24hrStats(ticker) {
        const change = parseFloat(ticker.P);
        const changeElement = document.getElementById('priceChange');
        changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        changeElement.style.color = change >= 0 ? '#00ff88' : '#ff4444';
        
        document.getElementById('volume24h').textContent = this.formatVolume(parseFloat(ticker.v));
    }

    updateOrderBookFromBinance(depthData) {
        // Update order book dari Binance depth data
        if (depthData.b && depthData.a) {
            this.orderBookData = {
                bids: depthData.b.slice(0, 10),
                asks: depthData.a.slice(0, 10)
            };
            this.updateOrderBook();
        }
    }



    generateOrderBook(currentPrice) {
        const bids = [];
        const asks = [];
        
        for (let i = 0; i < 10; i++) {
            bids.push([
                (currentPrice - (i + 1) * 0.5).toFixed(2),
                (Math.random() * 10 + 1).toFixed(4)
            ]);
            
            asks.push([
                (currentPrice + (i + 1) * 0.5).toFixed(2),
                (Math.random() * 10 + 1).toFixed(4)
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

    updateChart() {
        if (!this.chart || this.priceData.length === 0) return;
        
        const labels = this.priceData.map(candle => candle.time);
        const prices = this.priceData.map(candle => candle.close);
        
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = prices;
        
        // Update EMA lines jika ada data cukup
        if (this.priceData.length >= 21) {
            const indicators = new TechnicalIndicators();
            
            const ema9 = indicators.EMA(prices, 9);
            const ema21 = indicators.EMA(prices, 21);
            
            // Pad EMA arrays to match price data length
            const paddedEma9 = new Array(prices.length - ema9.length).fill(null).concat(ema9);
            const paddedEma21 = new Array(prices.length - ema21.length).fill(null).concat(ema21);
            
            this.chart.data.datasets[1].data = paddedEma9;
            this.chart.data.datasets[2].data = paddedEma21;
        }
        
        this.chart.update('none');
    }

    refreshChart() {
        if (this.chart) {
            this.chart.update();
        }
    }

    updateMarketData(candle) {
        const symbol = this.currentPair === 'XAUUSD' ? '$' : '$';
        const decimals = this.currentPair === 'XAUUSD' ? 2 : 5;
        
        document.getElementById('currentPrice').textContent = `${symbol}${candle.close.toFixed(decimals)}`;
        
        if (this.priceData.length >= 2) {
            const prevPrice = this.priceData[this.priceData.length - 2].close;
            const change = ((candle.close - prevPrice) / prevPrice * 100);
            const changeElement = document.getElementById('priceChange');
            changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.style.color = change >= 0 ? '#00ff88' : '#ff4444';
        }
        
        document.getElementById('volume24h').textContent = this.formatVolume(candle.volume);
        
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

    updateConnectionStatus(connected, source = '') {
        this.isConnected = connected;
        const statusElement = document.getElementById('connectionStatus');
        
        if (connected) {
            statusElement.textContent = source === 'BINANCE' ? 'Connected (Binance)' : 
                                      source === 'SIMULATION' ? 'Connected (Demo)' : 'Connected';
            statusElement.className = 'status-connected';
        } else {
            statusElement.textContent = 'Disconnected';
            statusElement.className = 'status-disconnected';
        }
    }

    changeTradingPair(pair) {
        this.currentPair = pair;
        this.priceData = [];
        
        // Update chart title
        if (this.chart) {
            this.chart.options.plugins.title.text = `${pair} - Price Movement`;
            this.chart.update();
        }
        
        console.log(`Switched to ${pair}`);
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

    toggleConnectionMode() {
        const toggleButton = document.getElementById('toggleConnection');
        
        if (this.useRealData) {
            // Switch to simulation
            this.useRealData = false;
            if (this.websocket) {
                this.websocket.close();
            }
            this.simulateGoldData();
            this.updateConnectionStatus(true, 'SIMULATION');
            toggleButton.textContent = 'Switch to Real Data';
        } else {
            // Switch to real data
            this.useRealData = true;
            if (this.simulationInterval) {
                clearInterval(this.simulationInterval);
            }
            this.connectWebSocket();
            toggleButton.textContent = 'Switch to Demo';
        }
    }

    simulateGoldData() {
        // Clear existing interval
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
        }
        
        // Initialize with realistic Gold price
        let currentPrice = this.goldConfig.basePrice;
        
        // Simulasi data XAU/USD yang realistis
        this.simulationInterval = setInterval(() => {
            const now = new Date();
            
            // Generate realistic price movement using Gold config
            const priceMovement = this.goldConfig.generatePriceMovement(currentPrice, 1);
            
            const candle = {
                time: now,
                open: priceMovement.open,
                high: priceMovement.high,
                low: priceMovement.low,
                close: priceMovement.close,
                volume: priceMovement.volume
            };
            
            // Update current price for next iteration
            currentPrice = candle.close;
            
            this.priceData.push(candle);
            if (this.priceData.length > 100) {
                this.priceData.shift();
            }
            
            // Generate realistic Gold order book
            this.orderBookData = this.generateGoldOrderBook(candle.close);
            
            this.updateChart();
            this.updateMarketData(candle);
            this.updateOrderBook();
            this.updateMarketSession();
            
        }, 1000); // Update setiap detik
    }

    generateGoldOrderBook(currentPrice) {
        const bids = [];
        const asks = [];
        const spread = this.goldConfig.spread;
        
        for (let i = 0; i < 10; i++) {
            bids.push([
                (currentPrice - spread/2 - (i * 0.1)).toFixed(2),
                (Math.random() * 100 + 10).toFixed(2)
            ]);
            
            asks.push([
                (currentPrice + spread/2 + (i * 0.1)).toFixed(2),
                (Math.random() * 100 + 10).toFixed(2)
            ]);
        }
        
        return { bids, asks };
    }

    updateMarketSession() {
        const session = this.goldConfig.getCurrentSession();
        const isOpen = this.goldConfig.isMarketOpen();
        const volatilityMultiplier = this.goldConfig.getVolatilityMultiplier();
        
        // Update session indicators
        document.getElementById('sessionValue').textContent = session.toUpperCase();
        document.getElementById('sessionSignal').textContent = isOpen ? 'OPEN' : 'CLOSED';
        document.getElementById('sessionSignal').className = `indicator-signal ${isOpen ? 'bullish' : 'bearish'}`;
        
        // Update trend strength based on volatility
        const trendStrength = volatilityMultiplier > 1.1 ? 'HIGH' : volatilityMultiplier > 0.8 ? 'MEDIUM' : 'LOW';
        document.getElementById('trendValue').textContent = `${(volatilityMultiplier * 100).toFixed(0)}%`;
        document.getElementById('trendSignal').textContent = trendStrength;
        document.getElementById('trendSignal').className = `indicator-signal ${
            trendStrength === 'HIGH' ? 'bullish' : 
            trendStrength === 'MEDIUM' ? 'neutral' : 'bearish'
        }`;
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ScalpTradingDashboard();
});