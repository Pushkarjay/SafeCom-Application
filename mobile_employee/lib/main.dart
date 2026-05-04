import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:mobile_employee/core/theme/app_theme.dart';
import 'package:mobile_employee/core/services/notification_service.dart';
import 'package:mobile_employee/routes/app_router.dart';
import 'package:firebase_core/firebase_core.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  if (!kIsWeb) {
    await Firebase.initializeApp();
    
    // Set background message handler for when app is terminated
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    
    // Initialize notification service
    final notificationService = NotificationService();
    await notificationService.initialize();
  }
  
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
