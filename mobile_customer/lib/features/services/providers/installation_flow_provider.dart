import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';

enum CameraMp { twoMp, fiveMp }

enum HardDiskSize { oneTb, twoTb, threeTb }

class InvoiceLineItem {
  final String key;
  final String name;
  final double unitPrice;
  final int quantity;
  final bool canEditQuantity;

  const InvoiceLineItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    this.canEditQuantity = true,
  });

  double get amount => unitPrice * quantity;

  InvoiceLineItem copyWith({
    String? key,
    String? name,
    double? unitPrice,
    int? quantity,
    bool? canEditQuantity,
  }) {
    return InvoiceLineItem(
      key: key ?? this.key,
      name: name ?? this.name,
      unitPrice: unitPrice ?? this.unitPrice,
      quantity: quantity ?? this.quantity,
      canEditQuantity: canEditQuantity ?? this.canEditQuantity,
    );
  }
}

class InstallationFlowState {
  final String selectedServiceType;
  final int selectedPackage;
  final CameraMp selectedCameraMp;
  final HardDiskSize selectedHardDiskSize;
  final List<InvoiceLineItem> items;

  const InstallationFlowState({
    required this.selectedServiceType,
    required this.selectedPackage,
    required this.selectedCameraMp,
    required this.selectedHardDiskSize,
    required this.items,
  });

  double get totalAmount => items.fold(0, (sum, item) => sum + item.amount);

  InstallationFlowState copyWith({
    String? selectedServiceType,
    int? selectedPackage,
    CameraMp? selectedCameraMp,
    HardDiskSize? selectedHardDiskSize,
    List<InvoiceLineItem>? items,
  }) {
    return InstallationFlowState(
      selectedServiceType: selectedServiceType ?? this.selectedServiceType,
      selectedPackage: selectedPackage ?? this.selectedPackage,
      selectedCameraMp: selectedCameraMp ?? this.selectedCameraMp,
      selectedHardDiskSize: selectedHardDiskSize ?? this.selectedHardDiskSize,
      items: items ?? this.items,
    );
  }
}

class InstallationFlowNotifier extends StateNotifier<InstallationFlowState> {
  final PricingRepository _repository;
  InstallationPricingContract _contract = _fallbackContract;

  InstallationFlowNotifier(this._repository)
      : super(
          InstallationFlowState(
            selectedServiceType: 'IP Camera',
            selectedPackage: 8,
            selectedCameraMp: CameraMp.twoMp,
            selectedHardDiskSize: HardDiskSize.oneTb,
            items: _buildDefaultItems(
              contract: _fallbackContract,
              packageSize: 8,
              cameraMp: CameraMp.twoMp,
              hardDiskSize: HardDiskSize.oneTb,
            ),
          ),
        ) {
    _loadContract();
  }

  static const _fallbackContract = InstallationPricingContract(
    nvrByPackage: {4: 4000, 8: 6400, 16: 9800, 32: 14800},
    cameraByMp: {'2MP': 1800, '5MP': 2600},
    hddBySize: {'1TB': 3500, '2TB': 5200, '3TB': 6900},
    cableKitPrice: 950,
    connectorPrice: 60,
    wiringPrice: 35,
    installationChargePrice: 250,
  );

  Future<void> _loadContract() async {
    final contract = await _repository.getInstallationPricing();
    _contract = contract;
    state = state.copyWith(
      items: _buildDefaultItems(
        contract: _contract,
        packageSize: state.selectedPackage,
        cameraMp: state.selectedCameraMp,
        hardDiskSize: state.selectedHardDiskSize,
      ),
    );
  }

  static List<InvoiceLineItem> _buildDefaultItems({
    required InstallationPricingContract contract,
    required int packageSize,
    required CameraMp cameraMp,
    required HardDiskSize hardDiskSize,
  }) {
    return [
      InvoiceLineItem(
        key: 'nvr',
        name: 'NVR Setup Box ($packageSize Channel)',
        unitPrice: _nvrPrice(contract, packageSize),
        quantity: 1,
        canEditQuantity: true,
      ),
      InvoiceLineItem(
        key: 'camera',
        name: 'IP Camera (${cameraMp == CameraMp.twoMp ? '2MP' : '5MP'})',
        unitPrice: _cameraPrice(contract, cameraMp),
        quantity: packageSize,
      ),
      InvoiceLineItem(
        key: 'cable',
        name: 'IP Cable Kit',
        unitPrice: contract.cableKitPrice,
        quantity: 1,
      ),
      InvoiceLineItem(
        key: 'hdd',
        name: 'Hard Disk (${_hardDiskLabel(hardDiskSize)})',
        unitPrice: _hardDiskPrice(contract, hardDiskSize),
        quantity: 1,
      ),
      InvoiceLineItem(
        key: 'connector',
        name: 'Connectors',
        unitPrice: contract.connectorPrice,
        quantity: packageSize * 2,
      ),
      InvoiceLineItem(
        key: 'wiring',
        name: 'Wiring',
        unitPrice: contract.wiringPrice,
        quantity: packageSize * 10,
      ),
      InvoiceLineItem(
        key: 'installation',
        name: 'Installation Charges',
        unitPrice: contract.installationChargePrice,
        quantity: packageSize,
        canEditQuantity: false,
      ),
    ];
  }

