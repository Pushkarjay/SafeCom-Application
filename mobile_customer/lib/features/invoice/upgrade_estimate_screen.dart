import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';

class UpgradeEstimateScreen extends ConsumerStatefulWidget {
  final UpgradeBundle bundle;

  const UpgradeEstimateScreen({
    super.key,
    required this.bundle,
  });

  @override
  ConsumerState<UpgradeEstimateScreen> createState() => _UpgradeEstimateScreenState();
}

class _UpgradeEstimateScreenState extends ConsumerState<UpgradeEstimateScreen> {
  int installationQty = 1;
  int migrationQty = 1;

  @override
  Widget build(BuildContext context) {
    final baseAmount = widget.bundle.price;
    final installationAmount = 499.0 * installationQty;
    final migrationAmount = 349.0 * migrationQty;
    final total = baseAmount + installationAmount + migrationAmount;

    return Scaffold(
      appBar: AppBar(title: const Text('Upgrade Estimate')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.bundle.name,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 6),
              Text(widget.bundle.description),
              const SizedBox(height: 14),
              InvoiceTable(
                rows: [
                  InvoiceTableRowData(
                    product: 'Upgrade Bundle',
                    unitPrice: baseAmount,
                    quantityWidget: const Text('1'),
                    amount: baseAmount,
                  ),
                  InvoiceTableRowData(
                    product: 'Installation Support',
                    unitPrice: 499,
                    quantityWidget: QuantityStepper(
                      quantity: installationQty,
                      onIncrement: () => setState(() {
                        installationQty += 1;
                      }),
                      onDecrement: installationQty > 0
                          ? () => setState(() {
                                installationQty -= 1;
                              })
                          : null,
                    ),
                    amount: installationAmount,
                  ),
                  InvoiceTableRowData(
                    product: 'Data Migration',
                    unitPrice: 349,
                    quantityWidget: QuantityStepper(
                      quantity: migrationQty,
                      onIncrement: () => setState(() {
                        migrationQty += 1;
                      }),
                      onDecrement: migrationQty > 0
                          ? () => setState(() {
                                migrationQty -= 1;
                              })
                          : null,
                    ),
                    amount: migrationAmount,
                  ),
                ],
              ),
            ],
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
              onPressed: () {
                ref.read(activeOrderProvider.notifier).setSummary(
                      ActiveOrderSummary(
                        serviceName: 'System Upgrade',
                        packageLabel: widget.bundle.name,
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
}
