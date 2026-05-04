import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/sdui/sdui_provider.dart';
import 'package:mobile_customer/core/sdui/sdui_renderer.dart';
import 'package:mobile_customer/features/home/fallback_home_content.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/widgets/common/customer_bottom_navigation.dart';

/// Home Screen — Server-Driven UI
///
/// Fetches the layout from the backend SDUI API and renders it dynamically.
/// Falls back to [FallbackHomeContent] if the API is unreachable.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final layoutAsync = ref.watch(sduiLayoutProvider('home'));
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
          child: layoutAsync.when(
            data: (layout) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Show location error if any (not part of SDUI)
                if (locationState.errorMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    locationState.errorMessage!,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.red.shade700,
                        ),
                  ),
                ],
                // Render SDUI components
                SduiRenderer(components: layout.layout),
              ],
            ),
            loading: () => const _HomeShimmer(),
            error: (_, __) => const FallbackHomeContent(),
          ),
        ),
      ),
      bottomNavigationBar: const CustomerBottomNavigation(selectedIndex: 0),
    );
  }
}

/// Shimmer/loading placeholder while SDUI layout is being fetched.
class _HomeShimmer extends StatelessWidget {
  const _HomeShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Location header placeholder
        Container(
          width: double.infinity,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        const SizedBox(height: 18),
        // Section title placeholder
        Container(
          width: 160,
          height: 24,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        const SizedBox(height: 12),
        // Service grid placeholder
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 6,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.78,
          ),
          itemBuilder: (context, index) => Container(
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(18),
            ),
          ),
        ),
        const SizedBox(height: 18),
        // Banner placeholder
        Container(
          width: double.infinity,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ],
    );
  }
}
