import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';
import 'package:mobile_customer/widgets/common/clubbed_product_selector.dart';
import 'package:mobile_customer/widgets/common/list_product_group_widget.dart';

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

    // ── Build variant option sections (OPTION render mode only) ──
    final variantSections = <Widget>[];
    for (final mappedProduct in group.mappedProducts) {
      // Skip LIST render mode products — they're rendered as ListProductGroupWidget below
      if (mappedProduct.renderType == 'list') continue;

      final product = mappedProduct.product;
      for (final variant in product.variants) {
        final currentSelection = flow.items
            .firstWhere(
                (item) => item.key == mappedProduct.productId,
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
                  selected: currentSelection == option ||
                      (currentSelection == null &&
                          variant.options.first == option),
                  onSelected: (selected) {
                    if (selected) {
                      flowNotifier.updateVariant(
                          mappedProduct.productId, variant.variantId, option);
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

    // ── LIST groups (Phase 1.1) ──
    final listGroupWidgets =
        flow.listGroups.map((lg) => ListProductGroupWidget(group: lg)).toList();

    // ── Separate OPTION and LIST items for the price breakdown table ──
    final optionItems = flow.items.where((i) => !i.isListChild).toList();
    final listItems =
        flow.items.where((i) => i.isListChild && i.quantity > 0).toList();
    final allItems = [...optionItems, ...listItems];

    // Proceed is gated on all LIST groups passing collective validation
    final canProceed = flow.allListGroupsValid;

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

               // ── OPTION variant selectors ──
               ...variantSections,

               // ── Branch selector for clubbed products with LIST branches ──
               ..._buildBranchSelectors(context, ref, group),

               // ── LIST group blocks ──
              if (listGroupWidgets.isNotEmpty) ...[
                const SizedBox(height: 4),
                ...listGroupWidgets,
                const SizedBox(height: 8),
              ],

              // ── Price Breakdown ──
              Text(
                'Price Breakdown',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 8),
              InvoiceTable(
                rows: allItems
                    .map(
                      (item) => InvoiceTableRowData(
                        product: _buildItemWidget(context, ref, item),
                        unitPrice: item.unitPrice,
                        quantityWidget: item.isListChild
                            // LIST children show a static qty badge (stepper is in the group block above)
                            ? Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEFF6FF),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  '${item.quantity}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF0A84FF),
                                  ),
                                ),
                              )
                            : QuantityStepper(
                                quantity: item.quantity,
                                onIncrement: item.canEditQuantity
                                    ? () =>
                                        flowNotifier.incrementQuantity(item.key)
                                    : null,
                                onDecrement: item.canEditQuantity
                                    ? () =>
                                        flowNotifier.decrementQuantity(item.key)
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
              onPressed: canProceed
                  ? () {
                      ref.read(activeOrderProvider.notifier).setSummary(
                            ActiveOrderSummary(
                              serviceName: category.name,
                              packageLabel: group.name,
                              estimatedTotal: flow.totalAmount,
                              items: allItems
                                  .map((i) => ActiveOrderLineItem(
                                        name: _buildItemName(i),
                                        quantity: i.quantity,
                                        unitPrice: i.unitPrice,
                                      ))
                                  .toList(),
                            ),
                          );
                      context.push(AppRoutes.scheduling);
                    }
                  : null,
              style: FilledButton.styleFrom(
                backgroundColor: canProceed
                    ? const Color(0xFF0A84FF)
                    : const Color(0xFFCBD5E1),
              ),
              child: const Text('Proceed'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItemWidget(
      BuildContext context, WidgetRef ref, InvoiceLineItem item) {
    if (item.isClubbed) {
      return GestureDetector(
        onTap: () async {
          final selected = await ClubbedProductSelector.show(
            context,
            title: item.key,
            options: item.clubbedOptions,
          );
          if (selected != null) {
            ref
                .read(installationFlowProvider.notifier)
                .selectClubbedOption(item.key, selected);
          }
        },
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                item.name,
                style: const TextStyle(fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(6),
                border:
                    Border.all(color: const Color(0xFF93C5FD), width: 0.5),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.swap_horiz, size: 12, color: Color(0xFF0A84FF)),
                  SizedBox(width: 2),
                  Text(
                    'Change',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0A84FF),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }
    return Text(_buildItemName(item));
  }

  String _buildItemName(InvoiceLineItem item) {
    if (item.selectedVariants.isEmpty) return item.name;
    final variantStr = item.selectedVariants.values.join(', ');
    return '${item.name} ($variantStr)';
  }

   String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';

  List<Widget> _buildBranchSelectors(BuildContext context, WidgetRef ref, InstallationGroup group) {
    final List<Widget> selectors = [];

    for (final mappedProduct in group.mappedProducts) {
      if (!mappedProduct.isClubbed || mappedProduct.clubbedOptions.isEmpty) continue;

      final listBranches = mappedProduct.clubbedOptions
          .where((opt) => !opt.isLeaf && opt.renderType == 'list')
          .toList();
      if (listBranches.isEmpty) continue;

      final flow = ref.read(installationFlowProvider);
      final selectedKey = flow.selectedBranch[mappedProduct.productKey] ?? listBranches.first.optionKey;

      selectors.add(
        _OptionSection(
          title: mappedProduct.product.productName,
          child: Wrap(
            spacing: 8,
            children: listBranches.map((branch) {
              final isSelected = branch.optionKey == selectedKey;
              return ChoiceChip(
                label: Text(branch.label),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    ref.read(installationFlowProvider.notifier).selectClubbedBranch(
                          mappedProduct.productKey,
                          branch.optionKey,
                        );
                  }
                },
              );
            }).toList(),
          ),
        ),
      );
      selectors.add(const SizedBox(height: 10));
    }

    return selectors;
  }
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
