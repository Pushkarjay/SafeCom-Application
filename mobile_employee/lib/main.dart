import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/core/theme/app_theme.dart';
import 'package:mobile_employee/routes/app_router.dart';
import 'package:firebase_core/firebase_core.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(const ProviderScope(child: SafeComEmployeeApp()));
}

class SafeComEmployeeApp extends ConsumerWidget {
  const SafeComEmployeeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.read(appRouterProvider);

    return MaterialApp.router(
      title: 'SafeCom Employee',
      theme: AppTheme.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
