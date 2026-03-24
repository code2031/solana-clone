import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/formatters.dart';
import '../../widgets/gradient_button.dart';

class StakingScreen extends StatefulWidget {
  const StakingScreen({super.key});

  @override
  State<StakingScreen> createState() => _StakingScreenState();
}

class _StakingScreenState extends State<StakingScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _stakeAmountController = TextEditingController();
  final _unstakeAmountController = TextEditingController();
  String? _selectedValidator;
  bool _isStaking = false;
  String? _error;

  // Mock validators
  final List<Map<String, dynamic>> _validators = [
    {
      'name': 'SolClone Validator #1',
      'address': 'Val1...abc123',
      'apy': 6.8,
      'commission': 5,
      'totalStake': 1250000.0,
    },
    {
      'name': 'Phantom Validator',
      'address': 'Val2...def456',
      'apy': 6.5,
      'commission': 7,
      'totalStake': 3400000.0,
    },
    {
      'name': 'Marinade Validator',
      'address': 'Val3...ghi789',
      'apy': 7.1,
      'commission': 3,
      'totalStake': 890000.0,
    },
    {
      'name': 'Jito Validator',
      'address': 'Val4...jkl012',
      'apy': 6.9,
      'commission': 4,
      'totalStake': 2100000.0,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _stakeAmountController.dispose();
    _unstakeAmountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Staking'),
        backgroundColor: AppTheme.darkBg,
      ),
      body: Column(
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
                Tab(text: 'Stake'),
                Tab(text: 'Unstake'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildStakeTab(),
                _buildUnstakeTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStakeTab() {
    return Consumer<WalletProvider>(
      builder: (context, walletProvider, _) {
        return ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Current balance info
            Container(
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.glassDecoration(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available to Stake',
                        style: TextStyle(
                          color: AppTheme.textTertiary,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                  Text(
                    '${Formatters.formatSol(walletProvider.wallet?.balanceSol ?? 0)} SOL',
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Amount input
            const Text(
              'Stake Amount',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _stakeAmountController,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
              decoration: const InputDecoration(
                hintText: '0.00',
                suffixText: 'SOL',
                suffixStyle: TextStyle(
                  color: AppTheme.textTertiary,
                  fontSize: 14,
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Validator selector
            const Text(
              'Select Validator',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 12),

            ..._validators.map((validator) {
              final isSelected = _selectedValidator == validator['address'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => setState(
                        () => _selectedValidator = validator['address']),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppTheme.solanaPurple.withValues(alpha: 0.1)
                            : AppTheme.darkCard.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected
                              ? AppTheme.solanaPurple.withValues(alpha: 0.5)
                              : Colors.white.withValues(alpha: 0.04),
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppTheme.darkCardLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.verified_rounded,
                              color: AppTheme.solanaPurple,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  validator['name'],
                                  style: const TextStyle(
                                    color: AppTheme.textPrimary,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                Text(
                                  '${validator['commission']}% commission',
                                  style: const TextStyle(
                                    color: AppTheme.textTertiary,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${validator['apy']}% APY',
                                style: const TextStyle(
                                  color: AppTheme.success,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              Text(
                                '${Formatters.compactNumber(validator['totalStake'])} SOL',
                                style: const TextStyle(
                                  color: AppTheme.textTertiary,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }),

            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!,
                  style:
                      const TextStyle(color: AppTheme.error, fontSize: 13)),
            ],

            const SizedBox(height: 20),
            GradientButton(
              text: 'Stake SOL',
              isLoading: _isStaking,
              onPressed: _selectedValidator != null &&
                      _stakeAmountController.text.isNotEmpty
                  ? () => _performStake(walletProvider)
                  : null,
            ),
          ],
        );
      },
    );
  }

  Widget _buildUnstakeTab() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 40),
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(
              Icons.lock_open_rounded,
              color: AppTheme.textTertiary,
              size: 36,
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'No Active Stakes',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Stake SOL to start earning rewards.\nYour active stakes will appear here.',
            style: TextStyle(
              color: AppTheme.textTertiary,
              fontSize: 14,
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Future<void> _performStake(WalletProvider walletProvider) async {
    final amount = double.tryParse(_stakeAmountController.text.trim());
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Please enter a valid amount');
      return;
    }
    if (amount > (walletProvider.wallet?.balanceSol ?? 0)) {
      setState(() => _error = 'Insufficient balance');
      return;
    }

    setState(() {
      _isStaking = true;
      _error = null;
    });

    // Simulate staking (real implementation would create a stake account)
    await Future.delayed(const Duration(seconds: 2));

    setState(() => _isStaking = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Staked ${Formatters.formatSol(amount)} SOL (mock -- requires stake program integration)'),
          backgroundColor: AppTheme.darkCard,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }
}
