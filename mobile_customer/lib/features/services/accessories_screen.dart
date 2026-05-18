import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/features/invoice/accessories_estimate_screen.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

final accessoriesCatalogProvider = FutureProvider((ref) {
  return ref.watch(pricingRepositoryProvider).getAccessoryCatalog();
});

class AccessoriesScreen extends ConsumerStatefulWidget {
  const AccessoriesScreen({super.key});

  @override
  ConsumerState<AccessoriesScreen> createState() => _AccessoriesScreenState();
}

class _AccessoriesScreenState extends ConsumerState<AccessoriesScreen> {
  final Map<String, int> _qtyById = {};

  @override
  Widget build(BuildContext context) {
    final catalogAsync = ref.watch(accessoriesCatalogProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Accessories')),
      body: catalogAsync.when(
        data: (catalog) {
          for (final item in catalog.items) {
            _qtyById.putIfAbsent(item.id, () => 0);
          }

          final total = _totalAmount(catalog.items);

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: catalog.items.length,
                  separatorBuilder: (_, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final item = catalog.items[index];
                    final qty = _qtyById[item.id] ?? 0;
                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  item.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleSmall
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 4),
                                Text('Rs ${item.price.toStringAsFixed(0)}'),
                              ],
                            ),
                          ),
                          QuantityStepper(
                            quantity: qty,
                            onIncrement: () => setState(() {
                              _qtyById[item.id] = qty + 1;
                            }),
                            onDecrement: qty > 0
                                ? () => setState(() {
                                      _qtyById[item.id] = qty - 1;
                                    })
                                : null,
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: AppColors.border)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text('Accessories Total',
                              style: Theme.of(context).textTheme.bodySmall),
                          Text(
                            'Rs ${total.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ],
                      ),
                    ),
                    FilledButton(
                      onPressed: total <= 0
                          ? null
                          : () {
                              final payload = catalog.items
                                  .where((item) => (_qtyById[item.id] ?? 0) > 0)
                                  .map(
                                    (item) => AccessoryEstimateEntry(
                                      id: item.id,
                                      name: item.name,
                                      price: item.price,
                                      quantity: _qtyById[item.id] ?? 0,
                                    ),
                                  )
                                  .toList(growable: false);

                              context.push(
                                AppRoutes.accessoriesEstimate,
                                extra: payload,
                              );
                            },
                      child: const Text('Proceed'),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Failed to load: $err')),
      ),
    );
  }

  double _totalAmount(List<AccessoryItem> items) {
    var sum = 0.0;
    for (final item in items) {
      final qty = _qtyById[item.id] ?? 0;
      sum += item.price * qty;
    }
    return sum;
  }
}
