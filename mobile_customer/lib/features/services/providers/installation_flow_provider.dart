import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';

class InvoiceLineItem {
  final String key;
  final String name;
  final double unitPrice;
  final int quantity;
  final bool canEditQuantity;
  final int minQty;
  final int maxQty;
  final Map<String, String> selectedVariants;

  /// If this product slot has clubbed options, the full tree is stored here.
  final bool isClubbed;
  final List<ClubbedOption> clubbedOptions;
  final ClubbedOption? selectedOption;

  /// Phase 1.1 — render type fields
  /// 'option' = classic popup, 'list' = grouped qty block rendered inline
  final String renderType;
  /// If true, this item belongs to a LIST group and its qty is validated collectively
  final bool isListChild;
  /// The key of the LIST group this item belongs to (null if not a list child)
  final String? listGroupKey;

  const InvoiceLineItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    this.canEditQuantity = true,
    this.minQty = 1,
    this.maxQty = 999,
    this.selectedVariants = const {},
    this.isClubbed = false,
    this.clubbedOptions = const [],
    this.selectedOption,
    this.renderType = 'option',
    this.isListChild = false,
    this.listGroupKey,
  });

  double get amount => unitPrice * quantity;

  InvoiceLineItem copyWith({
    String? key,
    String? name,
    double? unitPrice,
    int? quantity,
    bool? canEditQuantity,
    int? minQty,
    int? maxQty,
    Map<String, String>? selectedVariants,
    bool? isClubbed,
    List<ClubbedOption>? clubbedOptions,
    ClubbedOption? selectedOption,
    bool clearSelectedOption = false,
    String? renderType,
    bool? isListChild,
    String? listGroupKey,
  }) {
    return InvoiceLineItem(
      key: key ?? this.key,
      name: name ?? this.name,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      canEditQuantity: canEditQuantity ?? this.canEditQuantity,
      minQty: minQty ?? this.minQty,
      maxQty: maxQty ?? this.maxQty,
      selectedVariants: selectedVariants ?? this.selectedVariants,
      isClubbed: isClubbed ?? this.isClubbed,
      clubbedOptions: clubbedOptions ?? this.clubbedOptions,
      selectedOption: clearSelectedOption ? null : (selectedOption ?? this.selectedOption),
      renderType: renderType ?? this.renderType,
      isListChild: isListChild ?? this.isListChild,
      listGroupKey: listGroupKey ?? this.listGroupKey,
    );
  }
}

/// Represents a LIST group header — holds display info and collective validation params.
class InvoiceListGroup {
  final String key;
  final String label;
  final int minQty;
  final int maxQty;
  final bool collectiveValidation;

  const InvoiceListGroup({
    required this.key,
    required this.label,
    required this.minQty,
    required this.maxQty,
    this.collectiveValidation = true,
  });
}

class InstallationFlowState {
  final bool isLoading;
  final InstallationPricingContract? config;
  final String? selectedCategoryId;
  final String? selectedGroupId;
  final List<InvoiceLineItem> items;
  /// Phase 1.1 — list groups (for LIST renderType blocks)
  final List<InvoiceListGroup> listGroups;

  const InstallationFlowState({
    required this.isLoading,
    this.config,
    this.selectedCategoryId,
    this.selectedGroupId,
    this.items = const [],
    this.listGroups = const [],
  });

  double get totalAmount => items.fold(0, (sum, item) => sum + item.amount);

  InstallationCategory? get selectedCategory {
    if (config == null || selectedCategoryId == null) return null;
    return config!.categories.cast<InstallationCategory?>().firstWhere(
          (c) => c?.id == selectedCategoryId,
          orElse: () => null,
        );
  }

  InstallationGroup? get selectedGroup {
    final category = selectedCategory;
    if (category == null || selectedGroupId == null) return null;
    return category.groups.cast<InstallationGroup?>().firstWhere(
          (g) => g?.id == selectedGroupId,
          orElse: () => null,
        );
  }

  /// Returns the sum of quantities of all list children in the given group.
  int listGroupTotal(String groupKey) {
    return items
        .where((i) => i.isListChild && i.listGroupKey == groupKey)
        .fold(0, (sum, i) => sum + i.quantity);
  }

