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

  final bool isClubbed;
  final List<ClubbedOption> clubbedOptions;
  final ClubbedOption? selectedOption;

  final String renderType;
  final bool isListChild;
  final String? listGroupKey;
  final String? listGroupLabel;

  /// parentProductKey = top-level mappedProduct.productKey this item belongs to
  final String parentProductKey;
  /// dependsOn = productKey that controls this item's quantity (if any)
  final String? dependsOn;

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
    this.listGroupLabel,
    required this.parentProductKey,
    this.dependsOn,
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
    String? listGroupLabel,
    String? parentProductKey,
    String? dependsOn,
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
      listGroupLabel: listGroupLabel ?? this.listGroupLabel,
      parentProductKey: parentProductKey ?? this.parentProductKey,
      dependsOn: dependsOn ?? this.dependsOn,
    );
  }
}

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
  final List<InvoiceListGroup> listGroups;
  /// Tracks which LIST branch is selected for clubbed products (productKey -> branchOptionKey)
  final Map<String, String> selectedBranch;
  /// Tracks selected multi-select options (productKey -> set of selected optionKeys)
  final Map<String, Set<String>> selectedMultiOptions;

  const InstallationFlowState({
    required this.isLoading,
    this.config,
    this.selectedCategoryId,
    this.selectedGroupId,
    this.items = const [],
    this.listGroups = const [],
    this.selectedBranch = const {},
    this.selectedMultiOptions = const {},
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

  int listGroupTotal(String groupKey) {
    return items
        .where((i) => i.isListChild && i.listGroupKey == groupKey)
        .fold(0, (sum, i) => sum + i.quantity);
  }

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
    Map<String, String>? selectedBranch,
    Map<String, Set<String>>? selectedMultiOptions,
  }) {
    return InstallationFlowState(
      isLoading: isLoading ?? this.isLoading,
      config: config ?? this.config,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      selectedGroupId: selectedGroupId ?? this.selectedGroupId,
      items: items ?? this.items,
      listGroups: listGroups ?? this.listGroups,
      selectedBranch: selectedBranch ?? this.selectedBranch,
      selectedMultiOptions: selectedMultiOptions ?? this.selectedMultiOptions,
    );
  }
}

