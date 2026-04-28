import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/services/providers/maintenance_flow_provider.dart';

class MaintenanceTypeScreen extends ConsumerWidget {
  const MaintenanceTypeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    const types = [
      'Preventive Maintenance',
      'Fault Diagnosis',
      'Performance Tuning',
    ];

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
              ref.read(maintenanceFlowProvider.notifier).selectType(type);
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
                  const CircleAvatar(
                    backgroundColor: Color(0xFFEFF6FF),
                    child: Icon(Icons.settings_suggest_outlined,
                        color: Color(0xFF0A84FF)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      type,
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
