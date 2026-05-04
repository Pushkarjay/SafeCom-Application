import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';

class PackageSelectionScreen extends ConsumerWidget {
  const PackageSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flow = ref.watch(installationFlowProvider);
    final category = flow.selectedCategory;

    if (category == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Select Package')),
        body: const Center(child: Text('Invalid Category Selected.')),
      );
    }

    final groups = category.groups;

    return Scaffold(
      appBar: AppBar(title: Text('${category.name} Packages')),
      body: groups.isEmpty
          ? const Center(child: Text('No packages available.'))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: groups.length,
              separatorBuilder: (_, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final group = groups[index];
                final isSelected = flow.selectedGroupId == group.id;
                
                // Estimate base price by summing product base prices * minQty
                final estimatedPrice = group.mappedProducts.fold<double>(
                  0.0,
                  (sum, mapped) => sum + (mapped.product.basePrice * mapped.defaultQty),
                );

                return InkWell(
                  borderRadius: BorderRadius.circular(18),
                  onTap: () {
                    ref
                        .read(installationFlowProvider.notifier)
                        .selectGroup(group.id);
                    context.push(AppRoutes.installationCustomization);
                  },
                  child: Ink(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF0A84FF)
                            : const Color(0xFFE2E8F0),
                        width: isSelected ? 1.8 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                group.name,
                                style:
                                    Theme.of(context).textTheme.titleMedium?.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                group.description.isNotEmpty ? group.description : 'Base price starts at',
                                style: Theme.of(context).textTheme.bodySmall,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          _currency(estimatedPrice),
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: const Color(0xFF0A84FF),
                                fontWeight: FontWeight.w800,
                              ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';
}
