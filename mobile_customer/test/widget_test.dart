import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/routes/app_router.dart';
import 'package:mobile_customer/main.dart';

final _mockAppRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SizedBox()),
    ],
  );
});

void main() {
  testWidgets('App renders without errors', (WidgetTester tester) async {
    TestWidgetsFlutterBinding.ensureInitialized();
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          appRouterProvider.overrideWithProvider(_mockAppRouterProvider),
        ],
        child: const SafeComApp(),
      ),
    );

    expect(find.byType(SafeComApp), findsOneWidget);
  });
}
