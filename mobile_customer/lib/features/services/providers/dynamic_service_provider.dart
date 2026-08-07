import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/service_catalog_repository.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';

/// State for the dynamic service flow.
/// Mirrors InstallationFlowState but fetched per serviceId.
class DynamicServiceState {
  final bool isLoading;
  final String? error;
  final InstallationPricingContract? config;
  final String? selectedCategoryId;
  final String? selectedGroupId;
  final List<InvoiceLineItem> items;
  final List<InvoiceListGroup> listGroups;
  final Map<String, String> selectedBranch;
  final Map<String, Set<String>> selectedMultiOptions;

  const DynamicServiceState({
    this.isLoading = true,
    this.error,
    this.config,
    this.selectedCategoryId,
    this.selectedGroupId,
    this.items = const [],
    this.listGroups = const [],
    this.selectedBranch = const {},
    this.selectedMultiOptions = const {},
  });

  double get totalAmount => items.fold(0.0, (sum, item) => sum + item.amount);

  String get serviceName => config?.name ?? '';

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

  DynamicServiceState copyWith({
    bool? isLoading,
    String? error,
    bool clearError = false,
    InstallationPricingContract? config,
    String? selectedCategoryId,
    String? selectedGroupId,
    List<InvoiceLineItem>? items,
    List<InvoiceListGroup>? listGroups,
    Map<String, String>? selectedBranch,
    Map<String, Set<String>>? selectedMultiOptions,
  }) {
    return DynamicServiceState(
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
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

/// Notifier that manages the state of a dynamic service flow.
/// Works for any service by fetching its config via the generic pricing endpoint.
class DynamicServiceFlowNotifier extends StateNotifier<DynamicServiceState> {
  final ServiceCatalogRepository _repository;
  final String _serviceId;
  Map<String, List<String>> _dependencyMap = {};
  Map<String, String> _sourceProductKeys = {};

  DynamicServiceFlowNotifier(this._repository, this._serviceId)
      : super(DynamicServiceState(isLoading: true)) {
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    try {
      final config = await _repository.getDynamicServicePricing(_serviceId);
      state = DynamicServiceState(
        isLoading: false,
        config: config,
      );
    } catch (e, st) {
      debugPrint('*** DYNAMIC SERVICE ERROR *** _loadConfig error: $e');
      debugPrint('*** DYNAMIC SERVICE ERROR *** StackTrace: $st');
      state = DynamicServiceState(
        isLoading: false,
        error: 'Failed to load service configuration: $e',
      );
    }
  }

  void selectCategory(String categoryId) {
    state = state.copyWith(
      selectedCategoryId: categoryId,
      selectedGroupId: null,
      items: [],
      listGroups: [],
      selectedMultiOptions: {},
    );
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
        // ── Clubbed product with LIST branches ──
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

            final selBranch =
                listBranches.firstWhere((b) => b.optionKey == selectedBranchKey);
            final groupKey = '${mappedProduct.productKey}__${selBranch.optionKey}';

            final selLeaves = _collectLeaves([selBranch]);
            final groupMaxQty = selLeaves.isEmpty
                ? mappedProduct.maxQty
                : selLeaves.map((l) => l.maxQty).reduce((a, b) => a > b ? a : b);

            listGroups.add(InvoiceListGroup(
              key: groupKey,
              label: mappedProduct.productKey,
              minQty: selBranch.minQty,
              maxQty: groupMaxQty,
              collectiveValidation: selBranch.collectiveValidation,
            ));

            for (final leaf in selLeaves) {
              final leafKey = '${groupKey}__${leaf.optionKey}';
              final initialQty = leaf.defaultQty < leaf.minQty ? leaf.minQty : leaf.defaultQty;
              items.add(InvoiceLineItem(
                key: leafKey,
                name: leaf.label,
                unitPrice: leaf.price,
                quantity: initialQty,
                canEditQuantity: leaf.dependsOn == null && leaf.minQty != leaf.maxQty,
                minQty: leaf.minQty,
                maxQty: leaf.maxQty,
                renderType: 'list',
                isListChild: true,
                listGroupKey: groupKey,
                listGroupLabel: mappedProduct.productKey,
                parentProductKey: mappedProduct.productKey,
                dependsOn: leaf.dependsOn,
              ));
            }

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
              final initialQty = leaf.defaultQty < leaf.minQty ? leaf.minQty : leaf.defaultQty;
              items.add(InvoiceLineItem(
                key: '${mappedProduct.productKey}__${leaf.optionKey}',
                name: leaf.label,
                unitPrice: leaf.price,
                quantity: initialQty,
                canEditQuantity: leaf.dependsOn == null && leaf.minQty != leaf.maxQty,
                minQty: leaf.minQty,
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
            final initialQty = leaf.defaultQty < leaf.minQty ? leaf.minQty : leaf.defaultQty;
            items.add(InvoiceLineItem(
              key: leafKey,
              name: leaf.label,
              unitPrice: leaf.price,
              quantity: initialQty,
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

        // ── Multi-select clubbed product ──
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
              final initialQty = leaf.defaultQty < leaf.minQty ? leaf.minQty : leaf.defaultQty;
              items.add(InvoiceLineItem(
                key: '${mappedProduct.productKey}__${leaf.optionKey}',
                name: leaf.productName,
                unitPrice: leaf.price,
                quantity: initialQty,
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
          final leafMin = firstLeaf?.minQty ?? mappedProduct.minQty;
          final leafMax = firstLeaf?.maxQty ?? mappedProduct.maxQty;
          final leafDefault = firstLeaf?.defaultQty ?? mappedProduct.defaultQty;
          final initialQty = leafDefault < leafMin ? leafMin : leafDefault;
          items.add(InvoiceLineItem(
            key: mappedProduct.productKey,
            name: firstLeaf?.productName ?? mappedProduct.product.productName,
            unitPrice: firstLeaf?.price ?? mappedProduct.product.basePrice,
            quantity: initialQty,
            canEditQuantity: mappedProduct.dependsOn == null && leafMin != leafMax,
            minQty: leafMin,
            maxQty: leafMax,
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
      final nonClubbedMin = mappedProduct.minQty;
      final nonClubbedDefault = mappedProduct.defaultQty;
      final nonClubbedInitial = nonClubbedDefault < nonClubbedMin ? nonClubbedMin : nonClubbedDefault;
      items.add(InvoiceLineItem(
        key: mappedProduct.productId,
        name: mappedProduct.product.productName,
        unitPrice: mappedProduct.product.basePrice,
        quantity: nonClubbedInitial,
        canEditQuantity: mappedProduct.dependsOn == null &&
            mappedProduct.minQty != mappedProduct.maxQty,
        minQty: mappedProduct.minQty,
        maxQty: mappedProduct.maxQty,
        renderType: 'option',
        parentProductKey: mappedProduct.productKey,
        dependsOn: mappedProduct.dependsOn,
      ));
    }

    // Build dependency map
    _dependencyMap = {};
    _sourceProductKeys = {};
    String norm(String s) => s.replaceAll(',', '.').replaceAll(RegExp(r'\s+'), ' ').trim().toLowerCase();
    final nameToKey = <String, String>{};
    final normNameToKey = <String, String>{};
    nameToKey[group.name] = group.mappedProducts.isNotEmpty
        ? group.mappedProducts.first.productKey
        : '';
    normNameToKey[norm(group.name)] = group.mappedProducts.isNotEmpty
        ? group.mappedProducts.first.productKey
        : '';
    for (final mp in group.mappedProducts) {
      nameToKey[mp.productKey] = mp.productKey;
      normNameToKey[norm(mp.productKey)] = mp.productKey;
      if (mp.product.productName.isNotEmpty) {
        nameToKey[mp.product.productName] = mp.productKey;
        normNameToKey[norm(mp.product.productName)] = mp.productKey;
      }
      for (final opt in mp.clubbedOptions) {
        nameToKey[opt.optionKey] = mp.productKey;
        normNameToKey[norm(opt.optionKey)] = mp.productKey;
        if (opt.productName.isNotEmpty) {
          nameToKey[opt.productName] = mp.productKey;
          normNameToKey[norm(opt.productName)] = mp.productKey;
        }
      }
    }
    for (final item in items) {
      if (item.dependsOn != null) {
        _dependencyMap.putIfAbsent(item.dependsOn!, () => []).add(item.key);
        final resolved = nameToKey[item.dependsOn!] ?? normNameToKey[norm(item.dependsOn!)] ?? '';
        _sourceProductKeys[item.dependsOn!] = resolved;
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
    final parentMap = <String, List<InvoiceLineItem>>{};
    for (final item in target) {
      parentMap.putIfAbsent(item.parentProductKey, () => []).add(item);
    }
    for (final entry in _dependencyMap.entries) {
      final sourceKey = entry.key;
      final depKeys = entry.value;
      var sourceItems = parentMap[sourceKey] ?? [];
      var totalQty = sourceItems.fold(0, (sum, i) => sum + i.quantity);
      if (totalQty == 0 && sourceItems.isEmpty) {
        final sourceProductKey = _sourceProductKeys[sourceKey];
        if (sourceProductKey != null && sourceProductKey.isNotEmpty) {
          sourceItems = target.where((i) => i.parentProductKey == sourceProductKey).toList();
          totalQty = sourceItems.fold(0, (sum, i) => sum + i.quantity);
        }
      }
      if (sourceItems.length > 1) {
        final specificItems = sourceItems.where((i) =>
            i.key.endsWith('__$sourceKey') || i.name == sourceKey).toList();
        if (specificItems.isNotEmpty) {
          sourceItems = specificItems;
          totalQty = sourceItems.fold(0, (sum, i) => sum + i.quantity);
        }
      }
      for (final depKey in depKeys) {
        final idx = target.indexWhere((i) => i.key == depKey);
        if (idx >= 0) {
          final depItem = target[idx];
          final offset = depItem.minQty < 0 ? depItem.minQty : 0;
          final rawQty = totalQty + offset;
          final clampedQty = rawQty.clamp(depItem.minQty < 0 ? 0 : depItem.minQty, depItem.maxQty);
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

/// Provider that creates a DynamicServiceFlowNotifier for a given serviceId.
final dynamicServiceProvider = StateNotifierProvider.family<DynamicServiceFlowNotifier, DynamicServiceState, String>(
  (ref, serviceId) => DynamicServiceFlowNotifier(
    ref.watch(serviceCatalogRepositoryProvider),
    serviceId,
  ),
);
