# 🤖 AI Scalp Trading Analysis

Aplikasi AI Trading Analysis untuk Scalp Trading dengan analisis teknikal real-time dan sinyal trading otomatis.

## 🚀 Fitur Utama

### ⚡ AI Trading Engine
- **Multi-Indicator Analysis**: RSI, MACD, EMA, Bollinger Bands, Stochastic
- **Volume Analysis**: Deteksi volume spike dan trend analysis
- **Order Book Analysis**: Bid/ask imbalance dan spread analysis
- **Momentum Analysis**: Multi-timeframe momentum detection
- **Smart Scoring System**: Confidence-based signal generation

### 📊 Real-time Dashboard
- **Live Price Chart**: Candlestick dengan technical indicators
- **Trading Signals**: BUY/SELL/HOLD dengan confidence level
- **Market Data**: Current price, volume, spread, 24h change
- **Order Book**: Real-time bid/ask data
- **Signal History**: Track semua trading signals

### 🛡️ Risk Management
- **Configurable Stop Loss**: Default 0.3%
- **Profit Target**: Minimum 0.5% profit target
- **Risk/Reward Ratio**: Automatic calculation
- **Position Sizing**: Risk-based position recommendations

## 🔧 Cara Menggunakan

### 1. Buka Dashboard
```
Buka file: scalp-trading-dashboard.html
```

### 2. Pilih Mode Data
- **Demo Mode**: Data simulasi untuk testing (default)
- **Real Data**: Koneksi ke Binance WebSocket API
- Klik tombol "Switch to Real Data" untuk toggle

### 3. Konfigurasi Settings
```javascript
Trading Pair: BTC/USDT, ETH/USDT, ADA/USDT, DOT/USDT
Risk Level: 2% (default)
Profit Target: 0.5% (default)
Stop Loss: 0.3% (default)
```

### 4. Monitor Trading Signals
- **BUY Signal**: Score ≥3, Confidence ≥60%
- **SELL Signal**: Score ≤-3, Confidence ≥60%
- **HOLD**: Insufficient confidence atau mixed signals

### 5. Interpretasi Indicators
- **RSI**: Overbought (>70), Oversold (<30)
- **MACD**: Bullish/Bearish momentum
- **EMA Cross**: 9 vs 21 period crossover
- **Volume**: Spike detection dan trend

## 📈 Signal Scoring System

### Scoring Components:
- **EMA Signal**: ±2 points (Bullish/Bearish)
- **RSI Signal**: ±1.5 points (Oversold/Overbought)
- **MACD Signal**: ±1 point (Momentum direction)
- **Volume Confirmation**: ±1 point (Strong volume)
- **Order Book**: ±0.5 points (Buy/Sell pressure)
- **Momentum**: ±1 point (Multi-timeframe)

### Signal Generation:
```javascript
BUY Signal:  Score ≥3 && Confidence ≥60%
SELL Signal: Score ≤-3 && Confidence ≥60%
HOLD:        Insufficient score atau confidence
```

## 🔌 API Integration

### Binance WebSocket Streams:
```javascript
// Kline data (1 minute)
wss://stream.binance.com:9443/ws/{symbol}@kline_1m

// 24hr ticker
wss://stream.binance.com:9443/ws/{symbol}@ticker

// Order book depth
wss://stream.binance.com:9443/ws/{symbol}@depth10
```

### Supported Trading Pairs:
- BTC/USDT
- ETH/USDT
- ADA/USDT
- DOT/USDT
- (Mudah ditambah pair lain)

## ⚙️ Technical Specifications

### Timeframes:
- **Primary**: 1 minute (scalping)
- **Secondary**: 3 minutes, 5 minutes
- **Analysis Window**: 100 candles

### Indicators Parameters:
```javascript
RSI: 14 period
MACD: 12, 26, 9
EMA: 9, 21 period
Bollinger Bands: 20, 2
Stochastic: 14, 3
```

### Performance:
- **Update Frequency**: 1-5 seconds
- **Analysis Speed**: <100ms
- **Memory Usage**: ~50MB
- **WebSocket Latency**: <100ms

## 🚨 Risk Disclaimer

⚠️ **PERINGATAN PENTING**:
- Trading cryptocurrency sangat berisiko
- Bisa kehilangan seluruh modal
- Gunakan hanya modal yang siap hilang
- Tidak ada jaminan profit
- Selalu lakukan riset sendiri (DYOR)

## 📝 Development Notes

### File Structure:
```
ai analisis market/
├── scalp-trading-dashboard.html    # Main dashboard
├── css/
│   └── scalp-trading.css          # Styling
└── js/
    ├── scalp-trading-ai.js        # AI analysis engine
    ├── technical-indicators.js    # Technical indicators
    └── scalp-dashboard.js         # Dashboard controller
```

### Customization:
- Tambah trading pairs di `tradingPair` select
- Modifikasi scoring system di `combineSignals()`
- Adjust risk parameters di settings panel
- Tambah indicators baru di `TechnicalIndicators` class

## 🔄 Updates & Maintenance

### Regular Updates:
- Monitor API changes dari Binance
- Update technical indicators
- Improve AI scoring algorithm
- Add new trading pairs
- Performance optimizations

### Troubleshooting:
1. **Connection Issues**: Check internet dan Binance API status
2. **Slow Performance**: Reduce analysis frequency
3. **Wrong Signals**: Adjust scoring parameters
4. **Chart Issues**: Refresh browser atau clear cache

---

**Dibuat untuk educational purposes. Gunakan dengan bijak dan selalu kelola risiko dengan baik!** 🚀📊