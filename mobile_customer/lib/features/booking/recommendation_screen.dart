import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/features/services/providers/product_selection_provider.dart';

// Provider for selected accessories (simple products without variants)
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
  const RecommendationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recommendations = ref.watch(recommendationProvider);
    final simpleSelectedIds = ref.watch(selectedAccessoriesProvider);
    final productSelections = ref.watch(productSelectionProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recommended Accessories'),
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          TextButton(
            onPressed: () {
              ref.read(selectedAccessoriesProvider.notifier).clear();
              ref.read(productSelectionProvider.notifier).clearAll();
              context.go(AppRoutes.payment);
            },
            child: const Text('Skip'),
          ),
        ],
      ),
      body: recommendations.when(
        data: (payload) {
          final recommendation = payload.recommendations.isNotEmpty
              ? payload.recommendations.first
              : null;
          final productIds = recommendation?.productIds ?? [];

          if (productIds.isEmpty) {
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

          // Compute the combined list of selected product IDs (simple + complex)
          final List<String> effectiveSelectedIds = [];
          for (final id in productIds) {
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
              // Header info
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        recommendation?.name ?? 'Optional Add-ons',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1E40AF),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        recommendation?.description ??
                            'These accessories are optional but recommended to optimize your service.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: const Color(0xFF1E3A8A),
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Products list
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: productIds.length,
                  itemBuilder: (context, index) {
                    final productId = productIds[index];
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
                  },
                ),
              ),
              // Selected items summary and buttons
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
          color: isSelected ? const Color(0xFFF0F9FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
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
                    style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
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
      final variant = product.variants!.firstWhere((v) => v.variantId == e.key);
      return '${variant.name}: ${e.value}';
    }).join(', ');

    return GestureDetector(
      onTap: () => _showVariantSelector(context, ref, product),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isComplete ? const Color(0xFFF0F9FF) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isComplete ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
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
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
                    ),
                  if (!isComplete)
                    const Text(
                      'Tap to customize',
                      style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              isComplete ? 'Change' : 'Customize',
              style: const TextStyle(color: Color(0xFF0A84FF), fontWeight: FontWeight.w600),
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

  bool _isProductComplete(MasterProduct product, Map<String, String> selections) {
    for (final variant in product.variants) {
      if (variant.required && !selections.containsKey(variant.variantId)) {
        return false;
      }
    }
    return true;
  }

  Widget _buildBottomSection(BuildContext context, WidgetRef ref, List<String> effectiveSelectedIds) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
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
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
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
                            style: TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF16A34A)),
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
            onPressed: effectiveSelectedIds.isNotEmpty ? () => context.go(AppRoutes.payment) : null,
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
              context.go(AppRoutes.payment);
            },
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Text('Skip & Continue'),
            ),
          ),
        ],
      ),
    );
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

    // Determine current variant index: first variant with no selection
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
          // Drag handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Breadcrumb trail
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
                        backgroundColor: const Color(0xFFEFF6FF),
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
          // Content
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
              final isSelected = selections[variant.variantId] == option;
              return RadioListTile<String>(
                title: Text(option),
                value: option,
                groupValue: selections[variant.variantId],
                onChanged: (val) {
                  if (val != null) {
                    ref.read(productSelectionProvider.notifier).selectOption(product.id, variant.variantId, val);
                    // Also update the selectedAccessoriesProvider to reflect completion status
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
              // Ensure selection is marked (should already be true)
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
