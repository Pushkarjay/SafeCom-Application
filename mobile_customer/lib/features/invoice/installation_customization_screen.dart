import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';

class InstallationCustomizationScreen extends ConsumerWidget {
  const InstallationCustomizationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flow = ref.watch(installationFlowProvider);
    final flowNotifier = ref.read(installationFlowProvider.notifier);
    final locationState = ref.watch(locationProvider);
    const packageOptions = [4, 8, 16, 32];

    return Scaffold(
      appBar: AppBar(title: const Text('Customize Invoice')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              LocationHeader(
                location: locationState.location,
                onChange: () {
                  ref.read(locationProvider.notifier).requestAndFetchLocation();
                },
              ),
              const SizedBox(height: 16),
              Text(
                '${flow.selectedServiceType} Setup',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                children: [
                  for (final package in packageOptions)
                    ChoiceChip(
                      label: Text('$package Cameras'),
                      selected: flow.selectedPackage == package,
                      onSelected: (_) => flowNotifier.selectPackage(package),
                    ),
                ],
              ),
              const SizedBox(height: 14),
              _OptionSection(
                title: 'Camera Resolution',
                child: Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('2MP'),
                      selected: flow.selectedCameraMp == CameraMp.twoMp,
                      onSelected: (_) => flowNotifier.selectCameraMp(CameraMp.twoMp),
                    ),
                    ChoiceChip(
                      label: const Text('5MP'),
                      selected: flow.selectedCameraMp == CameraMp.fiveMp,
                      onSelected: (_) => flowNotifier.selectCameraMp(CameraMp.fiveMp),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              _OptionSection(
                title: 'Hard Disk Size',
                child: Wrap(
                  spacing: 8,
                  children: [
                    ChoiceChip(
                      label: const Text('1TB'),
                      selected: flow.selectedHardDiskSize == HardDiskSize.oneTb,
                      onSelected: (_) =>
                          flowNotifier.selectHardDiskSize(HardDiskSize.oneTb),
                    ),
                    ChoiceChip(
                      label: const Text('2TB'),
                      selected: flow.selectedHardDiskSize == HardDiskSize.twoTb,
                      onSelected: (_) =>
                          flowNotifier.selectHardDiskSize(HardDiskSize.twoTb),
                    ),
                    ChoiceChip(
                      label: const Text('3TB'),
                      selected: flow.selectedHardDiskSize == HardDiskSize.threeTb,
                      onSelected: (_) =>
                          flowNotifier.selectHardDiskSize(HardDiskSize.threeTb),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Price Breakdown',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              InvoiceTable(
                rows: flow.items
                    .map(
                      (item) => InvoiceTableRowData(
                        product: item.name,
                        unitPrice: item.unitPrice,
                        quantityWidget: QuantityStepper(
                          quantity: item.quantity,
                          onIncrement: item.canEditQuantity
                              ? () => flowNotifier.incrementQuantity(item.key)
                              : null,
                          onDecrement: item.canEditQuantity
                              ? () => flowNotifier.decrementQuantity(item.key)
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
                  Text(
                    'Amount Payable',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  Text(
                    _currency(flow.totalAmount),
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
                        serviceName: flow.selectedServiceType,
                        packageLabel: '${flow.selectedPackage} Cameras',
                        estimatedTotal: flow.totalAmount,
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

  String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';
}

class _OptionSection extends StatelessWidget {
  final String title;
  final Widget child;

  const _OptionSection({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          child,
        ],
      ),
    );
  }
}
