import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/services/providers/maintenance_flow_provider.dart';

class MaintenancePackageScreen extends ConsumerWidget {
  const MaintenancePackageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(maintenanceFlowProvider);
    final notifier = ref.read(maintenanceFlowProvider.notifier);

    if (state.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Select Maintenance Package')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final packages = state.availablePackages;

    return Scaffold(
      appBar: AppBar(title: const Text('Select Maintenance Package')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: packages.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final package = packages[index];
          final selected = state.selectedPackage == package;
          final visitCount = state.planVisits[package] ?? 1;

          return InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              notifier.selectPackage(package);
              context.push(AppRoutes.maintenanceCustomization);
            },
            child: Ink(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color:
                      selected ? const Color(0xFF0A84FF) : const Color(0xFFE2E8F0),
                  width: selected ? 1.5 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '$package Plan',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ),
                      Text(
                        '$visitCount visit${visitCount > 1 ? 's' : ''}/year',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Estimated: Rs ${_estimateTotal(state, package).toStringAsFixed(0)}',
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

  double _estimateTotal(MaintenanceFlowState state, String packageName) {
    final visitCount = state.planVisits[packageName] ?? 1;
    var total = 0.0;
    for (final template in state.itemTemplatesRaw) {
      final qty = template.multiplyByVisitCount
          ? template.baseQuantity * visitCount
          : template.baseQuantity;
      total += template.unitPrice * qty;
    }
    return total;
  }
}
