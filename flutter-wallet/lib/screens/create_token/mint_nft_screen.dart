import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/wallet_provider.dart';
import '../../services/rpc_service.dart';
import '../../services/wallet_service.dart';
import '../../services/token_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/gradient_button.dart';

class MintNftScreen extends StatefulWidget {
  const MintNftScreen({super.key});

  @override
  State<MintNftScreen> createState() => _MintNftScreenState();
}

class _MintNftScreenState extends State<MintNftScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _symbolController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _imageUrlController = TextEditingController();

  /// Dynamic list of NFT attributes (trait_type -> value pairs).
  final List<_AttributeEntry> _attributes = [];

  bool _isMinting = false;
  String _progressStep = '';
  MintNftResult? _result;
  String? _errorMessage;

  late AnimationController _successAnimController;
  late Animation<double> _successFadeAnim;

  @override
  void initState() {
    super.initState();
    _successAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _successFadeAnim = CurvedAnimation(
      parent: _successAnimController,
      curve: Curves.easeOut,
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _symbolController.dispose();
    _descriptionController.dispose();
    _imageUrlController.dispose();
    for (final attr in _attributes) {
      attr.keyController.dispose();
      attr.valueController.dispose();
    }
    _successAnimController.dispose();
    super.dispose();
  }

  /// Build the metadata JSON URI from form inputs.
  /// In a real app this would be uploaded to Arweave / IPFS.
  /// Here we encode it as a data URI so the metadata is self-contained.
  String _buildMetadataUri() {
    final attributes = _attributes
        .where((a) =>
            a.keyController.text.trim().isNotEmpty &&
            a.valueController.text.trim().isNotEmpty)
        .map((a) => {
              'trait_type': a.keyController.text.trim(),
              'value': a.valueController.text.trim(),
            })
        .toList();

    final metadata = {
      'name': _nameController.text.trim(),
      'symbol': _symbolController.text.trim().toUpperCase(),
      'description': _descriptionController.text.trim(),
      'image': _imageUrlController.text.trim(),
      'attributes': attributes,
    };

    // Encode as a data URI.
    final jsonStr = jsonEncode(metadata);
    final encoded = base64Encode(utf8.encode(jsonStr));
    return 'data:application/json;base64,$encoded';
  }

  Future<void> _mintNft() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isMinting = true;
      _progressStep = '';
      _result = null;
      _errorMessage = null;
    });

    try {
      final walletProvider = context.read<WalletProvider>();

      final tokenService = TokenService(
        rpcService: Provider.of<RpcService>(context, listen: false),
        walletService: Provider.of<WalletService>(context, listen: false),
      );

      final metadataUri = _buildMetadataUri();

      final result = await tokenService.createNFT(
        name: _nameController.text.trim(),
        symbol: _symbolController.text.trim().toUpperCase(),
        uri: metadataUri,
        onProgress: (step) {
          if (mounted) {
            setState(() => _progressStep = step);
          }
        },
      );

      if (mounted) {
        setState(() {
          _result = result;
          _isMinting = false;
        });
        _successAnimController.forward();
        walletProvider.refreshAll();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isMinting = false;
          _errorMessage = _formatError(e.toString());
        });
      }
    }
  }

  String _formatError(String error) {
    if (error.contains('insufficient')) {
      return 'Insufficient SOL balance. Request an airdrop first.';
    }
    if (error.contains('Connection failed')) {
      return 'Could not connect to the network. Check your RPC settings.';
    }
    if (error.contains('No wallet loaded')) {
      return 'No wallet loaded. Please create or import a wallet first.';
    }
    return error
        .replaceFirst('TokenServiceException: ', '')
        .replaceFirst('RpcException: ', '')
        .replaceFirst('Exception: ', '');
  }

  void _addAttribute() {
    setState(() {
      _attributes.add(_AttributeEntry(
        keyController: TextEditingController(),
        valueController: TextEditingController(),
      ));
    });
  }

  void _removeAttribute(int index) {
    setState(() {
      _attributes[index].keyController.dispose();
      _attributes[index].valueController.dispose();
      _attributes.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        title: const Text('Mint NFT'),
        backgroundColor: AppTheme.darkBg,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: _result != null ? _buildSuccessView() : _buildForm(),
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Center(
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  colors: [Color(0xFFFF6B6B), Color(0xFFFFD93D)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFF6B6B).withValues(alpha: 0.3),
                    blurRadius: 24,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(Icons.diamond_rounded, color: Colors.white, size: 40),
            ),
          ),
          const SizedBox(height: 24),
          const Center(
            child: Text(
              'Mint a New NFT',
              style: TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Center(
            child: Text(
              'Create a unique non-fungible token on SolClone',
              style: TextStyle(color: AppTheme.textTertiary, fontSize: 14),
            ),
          ),
          const SizedBox(height: 32),

          // NFT Name
          _buildLabel('NFT Name'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _nameController,
            style: const TextStyle(color: AppTheme.textPrimary),
            decoration: const InputDecoration(
              hintText: 'e.g. SolClone Punk #001',
              prefixIcon: Icon(Icons.badge_outlined, color: AppTheme.textTertiary),
            ),
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'NFT name is required' : null,
          ),
          const SizedBox(height: 20),

          // Symbol
          _buildLabel('Symbol'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _symbolController,
            style: const TextStyle(color: AppTheme.textPrimary),
            textCapitalization: TextCapitalization.characters,
            inputFormatters: [
              LengthLimitingTextInputFormatter(10),
              FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9]')),
            ],
            decoration: const InputDecoration(
              hintText: 'e.g. SCPUNK',
              prefixIcon: Icon(Icons.short_text_rounded, color: AppTheme.textTertiary),
            ),
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Symbol is required' : null,
          ),
          const SizedBox(height: 20),

          // Description
          _buildLabel('Description'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _descriptionController,
            style: const TextStyle(color: AppTheme.textPrimary),
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Describe your NFT...',
              prefixIcon: Padding(
                padding: EdgeInsets.only(bottom: 48),
                child: Icon(Icons.description_outlined, color: AppTheme.textTertiary),
              ),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 20),

          // Image URL
          _buildLabel('Image URL'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _imageUrlController,
            style: const TextStyle(color: AppTheme.textPrimary),
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              hintText: 'https://example.com/image.png',
              prefixIcon: Icon(Icons.image_outlined, color: AppTheme.textTertiary),
            ),
            validator: (v) {
              if (v != null && v.trim().isNotEmpty) {
                final uri = Uri.tryParse(v.trim());
                if (uri == null || (!uri.hasScheme)) {
                  return 'Enter a valid URL';
                }
              }
              return null;
            },
          ),
          // Image preview
          if (_imageUrlController.text.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                _imageUrlController.text.trim(),
                height: 160,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  height: 80,
                  decoration: BoxDecoration(
                    color: AppTheme.darkCard,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Text(
                      'Image preview unavailable',
                      style: TextStyle(color: AppTheme.textTertiary, fontSize: 12),
                    ),
                  ),
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),

          // Attributes section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildLabel('Attributes'),
              TextButton.icon(
                onPressed: _isMinting ? null : _addAttribute,
                icon: const Icon(Icons.add_circle_outline,
                    size: 18, color: AppTheme.solanaPurple),
                label: const Text(
                  'Add',
                  style: TextStyle(color: AppTheme.solanaPurple, fontSize: 13),
                ),
              ),
            ],
          ),
          if (_attributes.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.darkCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.darkCardLight),
              ),
              child: const Text(
                'No attributes yet. Tap "Add" to create trait_type / value pairs.',
                style: TextStyle(color: AppTheme.textTertiary, fontSize: 13),
                textAlign: TextAlign.center,
              ),
            )
          else
            ...List.generate(_attributes.length, (i) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _attributes[i].keyController,
                        style: const TextStyle(
                            color: AppTheme.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Trait',
                          hintStyle: const TextStyle(fontSize: 13),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextFormField(
                        controller: _attributes[i].valueController,
                        style: const TextStyle(
                            color: AppTheme.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Value',
                          hintStyle: const TextStyle(fontSize: 13),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 10),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      onPressed: () => _removeAttribute(i),
                      icon: const Icon(Icons.remove_circle_outline,
                          color: AppTheme.error, size: 20),
                      constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                      padding: EdgeInsets.zero,
                    ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 28),

          // Error
          if (_errorMessage != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.error.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.error.withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.error, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: AppTheme.error, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Progress
          if (_isMinting) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.solanaPurple.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: AppTheme.solanaPurple.withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor:
                          AlwaysStoppedAnimation<Color>(AppTheme.solanaPurple),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      _progressStep,
                      style: const TextStyle(
                          color: AppTheme.textSecondary, fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          // Mint button
          GradientButton(
            text: 'Mint NFT',
            icon: Icons.diamond_rounded,
            isLoading: _isMinting,
            onPressed: _isMinting ? null : _mintNft,
            gradient: const LinearGradient(
              colors: [Color(0xFFFF6B6B), Color(0xFFFFD93D)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Success View
  // ---------------------------------------------------------------------------

  Widget _buildSuccessView() {
    return FadeTransition(
      opacity: _successFadeAnim,
      child: Column(
        children: [
          const SizedBox(height: 20),
          // Success badge
          Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppTheme.success.withValues(alpha: 0.12),
            ),
            child: const Icon(
              Icons.diamond_rounded,
              color: AppTheme.success,
              size: 48,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'NFT Minted!',
            style: TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _nameController.text.trim(),
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 16),
          ),
          const SizedBox(height: 24),

          // Image preview (if available)
          if (_imageUrlController.text.trim().isNotEmpty) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.network(
                _imageUrlController.text.trim(),
                height: 200,
                width: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
            const SizedBox(height: 24),
          ],

          // Details card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: AppTheme.glassDecoration(),
            child: Column(
              children: [
                _detailRow('Mint Address', _result!.mintAddress, copyable: true),
                const Divider(color: AppTheme.darkCardLight, height: 24),
                _detailRow('Token Account', _result!.tokenAccountAddress,
                    copyable: true),
                const Divider(color: AppTheme.darkCardLight, height: 24),
                _detailRow('Decimals', '0 (NFT)'),
                const Divider(color: AppTheme.darkCardLight, height: 24),
                _detailRow('Supply', '1 (Non-fungible)'),
                const Divider(color: AppTheme.darkCardLight, height: 24),
                _detailRow('Mint Authority', 'Disabled'),
                const Divider(color: AppTheme.darkCardLight, height: 24),
                _detailRow('Signature', _result!.signature, copyable: true),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: const Text('Back'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.textPrimary,
                    side: const BorderSide(color: AppTheme.darkCardLight),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GradientButton(
                  text: 'Mint Another',
                  icon: Icons.add,
                  onPressed: () {
                    setState(() {
                      _result = null;
                      _nameController.clear();
                      _symbolController.clear();
                      _descriptionController.clear();
                      _imageUrlController.clear();
                      for (final attr in _attributes) {
                        attr.keyController.dispose();
                        attr.valueController.dispose();
                      }
                      _attributes.clear();
                      _errorMessage = null;
                    });
                    _successAnimController.reset();
                  },
                  height: 48,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFF6B6B), Color(0xFFFFD93D)],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Shared widgets
  // ---------------------------------------------------------------------------

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: AppTheme.textSecondary,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _detailRow(String label, String value, {bool copyable = false}) {
    final displayValue = value.length > 20
        ? '${value.substring(0, 8)}...${value.substring(value.length - 8)}'
        : value;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textTertiary, fontSize: 13),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              displayValue,
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 13,
                fontFamily: 'monospace',
              ),
            ),
            if (copyable) ...[
              const SizedBox(width: 6),
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: value));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('$label copied'),
                      backgroundColor: AppTheme.darkCard,
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 1),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  );
                },
                child: const Icon(Icons.copy_rounded,
                    color: AppTheme.solanaPurple, size: 16),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

/// Helper class for dynamic attribute entries.
class _AttributeEntry {
  final TextEditingController keyController;
  final TextEditingController valueController;

  _AttributeEntry({
    required this.keyController,
    required this.valueController,
  });
}
