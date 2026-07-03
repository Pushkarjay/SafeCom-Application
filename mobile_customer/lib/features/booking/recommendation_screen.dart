import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/services/providers/product_selection_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

final selectedAccessoriesProvider =
    StateNotifierProvider<SelectedAccessoriesNotifier, List<String>>((ref) {
  return SelectedAccessoriesNotifier();
});

class SelectedAccessoriesNotifier extends StateNotifier<List<String>> {
  SelectedAccessoriesNotifier() : super([]);

  void toggleAccessory(String id) {
    if (state.contains(id)) {
      state = state.where((item) => item != id).toList();
    } else {
      state = [...state, id];
    }
  }

  void setSelected(String id, bool selected) {
    if (selected) {
      if (!state.contains(id)) state = [...state, id];
    } else {
      state = state.where((item) => item != id).toList();
    }
  }

  void clear() {
    state = [];
  }
}

final recommendationProvider = FutureProvider<RecommendationCatalogResponse>((ref) async {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  return repository.getRecommendations(placement: 'checkout');
});

class RecommendationScreen extends ConsumerWidget {
  final String? serviceType;
  final String? serviceName;

  const RecommendationScreen({super.key, this.serviceType, this.serviceName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (serviceType != null && serviceType!.isNotEmpty) {
      return _RecommendationTreeScreen(serviceType: serviceType!, serviceName: serviceName);
    }
    return _LegacyRecommendationScreen();
  }
}

class _LegacyRecommendationScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recommendations = ref.watch(recommendationProvider);
    final simpleSelectedIds = ref.watch(selectedAccessoriesProvider);
    final productSelections = ref.watch(productSelectionProvider);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Recommended Accessories'),
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: () {
              ref.read(selectedAccessoriesProvider.notifier).clear();
              ref.read(productSelectionProvider.notifier).clearAll();
              context.push(AppRoutes.payment);
            },
            child: const Text('Skip'),
          ),
        ],
      ),
      body: recommendations.when(
        data: (payload) {
          final recs = payload.recommendations;

          if (recs.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No recommendations available right now.',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            );
          }

          final allProductIds = <String>[];
          for (final rec in recs) {
            for (final pid in rec.productIds) {
              if (!allProductIds.contains(pid)) allProductIds.add(pid);
            }
          }

          final List<String> effectiveSelectedIds = [];
          for (final id in allProductIds) {
            final productAsync = ref.watch(productDetailProvider(id));
            final product = productAsync.value;
            if (product == null) continue;
            if (product.variants.isEmpty) {
              if (simpleSelectedIds.contains(id)) effectiveSelectedIds.add(id);
            } else {
              final sel = productSelections[product.id]?.variantSelections ?? {};
              if (_isProductComplete(product, sel)) {
                effectiveSelectedIds.add(id);
              }
            }
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: recs.length,
                  itemBuilder: (context, recIndex) {
                    final rec = recs[recIndex];
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.secondaryLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.secondaryLight),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rec.name,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.secondary,
                                ),
                              ),
                              if (rec.description.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Text(
                                  rec.description,
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        ...rec.productIds.map((productId) {
                          final productAsync = ref.watch(productDetailProvider(productId));
                          return productAsync.when(
                            loading: () => const SizedBox(
                              height: 80,
                              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                            ),
                            error: (err, stack) => ListTile(
                              title: Text('Error: $err'),
                            ),
                            data: (product) {
                              if (product == null) {
                                return const ListTile(title: Text('Product not found'));
                              }
                              final hasVariants = product.variants.isNotEmpty;
                              if (hasVariants) {
                                final selections = productSelections[product.id]?.variantSelections ?? {};
                                final isComplete = _isProductComplete(product, selections);
                                return _buildComplexProductCard(context, ref, product, selections, isComplete);
                              } else {
                                final isSelected = simpleSelectedIds.contains(product.id);
                                return _buildSimpleProductCard(product, isSelected, () {
                                  ref.read(selectedAccessoriesProvider.notifier).toggleAccessory(product.id);
                                });
                              }
                            },
                          );
                        }),
                        if (recIndex < recs.length - 1) ...[
                          const SizedBox(height: 16),
                          const Divider(),
                          const SizedBox(height: 16),
                        ],
                      ],
                    );
                  },
                ),
              ),
              _buildBottomSection(context, ref, effectiveSelectedIds),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
      ),
    );
  }

  Widget _buildSimpleProductCard(MasterProduct product, bool isSelected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.secondaryLight : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.secondary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: isSelected,
              onChanged: (_) => onTap(),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.productName,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.description.isNotEmpty ? product.description : 'Recommended accessory',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildComplexProductCard(BuildContext context, WidgetRef ref, MasterProduct product, Map<String, String> selections, bool isComplete) {
    final selectedSummary = selections.entries.map((e) {
      final variant = product.variants.firstWhere((v) => v.variantId == e.key);
      return '${variant.name}: ${e.value}';
    }).join(', ');

    return GestureDetector(
      onTap: () => _showVariantSelector(context, ref, product),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isComplete ? AppColors.secondaryLight : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isComplete ? AppColors.secondary : AppColors.border,
            width: isComplete ? 2 : 1,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: isComplete,
              onChanged: (_) {},
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.productName,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                  ),
                  const SizedBox(height: 4),
                  if (selectedSummary.isNotEmpty)
                    Text(
                      selectedSummary,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  if (!isComplete)
                    const Text(
                      'Tap to customize',
                      style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              isComplete ? 'Change' : 'Customize',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  void _showVariantSelector(BuildContext context, WidgetRef ref, MasterProduct product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ProductVariantSelectorSheet(product: product),
    );
  }

  static bool _isProductComplete(MasterProduct product, Map<String, String> selections) {
    for (final variant in product.variants) {
      if (variant.required && !selections.containsKey(variant.variantId)) {
        return false;
      }
    }
    return true;
  }

  Widget _buildBottomSection(BuildContext context, WidgetRef ref, List<String> effectiveSelectedIds) {
    return SafeArea(
      top: false,
      child: Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (effectiveSelectedIds.isNotEmpty) ...[
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Selected Accessories', style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: 10),
                  ...effectiveSelectedIds.map(
                    (id) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(id, style: Theme.of(context).textTheme.bodySmall),
                          const Text(
                            'Added',
                            style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.success),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
          FilledButton(
            onPressed: effectiveSelectedIds.isNotEmpty
                ? () async {
                    final newItems = <ActiveOrderLineItem>[];
                    for (final id in effectiveSelectedIds) {
                      try {
                        final product = await ref.read(productDetailProvider(id).future);
                        if (product != null) {
                          newItems.add(ActiveOrderLineItem(
                            name: product.productName,
                            quantity: 1,
                            unitPrice: product.basePrice,
                          ));
                        }
                      } catch (_) {}
                    }
                    if (newItems.isNotEmpty) {
                      ref.read(activeOrderProvider.notifier).addItems(newItems);
                    }
                    if (context.mounted) context.push(AppRoutes.payment);
                  }
                : null,
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Continue with Selection'),
            ),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () {
              ref.read(selectedAccessoriesProvider.notifier).clear();
              ref.read(productSelectionProvider.notifier).clearAll();
              context.push(AppRoutes.payment);
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Skip & Continue'),
            ),
          ),
        ],
      ),
      ),
    );
  }
}

