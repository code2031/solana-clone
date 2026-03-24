import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/token.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/transaction_item.dart';
import '../send/send_screen.dart';
import '../receive/receive_screen.dart';

class TokenDetailScreen extends StatelessWidget {
  final TokenModel token;

  const TokenDetailScreen({super.key, required this.token});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: Text(token.name),
        backgroundColor: AppTheme.darkBg,
      ),
      body: Consumer<WalletProvider>(
        builder: (context, walletProvider, _) {
          // Filter transactions for this token
          final tokenTxns = walletProvider.transactions.where((tx) {
            return tx.tokenSymbol == token.symbol || token.isNative;
          }).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Token hero card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: AppTheme.glassDecoration(),
                child: Column(
                  children: [
                    // Token icon
                    Container(
                      width: 64,
                      height: 64,
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
                        child: Text(
                          token.isNative ? 'S' : token.symbol[0],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Balance
                    Text(
                      '${Formatters.formatSol(token.balance, decimals: token.isNative ? 4 : 2)} ${token.symbol}',
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.formatUsd(token.valueUsd),
                      style: const TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                    if (token.priceChangePercent24h != 0) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color:
                              (token.priceChangePercent24h >= 0
                                      ? AppTheme.success
                                      : AppTheme.error)
                                  .withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          Formatters.formatPercent(
                              token.priceChangePercent24h),
                          style: TextStyle(
                            color: token.priceChangePercent24h >= 0
                                ? AppTheme.success
                                : AppTheme.error,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),

                    // Price info
                    if (token.priceUsd > 0)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            '1 ${token.symbol} = ${Formatters.formatUsd(token.priceUsd)}',
                            style: const TextStyle(
                              color: AppTheme.textTertiary,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),

                    const SizedBox(height: 20),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: _ActionBtn(
                            icon: Icons.arrow_upward_rounded,
                            label: 'Send',
                            color: AppTheme.solanaPurple,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const SendScreen(),
                                ),
                              );
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _ActionBtn(
                            icon: Icons.arrow_downward_rounded,
                            label: 'Receive',
                            color: AppTheme.solanaGreen,
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => const ReceiveScreen(),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Recent transactions header
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 12),
                child: Text(
                  'Recent Transactions',
                  style: TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

              // Transaction list
              if (tokenTxns.isEmpty)
                Container(
                  padding: const EdgeInsets.all(40),
                  child: const Center(
                    child: Column(
                      children: [
                        Icon(Icons.receipt_long_rounded,
                            color: AppTheme.textTertiary, size: 40),
                        SizedBox(height: 12),
                        Text(
                          'No transactions yet',
                          style: TextStyle(
                            color: AppTheme.textTertiary,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ...tokenTxns.map((tx) => TransactionItem(transaction: tx)),
            ],
          );
        },
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _ActionBtn({
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
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 6),
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
