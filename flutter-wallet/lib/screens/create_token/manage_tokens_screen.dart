import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../services/rpc_service.dart';
import '../../services/wallet_service.dart';
import '../../services/token_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/gradient_button.dart';
import 'create_token_screen.dart';
import 'mint_nft_screen.dart';

class ManageTokensScreen extends StatefulWidget {
  const ManageTokensScreen({super.key});

  @override
  State<ManageTokensScreen> createState() => _ManageTokensScreenState();
}

class _ManageTokensScreenState extends State<ManageTokensScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Token Manager'),
        backgroundColor: AppTheme.darkBg,
        elevation: 0,
      ),
      body: SafeArea(
        child: Consumer<WalletProvider>(
          builder: (context, walletProvider, _) {
            return SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // -------------------------------------------------------
                  // Create section
                  // -------------------------------------------------------
                  const Text(
                    'Create',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Launch your own tokens and collectibles',
                    style: TextStyle(color: AppTheme.textTertiary, fontSize: 13),
                  ),
                  const SizedBox(height: 16),

                  // Create Token card
                  _ActionCard(
                    icon: Icons.token_rounded,
                    iconGradient: AppTheme.primaryGradient,
                    title: 'Create Token',
                    subtitle: 'Deploy a new SPL token with custom name, symbol, and supply',
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const CreateTokenScreen()),
                      );
                    },
                  ),
                  const SizedBox(height: 12),

                  // Mint NFT card
                  _ActionCard(
                    icon: Icons.diamond_rounded,
                    iconGradient: const LinearGradient(
                      colors: [Color(0xFFFF6B6B), Color(0xFFFFD93D)],
                    ),
                    title: 'Mint NFT',
                    subtitle: 'Create a unique collectible with metadata and attributes',
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const MintNftScreen()),
                      );
                    },
                  ),
                  const SizedBox(height: 32),

                  // -------------------------------------------------------
                  // Your Tokens section
                  // -------------------------------------------------------
                  const Text(
                    'Your Tokens',
                    style: TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Mint more or burn tokens you hold',
                    style: TextStyle(color: AppTheme.textTertiary, fontSize: 13),
                  ),
                  const SizedBox(height: 16),

                  if (walletProvider.tokens.isEmpty)
                    _EmptyState(
                      icon: Icons.token_outlined,
                      message: 'No tokens yet. Create one above!',
                    )
                  else
                    ...walletProvider.tokens.map((token) {
                      // Skip the native SOL entry — it's not mintable/burnable as an SPL token.
                      if (token.isNative) return const SizedBox.shrink();

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _TokenTile(
                          name: token.name,
                          symbol: token.symbol,
                          mintAddress: token.mintAddress,
                          balance: token.balance,
                          decimals: token.decimals,
                          onMintMore: () =>
                              _showMintMoreDialog(context, token.mintAddress, token.symbol, token.decimals),
                          onBurn: () => _showBurnDialog(
                              context, token.mintAddress, token.symbol, token.balance, token.decimals),
                        ),
                      );
                    }),

                  // Show a message if only SOL is present.
                  if (walletProvider.tokens.length == 1 && walletProvider.tokens.first.isNative)
                    _EmptyState(
                      icon: Icons.token_outlined,
                      message: 'No SPL tokens yet. Create one above!',
                    ),

                  const SizedBox(height: 40),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Mint More dialog
  // ---------------------------------------------------------------------------

  void _showMintMoreDialog(
      BuildContext context, String mintAddress, String symbol, int decimals) {
    final amountController = TextEditingController();
    bool isLoading = false;
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                  20, 24, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.darkCardLight,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Mint More $symbol',
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Mint address: ${_truncate(mintAddress)}',
                    style: const TextStyle(color: AppTheme.textTertiary, fontSize: 12,
                        fontFamily: 'monospace'),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: amountController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    ],
                    decoration: const InputDecoration(
                      hintText: 'Amount to mint',
                      prefixIcon: Icon(Icons.add_circle_outline,
                          color: AppTheme.textTertiary),
                    ),
                  ),
                  if (errorMsg != null) ...[
                    const SizedBox(height: 12),
                    Text(errorMsg!,
                        style: const TextStyle(color: AppTheme.error, fontSize: 13)),
                  ],
                  const SizedBox(height: 20),
                  GradientButton(
                    text: 'Mint Tokens',
                    icon: Icons.add,
                    isLoading: isLoading,
                    onPressed: isLoading
                        ? null
                        : () async {
                            final amount = double.tryParse(amountController.text);
                            if (amount == null || amount <= 0) {
                              setSheetState(() => errorMsg = 'Enter a valid amount');
                              return;
                            }
                            setSheetState(() {
                              isLoading = true;
                              errorMsg = null;
                            });
                            try {
                              final tokenService = TokenService(
                                rpcService: Provider.of<RpcService>(context, listen: false),
                                walletService:
                                    Provider.of<WalletService>(context, listen: false),
                              );
                              await tokenService.mintTokens(
                                mintAddress: mintAddress,
                                amount: amount,
                                decimals: decimals,
                              );
                              if (context.mounted) {
                                context.read<WalletProvider>().refreshAll();
                              }
                              if (ctx.mounted) Navigator.of(ctx).pop();
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Minted $amount $symbol'),
                                    backgroundColor: AppTheme.darkCard,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10)),
                                  ),
                                );
                              }
                            } catch (e) {
                              setSheetState(() {
                                isLoading = false;
                                errorMsg = e
                                    .toString()
                                    .replaceFirst('TokenServiceException: ', '')
                                    .replaceFirst('RpcException: ', '')
                                    .replaceFirst('Exception: ', '');
                              });
                            }
                          },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // Burn dialog
  // ---------------------------------------------------------------------------

  void _showBurnDialog(BuildContext context, String mintAddress, String symbol,
      double balance, int decimals) {
    final amountController = TextEditingController();
    bool isLoading = false;
    String? errorMsg;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                  20, 24, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.darkCardLight,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Burn $symbol',
                    style: const TextStyle(
                      color: AppTheme.error,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Balance: $balance $symbol',
                    style: const TextStyle(color: AppTheme.textTertiary, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  TextFormField(
                    controller: amountController,
                    style: const TextStyle(color: AppTheme.textPrimary),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    ],
                    decoration: InputDecoration(
                      hintText: 'Amount to burn',
                      prefixIcon: const Icon(Icons.local_fire_department_rounded,
                          color: AppTheme.error),
                      suffixIcon: TextButton(
                        onPressed: () =>
                            amountController.text = balance.toString(),
                        child: const Text('MAX',
                            style: TextStyle(
                                color: AppTheme.error,
                                fontWeight: FontWeight.bold,
                                fontSize: 12)),
                      ),
                    ),
                  ),
                  if (errorMsg != null) ...[
                    const SizedBox(height: 12),
                    Text(errorMsg!,
                        style: const TextStyle(color: AppTheme.error, fontSize: 13)),
                  ],
                  const SizedBox(height: 8),
                  const Text(
                    'Burned tokens are permanently destroyed and cannot be recovered.',
                    style: TextStyle(color: AppTheme.textTertiary, fontSize: 12),
                  ),
                  const SizedBox(height: 20),
                  GradientButton(
                    text: 'Burn Tokens',
                    icon: Icons.local_fire_department_rounded,
                    isLoading: isLoading,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF4D6A), Color(0xFFFF8A3D)],
                    ),
                    onPressed: isLoading
                        ? null
                        : () async {
                            final amount = double.tryParse(amountController.text);
                            if (amount == null || amount <= 0) {
                              setSheetState(() => errorMsg = 'Enter a valid amount');
                              return;
                            }
                            if (amount > balance) {
                              setSheetState(
                                  () => errorMsg = 'Amount exceeds balance');
                              return;
                            }
                            setSheetState(() {
                              isLoading = true;
                              errorMsg = null;
                            });
                            try {
                              final tokenService = TokenService(
                                rpcService: Provider.of<RpcService>(context, listen: false),
                                walletService:
                                    Provider.of<WalletService>(context, listen: false),
                              );
                              await tokenService.burnTokens(
                                mintAddress: mintAddress,
                                amount: amount,
                                decimals: decimals,
                              );
                              if (context.mounted) {
                                context.read<WalletProvider>().refreshAll();
                              }
                              if (ctx.mounted) Navigator.of(ctx).pop();
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Burned $amount $symbol'),
                                    backgroundColor: AppTheme.darkCard,
                                    behavior: SnackBarBehavior.floating,
                                    shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(10)),
                                  ),
                                );
                              }
                            } catch (e) {
                              setSheetState(() {
                                isLoading = false;
                                errorMsg = e
                                    .toString()
                                    .replaceFirst('TokenServiceException: ', '')
                                    .replaceFirst('RpcException: ', '')
                                    .replaceFirst('Exception: ', '');
                              });
                            }
                          },
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _truncate(String s) {
    if (s.length <= 12) return s;
    return '${s.substring(0, 6)}...${s.substring(s.length - 6)}';
  }
}

