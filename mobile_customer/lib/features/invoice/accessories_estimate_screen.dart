import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';

class AccessoryEstimateEntry {
  final String id;
  final String name;
  final double price;
  final int quantity;

  const AccessoryEstimateEntry({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
  });

  AccessoryEstimateEntry copyWith({int? quantity}) {
    return AccessoryEstimateEntry(
      id: id,
      name: name,
      price: price,
      quantity: quantity ?? this.quantity,
    );
  }
}

class AccessoriesEstimateScreen extends ConsumerStatefulWidget {
  final List<AccessoryEstimateEntry> entries;

  const AccessoriesEstimateScreen({
    super.key,
    required this.entries,
  });

  @override
  ConsumerState<AccessoriesEstimateScreen> createState() => _AccessoriesEstimateScreenState();
}

class _AccessoriesEstimateScreenState extends ConsumerState<AccessoriesEstimateScreen> {
  late List<AccessoryEstimateEntry> rows;

  @override
  void initState() {
    super.initState();
    rows = List<AccessoryEstimateEntry>.from(widget.entries);
  }

  @override
  Widget build(BuildContext context) {
    final total = rows.fold<double>(0, (sum, item) => sum + (item.price * item.quantity));

    return Scaffold(
      appBar: AppBar(title: const Text('Accessories Estimate')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 110),
          child: InvoiceTable(
            rows: rows
                .map(
                  (item) => InvoiceTableRowData(
                    product: item.name,
                    unitPrice: item.price,
                    quantityWidget: QuantityStepper(
                      quantity: item.quantity,
                      onIncrement: () => _updateQty(item.id, item.quantity + 1),
                      onDecrement: item.quantity > 0
                          ? () => _updateQty(item.id, item.quantity - 1)
                          : null,
                    ),
                    amount: item.price * item.quantity,
                  ),
                )
                .toList(growable: false),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Amount Payable', style: Theme.of(context).textTheme.bodySmall),
                  Text(
                    'Rs ${total.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF0A84FF),
                        ),
                  ),
                ],
              ),
            ),
            FilledButton(
              onPressed: total <= 0
                  ? null
                  : () {
                      ref.read(activeOrderProvider.notifier).setSummary(
                            ActiveOrderSummary(
                              serviceName: 'Accessories',
                              packageLabel: 'Selected items',
                              estimatedTotal: total,
                            ),
                          );
                      context.push(AppRoutes.scheduling);
                    },
              child: const Text('Proceed'),
            ),
          ],
        ),
      ),
    );
  }

  void _updateQty(String id, int next) {
    setState(() {
      rows = rows
          .map((item) => item.id == id ? item.copyWith(quantity: next) : item)
          .toList(growable: false);
    });
  }
}
