import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/sdui/sdui_provider.dart';
import 'package:mobile_customer/core/sdui/sdui_renderer.dart';
import 'package:mobile_customer/features/home/fallback_home_content.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/widgets/common/customer_bottom_navigation.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final layoutAsync = ref.watch(sduiLayoutProvider('home'));
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          child: layoutAsync.when(
            data: (layout) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                  const SizedBox(height: 8),
                ],
                SduiRenderer(components: layout.layout),
              ],
            ),
            loading: () => const _HomeShimmer(),
            error: (_, _) => const FallbackHomeContent(),
          ),
        ),
      ),
      bottomNavigationBar: const CustomerBottomNavigation(selectedIndex: 0),
    );
  }
}

class _HomeShimmer extends StatelessWidget {
  const _HomeShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          height: 76,
          decoration: BoxDecoration(
            color: AppColors.shimmer,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        const SizedBox(height: 20),
        Container(
          width: 140,
          height: 20,
          decoration: BoxDecoration(
            color: AppColors.shimmer,
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(height: 14),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 6,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.82,
          ),
          itemBuilder: (context, index) => Container(
            decoration: BoxDecoration(
              color: AppColors.shimmer,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        const SizedBox(height: 20),
        Container(
          width: double.infinity,
          height: 76,
          decoration: BoxDecoration(
            color: AppColors.shimmer,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ],
    );
  }
}