  /// Returns true if all LIST groups pass collective validation.
  bool get allListGroupsValid {
    for (final group in listGroups) {
      if (!group.collectiveValidation) continue;
      final total = listGroupTotal(group.key);
      if (total < group.minQty || total > group.maxQty) return false;
    }
    return true;
  }

  InstallationFlowState copyWith({
    bool? isLoading,
    InstallationPricingContract? config,
    String? selectedCategoryId,
    String? selectedGroupId,
    List<InvoiceLineItem>? items,
    List<InvoiceListGroup>? listGroups,
  }) {
    return InstallationFlowState(
      isLoading: isLoading ?? this.isLoading,
      config: config ?? this.config,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      selectedGroupId: selectedGroupId ?? this.selectedGroupId,
      items: items ?? this.items,
      listGroups: listGroups ?? this.listGroups,
    );
  }
}

class InstallationFlowNotifier extends StateNotifier<InstallationFlowState> {
  final PricingRepository _repository;

  InstallationFlowNotifier(this._repository)
      : super(const InstallationFlowState(isLoading: true)) {
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    state = state.copyWith(isLoading: true);
    try {
      final config = await _repository.getInstallationPricing();
      state = state.copyWith(isLoading: false, config: config);
    } catch (e) {
      // In a real app, handle error
      state = state.copyWith(isLoading: false);
    }
  }

