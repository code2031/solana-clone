import 'package:flutter/material.dart';
import '../models/token.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

class TokenListItem extends StatelessWidget {
  final TokenModel token;
  final VoidCallback? onTap;

  const TokenListItem({
    super.key,
    required this.token,
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: AppTheme.darkCard.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.04),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              // Token icon
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: token.isNative
                      ? AppTheme.primaryGradient
                      : LinearGradient(
                          colors: [
                            AppTheme.darkCardLight,
                            AppTheme.darkCard,
                          ],
                        ),
                ),
                child: Center(
                  child: token.isNative
                      ? const Text(
                          'S',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                      : Text(
                          token.symbol.isNotEmpty
                              ? token.symbol[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 14),

              // Name and symbol
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      token.name,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      token.symbol,
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),

              // Balance and value
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${Formatters.formatSol(token.balance, decimals: token.isNative ? 4 : 2)} ${token.symbol}',
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        Formatters.formatUsd(token.valueUsd),
                        style: const TextStyle(
                          color: AppTheme.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                      if (token.priceChangePercent24h != 0) ...[
                        const SizedBox(width: 6),
                        Text(
                          Formatters.formatPercent(token.priceChangePercent24h),
                          style: TextStyle(
                            color: token.priceChangePercent24h >= 0
                                ? AppTheme.success
                                : AppTheme.error,
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
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
