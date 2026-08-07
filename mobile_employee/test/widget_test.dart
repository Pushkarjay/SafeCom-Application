import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import 'package:mobile_employee/routes/app_router.dart';
import 'package:mobile_employee/main.dart';

final _mockGoRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, _) => const SizedBox()),
  ],
);

void main() {
  testWidgets('App renders without errors', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appRouterProvider.overrideWith((ref) => _mockGoRouter),
        ],
        child: const SafeComEmployeeApp(),
      ),
    );

    expect(find.byType(SafeComEmployeeApp), findsOneWidget);
  });
}
