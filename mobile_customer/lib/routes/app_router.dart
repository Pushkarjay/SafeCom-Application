import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/features/booking/booking_confirmation_screen.dart';
import 'package:mobile_customer/features/booking/payment_screen.dart';
import 'package:mobile_customer/features/booking/recommendation_screen.dart';
import 'package:mobile_customer/features/booking/scheduling_screen.dart';
import 'package:mobile_customer/features/info/about_screen.dart';
import 'package:mobile_customer/features/invoice/accessories_estimate_screen.dart';
import 'package:mobile_customer/features/invoice/installation_customization_screen.dart';
import 'package:mobile_customer/features/invoice/maintenance_customization_screen.dart';
import 'package:mobile_customer/features/invoice/repair_estimate_screen.dart';
import 'package:mobile_customer/features/invoice/upgrade_estimate_screen.dart';
import 'package:mobile_customer/features/home/home_screen.dart';
import 'package:mobile_customer/features/location/location_permission_screen.dart';
import 'package:mobile_customer/features/location/location_picker_screen.dart';
import 'package:mobile_customer/features/auth/screens/login_screen.dart';
import 'package:mobile_customer/features/auth/screens/phone_auth_screen.dart';
import 'package:mobile_customer/features/profile/screens/profile_screen.dart';
import 'package:mobile_customer/features/profile/screens/order_history_screen.dart';
import 'package:mobile_customer/features/services/accessories_screen.dart';
import 'package:mobile_customer/features/services/amc_plan_screen.dart';
import 'package:mobile_customer/features/services/maintenance_package_screen.dart';
import 'package:mobile_customer/features/services/maintenance_type_screen.dart';
import 'package:mobile_customer/features/services/package_selection_screen.dart';
import 'package:mobile_customer/features/services/products_discovery_screen.dart';
import 'package:mobile_customer/features/services/repair_issue_screen.dart';
import 'package:mobile_customer/features/services/service_placeholder_screen.dart';
import 'package:mobile_customer/features/services/service_type_screen.dart';
import 'package:mobile_customer/features/services/system_upgrade_screen.dart';
import 'package:mobile_customer/features/splash/splash_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: AppRoutes.splash,
    redirect: (context, state) {
      // Protect routes that require authentication
      final loggingIn = state.uri.path == AppRoutes.login ||
          state.uri.path == AppRoutes.phoneAuth ||
          state.uri.path == AppRoutes.locationPermission ||
          state.uri.path == AppRoutes.locationPicker ||
          state.uri.path == AppRoutes.splash;
      
      // If not logged in and trying to access a protected route, redirect to login
      if (!authState.isAuthenticated && !loggingIn) {
        return AppRoutes.login;
      }
      
      // If logged in and trying to access login screen, redirect to home
      if (authState.isAuthenticated && 
          (state.uri.path == AppRoutes.login || state.uri.path == AppRoutes.phoneAuth)) {
        return AppRoutes.home;
      }
      
      return null; // No redirect needed
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.phoneAuth,
        builder: (context, state) => const PhoneAuthScreen(),
      ),
      GoRoute(
        path: AppRoutes.locationPermission,
        builder: (context, state) => const LocationPermissionScreen(),
      ),
      GoRoute(
        path: AppRoutes.locationPicker,
        builder: (context, state) => const LocationPickerScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.about,
        builder: (context, state) => const AboutScreen(),
      ),
      GoRoute(
        path: AppRoutes.orderHistory,
        builder: (context, state) => const OrderHistoryScreen(),
      ),
      GoRoute(
        path: AppRoutes.productsDiscovery,
        builder: (context, state) => const ProductsDiscoveryScreen(),
      ),
      GoRoute(
        path: AppRoutes.serviceTypes,
        builder: (context, state) => const ServiceTypeScreen(),
      ),
      GoRoute(
        path: '${AppRoutes.servicePlaceholder}/:serviceId',
        builder: (context, state) => ServicePlaceholderScreen(
          serviceId: state.pathParameters['serviceId'] ?? 'service',
        ),
      ),
      GoRoute(
        path: AppRoutes.packageSelection,
        builder: (context, state) => const PackageSelectionScreen(),
      ),
      GoRoute(
        path: AppRoutes.installationCustomization,
        builder: (context, state) => const InstallationCustomizationScreen(),
      ),
      GoRoute(
        path: AppRoutes.maintenanceTypes,
        builder: (context, state) => const MaintenanceTypeScreen(),
      ),
      GoRoute(
        path: AppRoutes.maintenancePackageSelection,
        builder: (context, state) => const MaintenancePackageScreen(),
      ),
      GoRoute(
        path: AppRoutes.maintenanceCustomization,
        builder: (context, state) => const MaintenanceCustomizationScreen(),
      ),
      GoRoute(
        path: AppRoutes.amcPlans,
        builder: (context, state) => const AmcPlanScreen(),
      ),
      GoRoute(
        path: AppRoutes.repairIssues,
        builder: (context, state) => const RepairIssueScreen(),
      ),
      GoRoute(
        path: AppRoutes.repairEstimate,
        builder: (context, state) => const RepairEstimateScreen(),
      ),
      GoRoute(
        path: AppRoutes.systemUpgrade,
        builder: (context, state) => const SystemUpgradeScreen(),
      ),
      GoRoute(
        path: AppRoutes.upgradeEstimate,
        builder: (context, state) {
          final bundle = state.extra;
          if (bundle is UpgradeBundle) {
            return UpgradeEstimateScreen(bundle: bundle);
          }
          return const _RouteErrorScreen(message: 'Upgrade estimate payload missing');
        },
      ),
      GoRoute(
        path: AppRoutes.accessories,
        builder: (context, state) => const AccessoriesScreen(),
      ),
      GoRoute(
        path: AppRoutes.accessoriesEstimate,
        builder: (context, state) {
          final payload = state.extra;
          if (payload is List<AccessoryEstimateEntry>) {
            return AccessoriesEstimateScreen(entries: payload);
          }
          return const _RouteErrorScreen(message: 'Accessories estimate payload missing');
        },
      ),
      GoRoute(
        path: AppRoutes.scheduling,
        builder: (context, state) => const SchedulingScreen(),
      ),
      GoRoute(
        path: AppRoutes.recommendation,
        builder: (context, state) => const RecommendationScreen(),
      ),
      GoRoute(
        path: AppRoutes.payment,
        builder: (context, state) => const PaymentScreen(),
      ),
      GoRoute(
        path: AppRoutes.confirmation,
        builder: (context, state) => const BookingConfirmationScreen(),
      ),
    ],
  );
});

class _RouteErrorScreen extends StatelessWidget {
  final String message;

  const _RouteErrorScreen({required this.message});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Route Error')),
      body: Center(child: Text(message)),
    );
  }
}
