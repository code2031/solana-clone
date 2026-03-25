import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../widgets/gradient_button.dart';
import 'create_wallet_screen.dart';
import 'import_wallet_screen.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // Logo
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppTheme.primaryGradient,
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.solanaPurple.withValues(alpha: 0.3),
                      blurRadius: 40,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Center(
                  child: Text(
                    'SC',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 42,
                      fontWeight: FontWeight.bold,
                      letterSpacing: -1,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Title
              ShaderMask(
                shaderCallback: (bounds) =>
                    AppTheme.primaryGradient.createShader(bounds),
                child: const Text(
                  'Welcome to Prism',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Your gateway to the Solana blockchain.\nManage tokens, stake SOL, and explore DApps.',
                style: TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 16,
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),

              const Spacer(flex: 3),

              // Create wallet button
              GradientButton(
                text: 'Create New Wallet',
                icon: Icons.add_rounded,
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const CreateWalletScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 14),

              // Import wallet button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const ImportWalletScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.download_rounded, size: 20),
                  label: const Text(
                    'Import Existing Wallet',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.textPrimary,
                    side: BorderSide(
                      color: AppTheme.solanaPurple.withValues(alpha: 0.4),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
