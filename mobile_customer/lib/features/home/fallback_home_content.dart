import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/home/providers/home_providers.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/home/widgets/service_grid.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class FallbackHomeContent extends ConsumerWidget {
  const FallbackHomeContent({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationState = ref.watch(locationProvider);
    final servicesAsync = ref.watch(homeServicesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LocationHeader(
          location: locationState.location,
          onChange: () => context.push(AppRoutes.locationPicker),
        ),
        if (locationState.errorMessage != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.errorLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    locationState.errorMessage!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.error),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Text(
            'Book a Service',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(height: 14),
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

              final route = AppRoutes.serviceRouteMap[item.id];
              if (route != null) {
                context.push(route);
              } else {
                context.push('${AppRoutes.servicePlaceholder}/${item.id}', extra: {
                  'title': item.title,
                  'icon': item.icon,
                });
              }
            },
          ),
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 32),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (error, stackTrace) => Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: const Text('Unable to load services. Please check your connection.',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: () => context.push(AppRoutes.productsDiscovery),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [
                  Color(0xFFFFF3E0),
                  Color(0xFFFFFBF5),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.secondary.withOpacity(0.15),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.shopping_bag_outlined, color: AppColors.secondary, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Browse All Products',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Explore our complete catalog with search & filters',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_rounded, color: AppColors.secondary),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