// ─── Notifier ──────────────────────────────────────────────────
class InstallationFlowNotifier extends StateNotifier<InstallationFlowState> {
  final PricingRepository _repo;
  Map<String, List<String>> _dependencyMap = {};
  Map<String, String> _sourceProductKeys = {};
  Map<String, int> _slotMaxConstraints = {};

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
    state = state.copyWith(selectedCategoryId: categoryId, selectedGroupId: null, items: [], listGroups: [], selectedMultiOptions: {});
  }

  void selectGroup(String groupId) {
    state = state.copyWith(selectedGroupId: groupId);
    _buildItemsFromGroup();
  }

  void selectClubbedBranch(String productKey, String branchOptionKey) {
    state = state.copyWith(
      selectedBranch: Map.fromEntries([
        for (var e in state.selectedBranch.entries)
          if (e.key != productKey) e,
        MapEntry(productKey, branchOptionKey),
      ]),
    );
    _buildItemsFromGroup();
  }

  void setMultiSelectedOptions(String productKey, Set<String> optionKeys) {
    final updated = Map<String, Set<String>>.from(state.selectedMultiOptions);
    updated[productKey] = optionKeys;
    state = state.copyWith(selectedMultiOptions: updated);
    _buildItemsFromGroup();
  }

  void _buildItemsFromGroup() {
    final group = state.selectedGroup;
    if (group == null) return;

    final items = <InvoiceLineItem>[];
    final listGroups = <InvoiceListGroup>[];
    final Map<String, Set<String>> newMultiSelections = {};

    for (final mappedProduct in group.mappedProducts) {
      final clubbedOpts = mappedProduct.clubbedOptions;

      if (clubbedOpts.isNotEmpty) {
        // ── Clubbed product with LIST branches → mutual-exclusive branch selection ──
        if (mappedProduct.isClubbed) {
          final listBranches = clubbedOpts
              .where((opt) => !opt.isLeaf && opt.renderType == 'list')
              .toList();
          if (listBranches.isNotEmpty) {
            var selectedBranchKey = state.selectedBranch[mappedProduct.productKey];
            if (selectedBranchKey == null ||
                !listBranches.any((b) => b.optionKey == selectedBranchKey)) {
              selectedBranchKey = listBranches.first.optionKey;
            }

            // Only ONE listGroup for the selected branch
            final selBranch =
                listBranches.firstWhere((b) => b.optionKey == selectedBranchKey);
            final groupKey =
                '${mappedProduct.productKey}__${selBranch.optionKey}';
            listGroups.add(InvoiceListGroup(
              key: groupKey,
              label: selBranch.label,
              minQty: selBranch.minQty,
              maxQty: mappedProduct.maxQty,
              collectiveValidation: selBranch.collectiveValidation,
            ));

            // Compute group-level maxQty: MAX of all child leaf maxQty values
            final selLeaves = _collectLeaves([selBranch]);
            final groupMaxQty = selLeaves.isEmpty
                ? mappedProduct.maxQty
                : selLeaves.map((l) => l.maxQty).reduce((a, b) => a > b ? a : b);

            // Only add leaves from the selected branch
            for (final leaf in selLeaves) {
              final leafKey = '${groupKey}__${leaf.optionKey}';
              items.add(InvoiceLineItem(
                key: leafKey,
                name: leaf.label,
                unitPrice: leaf.price,
                quantity: leaf.defaultQty,
                canEditQuantity: leaf.dependsOn == null && leaf.minQty != leaf.maxQty,
                minQty: leaf.minQty,
                maxQty: groupMaxQty,
                renderType: 'list',
                isListChild: true,
                listGroupKey: groupKey,
                listGroupLabel: selBranch.label,
                parentProductKey: mappedProduct.productKey,
                dependsOn: leaf.dependsOn,
              ));
            }

            // Exclude leaves that belong to any LIST branch from regular option items
            final Set<String> branchLeafKeys = <String>{};
            for (final branch in listBranches) {
              final branchLeaves = _collectLeaves([branch]);
              for (final leaf in branchLeaves) {
                branchLeafKeys.add('${leaf.productId}||${leaf.optionKey}');
              }
            }
            final nonListLeaves = clubbedOpts.where((opt) {
              if (!opt.isLeaf) return false;
              final leafId = '${opt.productId}||${opt.optionKey}';
              return !branchLeafKeys.contains(leafId);
            }).toList();
            for (final leaf in nonListLeaves) {
              items.add(InvoiceLineItem(
                key: '${mappedProduct.productKey}__${leaf.optionKey}',
                name: leaf.label,
                unitPrice: leaf.price,
                quantity: 0,
                canEditQuantity: leaf.dependsOn == null,
                minQty: 0,
                maxQty: leaf.maxQty,
                renderType: 'option',
                parentProductKey: mappedProduct.productKey,
                dependsOn: leaf.dependsOn,
              ));
            }
            continue;
          }
        }

        // ── Product with renderType=='list' (flat LIST) ──
        if (mappedProduct.renderType == 'list' && clubbedOpts.isNotEmpty) {
          final groupKey = mappedProduct.productKey;
          final leaves = _collectLeaves(clubbedOpts);
          // Compute group-level maxQty: MAX of all child leaf maxQty values, fallback to mappedProduct.maxQty
          final computedGroupMax = leaves.isEmpty
              ? mappedProduct.maxQty
              : leaves.map((l) => l.maxQty).reduce((a, b) => a > b ? a : b);
          listGroups.add(InvoiceListGroup(
            key: groupKey,
            label: mappedProduct.displayLabel ?? mappedProduct.productKey,
            minQty: mappedProduct.minQty,
            maxQty: computedGroupMax,
            collectiveValidation: mappedProduct.collectiveValidation,
          ));
          for (final leaf in leaves) {
            final leafKey = '${groupKey}__${leaf.optionKey}';
            items.add(InvoiceLineItem(
              key: leafKey,
              name: leaf.label,
              unitPrice: leaf.price,
              quantity: leaf.defaultQty,
              canEditQuantity: leaf.dependsOn == null && leaf.minQty != leaf.maxQty,
              minQty: leaf.minQty,
              maxQty: computedGroupMax,
              renderType: 'list',
              isListChild: true,
              listGroupKey: groupKey,
              listGroupLabel: mappedProduct.displayLabel ?? mappedProduct.productKey,
              parentProductKey: mappedProduct.productKey,
              dependsOn: leaf.dependsOn,
            ));
          }
          continue;
        }

        // ── Multi-select clubbed product (flat leaf list) ──
        if (mappedProduct.isClubbed && clubbedOpts.isNotEmpty &&
            clubbedOpts.every((o) => o.isLeaf) &&
            clubbedOpts.any((o) => o.selectionType == 'multi')) {
          final hasSelection = state.selectedMultiOptions.containsKey(mappedProduct.productKey);
          final selectedKeys = hasSelection
              ? Set<String>.from(state.selectedMultiOptions[mappedProduct.productKey]!)
              : <String>{};
          if (selectedKeys.isEmpty) {
            selectedKeys.add(clubbedOpts.first.optionKey);
            newMultiSelections[mappedProduct.productKey] = selectedKeys;
          }
          for (final leaf in clubbedOpts) {
            if (selectedKeys.contains(leaf.optionKey)) {
              items.add(InvoiceLineItem(
                key: '${mappedProduct.productKey}__${leaf.optionKey}',
                name: leaf.productName,
                unitPrice: leaf.price,
                quantity: leaf.defaultQty,
                canEditQuantity: leaf.dependsOn == null && leaf.minQty != leaf.maxQty,
                minQty: leaf.minQty,
                maxQty: leaf.maxQty,
                isClubbed: true,
                clubbedOptions: clubbedOpts,
                selectedOption: leaf,
                renderType: 'option',
                parentProductKey: mappedProduct.productKey,
                dependsOn: leaf.dependsOn ?? mappedProduct.dependsOn,
              ));
            }
          }
          continue;
        }

        // ── Regular clubbed product (OPTION — drill-down selector) ──
        if (mappedProduct.isClubbed && clubbedOpts.isNotEmpty) {
          final firstLeaf = _findFirstLeaf(clubbedOpts);
          items.add(InvoiceLineItem(
            key: mappedProduct.productKey,
            name: firstLeaf?.productName ?? mappedProduct.product.productName,
            unitPrice: firstLeaf?.price ?? mappedProduct.product.basePrice,
            quantity: firstLeaf?.defaultQty ?? mappedProduct.defaultQty,
            canEditQuantity: mappedProduct.dependsOn == null &&
                (firstLeaf?.minQty ?? mappedProduct.minQty) !=
                    (firstLeaf?.maxQty ?? mappedProduct.maxQty),
            minQty: firstLeaf?.minQty ?? mappedProduct.minQty,
            maxQty: firstLeaf?.maxQty ?? mappedProduct.maxQty,
            isClubbed: true,
            clubbedOptions: clubbedOpts,
            selectedOption: firstLeaf,
            renderType: 'option',
            parentProductKey: mappedProduct.productKey,
            dependsOn: mappedProduct.dependsOn,
          ));
          continue;
        }
      }

      // ── Non-clubbed product ──
      items.add(InvoiceLineItem(
        key: mappedProduct.productId,
        name: mappedProduct.product.productName,
        unitPrice: mappedProduct.product.basePrice,
        quantity: mappedProduct.defaultQty,
        canEditQuantity: mappedProduct.dependsOn == null &&
            mappedProduct.minQty != mappedProduct.maxQty,
        minQty: mappedProduct.minQty,
        maxQty: mappedProduct.maxQty,
        renderType: 'option',
        parentProductKey: mappedProduct.productKey,
        dependsOn: mappedProduct.dependsOn,
      ));
    }

    // Build dependency map from dependsOn fields
    // Also record source productKey for group-level dependency resolution
    _dependencyMap = {};
    _sourceProductKeys = {};
    // Build name→key lookup so dependsOn values like "Camera" resolve to the
    // actual productKey (e.g. "Product_2") used as parentProductKey by source items.
    final nameToKey = <String, String>{};
    for (final mp in group.mappedProducts) {
      nameToKey[mp.productKey] = mp.productKey;
      if (mp.product.productName.isNotEmpty) {
        nameToKey[mp.product.productName] = mp.productKey;
      }
      for (final opt in mp.clubbedOptions) {
        nameToKey[opt.optionKey] = mp.productKey;
        if (opt.productName.isNotEmpty) {
          nameToKey[opt.productName] = mp.productKey;
        }
      }
    }
    for (final item in items) {
      if (item.dependsOn != null) {
        _dependencyMap.putIfAbsent(item.dependsOn!, () => []).add(item.key);
        _sourceProductKeys[item.dependsOn!] =
            nameToKey[item.dependsOn!] ?? item.parentProductKey;
      }
    }

    _applyDependencies(items);
    final updatedMulti = newMultiSelections.isNotEmpty
        ? {...state.selectedMultiOptions, ...newMultiSelections}
        : state.selectedMultiOptions;
    state = state.copyWith(items: items, listGroups: listGroups, selectedMultiOptions: updatedMulti);
  }

  void _applyDependencies([List<InvoiceLineItem>? items]) {
    final target = items ?? state.items;

    // Build parentProductKey -> items map for aggregation
    final parentMap = <String, List<InvoiceLineItem>>{};
    for (final item in target) {
      parentMap.putIfAbsent(item.parentProductKey, () => []).add(item);
    }

    // For each dependency group, sum quantities from ALL source items (same parentProductKey)
    for (final entry in _dependencyMap.entries) {
      final sourceKey = entry.key;
      final depKeys = entry.value;

      // Try direct parentProductKey lookup first
      var sourceItems = parentMap[sourceKey] ?? [];
      var totalQty = sourceItems.fold(0, (sum, i) => sum + i.quantity);

      // If no direct match, check if dependsOn matches a group-level dependency
      if (totalQty == 0 && sourceItems.isEmpty) {
        final sourceProductKey = _sourceProductKeys[sourceKey];
        if (sourceProductKey != null) {
          sourceItems = target.where((i) => i.parentProductKey == sourceProductKey).toList();
          totalQty = sourceItems.fold(0, (sum, i) => sum + i.quantity);
        }
      }

      for (final depKey in depKeys) {
        final idx = target.indexWhere((i) => i.key == depKey);
        if (idx >= 0) {
          final depItem = target[idx];
          // Apply minQty offset: if dependent has negative min, the actual qty is
          // sourceTotal + minOffset. This lets admin set offset (e.g., -2 means
          // cable starts 2 below camera count). Clamp to [0, maxQty].
          final offset = depItem.minQty < 0 ? depItem.minQty : 0;
          final rawQty = totalQty + offset;
          final clampedQty = rawQty.clamp(0, depItem.maxQty);
          target[idx] = depItem.copyWith(quantity: clampedQty, canEditQuantity: false);
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
      if (next < item.minQty) return item;
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
