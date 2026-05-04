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

  const ActiveOrderSummary({
    required this.serviceName,
    required this.packageLabel,
    required this.estimatedTotal,
    this.items = const [],
  });
}

class ActiveOrderNotifier extends StateNotifier<ActiveOrderSummary?> {
  ActiveOrderNotifier() : super(null);

  void setSummary(ActiveOrderSummary summary) {
    state = summary;
  }

  void clear() {
    state = null;
  }
}

final activeOrderProvider =
    StateNotifierProvider<ActiveOrderNotifier, ActiveOrderSummary?>(
  (ref) => ActiveOrderNotifier(),
);
