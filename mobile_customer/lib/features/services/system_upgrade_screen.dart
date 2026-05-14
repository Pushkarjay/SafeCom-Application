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
        data: (catalog) {
          if (catalog.bundles.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.upgrade_outlined, size: 48, color: Color(0xFF94A3B8)),
                    const SizedBox(height: 16),
                    Text(
                      'No upgrade bundles available',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    const Text('Check back later for upgrade options.', textAlign: TextAlign.center),
                  ],
                ),
              ),
            );
          }

          return ListView.separated(
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
                      Text(
                        bundle.description,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF64748B),
                            ),
                      ),
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
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.cloud_off_outlined, size: 48, color: Color(0xFF94A3B8)),
                const SizedBox(height: 16),
                Text(
                  'Failed to load upgrade options',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text('$err', textAlign: TextAlign.center),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
