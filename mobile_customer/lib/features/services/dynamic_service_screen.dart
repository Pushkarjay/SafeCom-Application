import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';

import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/services/providers/dynamic_service_provider.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';
import 'package:mobile_customer/widgets/common/clubbed_product_selector.dart';
import 'package:mobile_customer/widgets/common/list_product_group_widget.dart';

class DynamicServiceScreen extends ConsumerWidget {
  final String serviceId;
  final String serviceTitle;
  final String serviceIcon;

  const DynamicServiceScreen({
    super.key,
    required this.serviceId,
    this.serviceTitle = '',
    this.serviceIcon = '🔧',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flow = ref.watch(dynamicServiceProvider(serviceId));
    final flowNotifier = ref.read(dynamicServiceProvider(serviceId).notifier);
    final locationState = ref.watch(locationProvider);

    // Determine display title from service meta or fallback
    final title = flow.serviceName.isNotEmpty
        ? flow.serviceName
        : (serviceTitle.isNotEmpty ? serviceTitle : _formatId(serviceId));

    // Show loading state
    if (flow.isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: const Center(
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      );
    }

    // Show error state
    if (flow.error != null) {
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                const SizedBox(height: 16),
                Text(
                  'Failed to load service',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  flow.error!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () => context.pop(),
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Go Back'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final config = flow.config;
    if (config == null || config.categories.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(title)),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              'This service has no products configured yet.',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    // If there's only one category, auto-select it
    if (config.categories.length == 1 && flow.selectedCategoryId == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        flowNotifier.selectCategory(config.categories.first.id);
      });
    }

    // If only one category with one group, auto-select group too
    final category = flow.selectedCategory;
    if (category != null && category.groups.length == 1 && flow.selectedGroupId == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        flowNotifier.selectGroup(category.groups.first.id);
      });
    }

    // Category selection view (when no category selected)
    if (flow.selectedCategoryId == null) {
      return _buildCategorySelection(context, ref, title, config);
    }

    // Group selection view (when category selected but no group selected)
    if (flow.selectedGroupId == null) {
      return _buildGroupSelection(context, ref, title, category!);
    }

