import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';

class LocationPermissionScreen extends ConsumerWidget {
  const LocationPermissionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Container(
                height: 110,
                width: 110,
                decoration: const BoxDecoration(
                  color: Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.my_location_rounded,
                  size: 48,
                  color: Color(0xFF0A84FF),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Enable Location Access',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 10),
              Text(
                'SafeCom needs your location to show nearby services and keep your booking flow smooth.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: const Color(0xFF475569),
                    ),
              ),
              const SizedBox(height: 24),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Text(
                  'Use "Allow while using app" on your device permission prompt.',
                ),
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: locationState.isLoading
                      ? null
                      : () async {
                          final ok = await ref
                              .read(locationProvider.notifier)
                              .requestAndFetchLocation();
                          
                          if (context.mounted) {
                            final isAuthenticated = ref.read(authProvider).isAuthenticated;
                            // If authenticated go home, else go to login
                            if (isAuthenticated) {
                              context.go(AppRoutes.home);
                            } else {
                              context.go(AppRoutes.login);
                            }
                          }
                          if (!ok && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Could not get exact location. You can continue and update later.',
                                ),
                              ),
                            );
                          }
                        },
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text(
                      locationState.isLoading
                          ? 'Fetching location...'
                          : 'Enable Location and Continue',
                    ),
                  ),
                ),
              ),
              if (locationState.errorMessage != null) ...[
                const SizedBox(height: 8),
                Text(
                  locationState.errorMessage!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.red.shade700,
                      ),
                ),
              ],
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => context.go(AppRoutes.home),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 14),
                    child: Text('Skip for Now'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