class _RecommendationTreeScreen extends ConsumerStatefulWidget {
  final String serviceType;
  final String? serviceName;

  const _RecommendationTreeScreen({required this.serviceType, this.serviceName});

  @override
  ConsumerState<_RecommendationTreeScreen> createState() => _RecommendationTreeScreenState();
}

class _RecommendationTreeScreenState extends ConsumerState<_RecommendationTreeScreen> {
  final Set<String> _selectedProductKeys = {};
  final Map<String, int> _quantities = {};
  List<_DisplayItem> _flatItems = [];

  @override
  Widget build(BuildContext context) {
    final configAsync = ref.watch(serviceRecommendationsProvider(widget.serviceType));

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        title: const Text('Recommended Add-ons'),
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: () => context.push(AppRoutes.payment),
            child: const Text('Skip'),
          ),
        ],
      ),
      body: configAsync.when(
        data: (config) {
          if (config == null || config.categories.isEmpty) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Text(
                  'No recommendations available for this service.',
                  style: TextStyle(fontSize: 16),
                ),
              ),
            );
          }

          _flatItems = <_DisplayItem>[];
          final flatItems = _flatItems;
          for (final cat in config.categories) {
            final groups = widget.serviceName != null
                ? _bestMatchingGroups(cat.groups, widget.serviceName!)
                : cat.groups;
            for (final group in groups) {
              for (final product in group.mappedProducts) {
                final leaves = _collectLeaves(product.clubbedOptions);
                if (leaves.isEmpty) {
                  flatItems.add(_DisplayItem(
                    categoryName: cat.name,
                    groupName: group.name,
                    key: product.productKey,
                    productName: product.product.productName,
                    description: product.product.description,
                    price: product.product.basePrice,
                    defaultQty: product.defaultQty,
                    minQty: product.minQty,
                    maxQty: product.maxQty,
                  ));
                } else {
                  for (final leaf in leaves) {
                    flatItems.add(_DisplayItem(
                      categoryName: cat.name,
                      groupName: group.name,
                      key: '${product.productKey}__${leaf.optionKey}',
                      productName: leaf.productName,
                      description: '',
                      price: leaf.price,
                      defaultQty: leaf.defaultQty,
                      minQty: leaf.minQty,
                      maxQty: leaf.maxQty,
                    ));
                  }
                }
              }
            }
          }

          if (flatItems.isEmpty) {
            return const Center(
              child: Text('No products available.', style: TextStyle(fontSize: 16)),
            );
          }

          final grouped = <String, List<_DisplayItem>>{};
          for (final item in flatItems) {
            grouped.putIfAbsent(item.categoryName, () => []).add(item);
          }

          return Column(
            children: [
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  children: grouped.entries.toList().map((entry) {
                    return _buildCategorySection(entry.key, entry.value);
                  }).toList(),
                ),
              ),
              _buildBottomSection(),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Failed to load recommendations: $error'),
          ),
        ),
      ),
    );
  }

  Widget _buildCategorySection(String categoryName, List<_DisplayItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          child: Text(
            categoryName,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.secondary),
          ),
        ),
        ...items.map((item) => _buildProductCard(item)),
      ],
    );
  }

  Widget _buildProductCard(_DisplayItem item) {
    final key = item.key;
    final isSelected = _selectedProductKeys.contains(key);
    final currentQty = _quantities[key] ?? item.defaultQty;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.secondaryLight : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSelected ? AppColors.secondary : AppColors.border,
          width: isSelected ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: isSelected,
                onChanged: (val) {
                  setState(() {
                    val == true
                        ? _selectedProductKeys.add(key)
                        : _selectedProductKeys.remove(key);
                  });
                },
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.productName,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    if (item.description.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        item.description,
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
              Text(
                '₹${item.price.toStringAsFixed(0)}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ],
          ),
          if (isSelected && currentQty > 0 && item.minQty != item.maxQty)
            Padding(
              padding: const EdgeInsets.only(left: 44, top: 8),
              child: Row(
                children: [
                  const Text('Qty: ', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  _buildQtyControl(key, currentQty, item.minQty, item.maxQty),
                ],
              ),
            ),
        ],
      ),
    );
  }

  List<InstallationGroup> _bestMatchingGroups(List<InstallationGroup> groups, String serviceName) {
    final lowerName = serviceName.toLowerCase();
    final matched = groups.where((g) =>
        g.name.toLowerCase() == lowerName ||
        g.id.toLowerCase() == lowerName.replaceAll(' ', '_')).toList();
    return matched.isNotEmpty ? matched : groups;
  }

  List<ClubbedOption> _collectLeaves(List<ClubbedOption> options) {
    final leaves = <ClubbedOption>[];
    for (final opt in options) {
      if (opt.isLeaf) {
        leaves.add(opt);
      } else {
        leaves.addAll(_collectLeaves(opt.children));
      }
    }
    return leaves;
  }

  Widget _buildQtyControl(String key, int currentQty, int minQty, int maxQty) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _qtyButton(Icons.remove, currentQty > minQty ? () {
          setState(() => _quantities[key] = currentQty - 1);
        } : null),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('$currentQty', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
        ),
        _qtyButton(Icons.add, currentQty < maxQty ? () {
          setState(() => _quantities[key] = currentQty + 1);
        } : null),
      ],
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback? onPressed) {
    return SizedBox(
      width: 28, height: 28,
      child: IconButton(
        padding: EdgeInsets.zero,
        icon: Icon(icon, size: 16),
        onPressed: onPressed,
        style: IconButton.styleFrom(
          backgroundColor: AppColors.surfaceVariant,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
        ),
      ),
    );
  }

  Widget _buildBottomSection() {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FilledButton(
              onPressed: _selectedProductKeys.isNotEmpty
                  ? () {
                      final newItems = <ActiveOrderLineItem>[];
                      for (final key in _selectedProductKeys) {
                        try {
                          final item = _flatItems.firstWhere((i) => i.key == key);
                          newItems.add(ActiveOrderLineItem(
                            name: item.productName,
                            quantity: _quantities[key] ?? item.defaultQty,
                            unitPrice: item.price,
                          ));
                        } catch (_) {}
                      }
                      if (newItems.isNotEmpty) {
                        ref.read(activeOrderProvider.notifier).addItems(newItems);
                      }
                      if (context.mounted) context.push(AppRoutes.payment);
                    }
                  : null,
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('Continue with Selection'),
              ),
            ),
            const SizedBox(height: 10),
            OutlinedButton(
              onPressed: () => context.push(AppRoutes.payment),
              child: const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('Skip & Continue'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DisplayItem {
  final String categoryName;
  final String groupName;
  final String key;
  final String productName;
  final String description;
  final double price;
  final int defaultQty;
  final int minQty;
  final int maxQty;
  const _DisplayItem({
    required this.categoryName,
    required this.groupName,
    required this.key,
    required this.productName,
    required this.description,
    required this.price,
    required this.defaultQty,
    required this.minQty,
    required this.maxQty,
  });
}

class _ProductVariantSelectorSheet extends ConsumerStatefulWidget {
  final MasterProduct product;
  const _ProductVariantSelectorSheet({required this.product});

  @override
  ConsumerState<_ProductVariantSelectorSheet> createState() => _ProductVariantSelectorSheetState();
}

class _ProductVariantSelectorSheetState extends ConsumerState<_ProductVariantSelectorSheet> {
  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final productId = product.id;
    final productSelections = ref.watch(productSelectionProvider);
    final selections = productSelections[productId]?.variantSelections ?? {};
    final variants = product.variants;

    int currentIndex = -1;
    for (int i = 0; i < variants.length; i++) {
      final v = variants[i];
      if (!selections.containsKey(v.variantId)) {
        currentIndex = i;
        break;
      }
    }

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(product.productName, style: const TextStyle(fontWeight: FontWeight.w700)),
                if (variants.isNotEmpty) ...[
                  for (int i = 0; i < variants.length; i++)
                    if (selections.containsKey(variants[i].variantId)) ...[
                      const Text(' > ', style: TextStyle(fontSize: 12)),
                      Chip(
                        label: Text(
                          '${variants[i].name}: ${selections[variants[i].variantId]}',
                          style: const TextStyle(fontSize: 11),
                        ),
                        backgroundColor: AppColors.secondaryLight,
                        padding: EdgeInsets.zero,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                      ),
                    ],
                ],
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: currentIndex == -1
                ? _buildCompletionView(context, product, selections)
                : _buildVariantSelection(context, product, variants[currentIndex], selections),
          ),
        ],
      ),
    );
  }

  Widget _buildVariantSelection(BuildContext context, MasterProduct product, ProductVariant variant, Map<String, String> selections) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Text(
            'Select ${variant.name}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: ListView.builder(
            itemCount: variant.options.length,
            itemBuilder: (context, i) {
              final option = variant.options[i];
              return RadioListTile<String>(
                title: Text(option),
                value: option,
                groupValue: selections[variant.variantId],
                onChanged: (val) {
                  if (val != null) {
                    ref.read(productSelectionProvider.notifier).selectOption(product.id, variant.variantId, val);
                    final updatedSelections = ref.read(productSelectionProvider)[product.id]?.variantSelections ?? {};
                    final isNowComplete = _isProductComplete(product, updatedSelections);
                    ref.read(selectedAccessoriesProvider.notifier).setSelected(product.id, isNowComplete);
                  }
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCompletionView(BuildContext context, MasterProduct product, Map<String, String> selections) {
    final summary = product.variants.map((v) => '${v.name}: ${selections[v.variantId]}').join('\n');
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 64),
          const SizedBox(height: 16),
          Text(
            'Configuration Complete',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 16),
          Text(
            summary,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 32),
          FilledButton(
            onPressed: () {
              ref.read(selectedAccessoriesProvider.notifier).setSelected(product.id, true);
              Navigator.pop(context);
            },
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 32),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Add to Selection', style: TextStyle(fontSize: 16)),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  bool _isProductComplete(MasterProduct product, Map<String, String> selections) {
    for (final variant in product.variants) {
      if (variant.required && !selections.containsKey(variant.variantId)) {
        return false;
      }
    }
    return true;
  }
}
