import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class ServiceTypeScreen extends ConsumerWidget {
  const ServiceTypeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flowState = ref.watch(installationFlowProvider);

    if (flowState.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Select Installation Type')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final categories = flowState.config?.categories ?? [];

    if (categories.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Select Installation Type')),
        body: const Center(child: Text('No installation services available at the moment.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Select Installation Type')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: categories.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final category = categories[index];
          return InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () {
              ref.read(installationFlowProvider.notifier).selectCategory(category.id);
              context.push(AppRoutes.packageSelection);
            },
            child: Ink(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x10000000),
                    blurRadius: 14,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    height: 42,
                    width: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.videocam_outlined,
                        color: AppColors.primary),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          category.name,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          category.description.isNotEmpty ? category.description : 'Continue with package selection and live invoice customization.',
                          style: Theme.of(context).textTheme.bodySmall,

                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
