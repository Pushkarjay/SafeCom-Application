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

    const packages = ['Basic', 'Standard', 'Comprehensive'];

    return Scaffold(
      appBar: AppBar(title: const Text('Select Maintenance Package')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: packages.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final package = packages[index];
          final selected = state.selectedPackage == package;
          final estimate = package == 'Basic'
              ? 3299
              : package == 'Standard'
                  ? 5899
                  : 9999;

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
              child: Row(
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
                    'Rs $estimate',
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
}
