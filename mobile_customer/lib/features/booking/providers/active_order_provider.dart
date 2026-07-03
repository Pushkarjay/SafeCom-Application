import 'package:flutter_riverpod/flutter_riverpod.dart';

class ActiveOrderLineItem {
  final String name;
  final int quantity;
  final double unitPrice;

  const ActiveOrderLineItem({
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  double get amount => quantity * unitPrice;
}

class ActiveOrderSummary {
  final String serviceName;
  final String packageLabel;
  final double estimatedTotal;
  final List<ActiveOrderLineItem> items;
  final String? serviceTypeId;

  const ActiveOrderSummary({
    required this.serviceName,
    required this.packageLabel,
    required this.estimatedTotal,
    this.items = const [],
    this.serviceTypeId,
  });
}

class ActiveOrderNotifier extends StateNotifier<ActiveOrderSummary?> {
  ActiveOrderNotifier() : super(null);

  void setSummary(ActiveOrderSummary summary) {
    state = summary;
  }

  void addItems(List<ActiveOrderLineItem> additionalItems) {
    if (state == null) return;
    final currentItems = List<ActiveOrderLineItem>.from(state!.items);
    currentItems.addAll(additionalItems);
    final additionalTotal = additionalItems.fold<double>(0, (sum, item) => sum + item.amount);
    state = ActiveOrderSummary(
      serviceName: state!.serviceName,
      packageLabel: state!.packageLabel,
      estimatedTotal: state!.estimatedTotal + additionalTotal,
      items: currentItems,
      serviceTypeId: state!.serviceTypeId,
    );
  }

  void clear() {
    state = null;
  }
}

final activeOrderProvider =
    StateNotifierProvider<ActiveOrderNotifier, ActiveOrderSummary?>(
  (ref) => ActiveOrderNotifier(),
);
