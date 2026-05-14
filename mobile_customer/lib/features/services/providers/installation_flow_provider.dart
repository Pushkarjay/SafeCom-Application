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

// ─── Notifier ──────────────────────────────────────────────────
class InstallationFlowNotifier extends StateNotifier<InstallationFlowState> {
  final PricingRepository _repo;
  Map<String, List<String>> _dependencyMap = {};

  InstallationFlowNotifier(this._repo) : super(InstallationFlowState(isLoading: true)) {
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    try {
      final config = await _repo.getInstallationPricing();
      state = InstallationFlowState(isLoading: false, config: config);
    } catch (e) {
      state = InstallationFlowState(isLoading: false);
    }
  }

  void selectCategory(String categoryId) {
    state = state.copyWith(selectedCategoryId: categoryId, selectedGroupId: null, items: [], listGroups: []);
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
      if (mappedProduct.renderType == 'list' && mappedProduct.clubbedOptions.isNotEmpty) {
        final groupKey = mappedProduct.productKey;
        listGroups.add(InvoiceListGroup(
          key: groupKey,
          label: mappedProduct.displayLabel ?? mappedProduct.productKey,
          minQty: mappedProduct.minQty,
          maxQty: mappedProduct.maxQty,
          collectiveValidation: mappedProduct.collectiveValidation,
        ));
        final leaves = _collectLeaves(mappedProduct.clubbedOptions);
        for (final leaf in leaves) {
          items.add(InvoiceLineItem(
            key: '${groupKey}__${leaf.optionKey}',
            name: leaf.label,
            unitPrice: leaf.price,
            quantity: 0,
            canEditQuantity: leaf.dependsOn == null,
            minQty: 0,
            maxQty: leaf.maxQty,
            renderType: 'list',
            isListChild: true,
            listGroupKey: groupKey,
          ));
        }
        continue;
      }

      if (mappedProduct.isClubbed && mappedProduct.clubbedOptions.isNotEmpty) {
        final firstLeaf = _findFirstLeaf(mappedProduct.clubbedOptions);
        items.add(InvoiceLineItem(
          key: mappedProduct.productKey,
          name: firstLeaf?.productName ?? mappedProduct.product.productName,
          unitPrice: firstLeaf?.price ?? mappedProduct.product.basePrice,
          quantity: firstLeaf?.defaultQty ?? mappedProduct.defaultQty,
          canEditQuantity: mappedProduct.dependsOn == null && (firstLeaf?.minQty ?? mappedProduct.minQty) != (firstLeaf?.maxQty ?? mappedProduct.maxQty),
          minQty: firstLeaf?.minQty ?? mappedProduct.minQty,
          maxQty: firstLeaf?.maxQty ?? mappedProduct.maxQty,
          isClubbed: true,
          clubbedOptions: mappedProduct.clubbedOptions,
          selectedOption: firstLeaf,
          renderType: 'option',
        ));
        continue;
      }

      items.add(InvoiceLineItem(
        key: mappedProduct.productId,
        name: mappedProduct.product.productName,
        unitPrice: mappedProduct.product.basePrice,
        quantity: mappedProduct.defaultQty,
        canEditQuantity: mappedProduct.dependsOn == null && mappedProduct.minQty != mappedProduct.maxQty,
        minQty: mappedProduct.minQty,
        maxQty: mappedProduct.maxQty,
        renderType: 'option',
      ));
    }

    // Build dependency map
    final depMap = <String, List<String>>{};
    for (final mp in group.mappedProducts) {
      if (mp.dependsOn != null) {
        depMap.putIfAbsent(mp.dependsOn!, () => []).add(mp.productId);
      }
    }
    _dependencyMap = depMap;
    _applyDependencies(items);

    state = state.copyWith(items: items, listGroups: listGroups);
  }

  void _applyDependencies([List<InvoiceLineItem>? items]) {
    final target = items ?? state.items;
    for (final entry in _dependencyMap.entries) {
      final sourceKey = entry.key;
      final depKeys = entry.value;
      final source = target.where((i) => i.key == sourceKey || i.key == '${sourceKey}').firstOrNull;
      if (source == null) continue;
      for (final depKey in depKeys) {
        final idx = target.indexWhere((i) => i.key == depKey);
        if (idx >= 0) {
          target[idx] = target[idx].copyWith(quantity: source.quantity, canEditQuantity: false);
        }
      }
    }
    if (items == null) state = state.copyWith(items: target);
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

  ClubbedOption? _findFirstLeaf(List<ClubbedOption> options) {
    for (final opt in options) {
      if (opt.isLeaf) return opt;
      final childLeaf = _findFirstLeaf(opt.children);
      if (childLeaf != null) return childLeaf;
    }
    return null;
  }

  void incrementQuantity(String itemKey) {
    _updateQuantity(itemKey, isIncrement: true);
  }

  void decrementQuantity(String itemKey) {
    _updateQuantity(itemKey, isIncrement: false);
  }

  void _updateQuantity(String itemKey, {required bool isIncrement}) {
    final updatedItems = state.items.map((item) {
      if (item.key != itemKey || !item.canEditQuantity) return item;
      final nextQty = isIncrement ? item.quantity + 1 : item.quantity - 1;
      final safeQty = nextQty.clamp(item.minQty, item.maxQty);
      return item.copyWith(quantity: safeQty);
    }).toList();
    _applyDependencies(updatedItems);
    state = state.copyWith(items: updatedItems);
  }

  void incrementListChild(String itemKey, String groupKey) {
    final group = state.listGroups.firstWhere(
      (g) => g.key == groupKey,
      orElse: () => InvoiceListGroup(key: groupKey, label: groupKey, minQty: 0, maxQty: 999),
    );
    final currentTotal = state.listGroupTotal(groupKey);
    if (group.collectiveValidation && currentTotal >= group.maxQty) return;

    final updatedItems = state.items.map((item) {
      if (item.key != itemKey) return item;
      final next = item.quantity + 1;
      if (next > item.maxQty) return item;
      return item.copyWith(quantity: next);
    }).toList();
    _applyDependencies(updatedItems);
    state = state.copyWith(items: updatedItems);
  }

  void decrementListChild(String itemKey) {
    final updatedItems = state.items.map((item) {
      if (item.key != itemKey) return item;
      final next = item.quantity - 1;
      if (next < 0) return item;
      return item.copyWith(quantity: next);
    }).toList();
    _applyDependencies(updatedItems);
    state = state.copyWith(items: updatedItems);
  }

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
    _applyDependencies(updatedItems);
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
