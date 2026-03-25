import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/chain.dart';
import '../../providers/multi_chain_provider.dart';
import '../../theme/app_theme.dart';

/// Multi-chain receive screen showing the correct address and QR code
/// for each supported blockchain.
///
/// Features chain selector tabs, per-chain address display, QR code
/// generation, and copy/share functionality.
class MultiChainReceiveScreen extends StatefulWidget {
  final ChainType? initialChain;

  const MultiChainReceiveScreen({super.key, this.initialChain});

  @override
  State<MultiChainReceiveScreen> createState() =>
      _MultiChainReceiveScreenState();
}

class _MultiChainReceiveScreenState extends State<MultiChainReceiveScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late List<ChainType> _chainTypes;

  @override
  void initState() {
    super.initState();
    _chainTypes = ChainType.values.toList();
    _tabController = TabController(
      length: _chainTypes.length,
      vsync: this,
      initialIndex: widget.initialChain != null
          ? _chainTypes.indexOf(widget.initialChain!)
          : 0,
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Receive'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppTheme.solanaPurple,
          indicatorSize: TabBarIndicatorSize.label,
          labelColor: AppTheme.textPrimary,
          unselectedLabelColor: AppTheme.textTertiary,
          labelStyle: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
          tabAlignment: TabAlignment.start,
          tabs: _chainTypes.map((type) {
            final chain = Chain.defaults[type]!;
            return Tab(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(chain.iconEmoji, style: const TextStyle(fontSize: 14)),
                  const SizedBox(width: 6),
                  Text(chain.name),
                ],
              ),
            );
          }).toList(),
        ),
      ),
      body: Consumer<MultiChainProvider>(
        builder: (context, provider, _) {
          return TabBarView(
            controller: _tabController,
            children: _chainTypes.map((type) {
              final chain = provider.getChain(type);
              return _ChainReceiveView(chain: chain);
            }).toList(),
          );
        },
      ),
    );
  }
}

/// Individual chain receive view with QR code and address.
class _ChainReceiveView extends StatelessWidget {
  final Chain chain;

  const _ChainReceiveView({required this.chain});

  @override
  Widget build(BuildContext context) {
    final chainColor = Color(int.parse(chain.color, radix: 16));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),

          // Chain icon large
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: chainColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: chainColor.withValues(alpha: 0.2),
              ),
            ),
            child: Center(
              child: Text(
                chain.iconEmoji,
                style: const TextStyle(fontSize: 36),
              ),
            ),
          ),
          const SizedBox(height: 16),

          Text(
            'Receive ${chain.symbol}',
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'on ${chain.name} Network',
            style: const TextStyle(
              color: AppTheme.textTertiary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 32),

          // QR Code placeholder
          Container(
            width: 220,
            height: 220,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: chainColor.withValues(alpha: 0.15),
                  blurRadius: 20,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: _QRCodeWidget(
              data: chain.address,
              color: chainColor,
            ),
          ),
          const SizedBox(height: 28),

          // Address display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: chainColor.withValues(alpha: 0.15),
              ),
            ),
            child: Column(
              children: [
                Text(
                  'Your ${chain.name} Address',
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 10),
                SelectableText(
                  chain.address.isNotEmpty ? chain.address : 'Not available',
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 14,
                    fontFamily: 'monospace',
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Action buttons
          Row(
            children: [
              Expanded(
                child: _ActionButton(
                  icon: Icons.copy_rounded,
                  label: 'Copy Address',
                  color: chainColor,
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: chain.address));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                            '${chain.name} address copied to clipboard'),
                        backgroundColor: AppTheme.darkCard,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _ActionButton(
                  icon: Icons.share_rounded,
                  label: 'Share',
                  color: AppTheme.textSecondary,
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: chain.address));
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: const Text('Address copied for sharing'),
                        backgroundColor: AppTheme.darkCard,
                        behavior: SnackBarBehavior.floating,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Warning notice
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.warning.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.warning.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.warning_amber_rounded,
                    color: AppTheme.warning, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Only send ${chain.symbol} and ${chain.name}-compatible tokens to this address. Sending other assets may result in permanent loss.',
                    style: TextStyle(
                      color: AppTheme.warning.withValues(alpha: 0.9),
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Simple QR code widget (renders a visual representation of the address).
/// In production, use the qr_flutter package.
class _QRCodeWidget extends StatelessWidget {
  final String data;
  final Color color;

  const _QRCodeWidget({required this.data, required this.color});

  @override
  Widget build(BuildContext context) {
    // Generate a deterministic grid pattern from the address data.
    // In production, replace this with qr_flutter's QrImageView.
    final bytes = data.codeUnits;
    final gridSize = 11;

    return CustomPaint(
      painter: _QRPainter(
        bytes: bytes,
        gridSize: gridSize,
        color: color,
      ),
      size: const Size(188, 188),
    );
  }
}

class _QRPainter extends CustomPainter {
  final List<int> bytes;
  final int gridSize;
  final Color color;

  _QRPainter({
    required this.bytes,
    required this.gridSize,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cellSize = size.width / gridSize;
    final paint = Paint()..color = Colors.black;

    // Draw finder patterns (the three corner squares)
    _drawFinderPattern(canvas, 0, 0, cellSize, paint);
    _drawFinderPattern(canvas, (gridSize - 3) * cellSize, 0, cellSize, paint);
    _drawFinderPattern(canvas, 0, (gridSize - 3) * cellSize, cellSize, paint);

    // Fill data modules based on address bytes
    for (int row = 0; row < gridSize; row++) {
      for (int col = 0; col < gridSize; col++) {
        // Skip finder pattern areas
        if (_isFinderArea(row, col)) continue;

        final index = (row * gridSize + col) % bytes.length;
        final byteVal = bytes[index];
        final bitPos = (row + col) % 8;

        if ((byteVal >> bitPos) & 1 == 1) {
          canvas.drawRect(
            Rect.fromLTWH(
              col * cellSize + 0.5,
              row * cellSize + 0.5,
              cellSize - 1,
              cellSize - 1,
            ),
            paint,
          );
        }
      }
    }
  }

  bool _isFinderArea(int row, int col) {
    // Top-left finder
    if (row < 3 && col < 3) return true;
    // Top-right finder
    if (row < 3 && col >= gridSize - 3) return true;
    // Bottom-left finder
    if (row >= gridSize - 3 && col < 3) return true;
    return false;
  }

  void _drawFinderPattern(
      Canvas canvas, double x, double y, double cellSize, Paint paint) {
    // Outer border
    canvas.drawRect(
      Rect.fromLTWH(x, y, cellSize * 3, cellSize * 3),
      paint,
    );
    // Inner white
    final whitePaint = Paint()..color = Colors.white;
    canvas.drawRect(
      Rect.fromLTWH(
          x + cellSize * 0.5, y + cellSize * 0.5, cellSize * 2, cellSize * 2),
      whitePaint,
    );
    // Center dot
    canvas.drawRect(
      Rect.fromLTWH(x + cellSize, y + cellSize, cellSize, cellSize),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _QRPainter oldDelegate) {
    return oldDelegate.bytes != bytes || oldDelegate.color != color;
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: color.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
