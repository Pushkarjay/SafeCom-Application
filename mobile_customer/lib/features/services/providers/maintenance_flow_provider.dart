import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';

class MaintenanceFlowState {
  final MaintenancePricingContract? contract;
  final String? selectedType;
  final String? selectedPackage;
  final List<MaintenanceItem> items;
  final double totalAmount;
  final bool isLoading;
  final String? error;

  MaintenanceFlowState({
    this.contract,
    this.selectedType,
    this.selectedPackage,
    this.items = const [],
    this.totalAmount = 0,
    this.isLoading = false,
    this.error,
  });

  List<MaintenanceTypeEntry> get maintenanceTypes => contract?.maintenanceTypes ?? [];
  Map<String, int> get planVisits => contract?.planVisits ?? {};
  List<MaintenanceContractItem> get itemTemplatesRaw => contract?.itemTemplates ?? [];

  MaintenanceFlowState copyWith({
    MaintenancePricingContract? contract,
    String? selectedType,
    String? selectedPackage,
    List<MaintenanceItem>? items,
    double? totalAmount,
    bool? isLoading,
    String? error,
  }) {
    return MaintenanceFlowState(
      contract: contract ?? this.contract,
      selectedType: selectedType ?? this.selectedType,
      selectedPackage: selectedPackage ?? this.selectedPackage,
      items: items ?? this.items,
      totalAmount: totalAmount ?? this.totalAmount,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  List<String> get availablePackages => contract?.planVisits.keys.toList() ?? [];
}

class MaintenanceItem {
  final String key;
  final String name;
  final double unitPrice;
  final int quantity;
  final bool canEditQuantity;

  const MaintenanceItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    this.canEditQuantity = true,
  });

  double get amount => unitPrice * quantity;

  MaintenanceItem copyWith({int? quantity}) {
    return MaintenanceItem(
      key: key,
      name: name,
      unitPrice: unitPrice,
      quantity: quantity ?? this.quantity,
      canEditQuantity: canEditQuantity,
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
      final contract = await _repo.getMaintenancePricing();
      state = state.copyWith(contract: contract, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void selectType(String type) {
    state = state.copyWith(selectedType: type, selectedPackage: null, items: []);
  }

  void selectPackage(String package) {
    final visits = state.contract?.planVisits[package] ?? 1;
    final items = (state.contract?.itemTemplates ?? []).map((t) => MaintenanceItem(
      key: t.key,
      name: t.name,
      unitPrice: t.unitPrice,
      quantity: t.multiplyByVisitCount ? t.baseQuantity * visits : t.baseQuantity,
      canEditQuantity: t.canEditQuantity,
    )).toList();
    state = state.copyWith(selectedPackage: package, items: items, totalAmount: items.fold<double>(0.0, (s, i) => s + i.amount));
  }

  void incrementQuantity(String key) {
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.key == key && i.canEditQuantity) {
          return i.copyWith(quantity: i.quantity + 1);
        }
        return i;
      }).toList(),
      totalAmount: state.items.fold<double>(0.0, (s, i) => s + i.amount),
    );
  }

  void decrementQuantity(String key) {
    state = state.copyWith(
      items: state.items.map((i) {
        if (i.key == key && i.quantity > 1 && i.canEditQuantity) {
          return i.copyWith(quantity: i.quantity - 1);
        }
        return i;
      }).toList(),
      totalAmount: state.items.fold<double>(0.0, (s, i) => s + i.amount),
    );
  }
}

final maintenanceFlowProvider =
    StateNotifierProvider<MaintenanceFlowNotifier, MaintenanceFlowState>((ref) {
  final repo = ref.watch(pricingRepositoryProvider);
  return MaintenanceFlowNotifier(repo);
});