  static double _cameraPrice(InstallationPricingContract contract, CameraMp mp) {
    final key = mp == CameraMp.twoMp ? '2MP' : '5MP';
    return contract.cameraByMp[key] ?? 0;
  }

  static double _hardDiskPrice(
      InstallationPricingContract contract, HardDiskSize size) {
    final key = _hardDiskLabel(size);
    return contract.hddBySize[key] ?? 0;
  }

  static String _hardDiskLabel(HardDiskSize size) {
    switch (size) {
      case HardDiskSize.oneTb:
        return '1TB';
      case HardDiskSize.twoTb:
        return '2TB';
      case HardDiskSize.threeTb:
        return '3TB';
    }
  }

  static double _nvrPrice(InstallationPricingContract contract, int packageSize) {
    final direct = contract.nvrByPackage[packageSize];
    if (direct != null) {
      return direct;
    }
    final keys = contract.nvrByPackage.keys.toList()..sort();
    for (final key in keys) {
      if (packageSize <= key) {
        return contract.nvrByPackage[key] ?? 0;
      }
    }
    return keys.isEmpty ? 0 : (contract.nvrByPackage[keys.last] ?? 0);
  }

  void selectServiceType(String serviceType) {
    state = state.copyWith(selectedServiceType: serviceType);
  }

  void selectPackage(int packageSize) {
    state = state.copyWith(
      selectedPackage: packageSize,
      items: _buildDefaultItems(
        contract: _contract,
        packageSize: packageSize,
        cameraMp: state.selectedCameraMp,
        hardDiskSize: state.selectedHardDiskSize,
      ),
    );
  }

  void selectCameraMp(CameraMp mp) {
    final updatedItems = state.items.map((item) {
      if (item.key == 'camera') {
        return item.copyWith(
          name: 'IP Camera (${mp == CameraMp.twoMp ? '2MP' : '5MP'})',
          unitPrice: _cameraPrice(_contract, mp),
        );
      }
      return item;
    }).toList();

    state = state.copyWith(selectedCameraMp: mp, items: updatedItems);
  }

  void selectHardDiskSize(HardDiskSize size) {
    final updatedItems = state.items.map((item) {
      if (item.key == 'hdd') {
        return item.copyWith(
          name: 'Hard Disk (${_hardDiskLabel(size)})',
          unitPrice: _hardDiskPrice(_contract, size),
        );
      }
      return item;
    }).toList();

    state = state.copyWith(selectedHardDiskSize: size, items: updatedItems);
  }

  void incrementQuantity(String itemKey) {
    _updateQuantity(itemKey, isIncrement: true);
  }

  void decrementQuantity(String itemKey) {
    _updateQuantity(itemKey, isIncrement: false);
  }

  void _updateQuantity(String itemKey, {required bool isIncrement}) {
    var cameraQty = state.items
        .firstWhere((item) => item.key == 'camera')
        .quantity;

    final updatedItems = state.items.map((item) {
      if (item.key != itemKey || !item.canEditQuantity) {
        return item;
      }

      final nextQty = isIncrement ? item.quantity + 1 : item.quantity - 1;
      final safeQty = nextQty < 1 ? 1 : nextQty;

      if (item.key == 'camera') {
        cameraQty = safeQty;
      }
      return item.copyWith(quantity: safeQty);
    }).toList();

    final normalizedItems = updatedItems.map((item) {
      if (item.key == 'installation') {
        return item.copyWith(quantity: cameraQty);
      }
      return item;
    }).toList();

    state = state.copyWith(items: normalizedItems);
  }
}

final installationFlowProvider =
    StateNotifierProvider<InstallationFlowNotifier, InstallationFlowState>(
  (ref) => InstallationFlowNotifier(ref.watch(pricingRepositoryProvider)),
);
