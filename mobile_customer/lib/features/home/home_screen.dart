import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/home/providers/home_providers.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/home/widgets/promo_banner.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/home/widgets/service_grid.dart';

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
                onChange: () => ref
                    .read(locationProvider.notifier)
                    .requestAndFetchLocation(),
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
              const PromoBanner(),
              const SizedBox(height: 18),
              Text(
                'Announcements',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 10),
              _AnnouncementCard(
                title: 'New CCTV packages launched',
                subtitle: 'Now available with faster installation slots.',
              ),
              const SizedBox(height: 10),
              _AnnouncementCard(
                title: 'Support 24x7',
                subtitle: 'Chat and call support coming in next update.',
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: 0,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            label: 'Bookings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final String title;
  final String subtitle;

  const _AnnouncementCard({required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Color(0xFFEFF6FF),
            child: Icon(Icons.campaign_outlined, color: Color(0xFF0A84FF)),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
