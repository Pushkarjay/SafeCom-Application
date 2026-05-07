import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

/// Holds the selected variant options for a single product.
class ProductSelection {
  final Map<String, String> variantSelections; // variantId -> selected option

  ProductSelection({Map<String, String>? variantSelections})
      : variantSelections = variantSelections ?? {};

  ProductSelection copyWith({Map<String, String>? variantSelections}) {
    return ProductSelection(
      variantSelections: variantSelections ?? this.variantSelections,
    );
  }
}

/// Notifier to manage product selections across the app.
class ProductSelectionNotifier extends StateNotifier<Map<String, ProductSelection>> {
  ProductSelectionNotifier() : super({});

  /// Selects an [option] for a given [productId] and [variantId].
  void selectOption(String productId, String variantId, String option) {
    final current = state[productId]?.variantSelections ?? {};
    final updated = Map<String, String>.from(current);
    updated[variantId] = option;
    state = {
      ...state,
      productId: ProductSelection(variantSelections: updated)
    };
  }

  /// Removes all selections for a specific product.
  void clearProduct(String productId) {
    final newMap = Map<String, ProductSelection>.from(state);
    newMap.remove(productId);
    state = newMap;
  }

  /// Clears all product selections.
  void clearAll() {
    state = {};
  }

  /// Returns the variant selections for a product, or empty map if none.
  Map<String, String> getSelections(String productId) {
    return state[productId]?.variantSelections ?? {};
  }

  /// Checks whether a product is fully selected (all required variants have an option).
  bool isProductComplete(MasterProduct product) {
    final variants = product.variants ?? [];
    if (variants.isEmpty) return true; // no variants means simple product
    final selections = getSelections(product.productId);
    for (final variant in variants) {
      if (variant.required) {
        if (!selections.containsKey(variant.variantId)) return false;
      }
    }
    return true;
  }
}

/// Provider exposing the product selection state.
final productSelectionProvider =
    StateNotifierProvider<ProductSelectionNotifier, Map<String, ProductSelection>>((ref) {
  return ProductSelectionNotifier();
});