    // Product customization view (when both category and group selected)
    return _buildProductCustomization(context, ref, title, flow, flowNotifier, locationState);
  }

  Scaffold _buildCategorySelection(BuildContext context, WidgetRef ref, String title, InstallationPricingContract config) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Select Category',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 16),
              ...config.categories.map((category) => _CategoryCard(
                name: category.name,
                onTap: () {
                  ref.read(dynamicServiceProvider(serviceId).notifier)
                      .selectCategory(category.id);
                },
              )),
            ],
          ),
        ),
      ),
    );
  }

  Scaffold _buildGroupSelection(BuildContext context, WidgetRef ref, String title, InstallationCategory category) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                category.name,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              if (category.description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  category.description,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Text(
                'Select Package',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              ...category.groups.map((group) => _GroupCard(
                name: group.name,
                productCount: group.mappedProducts.length,
                onTap: () {
                  ref.read(dynamicServiceProvider(serviceId).notifier)
                      .selectGroup(group.id);
                },
              )),
            ],
          ),
        ),
      ),
    );
  }

  Scaffold _buildProductCustomization(
    BuildContext context,
    WidgetRef ref,
    String title,
    DynamicServiceState flow,
    DynamicServiceFlowNotifier flowNotifier,
    dynamic locationState,
  ) {
    final category = flow.selectedCategory!;
    final group = flow.selectedGroup!;

    // Variant sections
    final variantSections = <Widget>[];
    for (final mappedProduct in group.mappedProducts) {
      if (mappedProduct.renderType == 'list') continue;
      final product = mappedProduct.product;
      for (final variant in product.variants) {
        final currentSelection = flow.items
            .firstWhere(
                (item) => item.key == mappedProduct.productId,
                orElse: () => flow.items.isNotEmpty ? flow.items.first : InvoiceLineItem(
                  key: '',
                  name: '',
                  unitPrice: 0,
                  quantity: 0,
                  parentProductKey: '',
                ))
            .selectedVariants[variant.variantId];
        variantSections.add(
          _OptionSection(
            title: '${product.productName} - ${variant.name}',
            child: Wrap(
              spacing: 8,
              runSpacing: 6,
              children: variant.options.map((option) {
                return ChoiceChip(
                  label: Text(option, style: TextStyle(
                    fontSize: 13,
                    color: currentSelection == option || (currentSelection == null && variant.options.first == option)
                        ? AppColors.secondary : AppColors.textPrimary,
                  )),
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

    // Branch selectors
    final branchSelectors = _buildBranchSelectors(context, ref, group);

    // List group widgets
    final listGroupWidgets = flow.listGroups.map((lg) => ListProductGroupWidget(group: lg)).toList();

    // Items
    final optionItems = flow.items.where((i) => !i.isListChild).toList();
    final listItems = flow.items.where((i) => i.isListChild && i.quantity > 0).toList();
    final allItems = [...optionItems, ...listItems];
    final canProceed = flow.allListGroupsValid;

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Back to category/group selection
              Row(
                children: [
                  TextButton.icon(
                    onPressed: () => flowNotifier.selectGroup(group.id),
                    icon: const Icon(Icons.arrow_back, size: 16),
                    label: Text(
                      '${category.name} / ${group.name}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
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
              if (group.description.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  group.description,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 14),

              ...variantSections,
              ...branchSelectors,

              if (listGroupWidgets.isNotEmpty) ...[
                const SizedBox(height: 4),
                ...listGroupWidgets,
                const SizedBox(height: 8),
              ],

              // Price breakdown header
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
                        product: _buildItemWidget(context, ref, item, serviceId),
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
                                onIncrement: item.canEditQuantity && item.quantity < item.maxQty
                                    ? () => flowNotifier.incrementQuantity(item.key)
                                    : null,
                                onDecrement: item.canEditQuantity && item.quantity > item.minQty
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
                                serviceName: title,
                                packageLabel: group.name,
                                estimatedTotal: flow.totalAmount,
                                serviceTypeId: widget.serviceId,
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

  Widget _buildItemWidget(BuildContext context, WidgetRef ref, InvoiceLineItem item, String svcId) {
    if (item.isClubbed) {
      final isMulti = item.clubbedOptions.any((o) => o.selectionType == 'multi');
      return GestureDetector(
        onTap: () async {
          if (isMulti) {
            final selected = await ClubbedProductSelector.showMulti(
              context,
              title: item.key,
              options: item.clubbedOptions,
              preSelectedKeys: ref.read(dynamicServiceProvider(svcId)).selectedMultiOptions[item.parentProductKey],
            );
            if (selected != null) {
              final keys = selected.map((l) => l.optionKey).toSet();
              ref.read(dynamicServiceProvider(svcId).notifier).setMultiSelectedOptions(item.parentProductKey, keys);
            }
          } else {
            final selected = await ClubbedProductSelector.show(
              context,
              title: item.key,
              options: item.clubbedOptions,
            );
            if (selected != null) {
              ref.read(dynamicServiceProvider(svcId).notifier).selectClubbedOption(item.key, selected);
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

  String _formatId(String id) {
    return id.replaceAll('_', ' ').replaceAll('-', ' ').split(' ').map((w) {
      if (w.isEmpty) return w;
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');
  }

  List<Widget> _buildBranchSelectors(BuildContext context, WidgetRef ref, InstallationGroup group) {
    final List<Widget> selectors = [];

    for (final mappedProduct in group.mappedProducts) {
      if (!mappedProduct.isClubbed || mappedProduct.clubbedOptions.isEmpty) continue;

      final listBranches = mappedProduct.clubbedOptions
          .where((opt) => !opt.isLeaf && opt.renderType == 'list')
          .toList();
      if (listBranches.isEmpty) continue;

      final flow = ref.read(dynamicServiceProvider(serviceId));
      final selectedKey = flow.selectedBranch[mappedProduct.productKey] ?? listBranches.first.optionKey;

      selectors.add(
        _OptionSection(
          title: mappedProduct.productKey,
          child: Wrap(
            spacing: 8,
            runSpacing: 6,
            children: listBranches.map((branch) {
              final isSelected = branch.optionKey == selectedKey;
              return ChoiceChip(
                label: Text(branch.label, style: TextStyle(
                  fontSize: 13,
                  color: isSelected ? AppColors.secondary : AppColors.textPrimary,
                )),
                selected: isSelected,
                onSelected: (selected) {
                  if (selected) {
                    ref.read(dynamicServiceProvider(serviceId).notifier).selectClubbedBranch(
                      mappedProduct.productKey,
                      branch.optionKey,
                    );
                  }
                },
                selectedColor: AppColors.secondary.withOpacity(0.15),
                backgroundColor: AppColors.surfaceVariant,
                side: BorderSide(
                  color: isSelected ? AppColors.secondary : AppColors.borderLight,
                  width: isSelected ? 2 : 1,
                ),
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

// ─── Reusable Widgets ──────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final String name;
  final VoidCallback onTap;

  const _CategoryCard({required this.name, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadowLight,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.secondaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.category_outlined, color: AppColors.secondary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  name,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
  }
}

class _GroupCard extends StatelessWidget {
  final String name;
  final int productCount;
  final VoidCallback onTap;

  const _GroupCard({
    required this.name,
    required this.productCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderLight),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadowLight,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.inventory_2_outlined, color: AppColors.primary),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$productCount product${productCount == 1 ? '' : 's'}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textSecondary),
            ],
          ),
        ),
      ),
    );
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
