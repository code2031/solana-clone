import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme/app_theme.dart';

class DappBrowserScreen extends StatefulWidget {
  const DappBrowserScreen({super.key});

  @override
  State<DappBrowserScreen> createState() => _DappBrowserScreenState();
}

class _DappBrowserScreenState extends State<DappBrowserScreen> {
  final _urlController = TextEditingController();

  // Popular DApps
  final List<Map<String, dynamic>> _dapps = [
    {
      'name': 'Jupiter',
      'description': 'Best swap aggregator on Solana',
      'url': 'https://jup.ag',
      'icon': Icons.swap_horiz_rounded,
      'color': const Color(0xFF22D1EE),
    },
    {
      'name': 'Raydium',
      'description': 'AMM and liquidity provider',
      'url': 'https://raydium.io',
      'icon': Icons.water_drop_rounded,
      'color': const Color(0xFF5AC4BE),
    },
    {
      'name': 'Marinade Finance',
      'description': 'Liquid staking protocol',
      'url': 'https://marinade.finance',
      'icon': Icons.sailing_rounded,
      'color': const Color(0xFF6CCFB5),
    },
    {
      'name': 'Tensor',
      'description': 'NFT marketplace and analytics',
      'url': 'https://tensor.trade',
      'icon': Icons.grid_view_rounded,
      'color': const Color(0xFFF5A623),
    },
    {
      'name': 'Magic Eden',
      'description': 'Leading NFT marketplace',
      'url': 'https://magiceden.io',
      'icon': Icons.store_rounded,
      'color': const Color(0xFFE42575),
    },
    {
      'name': 'Orca',
      'description': 'DEX with concentrated liquidity',
      'url': 'https://orca.so',
      'icon': Icons.waves_rounded,
      'color': const Color(0xFFFFD15C),
    },
    {
      'name': 'Solscan',
      'description': 'Solana blockchain explorer',
      'url': 'https://solscan.io',
      'icon': Icons.explore_rounded,
      'color': const Color(0xFF9945FF),
    },
    {
      'name': 'Solana FM',
      'description': 'Transaction explorer and indexer',
      'url': 'https://solana.fm',
      'icon': Icons.search_rounded,
      'color': const Color(0xFF14F195),
    },
  ];

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open $url'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  void _openCustomUrl() {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;
    final fullUrl = url.startsWith('http') ? url : 'https://$url';
    _openUrl(fullUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('DApp Browser'),
        backgroundColor: AppTheme.darkBg,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // URL bar
          Container(
            decoration: AppTheme.glassDecoration(),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _urlController,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Enter DApp URL...',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                    ),
                    onSubmitted: (_) => _openCustomUrl(),
                  ),
                ),
                Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: _openCustomUrl,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      child: const Icon(
                        Icons.arrow_forward_rounded,
                        color: AppTheme.solanaPurple,
                        size: 22,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Popular DApps header
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 14),
            child: Text(
              'Popular DApps',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),

          // DApp grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.35,
            ),
            itemCount: _dapps.length,
            itemBuilder: (context, index) {
              final dapp = _dapps[index];
              return _DappCard(
                name: dapp['name'],
                description: dapp['description'],
                icon: dapp['icon'],
                color: dapp['color'],
                onTap: () => _openUrl(dapp['url']),
              );
            },
          ),

          const SizedBox(height: 20),
          const Center(
            child: Text(
              'DApps open in your default browser.\nFull in-app WebView coming soon.',
              style: TextStyle(
                color: AppTheme.textTertiary,
                fontSize: 12,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class _DappCard extends StatelessWidget {
  final String name;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _DappCard({
    required this.name,
    required this.description,
    required this.icon,
    required this.color,
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
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.darkCard.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: color.withValues(alpha: 0.15),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              Text(
                name,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                description,
                style: const TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 11,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
