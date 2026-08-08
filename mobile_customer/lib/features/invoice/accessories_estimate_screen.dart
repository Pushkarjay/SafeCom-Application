import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

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
          child: Column(
            children: [
              InvoiceTable(
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
              const SizedBox(height: 16),
              _CustomTextBoxField(),
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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('Amount Payable', style: Theme.of(context).textTheme.bodySmall),
                    Text(
                      'Rs ${total.toStringAsFixed(0)}',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
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
                                serviceTypeId: 'accessories',
                                items: rows.where((r) => r.quantity > 0).map((r) => ActiveOrderLineItem(
                                  name: r.name,
                                  quantity: r.quantity,
                                  unitPrice: r.price,
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

  void _updateQty(String id, int next) {
    setState(() {
      rows = rows
          .map((item) => item.id == id ? item.copyWith(quantity: next) : item)
          .toList(growable: false);
    });
  }
}

class _CustomTextBoxField extends ConsumerStatefulWidget {
  const _CustomTextBoxField();

  @override
  ConsumerState<_CustomTextBoxField> createState() => _CustomTextBoxFieldState();
}

class _CustomTextBoxFieldState extends ConsumerState<_CustomTextBoxField> {
  // Created ONCE, never inside build(): a fresh controller on every rebuild
  // was resetting the cursor/IME on each keystroke (characters appeared in
  // reverse, backspace and mid-text editing broke).
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: ref.read(bookingFlowProvider).customTextBoxValue ?? '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final customTextBoxValue = ref.watch(bookingFlowProvider).customTextBoxValue;
    final notifier = ref.read(bookingFlowProvider.notifier);

    // Sync only when the value changed from outside (e.g. flow reset). While
    // typing, onChanged keeps provider == controller text, so this never
    // interferes with the cursor position or IME composition.
    if (customTextBoxValue != _controller.text) {
      _controller.text = customTextBoxValue ?? '';
    }

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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.secondaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.notes_outlined, color: AppColors.secondary, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                'Custom Message for Technician',
                style: Theme
                    .of(context)
                    .textTheme
                    .titleSmall
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Add any special instructions or details for the technician (e.g., "Camera near main gate not working")',
            style: Theme.of(context)
                .textTheme
                .bodySmall
                ?.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            maxLines: 3,
            maxLength: 500,
            decoration: InputDecoration(
              hintText: 'Enter custom message...',
              hintStyle: const TextStyle(color: AppColors.textMuted),
              filled: true,
              fillColor: AppColors.surfaceVariant,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.borderLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.borderLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.secondary, width: 1.5),
              ),
              counterText: '',
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
            onChanged: (value) {
              notifier.setCustomTextBoxValue(value);
            },
          ),
        ],
      ),
    );
  }
}
