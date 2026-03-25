import 'dart:convert';
import 'package:http/http.dart' as http;
import 'price_service.dart';

/// Price chart service using the unofficial Yahoo Finance API.
///
/// Fetches OHLCV candlestick data for crypto pairs (e.g., BTC-USD).
/// Provides 1D, 1W, 1M, 3M, 1Y, and ALL time ranges.
class ChartService {
  final http.Client _client;
  final String _baseUrl;

  /// Yahoo Finance ticker symbols for each crypto.
  static const Map<String, String> _yahooTickers = {
    'BTC': 'BTC-USD',
    'ETH': 'ETH-USD',
    'SOL': 'SOL-USD',
    'BNB': 'BNB-USD',
    'XRP': 'XRP-USD',
    'ADA': 'ADA-USD',
    'DOGE': 'DOGE-USD',
    'AVAX': 'AVAX-USD',
    'DOT': 'DOT-USD',
    'LINK': 'LINK-USD',
    'ATOM': 'ATOM-USD',
    'LTC': 'LTC-USD',
    'NEAR': 'NEAR-USD',
    'BCH': 'BCH-USD',
    'XMR': 'XMR-USD',
    'FIL': 'FIL-USD',
    'HBAR': 'HBAR-USD',
    'ALGO': 'ALGO-USD',
    'XLM': 'XLM-USD',
    'SUI': 'SUI20947-USD',
    'APT': 'APT21794-USD',
    'TON': 'TON11419-USD',
    'KAS': 'KAS-USD',
    'TIA': 'TIA22861-USD',
    'SEI': 'SEI-USD',
    'TRX': 'TRX-USD',
    'FTM': 'FTM-USD',
    'CRO': 'CRO-USD',
    'POL': 'MATIC-USD',
    'ARB': 'ARB11841-USD',
    'OP': 'OP-USD',
    'UNI': 'UNI7083-USD',
    'AAVE': 'AAVE-USD',
    'MKR': 'MKR-USD',
    'COMP': 'COMP-USD',
    'SNX': 'SNX-USD',
    'CRV': 'CRV-USD',
    'LDO': 'LDO-USD',
    'GRT': 'GRT6719-USD',
    'ENS': 'ENS-USD',
    'SUSHI': 'SUSHI-USD',
    'RNDR': 'RNDR-USD',
    'FET': 'FET-USD',
    'APE': 'APE18876-USD',
    'SAND': 'SAND-USD',
    'MANA': 'MANA-USD',
    'SHIB': 'SHIB-USD',
    'PEPE': 'PEPE24478-USD',
    'JUP': 'JUP-USD',
    'BONK': 'BONK-USD',
    'WIF': 'WIF-USD',
    'PYTH': 'PYTH-USD',
    'ORCA': 'ORCA-USD',
    'HNT': 'HNT-USD',
    'CAKE': 'CAKE-USD',
    'RAY': 'RAY-USD',
  };

  ChartService({http.Client? client, String? baseUrl})
      : _client = client ?? http.Client(),
        _baseUrl = baseUrl ?? 'https://query1.finance.yahoo.com';

  /// Supported time ranges for charts.
  static const Map<ChartRange, _RangeConfig> _ranges = {
    ChartRange.day: _RangeConfig(range: '1d', interval: '5m'),
    ChartRange.week: _RangeConfig(range: '5d', interval: '15m'),
    ChartRange.month: _RangeConfig(range: '1mo', interval: '1h'),
    ChartRange.threeMonths: _RangeConfig(range: '3mo', interval: '1d'),
    ChartRange.year: _RangeConfig(range: '1y', interval: '1d'),
    ChartRange.all: _RangeConfig(range: 'max', interval: '1wk'),
  };

  /// Get the Yahoo Finance ticker for a symbol, or null if unsupported.
  String? getYahooTicker(String symbol) {
    return _yahooTickers[symbol.toUpperCase()];
  }

  /// Whether chart data is available for a symbol.
  bool isSupported(String symbol) {
    return _yahooTickers.containsKey(symbol.toUpperCase());
  }

  /// Fetch chart data for a crypto symbol.
  ///
  /// Returns a list of [PricePoint]s for the given time range.
  /// Falls back to empty list on failure.
  Future<ChartData> getChart(String symbol, {ChartRange range = ChartRange.week}) async {
    final ticker = _yahooTickers[symbol.toUpperCase()];
    if (ticker == null) {
      return ChartData.empty(symbol);
    }

    final config = _ranges[range]!;

    try {
      final url = '$_baseUrl/v8/finance/chart/$ticker'
          '?range=${config.range}&interval=${config.interval}';

      final response = await _client.get(
        Uri.parse(url),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PrismWallet/1.0',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode != 200) {
        return ChartData.empty(symbol);
      }

      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return _parseChartResponse(symbol, data, range);
    } catch (e) {
      return ChartData.empty(symbol);
    }
  }

