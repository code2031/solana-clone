import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../providers/network_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/constants.dart';
import '../../widgets/address_display.dart';
import '../onboarding/welcome_screen.dart';
import '../dapp_browser/dapp_browser_screen.dart';

class SettingsTab extends StatelessWidget {
  const SettingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<WalletProvider, NetworkProvider>(
      builder: (context, walletProvider, networkProvider, _) {
        return SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(4, 16, 0, 16),
                child: Text(
                  'Settings',
                  style: TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              // Wallet info
              Container(
                padding: const EdgeInsets.all(16),
                decoration: AppTheme.glassDecoration(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Wallet Address',
                      style: TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (walletProvider.wallet != null)
                      AddressDisplay(
                        address: walletProvider.wallet!.publicKey,
                        prefixLen: 10,
                        suffixLen: 10,
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Network section
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 10),
                child: Text(
                  'NETWORK',
                  style: TextStyle(
                    color: AppTheme.textTertiary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Container(
                decoration: AppTheme.glassDecoration(),
                child: Column(
                  children: [
                    _NetworkOption(
                      name: 'Localnet',
                      subtitle: AppConstants.localRpcUrl,
                      type: NetworkType.localnet,
                      currentNetwork: networkProvider.currentNetwork,
                      onTap: () =>
                          networkProvider.switchNetwork(NetworkType.localnet),
                    ),
                    _divider(),
                    _NetworkOption(
                      name: 'Devnet',
                      subtitle: AppConstants.devnetRpcUrl,
                      type: NetworkType.devnet,
                      currentNetwork: networkProvider.currentNetwork,
                      onTap: () =>
                          networkProvider.switchNetwork(NetworkType.devnet),
                    ),
                    _divider(),
                    _NetworkOption(
                      name: 'Testnet',
                      subtitle: AppConstants.testnetRpcUrl,
                      type: NetworkType.testnet,
                      currentNetwork: networkProvider.currentNetwork,
                      onTap: () =>
                          networkProvider.switchNetwork(NetworkType.testnet),
                    ),
                    _divider(),
                    _NetworkOption(
                      name: 'Mainnet Beta',
                      subtitle: AppConstants.mainnetRpcUrl,
                      type: NetworkType.mainnet,
                      currentNetwork: networkProvider.currentNetwork,
                      onTap: () =>
                          networkProvider.switchNetwork(NetworkType.mainnet),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              // Connection status
              Padding(
                padding: const EdgeInsets.only(left: 4),
                child: Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: networkProvider.isConnected
                            ? AppTheme.success
                            : AppTheme.error,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      networkProvider.isConnected
                          ? 'Connected${networkProvider.clusterVersion != null ? ' (v${networkProvider.clusterVersion})' : ''}'
                          : 'Disconnected',
                      style: TextStyle(
                        color: networkProvider.isConnected
                            ? AppTheme.success
                            : AppTheme.error,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Tools section
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 10),
                child: Text(
                  'TOOLS',
                  style: TextStyle(
                    color: AppTheme.textTertiary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Container(
                decoration: AppTheme.glassDecoration(),
                child: Column(
                  children: [
                    _SettingsTile(
                      icon: Icons.language_rounded,
                      title: 'DApp Browser',
                      subtitle: 'Browse decentralized apps',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const DappBrowserScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // About section
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 10),
                child: Text(
                  'ABOUT',
                  style: TextStyle(
                    color: AppTheme.textTertiary,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Container(
                decoration: AppTheme.glassDecoration(),
                child: Column(
                  children: [
                    _SettingsTile(
                      icon: Icons.info_outline_rounded,
                      title: 'Version',
                      subtitle: AppConstants.appVersion,
                    ),
                    _divider(),
                    _SettingsTile(
                      icon: Icons.code_rounded,
                      title: 'App Name',
                      subtitle: AppConstants.appName,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Danger zone
              const Padding(
                padding: EdgeInsets.only(left: 4, bottom: 10),
                child: Text(
                  'DANGER ZONE',
                  style: TextStyle(
                    color: AppTheme.error,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  color: AppTheme.darkCard.withValues(alpha: 0.7),
                  border: Border.all(
                    color: AppTheme.error.withValues(alpha: 0.2),
                    width: 1,
                  ),
                ),
                child: _SettingsTile(
                  icon: Icons.logout_rounded,
                  title: 'Delete Wallet',
                  subtitle: 'Remove wallet from this device',
                  iconColor: AppTheme.error,
                  titleColor: AppTheme.error,
                  onTap: () => _showDeleteDialog(context, walletProvider),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        );
      },
    );
  }

  Widget _divider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Divider(
        height: 0.5,
        color: Colors.white.withValues(alpha: 0.06),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, WalletProvider walletProvider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Wallet',
          style: TextStyle(color: AppTheme.textPrimary),
        ),
        content: const Text(
          'Are you sure you want to delete this wallet? Make sure you have backed up your recovery phrase. This action cannot be undone.',
          style: TextStyle(color: AppTheme.textSecondary, height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(ctx).pop();
              await walletProvider.deleteWallet();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const WelcomeScreen()),
                  (route) => false,
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppTheme.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _NetworkOption extends StatelessWidget {
  final String name;
  final String subtitle;
  final NetworkType type;
  final NetworkType currentNetwork;
  final VoidCallback? onTap;

  const _NetworkOption({
    required this.name,
    required this.subtitle,
    required this.type,
    required this.currentNetwork,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isSelected = type == currentNetwork;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isSelected
                        ? AppTheme.solanaPurple
                        : AppTheme.textTertiary,
                    width: 2,
                  ),
                  color: isSelected
                      ? AppTheme.solanaPurple
                      : Colors.transparent,
                ),
                child: isSelected
                    ? const Icon(Icons.check_rounded,
                        color: Colors.white, size: 12)
                    : null,
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        color: isSelected
                            ? AppTheme.textPrimary
                            : AppTheme.textSecondary,
                        fontSize: 15,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color? iconColor;
  final Color? titleColor;
  final VoidCallback? onTap;

  const _SettingsTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.iconColor,
    this.titleColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Icon(icon, color: iconColor ?? AppTheme.textSecondary, size: 22),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: titleColor ?? AppTheme.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        color: AppTheme.textTertiary,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppTheme.textTertiary,
                  size: 20,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
