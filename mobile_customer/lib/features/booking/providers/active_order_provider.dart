import 'package:flutter_riverpod/flutter_riverpod.dart';

class ActiveOrderSummary {
  final String serviceName;
  final String packageLabel;
  final double estimatedTotal;

  const ActiveOrderSummary({
    required this.serviceName,
    required this.packageLabel,
    required this.estimatedTotal,
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
