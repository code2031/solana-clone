import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/gradient_button.dart';

class SendScreen extends StatefulWidget {
  const SendScreen({super.key});

  @override
  State<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends State<SendScreen> {
  final _addressController = TextEditingController();
  final _amountController = TextEditingController();
  int _step = 0; // 0 = enter details, 1 = confirm
  bool _isSending = false;
  String? _error;

  @override
  void dispose() {
    _addressController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  bool get _isFormValid {
    final address = _addressController.text.trim();
    final amount = double.tryParse(_amountController.text.trim());
    return address.length >= 32 && amount != null && amount > 0;
  }

  void _proceedToConfirm() {
    if (!_isFormValid) {
      setState(() {
        if (_addressController.text.trim().length < 32) {
          _error = 'Please enter a valid Solana address';
        } else {
          _error = 'Please enter a valid amount';
        }
      });
      return;
    }
    setState(() {
      _error = null;
      _step = 1;
    });
  }

  Future<void> _send() async {
    setState(() {
      _isSending = true;
      _error = null;
    });

    try {
      final walletProvider = context.read<WalletProvider>();
      final amount = double.parse(_amountController.text.trim());
      await walletProvider.sendSol(
        _addressController.text.trim(),
        amount,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Transaction sent successfully!'),
            backgroundColor: AppTheme.success.withValues(alpha: 0.9),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isSending = false;
      });
    }
  }

  void _setMaxAmount() {
    final walletProvider = context.read<WalletProvider>();
    final balance = walletProvider.wallet?.balanceSol ?? 0;
    // Leave a small amount for fees
    final maxAmount = (balance - 0.001).clamp(0.0, balance);
    _amountController.text = maxAmount.toStringAsFixed(9);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: Text(_step == 0 ? 'Send SOL' : 'Confirm'),
        backgroundColor: AppTheme.darkBg,
      ),
      body: SafeArea(
        child: _step == 0 ? _buildForm() : _buildConfirm(),
      ),
    );
  }

  Widget _buildForm() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recipient address
          const Text(
            'Recipient Address',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _addressController,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 14,
              fontFamily: 'monospace',
            ),
            decoration: InputDecoration(
              hintText: 'Enter or paste address',
              suffixIcon: IconButton(
                icon: const Icon(Icons.paste_rounded, size: 20),
                color: AppTheme.textTertiary,
                onPressed: () async {
                  final data = await Clipboard.getData(Clipboard.kTextPlain);
                  if (data?.text != null) {
                    _addressController.text = data!.text!;
                  }
                },
              ),
            ),
          ),
          const SizedBox(height: 24),

          // Amount
          const Text(
            'Amount (SOL)',
            style: TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _amountController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
            decoration: InputDecoration(
              hintText: '0.00',
              suffixIcon: TextButton(
                onPressed: _setMaxAmount,
                child: const Text(
                  'MAX',
                  style: TextStyle(
                    color: AppTheme.solanaPurple,
                    fontWeight: FontWeight.w700,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Consumer<WalletProvider>(
            builder: (context, wp, _) {
              return Text(
                'Available: ${Formatters.formatSol(wp.wallet?.balanceSol ?? 0)} SOL',
                style: const TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 13,
                ),
              );
            },
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded,
                      color: AppTheme.error, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _error!,
                      style: const TextStyle(
                          color: AppTheme.error, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const Spacer(),

          GradientButton(
            text: 'Continue',
            onPressed: _isFormValid ? _proceedToConfirm : null,
          ),
        ],
      ),
    );
  }

  Widget _buildConfirm() {
    final address = _addressController.text.trim();
    final amount = double.tryParse(_amountController.text.trim()) ?? 0;

    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Amount display
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: AppTheme.glassDecoration(),
            child: Column(
              children: [
                const Icon(
                  Icons.arrow_upward_rounded,
                  color: AppTheme.solanaPurple,
                  size: 40,
                ),
                const SizedBox(height: 12),
                Text(
                  '${Formatters.formatSol(amount)} SOL',
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                _ConfirmRow(
                  label: 'To',
                  value: Formatters.truncateAddress(address, prefixLen: 8, suffixLen: 8),
                ),
                _ConfirmRow(
                  label: 'Network Fee',
                  value: '~0.000005 SOL',
                ),
              ],
            ),
          ),

          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                _error!,
                style:
                    const TextStyle(color: AppTheme.error, fontSize: 13),
              ),
            ),
          ],

          const Spacer(),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _step = 0),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    side: BorderSide(
                      color: AppTheme.solanaPurple.withValues(alpha: 0.4),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text('Back'),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: GradientButton(
                  text: 'Send',
                  isLoading: _isSending,
                  onPressed: _isSending ? null : _send,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;

  const _ConfirmRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textTertiary,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
