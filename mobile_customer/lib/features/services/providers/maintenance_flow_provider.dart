import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';

class MaintenanceFlowState {
  final InstallationPricingContract? contract;
  final InstallationCategory? selectedCategory;
  final InstallationGroup? selectedGroup;
  final List<InvoiceLineItem> items;
  final List<InvoiceListGroup> listGroups;
  final double totalAmount;
  final bool allListGroupsValid;
  final bool isLoading;
  final String? error;

  MaintenanceFlowState({
    this.contract,
    this.selectedCategory,
    this.selectedGroup,
    this.items = const [],
    this.listGroups = const [],
    this.totalAmount = 0,
    this.allListGroupsValid = true,
    this.isLoading = false,
    this.error,
  });

  MaintenanceFlowState copyWith({
    InstallationPricingContract? contract,
    InstallationCategory? selectedCategory,
    InstallationGroup? selectedGroup,
    List<InvoiceLineItem>? items,
    List<InvoiceListGroup>? listGroups,
    double? totalAmount,
    bool? allListGroupsValid,
    bool? isLoading,
    String? error,
  }) {
    return MaintenanceFlowState(
      contract: contract ?? this.contract,
      selectedCategory: selectedCategory ?? this.selectedCategory,
      selectedGroup: selectedGroup ?? this.selectedGroup,
      items: items ?? this.items,
      listGroups: listGroups ?? this.listGroups,
      totalAmount: totalAmount ?? this.totalAmount,
      allListGroupsValid: allListGroupsValid ?? this.allListGroupsValid,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class MaintenanceFlowNotifier extends StateNotifier<MaintenanceFlowState> {
  final PricingRepository _repo;

  MaintenanceFlowNotifier(this._repo) : super(MaintenanceFlowState()) {
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final contract = await _repo.getMaintenanceTreePricing();
      state = state.copyWith(contract: contract, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectCategory(InstallationCategory category) {
    state = state.copyWith(
      selectedCategory: category,
      selectedGroup: null,
      items: [],
      listGroups: [],
    );
  }

  void selectGroup(InstallationGroup group) {
    state = state.copyWith(selectedGroup: group);
    _buildItemsFromGroup(group);
  }

  void _buildItemsFromGroup(InstallationGroup group) {
    final items = <InvoiceLineItem>[];
    final listGroups = <InvoiceListGroup>[];

    for (final mp in group.mappedProducts) {
      if (mp.isClubbed) {
        _expandClubbed(mp, items);
      } else if (mp.renderType == 'list') {
        _expandListProduct(mp, items, listGroups);
      } else {
        items.add(InvoiceLineItem(
          key: mp.productKey,
          name: mp.product.productName,
          unitPrice: mp.product.basePrice,
          quantity: mp.defaultQty,
          canEditQuantity: true,
          minQty: mp.minQty,
          maxQty: mp.maxQty,
          renderType: mp.renderType,
        ));
      }
    }

    state = state.copyWith(
      items: items,
      listGroups: listGroups,
      totalAmount: items.fold<double>(0.0, (s, i) => s + i.amount),
    );
  }

  void _expandClubbed(MappedProduct mp, List<InvoiceLineItem> items) {
    for (final opt in mp.clubbedOptions) {
      if (opt.isLeaf) {
        items.add(InvoiceLineItem(
          key: opt.optionKey,
          name: opt.productName,
          unitPrice: opt.price,
          quantity: opt.defaultQty,
          canEditQuantity: !opt.rigid,
          minQty: opt.minQty,
          maxQty: opt.maxQty,
          renderType: opt.renderType,
        ));
      }
    }
  }

  void _expandListProduct(
      MappedProduct mp, List<InvoiceLineItem> items, List<InvoiceListGroup> listGroups) {
    for (final opt in mp.clubbedOptions) {
      if (opt.isLeaf && !opt.rigid) {
        items.add(InvoiceLineItem(
          key: opt.optionKey,
          name: opt.productName,
          unitPrice: opt.price,
          quantity: opt.defaultQty,
          canEditQuantity: true,
          minQty: opt.minQty,
          maxQty: opt.maxQty,
          renderType: 'list',
          isListChild: true,
        ));
      }
    }
  }

  void incrementQuantity(String key) {
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.key == key && i.quantity < i.maxQty) {
          return i.copyWith(quantity: i.quantity + 1);
        }
        return i;
      }).toList(),
      totalAmount: state.items.fold<double>(0.0, (prev, item) => prev + item.amount),
    );
  }

  void decrementQuantity(String key) {
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.key == key && i.quantity > i.minQty) {
          return i.copyWith(quantity: i.quantity - 1);
        }
        return i;
      }).toList(),
      totalAmount: state.items.fold<double>(0.0, (prev, item) => prev + item.amount),
    );
  }
}

final maintenanceFlowProvider =
    StateNotifierProvider<MaintenanceFlowNotifier, MaintenanceFlowState>((ref) {
  final repo = ref.watch(pricingRepositoryProvider);
  return MaintenanceFlowNotifier(repo);
});