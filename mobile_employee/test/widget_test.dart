import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_employee/main.dart';

void main() {
  testWidgets('App renders without errors', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: SafeComEmployeeApp()));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(find.byType(SafeComEmployeeApp), findsOneWidget);
  });
}
