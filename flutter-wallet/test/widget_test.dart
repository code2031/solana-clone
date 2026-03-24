import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_wallet/main.dart';
import 'package:flutter_wallet/services/rpc_service.dart';
import 'package:flutter_wallet/services/wallet_service.dart';
import 'package:flutter_wallet/services/price_service.dart';

void main() {
  testWidgets('App starts and shows splash screen', (WidgetTester tester) async {
    final rpcService = RpcService();
    final walletService = WalletService();
    final priceService = PriceService();

    await tester.pumpWidget(SolCloneWallet(
      rpcService: rpcService,
      walletService: walletService,
      priceService: priceService,
    ));

    // Verify the splash screen shows the app name
    expect(find.text('SolClone'), findsOneWidget);
    expect(find.text('Wallet'), findsOneWidget);
  });
}
