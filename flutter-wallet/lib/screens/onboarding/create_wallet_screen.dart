import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/gradient_button.dart';
import '../home/home_screen.dart';

class CreateWalletScreen extends StatefulWidget {
  const CreateWalletScreen({super.key});

  @override
  State<CreateWalletScreen> createState() => _CreateWalletScreenState();
}

class _CreateWalletScreenState extends State<CreateWalletScreen> {
  String? _mnemonic;
  List<String> _words = [];
  bool _isLoading = false;
  bool _backed = false;
  int _step = 0; // 0 = generating, 1 = show words, 2 = confirm backup

  @override
  void initState() {
    super.initState();
    _generateWallet();
  }

  Future<void> _generateWallet() async {
    setState(() => _isLoading = true);
    try {
      final walletProvider = context.read<WalletProvider>();
      final mnemonic = await walletProvider.createWallet();
      setState(() {
        _mnemonic = mnemonic;
        _words = mnemonic.split(' ');
        _step = 1;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error creating wallet: $e')),
        );
      }
    }
  }

  void _copyMnemonic() {
    if (_mnemonic == null) return;
    Clipboard.setData(ClipboardData(text: _mnemonic!));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Recovery phrase copied to clipboard'),
        backgroundColor: AppTheme.darkCard,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  void _proceedToHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomeScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Create Wallet'),
        backgroundColor: AppTheme.darkBg,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppTheme.solanaPurple),
                    SizedBox(height: 16),
                    Text(
                      'Generating wallet...',
                      style: TextStyle(color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              )
            : _step == 1
                ? _buildShowWords()
                : _buildConfirmBackup(),
      ),
    );
  }

  Widget _buildShowWords() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Your Recovery Phrase',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Write down these 12 words in order. This is the ONLY way to recover your wallet.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          // Warning
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.error.withValues(alpha: 0.3),
              ),
            ),
            child: const Row(
              children: [
                Icon(Icons.warning_amber_rounded,
                    color: AppTheme.error, size: 20),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Never share your recovery phrase with anyone!',
                    style: TextStyle(
                      color: AppTheme.error,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Word grid
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.glassDecoration(),
              child: GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 2.5,
                ),
                itemCount: _words.length,
                itemBuilder: (context, index) {
                  return Container(
                    decoration: BoxDecoration(
                      color: AppTheme.darkCardLight.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.06),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        '${index + 1}. ${_words[index]}',
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Copy button
          Center(
            child: TextButton.icon(
              onPressed: _copyMnemonic,
              icon: const Icon(Icons.copy_rounded, size: 18),
              label: const Text('Copy to clipboard'),
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.solanaPurple,
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Continue button
          GradientButton(
            text: 'I\'ve Saved My Phrase',
            onPressed: () => setState(() => _step = 2),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmBackup() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Confirm Backup',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Please confirm that you have saved your recovery phrase securely.',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 32),

          // Confirmation card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: AppTheme.glassDecoration(),
            child: Column(
              children: [
                const Icon(
                  Icons.shield_rounded,
                  color: AppTheme.solanaPurple,
                  size: 48,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Keep your recovery phrase safe',
                  style: TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'If you lose your recovery phrase, you will lose access to your wallet forever.',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 14,
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                // Checkbox
                InkWell(
                  onTap: () => setState(() => _backed = !_backed),
                  borderRadius: BorderRadius.circular(8),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: _backed
                                ? AppTheme.solanaPurple
                                : AppTheme.textTertiary,
                            width: 2,
                          ),
                          color: _backed
                              ? AppTheme.solanaPurple
                              : Colors.transparent,
                        ),
                        child: _backed
                            ? const Icon(Icons.check_rounded,
                                color: Colors.white, size: 16)
                            : null,
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'I have saved my recovery phrase in a secure location.',
                          style: TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Spacer(),

          // Back and Continue buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _step = 1),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(
                      color: AppTheme.solanaPurple.withValues(alpha: 0.4),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('View Again'),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: GradientButton(
                  text: 'Continue',
                  onPressed: _backed ? _proceedToHome : null,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
