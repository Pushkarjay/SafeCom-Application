import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';
import 'package:mobile_customer/routes/app_router.dart';

void main() {
  runApp(const ProviderScope(child: SafeComApp()));
}

class SafeComApp extends ConsumerWidget {
  const SafeComApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);
    return MaterialApp.router(
      title: 'SafeCom',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      routerConfig: router,
    );
  }
}
