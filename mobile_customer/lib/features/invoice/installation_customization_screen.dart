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
    final category = flow.selectedCategory;
    final group = flow.selectedGroup;

    if (category == null || group == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Customize Invoice')),
        body: const Center(child: Text('Invalid Category or Package Selected.')),
      );
    }

    // Build variant option sections based on mapped products
    final variantSections = <Widget>[];
    for (final mappedProduct in group.mappedProducts) {
      final product = mappedProduct.product;
      for (final variant in product.variants) {
        final currentSelection = flow.items
            .firstWhere((item) => item.key == mappedProduct.productId,
                orElse: () => flow.items.first)
            .selectedVariants[variant.variantId];

        variantSections.add(
          _OptionSection(
            title: '${product.productName} - ${variant.name}',
            child: Wrap(
              spacing: 8,
              children: variant.options.map((option) {
                return ChoiceChip(
                  label: Text(option),
                  selected: currentSelection == option || (currentSelection == null && variant.options.first == option),
                  onSelected: (selected) {
                    if (selected) {
                      flowNotifier.updateVariant(mappedProduct.productId, variant.variantId, option);
                    }
                  },
                );
              }).toList(),
            ),
          ),
        );
        variantSections.add(const SizedBox(height: 10));
      }
    }

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
                '${category.name} - ${group.name}',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 14),
              ...variantSections,
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
                        product: _buildItemName(item),
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
                        serviceName: category.name,
                        packageLabel: group.name,
                        estimatedTotal: flow.totalAmount,
                        items: flow.items.map((i) => ActiveOrderLineItem(
                          name: _buildItemName(i),
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
    );
  }

  String _buildItemName(InvoiceLineItem item) {
    if (item.selectedVariants.isEmpty) return item.name;
    final variantStr = item.selectedVariants.values.join(', ');
    return '${item.name} ($variantStr)';
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
