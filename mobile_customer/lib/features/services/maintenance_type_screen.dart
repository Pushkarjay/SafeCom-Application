import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/services/providers/maintenance_flow_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class MaintenanceTypeScreen extends ConsumerWidget {
  const MaintenanceTypeScreen({super.key});

  static const _iconMap = <String, IconData>{
    'settings_suggest_outlined': Icons.settings_suggest_outlined,
    'troubleshoot': Icons.troubleshoot,
    'tune': Icons.tune,
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(maintenanceFlowProvider);

    if (state.isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Select Maintenance Type')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final types = state.maintenanceTypes;

    return Scaffold(
      appBar: AppBar(title: const Text('Select Maintenance Type')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: types.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final type = types[index];
          return InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              ref.read(maintenanceFlowProvider.notifier).selectType(type.name);
              context.push(AppRoutes.maintenancePackageSelection);
            },
            child: Ink(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.secondaryLight,
                    child: Icon(
                      _iconMap[type.icon] ?? Icons.settings_suggest_outlined,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      type.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
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