  void selectCategory(String categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId, selectedGroupId: null, items: []);
  }

  void selectGroup(String groupId) {
    state = state.copyWith(selectedGroupId: groupId);
    _buildItemsFromGroup();
  }

  void _buildItemsFromGroup() {
    final group = state.selectedGroup;
    if (group == null) return;

    final items = <InvoiceLineItem>[];
    final listGroups = <InvoiceListGroup>[];

    for (final mappedProduct in group.mappedProducts) {
      // ─── LIST render mode: each leaf child gets its own qty stepper
      if (mappedProduct.renderType == 'list' && mappedProduct.clubbedOptions.isNotEmpty) {
        final groupKey = mappedProduct.productKey;
        listGroups.add(InvoiceListGroup(
          key: groupKey,
          label: mappedProduct.displayLabel ?? mappedProduct.productKey,
          minQty: mappedProduct.minQty,
          maxQty: mappedProduct.maxQty,
          collectiveValidation: mappedProduct.collectiveValidation,
        ));
        // Flatten all leaves of the LIST tree into individual line items
        final leaves = _collectLeaves(mappedProduct.clubbedOptions);
        for (final leaf in leaves) {
          items.add(InvoiceLineItem(
            key: '${groupKey}__${leaf.optionKey}',
            name: leaf.label,
            unitPrice: leaf.price,
            quantity: 0, // start at 0 for LIST items
            canEditQuantity: true,
            minQty: 0,
            maxQty: leaf.maxQty,
            renderType: 'list',
            isListChild: true,
            listGroupKey: groupKey,
          ));
        }
        continue;
      }

      // ─── OPTION render mode: clubbed popup OR single product
      if (mappedProduct.isClubbed && mappedProduct.clubbedOptions.isNotEmpty) {
        final firstLeaf = _findFirstLeaf(mappedProduct.clubbedOptions);
        items.add(InvoiceLineItem(
          key: mappedProduct.productKey,
          name: firstLeaf?.productName ?? mappedProduct.product.productName,
          unitPrice: firstLeaf?.price ?? mappedProduct.product.basePrice,
          quantity: firstLeaf?.defaultQty ?? mappedProduct.defaultQty,
          canEditQuantity: (firstLeaf?.minQty ?? mappedProduct.minQty) != (firstLeaf?.maxQty ?? mappedProduct.maxQty),
          minQty: firstLeaf?.minQty ?? mappedProduct.minQty,
          maxQty: firstLeaf?.maxQty ?? mappedProduct.maxQty,
          isClubbed: true,
          clubbedOptions: mappedProduct.clubbedOptions,
          selectedOption: firstLeaf,
          renderType: 'option',
        ));
        continue;
      }

      // Normal non-clubbed product
      items.add(InvoiceLineItem(
        key: mappedProduct.productId,
        name: mappedProduct.product.productName,
        unitPrice: mappedProduct.product.basePrice,
        quantity: mappedProduct.defaultQty,
        canEditQuantity: mappedProduct.minQty != mappedProduct.maxQty,
        minQty: mappedProduct.minQty,
        maxQty: mappedProduct.maxQty,
        renderType: 'option',
      ));
    }

    state = state.copyWith(items: items, listGroups: listGroups);
  }

  /// Collect all leaf nodes from a ClubbedOption tree (depth-first).
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

  /// Walk the tree and return the first leaf node found (depth-first).
  ClubbedOption? _findFirstLeaf(List<ClubbedOption> options) {
    for (final opt in options) {
      if (opt.isLeaf) return opt;
      final childLeaf = _findFirstLeaf(opt.children);
      if (childLeaf != null) return childLeaf;
    }
    return null;
  }

  /// Called when the customer selects a leaf from the nested popup.
  void selectClubbedOption(String itemKey, ClubbedOption selectedLeaf) {
    final updatedItems = state.items.map((item) {
      if (item.key == itemKey && item.isClubbed) {
        return item.copyWith(
          name: selectedLeaf.productName,
          unitPrice: selectedLeaf.price,
          quantity: selectedLeaf.defaultQty,
          minQty: selectedLeaf.minQty,
          maxQty: selectedLeaf.maxQty,
          canEditQuantity: selectedLeaf.minQty != selectedLeaf.maxQty,
          selectedOption: selectedLeaf,
        );
      }
      return item;
    }).toList();
    state = state.copyWith(items: updatedItems);
  }

  void incrementQuantity(String itemKey) {
    _updateQuantity(itemKey, isIncrement: true);
  }

  void decrementQuantity(String itemKey) {
    _updateQuantity(itemKey, isIncrement: false);
  }

  void _updateQuantity(String itemKey, {required bool isIncrement}) {
    final updatedItems = state.items.map((item) {
      if (item.key != itemKey || !item.canEditQuantity) {
        return item;
      }

      final nextQty = isIncrement ? item.quantity + 1 : item.quantity - 1;
      final safeQty = nextQty < item.minQty
          ? item.minQty
          : (nextQty > item.maxQty ? item.maxQty : nextQty);

      return item.copyWith(quantity: safeQty);
    }).toList();

    state = state.copyWith(items: updatedItems);
  }

  /// Phase 1.1 — LIST mode: increment a list child, enforcing collective max.
  void incrementListChild(String itemKey, String groupKey) {
    final group = state.listGroups.firstWhere(
      (g) => g.key == groupKey,
      orElse: () => InvoiceListGroup(key: groupKey, label: groupKey, minQty: 0, maxQty: 999),
    );
    final currentTotal = state.listGroupTotal(groupKey);
    if (group.collectiveValidation && currentTotal >= group.maxQty) return; // blocked by collective max

    final updatedItems = state.items.map((item) {
      if (item.key != itemKey) return item;
      final next = item.quantity + 1;
      if (next > item.maxQty) return item;
      return item.copyWith(quantity: next);
    }).toList();
    state = state.copyWith(items: updatedItems);
  }

  /// Phase 1.1 — LIST mode: decrement a list child (minimum 0).
  void decrementListChild(String itemKey) {
    final updatedItems = state.items.map((item) {
      if (item.key != itemKey) return item;
      final next = item.quantity - 1;
      if (next < 0) return item;
      return item.copyWith(quantity: next);
    }).toList();
    state = state.copyWith(items: updatedItems);
  }

  void updateVariant(String itemKey, String variantId, String optionValue) {
    final updatedItems = state.items.map((item) {
      if (item.key == itemKey) {
        final newVariants = Map<String, String>.from(item.selectedVariants);
        newVariants[variantId] = optionValue;
        return item.copyWith(selectedVariants: newVariants);
      }
      return item;
    }).toList();
    state = state.copyWith(items: updatedItems);
  }
}

final installationFlowProvider =
    StateNotifierProvider<InstallationFlowNotifier, InstallationFlowState>(
  (ref) => InstallationFlowNotifier(ref.watch(pricingRepositoryProvider)),
);
