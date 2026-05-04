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

  const InvoiceLineItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    this.canEditQuantity = true,
    this.minQty = 1,
    this.maxQty = 999,
    this.selectedVariants = const {},
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
    );
  }
}

class InstallationFlowState {
  final bool isLoading;
  final InstallationPricingContract? config;
  final String? selectedCategoryId;
  final String? selectedGroupId;
  final List<InvoiceLineItem> items;

  const InstallationFlowState({
    required this.isLoading,
    this.config,
    this.selectedCategoryId,
    this.selectedGroupId,
    this.items = const [],
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

  InstallationFlowState copyWith({
    bool? isLoading,
    InstallationPricingContract? config,
    String? selectedCategoryId,
    String? selectedGroupId,
    List<InvoiceLineItem>? items,
  }) {
    return InstallationFlowState(
      isLoading: isLoading ?? this.isLoading,
      config: config ?? this.config,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      selectedGroupId: selectedGroupId ?? this.selectedGroupId,
      items: items ?? this.items,
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

    final items = group.mappedProducts.map((mappedProduct) {
      return InvoiceLineItem(
        key: mappedProduct.productId,
        name: mappedProduct.product.productName,
        unitPrice: mappedProduct.product.basePrice,
        quantity: mappedProduct.defaultQty,
        canEditQuantity: mappedProduct.minQty != mappedProduct.maxQty,
        minQty: mappedProduct.minQty,
        maxQty: mappedProduct.maxQty,
      );
    }).toList();

    state = state.copyWith(items: items);
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
