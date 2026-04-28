import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';

final upgradeCatalogProvider = FutureProvider((ref) {
  return ref.watch(pricingRepositoryProvider).getUpgradeCatalog();
});

class SystemUpgradeScreen extends ConsumerWidget {
  const SystemUpgradeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalogAsync = ref.watch(upgradeCatalogProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('System Upgrade')),
      body: catalogAsync.when(
        data: (catalog) => ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: catalog.bundles.length,
          separatorBuilder: (_, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final bundle = catalog.bundles[index];
            return InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                context.push(AppRoutes.upgradeEstimate, extra: bundle);
              },
              child: Ink(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      bundle.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(bundle.description),
                    const SizedBox(height: 10),
                    Text(
                      'Rs ${bundle.price.toStringAsFixed(0)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
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
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Failed to load: $err')),
      ),
    );
  }
}