// =============================================================================
// Private widgets
// =============================================================================

/// Large action card for the Create section.
class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Gradient iconGradient;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const _ActionCard({
    required this.icon,
    required this.iconGradient,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: AppTheme.glassDecoration(),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  gradient: iconGradient,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded,
                  color: AppTheme.textTertiary, size: 24),
            ],
          ),
        ),
      ),
    );
  }
}

/// Tile for a token in the "Your Tokens" list.
class _TokenTile extends StatelessWidget {
  final String name;
  final String symbol;
  final String mintAddress;
  final double balance;
  final int decimals;
  final VoidCallback? onMintMore;
  final VoidCallback? onBurn;

  const _TokenTile({
    required this.name,
    required this.symbol,
    required this.mintAddress,
    required this.balance,
    required this.decimals,
    this.onMintMore,
    this.onBurn,
  });

  @override
  Widget build(BuildContext context) {
    final shortMint = mintAddress.length > 12
        ? '${mintAddress.substring(0, 6)}...${mintAddress.substring(mintAddress.length - 4)}'
        : mintAddress;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.glassDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Token icon placeholder
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppTheme.solanaPurple.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Center(
                  child: Text(
                    symbol.isNotEmpty ? symbol[0] : '?',
                    style: const TextStyle(
                      color: AppTheme.solanaPurple,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      symbol,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      shortMint,
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '$balance',
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    '$decimals decimals',
                    style: const TextStyle(
                        color: AppTheme.textTertiary, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _SmallActionButton(
                  icon: Icons.add_circle_outline,
                  label: 'Mint More',
                  color: AppTheme.solanaGreen,
                  onTap: onMintMore,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _SmallActionButton(
                  icon: Icons.local_fire_department_rounded,
                  label: 'Burn',
                  color: AppTheme.error,
                  onTap: onBurn,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SmallActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;

  const _SmallActionButton({
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
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withValues(alpha: 0.25)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 16),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontSize: 12,
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

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyState({required this.icon, required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Icon(icon, color: AppTheme.textTertiary, size: 48),
          const SizedBox(height: 12),
          Text(
            message,
            style: const TextStyle(color: AppTheme.textTertiary, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
