import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/chain.dart';
import '../../providers/multi_chain_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/chain_selector.dart';

/// Multi-chain send screen that allows sending tokens on any enabled chain.
///
/// Features chain selection, token selection (native + chain tokens),
/// address validation per chain, amount input with MAX, and fee estimation.
class MultiChainSendScreen extends StatefulWidget {
  final ChainType? initialChain;

  const MultiChainSendScreen({super.key, this.initialChain});

  @override
  State<MultiChainSendScreen> createState() => _MultiChainSendScreenState();
}

class _MultiChainSendScreenState extends State<MultiChainSendScreen> {
  late ChainType _selectedChain;
  String? _selectedToken; // null = native token
  final _addressController = TextEditingController();
  final _amountController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isSending = false;
  double _estimatedFee = 0;
  String? _error;

  @override
  void initState() {
    super.initState();
    _selectedChain = widget.initialChain ?? ChainType.solclone;
    _updateFeeEstimate();
  }

  @override
  void dispose() {
    _addressController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _updateFeeEstimate() async {
    final provider = context.read<MultiChainProvider>();
    try {
      final fee = await provider.estimateFee(_selectedChain);
      if (mounted) {
        setState(() => _estimatedFee = fee);
      }
    } catch (_) {}
  }

  void _onChainChanged(ChainType type) {
    setState(() {
      _selectedChain = type;
      _selectedToken = null;
      _error = null;
    });
    _updateFeeEstimate();
  }

  double get _maxAmount {
    final provider = context.read<MultiChainProvider>();
    final chain = provider.getChain(_selectedChain);

    if (_selectedToken != null) {
      final token = chain.tokens.firstWhere(
        (t) => t.symbol == _selectedToken,
        orElse: () => const ChainToken(
          name: '',
          symbol: '',
          contractAddress: '',
        ),
      );
      return token.balance;
    }

    return (chain.balance - _estimatedFee).clamp(0, double.infinity);
  }

  Future<void> _send() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<MultiChainProvider>();
    final service = provider.getService(_selectedChain);
    final chain = provider.getChain(_selectedChain);

    setState(() {
      _isSending = true;
      _error = null;
    });

    try {
      final amount = double.parse(_amountController.text);
      final to = _addressController.text.trim();

      // Show confirmation dialog
      final confirmed = await _showConfirmation(
        chain: chain,
        to: to,
        amount: amount,
        fee: _estimatedFee,
        tokenSymbol: _selectedToken ?? chain.symbol,
      );

      if (confirmed == true) {
        final txHash = await service.sendTransaction(to, amount);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Transaction sent: ${txHash.substring(0, 16)}...'),
              backgroundColor: AppTheme.success.withValues(alpha: 0.9),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
          Navigator.of(context).pop();
        }
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  Future<bool?> _showConfirmation({
    required Chain chain,
    required String to,
    required double amount,
    required double fee,
    required String tokenSymbol,
  }) {
    final chainColor = Color(int.parse(chain.color, radix: 16));

    return showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppTheme.darkSurface,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: chainColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(chain.iconEmoji, style: const TextStyle(fontSize: 16)),
                ),
              ),
              const SizedBox(width: 10),
              const Text(
                'Confirm Send',
                style: TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ConfirmRow(label: 'Network', value: chain.name),
              _ConfirmRow(label: 'To', value: Formatters.truncateAddress(to, prefixLen: 8, suffixLen: 6)),
              _ConfirmRow(label: 'Amount', value: '$amount $tokenSymbol'),
              _ConfirmRow(label: 'Fee', value: '~${fee.toStringAsFixed(6)} ${chain.symbol}'),
              const Divider(color: AppTheme.darkCardLight),
              _ConfirmRow(
                label: 'Total',
                value: '${(amount + (_selectedToken == null ? fee : 0)).toStringAsFixed(6)} $tokenSymbol',
                isBold: true,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: chainColor,
              ),
              child: const Text('Send'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Send'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Consumer<MultiChainProvider>(
        builder: (context, provider, _) {
          final chain = provider.getChain(_selectedChain);
          final chainColor = Color(int.parse(chain.color, radix: 16));

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Chain selector
                    const Text(
                      'Network',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ChainSelector(
                      selectedChain: _selectedChain,
                      onChainSelected: _onChainChanged,
                    ),
                    const SizedBox(height: 20),

                    // Token selector (native + chain tokens)
                    if (chain.tokens.isNotEmpty) ...[
                      const Text(
                        'Token',
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _TokenSelector(
                        chain: chain,
                        selectedToken: _selectedToken,
                        onChanged: (token) {
                          setState(() => _selectedToken = token);
                        },
                      ),
                      const SizedBox(height: 20),
                    ],

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
                    TextFormField(
                      controller: _addressController,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontFamily: 'monospace',
                        fontSize: 14,
                      ),
                      decoration: InputDecoration(
                        hintText: _getAddressHint(_selectedChain),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.paste_rounded,
                              color: AppTheme.textTertiary, size: 20),
                          onPressed: () async {
                            final data = await Clipboard.getData('text/plain');
                            if (data?.text != null) {
                              _addressController.text = data!.text!;
                            }
                          },
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Please enter an address';
                        }
                        if (!provider.validateAddress(
                            _selectedChain, value.trim())) {
                          return 'Invalid ${chain.name} address';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 20),

                    // Amount input
                    const Text(
                      'Amount',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _amountController,
                      keyboardType:
                          const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                      ),
                      decoration: InputDecoration(
                        hintText: '0.00',
                        suffixIcon: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _selectedToken ?? chain.symbol,
                              style: TextStyle(
                                color: chainColor,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(width: 8),
                            InkWell(
                              onTap: () {
                                _amountController.text =
                                    _maxAmount.toStringAsFixed(6);
                              },
                              borderRadius: BorderRadius.circular(6),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: chainColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'MAX',
                                  style: TextStyle(
                                    color: chainColor,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                          ],
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Please enter an amount';
                        }
                        final amount = double.tryParse(value);
                        if (amount == null || amount <= 0) {
                          return 'Please enter a valid amount';
                        }
                        if (amount > _maxAmount) {
                          return 'Insufficient balance';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 8),
                    // Available balance
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Available: ${_maxAmount.toStringAsFixed(6)} ${_selectedToken ?? chain.symbol}',
                          style: const TextStyle(
                            color: AppTheme.textTertiary,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          'Fee: ~${_estimatedFee.toStringAsFixed(6)} ${chain.symbol}',
                          style: const TextStyle(
                            color: AppTheme.textTertiary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),

                    // Error message
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.error.withValues(alpha: 0.3),
                          ),
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
                                  color: AppTheme.error,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),

                    // Send button
                    SizedBox(
                      width: double.infinity,
                      height: 54,
                      child: ElevatedButton(
                        onPressed: _isSending ? null : _send,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: chainColor,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        child: _isSending
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white),
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(chain.iconEmoji),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Send on ${chain.name}',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _getAddressHint(ChainType type) {
    switch (type) {
      case ChainType.bitcoin:
        return 'bc1q... or 1... or 3...';
      case ChainType.ethereum:
      case ChainType.polygon:
      case ChainType.bnb:
        return '0x...';
      case ChainType.solana:
      case ChainType.solclone:
        return 'Base58 address...';
    }
  }
}

class _TokenSelector extends StatelessWidget {
  final Chain chain;
  final String? selectedToken;
  final ValueChanged<String?> onChanged;

  const _TokenSelector({
    required this.chain,
    required this.selectedToken,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final chainColor = Color(int.parse(chain.color, radix: 16));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkCardLight),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String?>(
          value: selectedToken,
          isExpanded: true,
          dropdownColor: AppTheme.darkCard,
          icon: Icon(Icons.keyboard_arrow_down_rounded,
              color: chainColor),
          items: [
            // Native token
            DropdownMenuItem<String?>(
              value: null,
              child: Row(
                children: [
                  Text(chain.iconEmoji, style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 8),
                  Text(
                    '${chain.symbol} (Native)',
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 14,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    chain.balance.toStringAsFixed(4),
                    style: const TextStyle(
                      color: AppTheme.textTertiary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            // Chain tokens
            ...chain.tokens.map((token) => DropdownMenuItem<String?>(
                  value: token.symbol,
                  child: Row(
                    children: [
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(
                          color: chainColor.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Center(
                          child: Text(
                            token.symbol.substring(0, 1),
                            style: TextStyle(
                              color: chainColor,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        token.symbol,
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 14,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        token.balance.toStringAsFixed(4),
                        style: const TextStyle(
                          color: AppTheme.textTertiary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                )),
          ],
          onChanged: onChanged,
        ),
      ),
    );
  }
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _ConfirmRow({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: AppTheme.textTertiary,
              fontSize: 13,
              fontWeight: isBold ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 13,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
              ),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}
