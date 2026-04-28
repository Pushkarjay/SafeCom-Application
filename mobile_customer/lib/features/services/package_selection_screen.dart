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
    const packageOptions = [4, 8, 16, 32];

    return Scaffold(
      appBar: AppBar(title: Text('${flow.selectedServiceType} Packages')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: packageOptions.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final packageSize = packageOptions[index];
          final isSelected = flow.selectedPackage == packageSize;
          final estimated = _estimatePackagePrice(packageSize);

          return InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () {
              ref
                  .read(installationFlowProvider.notifier)
                  .selectPackage(packageSize);
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
                          '$packageSize Camera Installation',
                          style:
                              Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Base price starts at',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  Text(
                    _currency(estimated),
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

  double _estimatePackagePrice(int packageSize) {
    switch (packageSize) {
      case 4:
        return 20999;
      case 8:
        return 36999;
      case 16:
        return 64999;
      default:
        return 119999;
    }
  }

  String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';
}
