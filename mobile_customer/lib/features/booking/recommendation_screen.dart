import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
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

  const RecommendationScreen({super.key, this.serviceType});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (serviceType != null && serviceType!.isNotEmpty) {
      return _RecommendationTreeScreen(serviceType: serviceType!);
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
            onPressed: effectiveSelectedIds.isNotEmpty ? () => context.push(AppRoutes.payment) : null,
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

  const _RecommendationTreeScreen({required this.serviceType});

  @override
  ConsumerState<_RecommendationTreeScreen> createState() => _RecommendationTreeScreenState();
}

class _RecommendationTreeScreenState extends ConsumerState<_RecommendationTreeScreen> {
  String? _selectedCategoryId;
  String? _selectedGroupId;
  final Map<String, int> _quantities = {};
  final Set<String> _selectedLeaves = {};

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

          // Auto-select first category and first group if nothing selected
          if (_selectedCategoryId == null) {
            _selectedCategoryId = config.categories.first.id;
            if (config.categories.first.groups.isNotEmpty) {
              _selectedGroupId = config.categories.first.groups.first.id;
            }
          }

          final selectedCat = config.categories.cast<InstallationCategory?>().firstWhere(
            (c) => c?.id == _selectedCategoryId,
            orElse: () => null,
          );

          return Column(
            children: [
              // Category chips
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: config.categories.map((cat) {
                      final isSelected = cat.id == _selectedCategoryId;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat.name, style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          )),
                          selected: isSelected,
                          onSelected: (selected) {
                            if (selected) {
                              setState(() {
                                _selectedCategoryId = cat.id;
                                _selectedGroupId = cat.groups.isNotEmpty ? cat.groups.first.id : null;
                              });
                            }
                          },
                          selectedColor: AppColors.secondaryLight,
                          backgroundColor: AppColors.surfaceVariant,
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              if (selectedCat != null && selectedCat.groups.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: selectedCat.groups.map((group) {
                        final isSelected = group.id == _selectedGroupId;
                        return Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: FilterChip(
                            label: Text(group.name, style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                            )),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) setState(() => _selectedGroupId = group.id);
                            },
                            visualDensity: VisualDensity.compact,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
              ],
              Expanded(
                child: selectedCat != null ? _buildCategoryContent(selectedCat) : const SizedBox.shrink(),
              ),
              _buildTreeBottomSection(),
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

  Widget _buildCategoryContent(InstallationCategory category) {
    if (category.groups.isEmpty) {
      return const Center(child: Text('No setups in this category'));
    }

    if (_selectedGroupId == null || !category.groups.any((g) => g.id == _selectedGroupId)) {
      return const SizedBox.shrink();
    }

    final group = category.groups.firstWhere((g) => g.id == _selectedGroupId);

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      children: group.mappedProducts.map((product) {
        return _buildProductCard(product);
      }).toList(),
    );
  }

  Widget _buildProductCard(MappedProduct mappedProduct) {
    final productKey = mappedProduct.productKey;
    final defaultQty = mappedProduct.defaultQty;
    final currentQty = _quantities[productKey] ?? defaultQty;
    final isSelected = _selectedLeaves.contains(productKey);

    if (mappedProduct.isClubbed && mappedProduct.clubbedOptions.isNotEmpty) {
      return _buildClubbedProductCard(mappedProduct);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
                        ? _selectedLeaves.add(productKey)
                        : _selectedLeaves.remove(productKey);
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
                      mappedProduct.product.productName,
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                    ),
                    if (mappedProduct.product.description.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        mappedProduct.product.description,
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ],
                  ],
                ),
              ),
              Text(
                '₹${mappedProduct.product.basePrice.toStringAsFixed(0)}',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ],
          ),
          if (isSelected && currentQty > 0 && mappedProduct.minQty != mappedProduct.maxQty)
            Padding(
              padding: const EdgeInsets.only(left: 44, top: 8),
              child: Row(
                children: [
                  const Text('Qty: ', style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                  _buildQtyControl(productKey, currentQty, mappedProduct.minQty, mappedProduct.maxQty),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildClubbedProductCard(MappedProduct mappedProduct) {
    final productKey = mappedProduct.productKey;
    final firstLeaf = _findFirstLeaf(mappedProduct.clubbedOptions);
    final isSelected = _selectedLeaves.contains(productKey);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
            children: [
              Checkbox(
                value: isSelected,
                onChanged: (val) {
                  setState(() {
                    val == true
                        ? _selectedLeaves.add(productKey)
                        : _selectedLeaves.remove(productKey);
                  });
                },
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  mappedProduct.displayLabel ?? mappedProduct.product.productName,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
              ),
              if (firstLeaf != null)
                Text(
                  '₹${firstLeaf.price.toStringAsFixed(0)}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                ),
            ],
          ),
          if (isSelected && mappedProduct.clubbedOptions.isNotEmpty) ...[
            const SizedBox(height: 8),
            ...mappedProduct.clubbedOptions.map((opt) {
              return _buildClubbedOptionTile(opt, productKey, 0);
            }),
          ],
        ],
      ),
    );
  }

  Widget _buildClubbedOptionTile(ClubbedOption option, String parentProductKey, int depth) {
    if (option.isLeaf) {
      final isOptSelected = _selectedLeaves.contains('${parentProductKey}__${option.optionKey}');
      return Padding(
        padding: EdgeInsets.only(left: 16.0 * depth, bottom: 4),
        child: Row(
          children: [
            Checkbox(
              value: isOptSelected,
              onChanged: (val) {
                setState(() {
                  val == true
                      ? _selectedLeaves.add('${parentProductKey}__${option.optionKey}')
                      : _selectedLeaves.remove('${parentProductKey}__${option.optionKey}');
                });
              },
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 4),
            Expanded(child: Text(option.label, style: const TextStyle(fontSize: 13))),
            Text('₹${option.price.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(left: 16.0 * depth, top: 4, bottom: 2),
          child: Text(option.label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.secondary)),
        ),
        ...option.children.map((child) => _buildClubbedOptionTile(child, parentProductKey, depth + 1)),
      ],
    );
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

  Widget _buildTreeBottomSection() {
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
              onPressed: _selectedLeaves.isNotEmpty ? () => context.push(AppRoutes.payment) : null,
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

  ClubbedOption? _findFirstLeaf(List<ClubbedOption> options) {
    for (final opt in options) {
      if (opt.isLeaf) return opt;
      final child = _findFirstLeaf(opt.children);
      if (child != null) return child;
    }
    return null;
  }
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
