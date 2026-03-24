import 'package:flutter/material.dart';
import '../providers/network_provider.dart';
import '../theme/app_theme.dart';

class NetworkBadge extends StatelessWidget {
  final NetworkType network;
  final bool isConnected;
  final bool compact;

  const NetworkBadge({
    super.key,
    required this.network,
    this.isConnected = true,
    this.compact = false,
  });

  Color get _color {
    switch (network) {
      case NetworkType.mainnet:
        return AppTheme.success;
      case NetworkType.testnet:
        return AppTheme.warning;
      case NetworkType.devnet:
        return AppTheme.solanaTeal;
      case NetworkType.localnet:
        return AppTheme.solanaPurple;
      case NetworkType.custom:
        return AppTheme.info;
    }
  }

  String get _label {
    switch (network) {
      case NetworkType.mainnet:
        return 'Mainnet';
      case NetworkType.testnet:
        return 'Testnet';
      case NetworkType.devnet:
        return 'Devnet';
      case NetworkType.localnet:
        return 'Local';
      case NetworkType.custom:
        return 'Custom';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _color.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: compact ? 6 : 8,
            height: compact ? 6 : 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isConnected ? _color : AppTheme.textTertiary,
            ),
          ),
          SizedBox(width: compact ? 4 : 6),
          Text(
            _label,
            style: TextStyle(
              color: _color,
              fontSize: compact ? 10 : 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
