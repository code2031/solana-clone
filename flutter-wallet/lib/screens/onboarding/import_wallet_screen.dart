import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/gradient_button.dart';
import '../home/home_screen.dart';

class ImportWalletScreen extends StatefulWidget {
  const ImportWalletScreen({super.key});

  @override
  State<ImportWalletScreen> createState() => _ImportWalletScreenState();
}

class _ImportWalletScreenState extends State<ImportWalletScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _mnemonicController = TextEditingController();
  final _privateKeyController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _mnemonicController.dispose();
    _privateKeyController.dispose();
    super.dispose();
  }

  Future<void> _importFromMnemonic() async {
    final mnemonic = _mnemonicController.text.trim();
    if (mnemonic.isEmpty) {
      setState(() => _error = 'Please enter a recovery phrase');
      return;
    }

    final words = mnemonic.split(RegExp(r'\s+'));
    if (words.length != 12 && words.length != 24) {
      setState(() => _error = 'Recovery phrase must be 12 or 24 words');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final walletProvider = context.read<WalletProvider>();
      await walletProvider.importFromMnemonic(mnemonic);

      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _importFromPrivateKey() async {
    final privateKey = _privateKeyController.text.trim();
    if (privateKey.isEmpty) {
      setState(() => _error = 'Please enter a private key');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final walletProvider = context.read<WalletProvider>();
      await walletProvider.importFromPrivateKey(privateKey);

      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const HomeScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Import Wallet'),
        backgroundColor: AppTheme.darkBg,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Tab bar
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(12),
              ),
              child: TabBar(
                controller: _tabController,
                onTap: (_) => setState(() => _error = null),
                indicator: BoxDecoration(
                  color: AppTheme.solanaPurple,
                  borderRadius: BorderRadius.circular(10),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: Colors.white,
                unselectedLabelColor: AppTheme.textTertiary,
                labelStyle: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                tabs: const [
                  Tab(text: 'Recovery Phrase'),
                  Tab(text: 'Private Key'),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Tab content
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildMnemonicTab(),
                  _buildPrivateKeyTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMnemonicTab() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Enter Recovery Phrase',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Enter your 12 or 24-word recovery phrase, separated by spaces.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: TextField(
              controller: _mnemonicController,
              maxLines: 6,
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 16,
                height: 1.6,
              ),
              decoration: InputDecoration(
                hintText: 'word1 word2 word3 ...',
                hintStyle: const TextStyle(color: AppTheme.textTertiary),
                filled: true,
                fillColor: AppTheme.darkCard,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: AppTheme.solanaPurple),
                ),
              ),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(color: AppTheme.error, fontSize: 13),
            ),
          ],
          const SizedBox(height: 16),
          GradientButton(
            text: 'Import Wallet',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _importFromMnemonic,
          ),
        ],
      ),
    );
  }

  Widget _buildPrivateKeyTab() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Enter Private Key',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Enter your base58-encoded private key.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _privateKeyController,
            maxLines: 3,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 14,
              fontFamily: 'monospace',
            ),
            decoration: InputDecoration(
              hintText: 'Base58 private key...',
              hintStyle: const TextStyle(color: AppTheme.textTertiary),
              filled: true,
              fillColor: AppTheme.darkCard,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(
                  color: Colors.white.withValues(alpha: 0.06),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: AppTheme.solanaPurple),
              ),
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            Text(
              _error!,
              style: const TextStyle(color: AppTheme.error, fontSize: 13),
            ),
          ],
          const Spacer(),
          GradientButton(
            text: 'Import Wallet',
            isLoading: _isLoading,
            onPressed: _isLoading ? null : _importFromPrivateKey,
          ),
        ],
      ),
    );
  }
}
