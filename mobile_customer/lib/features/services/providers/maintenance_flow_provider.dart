import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';

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

  MaintenanceItem copyWith({
    String? name,
    double? unitPrice,
    int? quantity,
    bool? canEditQuantity,
  }) {
    return MaintenanceItem(
      key: key,
      name: name ?? this.name,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      canEditQuantity: canEditQuantity ?? this.canEditQuantity,
    );
  }
}

class MaintenanceFlowState {
  final String selectedType;
  final String selectedPackage;
  final List<MaintenanceItem> items;

  const MaintenanceFlowState({
    required this.selectedType,
    required this.selectedPackage,
    required this.items,
  });

  double get totalAmount => items.fold(0, (sum, item) => sum + item.amount);

  MaintenanceFlowState copyWith({
    String? selectedType,
    String? selectedPackage,
    List<MaintenanceItem>? items,
  }) {
    return MaintenanceFlowState(
      selectedType: selectedType ?? this.selectedType,
      selectedPackage: selectedPackage ?? this.selectedPackage,
      items: items ?? this.items,
    );
  }
}

class MaintenanceFlowNotifier extends StateNotifier<MaintenanceFlowState> {
  final PricingRepository _repository;
  MaintenancePricingContract _contract = _fallbackContract;

  MaintenanceFlowNotifier(this._repository)
      : super(
          MaintenanceFlowState(
            selectedType: 'Preventive Maintenance',
            selectedPackage: 'Standard',
            items: _buildItems(_fallbackContract, 'Standard'),
          ),
        ) {
    _loadContract();
  }

  static const _fallbackContract = MaintenancePricingContract(
    planVisits: {'Basic': 1, 'Standard': 2, 'Comprehensive': 4},
    itemTemplates: [
      MaintenanceContractItem(
        key: 'inspection',
        name: 'System Inspection Visit',
        unitPrice: 799,
        baseQuantity: 1,
        multiplyByVisitCount: true,
        canEditQuantity: false,
      ),
      MaintenanceContractItem(
        key: 'cleaning',
        name: 'Camera Cleaning & Refocus',
        unitPrice: 199,
        baseQuantity: 8,
        multiplyByVisitCount: false,
        canEditQuantity: true,
      ),
      MaintenanceContractItem(
        key: 'healthcheck',
        name: 'NVR/DVR Health Check',
        unitPrice: 349,
        baseQuantity: 1,
        multiplyByVisitCount: false,
        canEditQuantity: true,
      ),
      MaintenanceContractItem(
        key: 'rewiring',
        name: 'Minor Rewiring Support',
        unitPrice: 120,
        baseQuantity: 10,
        multiplyByVisitCount: false,
        canEditQuantity: true,
      ),
      MaintenanceContractItem(
        key: 'labour',
        name: 'Service Labor Charges',
        unitPrice: 299,
        baseQuantity: 1,
        multiplyByVisitCount: true,
        canEditQuantity: false,
      ),
    ],
  );

  Future<void> _loadContract() async {
    final contract = await _repository.getMaintenancePricing();
    _contract = contract;
    state = state.copyWith(
      items: _buildItems(_contract, state.selectedPackage),
    );
  }

  static List<MaintenanceItem> _buildItems(
      MaintenancePricingContract contract, String selectedPackage) {
    final visitCount = contract.planVisits[selectedPackage] ?? 1;

    return contract.itemTemplates
        .map(
          (template) => MaintenanceItem(
            key: template.key,
            name: template.name,
            unitPrice: template.unitPrice,
            quantity: template.multiplyByVisitCount
                ? template.baseQuantity * visitCount
                : template.baseQuantity,
            canEditQuantity: template.canEditQuantity,
          ),
        )
        .toList(growable: false);
  }

  void selectType(String value) {
    state = state.copyWith(selectedType: value);
  }

  void selectPackage(String value) {
    state =
        state.copyWith(selectedPackage: value, items: _buildItems(_contract, value));
  }

  void incrementQuantity(String key) {
    _updateQuantity(key, isIncrement: true);
  }

  void decrementQuantity(String key) {
    _updateQuantity(key, isIncrement: false);
  }

  void _updateQuantity(String key, {required bool isIncrement}) {
    final updated = state.items.map((item) {
      if (item.key != key || !item.canEditQuantity) {
        return item;
      }
      final next = isIncrement ? item.quantity + 1 : item.quantity - 1;
      return item.copyWith(quantity: next < 1 ? 1 : next);
    }).toList();

    state = state.copyWith(items: updated);
  }
}

final maintenanceFlowProvider =
    StateNotifierProvider<MaintenanceFlowNotifier, MaintenanceFlowState>(
  (ref) => MaintenanceFlowNotifier(ref.watch(pricingRepositoryProvider)),
);
