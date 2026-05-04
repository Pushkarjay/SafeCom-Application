import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/home/providers/home_providers.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/home/widgets/service_grid.dart';
import 'package:mobile_customer/widgets/common/customer_bottom_navigation.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationState = ref.watch(locationProvider);
    final servicesAsync = ref.watch(homeServicesProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LocationHeader(
                location: locationState.location,
                onChange: () => context.push(AppRoutes.locationPicker),
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
              const SizedBox(height: 18),
              Text(
                'Book a Service',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 12),
              servicesAsync.when(
                data: (services) => ServiceGrid(
                  services: services,
                  onServiceTap: (item) {
                    if (!item.enabled) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('${item.title} is disabled.')),
                      );
                      return;
                    }

                    if (item.id == 'installation') {
                      context.push(AppRoutes.serviceTypes);
                      return;
                    }

                    if (item.id == 'maintenance') {
                      context.push(AppRoutes.maintenanceTypes);
                      return;
                    }

                    if (item.id == 'amc') {
                      context.push(AppRoutes.amcPlans);
                      return;
                    }

                    if (item.id == 'repair') {
                      context.push(AppRoutes.repairIssues);
                      return;
                    }

                    if (item.id == 'upgrade') {
                      context.push(AppRoutes.systemUpgrade);
                      return;
                    }

                    if (item.id == 'accessories') {
                      context.push(AppRoutes.accessories);
                      return;
                    }

                    context.push('${AppRoutes.servicePlaceholder}/${item.id}');
                  },
                ),
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (error, stackTrace) => Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Text('Failed to load services: $error'),
                ),
              ),
              const SizedBox(height: 18),
              GestureDetector(
                onTap: () => context.push(AppRoutes.productsDiscovery),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0A84FF), Color(0xFF1E40AF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Browse All Products',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Explore our complete catalog with search & filters',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    color: Colors.white70,
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Icon(Icons.arrow_forward_rounded,
                          color: Colors.white),
                    ],
                  ),
                ),
              ),
              // TODO: Replace with dynamic backend-driven banners
              // const PromoBanner(),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const CustomerBottomNavigation(selectedIndex: 0),
    );
  }
}
