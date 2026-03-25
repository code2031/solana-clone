import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/chain.dart';
import '../providers/multi_chain_provider.dart';
import '../theme/app_theme.dart';

/// A dropdown chain picker widget used in send/receive screens.
///
/// Shows all enabled chains with their icons and symbols.
/// The selected chain is highlighted with its accent color.
class ChainSelector extends StatelessWidget {
  final ChainType selectedChain;
  final ValueChanged<ChainType> onChainSelected;
  final bool showDisabled;

  const ChainSelector({
    super.key,
    required this.selectedChain,
    required this.onChainSelected,
    this.showDisabled = false,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<MultiChainProvider>(
      builder: (context, provider, _) {
        final chains = showDisabled
            ? provider.allChains
            : provider.enabledChains;
        final selectedChainData = provider.getChain(selectedChain);
        final selectedColor =
            Color(int.parse(selectedChainData.color, radix: 16));

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: AppTheme.darkCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selectedColor.withValues(alpha: 0.2),
            ),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<ChainType>(
              value: selectedChain,
              isExpanded: true,
              dropdownColor: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(12),
              icon: Icon(
                Icons.keyboard_arrow_down_rounded,
                color: selectedColor,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              items: chains.map((chain) {
                final chainColor =
                    Color(int.parse(chain.color, radix: 16));

                return DropdownMenuItem<ChainType>(
                  value: chain.type,
                  child: Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: chainColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: Center(
                          child: Text(
                            chain.iconEmoji,
                            style: const TextStyle(fontSize: 16),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              chain.name,
                              style: const TextStyle(
                                color: AppTheme.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              chain.symbol,
                              style: const TextStyle(
                                color: AppTheme.textTertiary,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Balance indicator
                      Text(
                        chain.balance.toStringAsFixed(4),
                        style: TextStyle(
                          color: chainColor.withValues(alpha: 0.7),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
              onChanged: (type) {
                if (type != null) onChainSelected(type);
              },
            ),
          ),
        );
      },
    );
  }
}

/// A horizontal chain tab selector, used as an alternative to the dropdown.
class ChainTabSelector extends StatelessWidget {
  final ChainType selectedChain;
  final ValueChanged<ChainType> onChainSelected;

  const ChainTabSelector({
    super.key,
    required this.selectedChain,
    required this.onChainSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<MultiChainProvider>(
      builder: (context, provider, _) {
        final chains = provider.enabledChains;

        return SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: chains.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final chain = chains[index];
              final isSelected = chain.type == selectedChain;
              final chainColor =
                  Color(int.parse(chain.color, radix: 16));

              return Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => onChainSelected(chain.type),
                  borderRadius: BorderRadius.circular(10),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? chainColor.withValues(alpha: 0.15)
                          : AppTheme.darkCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? chainColor.withValues(alpha: 0.4)
                            : AppTheme.darkCardLight,
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(chain.iconEmoji,
                            style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: 6),
                        Text(
                          chain.symbol,
                          style: TextStyle(
                            color: isSelected
                                ? chainColor
                                : AppTheme.textSecondary,
                            fontSize: 13,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.normal,
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
      },
    );
  }
}
