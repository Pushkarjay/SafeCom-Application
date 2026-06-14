import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/services/providers/repair_flow_provider.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class RepairEstimateScreen extends ConsumerWidget {
  const RepairEstimateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(repairFlowProvider);
    final notifier = ref.read(repairFlowProvider.notifier);
    final locationState = ref.watch(locationProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Repair Estimate')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LocationHeader(
                location: locationState.location,
                onChange: () =>
                    ref.read(locationProvider.notifier).requestAndFetchLocation(),
              ),
              const SizedBox(height: 16),
              Text(
                state.selectedIssue.title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 12),
              InvoiceTable(
                rows: state.items
                    .map(
                      (item) => InvoiceTableRowData(
                        product: item.name,
                        unitPrice: item.unitPrice,
                        quantityWidget: QuantityStepper(
                          quantity: item.quantity,
                          onIncrement: item.canEditQuantity && item.quantity < item.maxQty
                              ? () => notifier.incrementQuantity(item.key)
                              : null,
                          onDecrement: item.canEditQuantity && item.quantity > item.minQty
                              ? () => notifier.decrementQuantity(item.key)
                              : null,
                        ),
                        amount: item.amount,
                      ),
                    )
                    .toList(growable: false),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Amount Payable', style: Theme.of(context).textTheme.bodySmall),
                    Text(
                      'Rs ${state.totalAmount.toStringAsFixed(0)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                    ),
                  ],
                ),
              ),
              FilledButton(
                onPressed: () {
                  ref.read(activeOrderProvider.notifier).setSummary(
                        ActiveOrderSummary(
                          serviceName: 'Camera Repair',
                          packageLabel: state.selectedIssue.title,
                          estimatedTotal: state.totalAmount,
                          serviceTypeId: 'repair',
                          items: state.items.map((i) => ActiveOrderLineItem(
                            name: i.name,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                          )).toList(),
                        ),
                      );
                  context.push(AppRoutes.scheduling);
                },
                child: const Text('Proceed'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
