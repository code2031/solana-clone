import 'package:flutter/material.dart';
import '../models/transaction.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class TransactionItem extends StatelessWidget {
  final TransactionModel transaction;
  final VoidCallback? onTap;

  const TransactionItem({
    super.key,
    required this.transaction,
    this.onTap,
  });

  IconData get _icon {
    switch (transaction.type) {
      case TransactionType.send:
        return Icons.arrow_upward_rounded;
      case TransactionType.receive:
        return Icons.arrow_downward_rounded;
      case TransactionType.swap:
        return Icons.swap_horiz_rounded;
      case TransactionType.stake:
        return Icons.lock_rounded;
      case TransactionType.unstake:
        return Icons.lock_open_rounded;
      case TransactionType.unknown:
        return Icons.receipt_long_rounded;
    }
  }

  Color get _iconColor {
    switch (transaction.type) {
      case TransactionType.send:
        return AppTheme.error;
      case TransactionType.receive:
        return AppTheme.success;
      case TransactionType.swap:
        return AppTheme.solanaTeal;
      case TransactionType.stake:
        return AppTheme.solanaPurple;
      case TransactionType.unstake:
        return AppTheme.warning;
      case TransactionType.unknown:
        return AppTheme.textTertiary;
    }
  }

  String get _displayAddress {
    if (transaction.isOutgoing && transaction.toAddress.isNotEmpty) {
      return Formatters.truncateAddress(transaction.toAddress);
    } else if (!transaction.isOutgoing && transaction.fromAddress.isNotEmpty) {
      return Formatters.truncateAddress(transaction.fromAddress);
    }
    return Formatters.truncateAddress(transaction.signature);
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              // Type icon
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: _iconColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_icon, color: _iconColor, size: 20),
              ),
              const SizedBox(width: 14),

              // Type and address
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          transaction.typeLabel,
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (transaction.status == TransactionStatus.failed) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.error.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Failed',
                              style: TextStyle(
                                color: AppTheme.error,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                        if (transaction.status == TransactionStatus.pending) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.warning.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Pending',
                              style: TextStyle(
                                color: AppTheme.warning,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _displayAddress,
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              // Amount and time
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${transaction.isOutgoing ? '-' : '+'}${Formatters.formatSol(transaction.amount)} ${transaction.tokenSymbol}',
                    style: TextStyle(
                      color: transaction.isOutgoing
                          ? AppTheme.error
                          : AppTheme.success,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    Formatters.timeAgo(transaction.timestamp),
                    style: const TextStyle(
                      color: AppTheme.textTertiary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
