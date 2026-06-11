import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';

class RepairInvoiceItem {
  final String key;
  final String name;
  final double unitPrice;
  final int quantity;
  final int minQty;
  final int maxQty;
  final bool canEditQuantity;

  const RepairInvoiceItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    this.minQty = 1,
    this.maxQty = 999,
    required this.canEditQuantity,
  });

  double get amount => unitPrice * quantity;

  RepairInvoiceItem copyWith({
    int? quantity,
  }) {
    return RepairInvoiceItem(
      key: key,
      name: name,
      unitPrice: unitPrice,
      quantity: quantity ?? this.quantity,
      minQty: minQty,
      maxQty: maxQty,
      canEditQuantity: canEditQuantity,
    );
  }
}

class RepairFlowState {
  final bool isLoading;
  final List<RepairIssueType> issues;
  final RepairIssueType selectedIssue;
  final List<RepairInvoiceItem> items;

  const RepairFlowState({
    required this.isLoading,
    required this.issues,
    required this.selectedIssue,
    required this.items,
  });

  double get totalAmount => items.fold(0, (sum, item) => sum + item.amount);

  RepairFlowState copyWith({
    bool? isLoading,
    List<RepairIssueType>? issues,
    RepairIssueType? selectedIssue,
    List<RepairInvoiceItem>? items,
  }) {
    return RepairFlowState(
      isLoading: isLoading ?? this.isLoading,
      issues: issues ?? this.issues,
      selectedIssue: selectedIssue ?? this.selectedIssue,
      items: items ?? this.items,
    );
  }
}

class RepairFlowNotifier extends StateNotifier<RepairFlowState> {
  final PricingRepository _repository;
  RepairPricingContract _contract = _fallbackContract;

  RepairFlowNotifier(this._repository)
      : super(
          RepairFlowState(
            isLoading: true,
            issues: _fallbackContract.issues,
            selectedIssue: _fallbackContract.issues.first,
            items: _buildItems(
              _fallbackContract.issues.first,
              _fallbackContract.itemTemplates,
            ),
          ),
        ) {
    _loadContract();
  }

  static const _fallbackContract = RepairPricingContract(
    issues: [
      RepairIssueType(
        id: 'no_video',
        title: 'No Video Output',
        visitFee: 299,
        diagnosticFee: 399,
      ),
      RepairIssueType(
        id: 'night_vision',
        title: 'Night Vision Not Working',
        visitFee: 299,
        diagnosticFee: 349,
      ),
      RepairIssueType(
        id: 'blurry_image',
        title: 'Blurry / Distorted Image',
        visitFee: 299,
        diagnosticFee: 349,
      ),
      RepairIssueType(
        id: 'other',
        title: 'Other Issue',
        visitFee: 349,
        diagnosticFee: 499,
      ),
    ],
    itemTemplates: [
      RepairContractItem(
        key: 'camera_fix',
        name: 'Camera Repair Unit',
        unitPrice: 899,
        quantity: 1,
        canEditQuantity: true,
      ),
      RepairContractItem(
        key: 'connector_replacement',
        name: 'Connector Replacement',
        unitPrice: 80,
        quantity: 4,
        canEditQuantity: true,
      ),
    ],
  );

  static List<RepairInvoiceItem> _buildItems(
    RepairIssueType issue,
    List<RepairContractItem> templates,
  ) {
    final items = <RepairInvoiceItem>[
      RepairInvoiceItem(
        key: 'visit_fee',
        name: 'Service Visit Fee',
        unitPrice: issue.visitFee,
        quantity: 1,
        canEditQuantity: false,
      ),
      RepairInvoiceItem(
        key: 'diagnostic_fee',
        name: 'Diagnostic Charges',
        unitPrice: issue.diagnosticFee,
        quantity: 1,
        canEditQuantity: false,
      ),
    ];

    items.addAll(
      templates.map(
        (template) => RepairInvoiceItem(
          key: template.key,
          name: template.name,
          unitPrice: template.unitPrice,
          quantity: template.quantity,
          minQty: template.minQty,
          maxQty: template.maxQty,
          canEditQuantity: template.canEditQuantity,
        ),
      ),
    );

    return items;
  }

  Future<void> _loadContract() async {
    try {
      final contract = await _repository.getRepairPricing();
      _contract = contract;
      if (contract.issues.isEmpty) {
        state = state.copyWith(isLoading: false);
        return;
      }

      final issue = contract.issues.first;
      state = state.copyWith(
        isLoading: false,
        issues: contract.issues,
        selectedIssue: issue,
        items: _buildItems(issue, contract.itemTemplates),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  void selectIssue(RepairIssueType issue) {
    state = state.copyWith(
      selectedIssue: issue,
      items: _buildItems(issue, _contract.itemTemplates),
    );
  }

  void incrementQuantity(String key) => _updateQuantity(key, true);

  void decrementQuantity(String key) => _updateQuantity(key, false);

  void _updateQuantity(String key, bool increment) {
    final items = state.items.map((item) {
      if (item.key != key || !item.canEditQuantity) {
        return item;
      }
      final next = increment ? item.quantity + 1 : item.quantity - 1;
      final safeQty = next.clamp(item.minQty, item.maxQty);
      return item.copyWith(quantity: safeQty);
    }).toList(growable: false);

    state = state.copyWith(items: items);
  }
}

final repairFlowProvider =
    StateNotifierProvider<RepairFlowNotifier, RepairFlowState>(
  (ref) => RepairFlowNotifier(ref.watch(pricingRepositoryProvider)),
);
