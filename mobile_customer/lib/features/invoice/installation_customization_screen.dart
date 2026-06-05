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
import 'package:mobile_customer/core/theme/app_theme.dart';

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

    final variantSections = <Widget>[];
    for (final mappedProduct in group.mappedProducts) {
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
              runSpacing: 6,
              children: variant.options.map((option) {
                return ChoiceChip(
                  label: Text(option, style: TextStyle(fontSize: 13, color: currentSelection == option || (currentSelection == null && variant.options.first == option) ? AppColors.secondary : AppColors.textPrimary)),
                  selected: currentSelection == option ||
                      (currentSelection == null && variant.options.first == option),
                  onSelected: (selected) {
                    if (selected) {
                      flowNotifier.updateVariant(mappedProduct.productId, variant.variantId, option);
                    }
                  },
                  selectedColor: AppColors.secondary.withOpacity(0.15),
                  backgroundColor: AppColors.surfaceVariant,
                  side: BorderSide(
                    color: currentSelection == option ? AppColors.secondary : AppColors.borderLight,
                    width: currentSelection == option ? 2 : 1,
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                );
              }).toList(),
            ),
          ),
        );
        variantSections.add(const SizedBox(height: 10));
      }
    }

    final listGroupWidgets =
        flow.listGroups.map((lg) => ListProductGroupWidget(group: lg)).toList();

    final optionItems = flow.items.where((i) => !i.isListChild).toList();
    final listItems =
        flow.items.where((i) => i.isListChild && i.quantity > 0).toList();
    final allItems = [...optionItems, ...listItems];

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
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 14),

              ...variantSections,
              ..._buildBranchSelectors(context, ref, group),

              if (listGroupWidgets.isNotEmpty) ...[
                const SizedBox(height: 4),
                ...listGroupWidgets,
                const SizedBox(height: 8),
              ],

              Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.secondaryLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.receipt_long_outlined, color: AppColors.secondary, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Price Breakdown',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              InvoiceTable(
                rows: allItems
                    .map(
                      (item) => InvoiceTableRowData(
                        product: _buildItemWidget(context, ref, item),
                        unitPrice: item.unitPrice,
                        quantityWidget: item.isListChild
                            ? Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.secondaryLight,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${item.quantity}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.secondary,
                                    fontSize: 13,
                                  ),
                                ),
                              )
                            : QuantityStepper(
                                quantity: item.quantity,
                                onIncrement: item.canEditQuantity ? () => flowNotifier.incrementQuantity(item.key) : null,
                                onDecrement: item.canEditQuantity ? () => flowNotifier.decrementQuantity(item.key) : null,
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
            color: AppColors.surface,
            border: Border(top: BorderSide(color: AppColors.borderLight)),
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
                      _currency(flow.totalAmount),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        color: AppColors.secondary,
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
                  backgroundColor: canProceed ? AppColors.primary : AppColors.border,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Proceed', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildItemWidget(BuildContext context, WidgetRef ref, InvoiceLineItem item) {
    if (item.isClubbed) {
      final isMulti = item.clubbedOptions.any((o) => o.selectionType == 'multi');
      return GestureDetector(
        onTap: () async {
          if (isMulti) {
            final selected = await ClubbedProductSelector.showMulti(
              context,
              title: item.key,
              options: item.clubbedOptions,
              preSelectedKeys: ref.read(installationFlowProvider).selectedMultiOptions[item.parentProductKey],
            );
            if (selected != null) {
              final keys = selected.map((l) => l.optionKey).toSet();
              ref.read(installationFlowProvider.notifier).setMultiSelectedOptions(item.parentProductKey, keys);
            }
          } else {
            final selected = await ClubbedProductSelector.show(
              context,
              title: item.key,
              options: item.clubbedOptions,
            );
            if (selected != null) {
              ref.read(installationFlowProvider.notifier).selectClubbedOption(item.key, selected);
            }
          }
        },
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
            ),
            const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.secondaryLight,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.secondary.withOpacity(0.3), width: 0.5),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.swap_horiz, size: 12, color: AppColors.secondary),
                    SizedBox(width: 2),
                    Text('Change', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.secondary)),
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
            runSpacing: 6,
            children: listBranches.map((branch) {
              final isSelected = branch.optionKey == selectedKey;
              return ChoiceChip(
                label: Text(branch.label, style: TextStyle(fontSize: 13, color: isSelected ? AppColors.secondary : AppColors.textPrimary)),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    ref.read(installationFlowProvider.notifier).selectClubbedBranch(
                          mappedProduct.productKey,
                          branch.optionKey,
                        );
                  }
                },
                selectedColor: AppColors.secondary.withOpacity(0.15),
                backgroundColor: AppColors.surfaceVariant,
                side: BorderSide(color: isSelected ? AppColors.secondary : AppColors.borderLight, width: isSelected ? 2 : 1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}
