import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/network_provider.dart';
import '../../providers/multi_chain_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/balance_card.dart';
import '../../widgets/token_list_item.dart';
import '../../widgets/network_badge.dart';
import '../../widgets/loading_shimmer.dart';
import '../send/send_screen.dart';
import '../receive/receive_screen.dart';
import '../token/token_detail_screen.dart';
import '../staking/staking_screen.dart';
import '../create_token/manage_tokens_screen.dart';
import 'chains_overview.dart';

class PortfolioTab extends StatefulWidget {
  const PortfolioTab({super.key});

  @override
  State<PortfolioTab> createState() => _PortfolioTabState();
}

class _PortfolioTabState extends State<PortfolioTab> {
  bool _showAllChains = false;

  @override
  Widget build(BuildContext context) {
    return Consumer2<WalletProvider, NetworkProvider>(
      builder: (context, walletProvider, networkProvider, _) {
        return Stack(
          children: [
          SafeArea(
          child: Column(
            children: [
              // App bar area with view toggle
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SolClone Wallet',
                          style: TextStyle(
                            color: AppTheme.textPrimary,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (walletProvider.wallet != null)
                          Text(
                            walletProvider.wallet!.shortAddress,
                            style: const TextStyle(
                              color: AppTheme.textTertiary,
                              fontSize: 13,
                              fontFamily: 'monospace',
                            ),
                          ),
                      ],
                    ),
                    Row(
                      children: [
                        // View mode toggle
                        _ViewToggle(
                          showAllChains: _showAllChains,
                          onToggle: (value) {
                            setState(() => _showAllChains = value);
                          },
                        ),
                        const SizedBox(width: 8),
                        NetworkBadge(
                          network: networkProvider.currentNetwork,
                          isConnected: networkProvider.isConnected,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Content area -- switches between all chains and SolClone only
              Expanded(
                child: _showAllChains
                    ? const ChainsOverview()
                    : _SolClonePortfolioView(
                        walletProvider: walletProvider,
                        networkProvider: networkProvider,
                      ),
              ),
            ],
          ),
        ),
          // Floating action button -- Create Token / NFT
          if (!_showAllChains)
            Positioned(
              right: 20,
              bottom: 20,
              child: FloatingActionButton(
                heroTag: 'create_token_fab',
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const ManageTokensScreen(),
                    ),
                  );
                },
                backgroundColor: AppTheme.solanaPurple,
                child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
              ),
            ),
          ],
        );
      },
    );
  }
}

/// Toggle widget for switching between "All Chains" and "SolClone Only" views.
class _ViewToggle extends StatelessWidget {
  final bool showAllChains;
  final ValueChanged<bool> onToggle;

  const _ViewToggle({
    required this.showAllChains,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 32,
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.darkCardLight),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _ToggleOption(
            label: 'All Chains',
            isSelected: showAllChains,
            onTap: () => onToggle(true),
          ),
          _ToggleOption(
            label: 'SolClone',
            isSelected: !showAllChains,
            onTap: () => onToggle(false),
          ),
        ],
      ),
    );
  }
}

class _ToggleOption extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _ToggleOption({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.solanaPurple.withValues(alpha: 0.2)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(7),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppTheme.solanaPurple : AppTheme.textTertiary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

/// The original SolClone-only portfolio view, extracted for clarity.
class _SolClonePortfolioView extends StatelessWidget {
  final WalletProvider walletProvider;
  final NetworkProvider networkProvider;

  const _SolClonePortfolioView({
    required this.walletProvider,
    required this.networkProvider,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => walletProvider.refreshAll(),
      color: AppTheme.solanaPurple,
      backgroundColor: AppTheme.darkCard,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Balance card
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 20),
              child: walletProvider.isLoading
                  ? LoadingShimmer.balanceCard()
                  : BalanceCard(
                      balanceSol: walletProvider.wallet?.balanceSol ?? 0,
                      balanceUsd: walletProvider.wallet?.balanceUsd ?? 0,
                      showAirdrop: networkProvider.canAirdrop,
                      onSend: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const SendScreen(),
                          ),
                        );
                      },
                      onReceive: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const ReceiveScreen(),
                          ),
                        );
                      },
                      onAirdrop: () async {
                        try {
                          await walletProvider.requestAirdrop();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: const Text(
                                    'Airdrop of 1 SOL requested!'),
                                backgroundColor: AppTheme.darkCard,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(12),
                                ),
                              ),
                            );
                          }
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Airdrop failed: $e'),
                                backgroundColor: AppTheme.error,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius:
                                      BorderRadius.circular(12),
                                ),
                              ),
                            );
                          }
                        }
                      },
                    ),
            ),
          ),

          // Quick actions row
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 4),
              child: Row(
                children: [
                  _QuickAction(
                    icon: Icons.lock_rounded,
                    label: 'Stake',
                    color: AppTheme.solanaPurple,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const StakingScreen(),
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 10),
                  _QuickAction(
                    icon: Icons.add_circle_outline_rounded,
                    label: 'Create',
                    color: AppTheme.solanaGreen,
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const ManageTokensScreen(),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ),

          // Token list header
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 10),
              child: Text(
                'Tokens',
                style: TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),

          // Token list
          if (walletProvider.isLoading)
            SliverToBoxAdapter(
              child: Column(
                children: List.generate(
                    3, (_) => LoadingShimmer.tokenRow()),
              ),
            )
          else if (walletProvider.tokens.isEmpty)
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                  child: Column(
                    children: [
                      Icon(Icons.token_rounded,
                          color: AppTheme.textTertiary, size: 48),
                      SizedBox(height: 12),
                      Text(
                        'No tokens yet',
                        style: TextStyle(
                          color: AppTheme.textTertiary,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final token = walletProvider.tokens[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: TokenListItem(
                        token: token,
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  TokenDetailScreen(token: token),
                            ),
                          );
                        },
                      ),
                    );
                  },
                  childCount: walletProvider.tokens.length,
                ),
              ),
            ),

          // Bottom padding for FAB clearance
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _QuickAction({
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: color.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 13,
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
