import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class AddressDisplay extends StatelessWidget {
  final String address;
  final int prefixLen;
  final int suffixLen;
  final bool showCopyButton;
  final double fontSize;
  final Color? textColor;

  const AddressDisplay({
    super.key,
    required this.address,
    this.prefixLen = 6,
    this.suffixLen = 6,
    this.showCopyButton = true,
    this.fontSize = 14,
    this.textColor,
  });

  void _copyToClipboard(BuildContext context) {
    Clipboard.setData(ClipboardData(text: address));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Address copied to clipboard'),
        backgroundColor: AppTheme.darkCard,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: showCopyButton ? () => _copyToClipboard(context) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.06),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                Formatters.truncateAddress(
                  address,
                  prefixLen: prefixLen,
                  suffixLen: suffixLen,
                ),
                style: TextStyle(
                  color: textColor ?? AppTheme.textSecondary,
                  fontSize: fontSize,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (showCopyButton) ...[
              const SizedBox(width: 8),
              Icon(
                Icons.copy_rounded,
                color: AppTheme.textTertiary,
                size: fontSize + 2,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