  /// Parse Yahoo Finance chart response into ChartData.
  ChartData _parseChartResponse(
    String symbol,
    Map<String, dynamic> data,
    ChartRange range,
  ) {
    try {
      final chart = data['chart'] as Map<String, dynamic>?;
      if (chart == null) return ChartData.empty(symbol);

      final results = chart['result'] as List<dynamic>?;
      if (results == null || results.isEmpty) return ChartData.empty(symbol);

      final result = results[0] as Map<String, dynamic>;

      // Timestamps
      final timestamps = result['timestamp'] as List<dynamic>? ?? [];

      // Quote data (close prices)
      final indicators = result['indicators'] as Map<String, dynamic>? ?? {};
      final quotes = indicators['quote'] as List<dynamic>? ?? [];
      if (quotes.isEmpty) return ChartData.empty(symbol);

      final quote = quotes[0] as Map<String, dynamic>;
      final closes = quote['close'] as List<dynamic>? ?? [];
      final opens = quote['open'] as List<dynamic>? ?? [];
      final highs = quote['high'] as List<dynamic>? ?? [];
      final lows = quote['low'] as List<dynamic>? ?? [];
      final volumes = quote['volume'] as List<dynamic>? ?? [];

      // Build price points
      final points = <PricePoint>[];
      final candles = <Candle>[];

      for (int i = 0; i < timestamps.length && i < closes.length; i++) {
        final ts = timestamps[i] as int?;
        final close = closes[i] as num?;
        if (ts == null || close == null) continue;

        final time = DateTime.fromMillisecondsSinceEpoch(ts * 1000);
        points.add(PricePoint(timestamp: time, price: close.toDouble()));

        candles.add(Candle(
          timestamp: time,
          open: (i < opens.length ? opens[i] as num? : null)?.toDouble() ?? close.toDouble(),
          high: (i < highs.length ? highs[i] as num? : null)?.toDouble() ?? close.toDouble(),
          low: (i < lows.length ? lows[i] as num? : null)?.toDouble() ?? close.toDouble(),
          close: close.toDouble(),
          volume: (i < volumes.length ? volumes[i] as num? : null)?.toDouble() ?? 0,
        ));
      }

      // Meta data
      final meta = result['meta'] as Map<String, dynamic>? ?? {};
      final currentPrice = (meta['regularMarketPrice'] as num?)?.toDouble() ?? 0;
      final prevClose = (meta['chartPreviousClose'] as num?)?.toDouble() ?? 0;

      return ChartData(
        symbol: symbol,
        range: range,
        points: points,
        candles: candles,
        currentPrice: currentPrice,
        previousClose: prevClose,
        priceChange: currentPrice - prevClose,
        priceChangePercent: prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
        high: candles.isNotEmpty ? candles.map((c) => c.high).reduce((a, b) => a > b ? a : b) : 0,
        low: candles.isNotEmpty ? candles.map((c) => c.low).reduce((a, b) => a < b ? a : b) : 0,
      );
    } catch (e) {
      return ChartData.empty(symbol);
    }
  }

  void dispose() {
    _client.close();
  }
}

/// Time range for chart data.
enum ChartRange {
  day,
  week,
  month,
  threeMonths,
  year,
  all,
}

class _RangeConfig {
  final String range;
  final String interval;
  const _RangeConfig({required this.range, required this.interval});
}

/// Complete chart data for a symbol.
class ChartData {
  final String symbol;
  final ChartRange range;
  final List<PricePoint> points;
  final List<Candle> candles;
  final double currentPrice;
  final double previousClose;
  final double priceChange;
  final double priceChangePercent;
  final double high;
  final double low;

  const ChartData({
    required this.symbol,
    required this.range,
    required this.points,
    required this.candles,
    required this.currentPrice,
    required this.previousClose,
    required this.priceChange,
    required this.priceChangePercent,
    required this.high,
    required this.low,
  });

  factory ChartData.empty(String symbol) => ChartData(
    symbol: symbol,
    range: ChartRange.week,
    points: const [],
    candles: const [],
    currentPrice: 0,
    previousClose: 0,
    priceChange: 0,
    priceChangePercent: 0,
    high: 0,
    low: 0,
  );

  bool get isEmpty => points.isEmpty;
  bool get isPositive => priceChange >= 0;
}

/// OHLCV candlestick data point.
class Candle {
  final DateTime timestamp;
  final double open;
  final double high;
  final double low;
  final double close;
  final double volume;

  const Candle({
    required this.timestamp,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    required this.volume,
  });
}
