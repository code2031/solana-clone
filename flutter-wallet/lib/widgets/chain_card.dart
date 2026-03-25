import 'package:flutter/material.dart';
import '../models/chain.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

/// A card widget representing a single blockchain in the multi-chain portfolio.
///
/// Displays the chain icon (emoji), name, native balance, USD value,
/// token count badge, and a color accent matching the chain.
class ChainCard extends StatelessWidget {
  final Chain chain;
  final VoidCallback? onTap;

  const ChainCard({
    super.key,
    required this.chain,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final chainColor = Color(int.parse(chain.color, radix: 16));
    final hasTokens = chain.tokens.isNotEmpty;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: chainColor.withValues(alpha: 0.12),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              // Chain icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: chainColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text(
                    chain.iconEmoji,
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              const SizedBox(width: 14),

              // Chain info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          chain.name,
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (hasTokens) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: chainColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              '${chain.tokens.length} token${chain.tokens.length != 1 ? 's' : ''}',
                              style: TextStyle(
                                color: chainColor,
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${chain.balance.toStringAsFixed(6)} ${chain.symbol}',
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              // USD value column
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    Formatters.formatUsd(chain.totalUsdValue),
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  // Color accent bar
                  Container(
                    width: 24,
                    height: 3,
                    decoration: BoxDecoration(
                      color: chainColor,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),

              const SizedBox(width: 4),
              Icon(
                Icons.chevron_right_rounded,
                color: AppTheme.textTertiary.withValues(alpha: 0.5),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
