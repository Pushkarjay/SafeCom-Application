import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/invoice/widgets/invoice_table.dart';
import 'package:mobile_customer/features/services/providers/repair_flow_provider.dart';
import 'package:mobile_customer/widgets/common/quantity_stepper.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class RepairEstimateScreen extends ConsumerWidget {
  const RepairEstimateScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(repairFlowProvider);
    final notifier = ref.read(repairFlowProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Repair Estimate')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 110),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              Text(
                state.selectedIssue.title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 12),
              _CustomTextBoxField(),
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
          Text(
            'Special Instructions (Optional)',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _controller,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'e.g., Camera near the main gate is not working',
              hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: AppColors.secondary, width: 1.5),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              filled: true,
              fillColor: AppColors.surfaceVariant,
            ),
            onChanged: (value) => notifier.setCustomTextBoxValue(value.trim().isEmpty ? null : value),
          ),
        ],
      ),
    );
  }
}
