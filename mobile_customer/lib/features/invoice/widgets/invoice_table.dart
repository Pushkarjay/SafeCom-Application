import 'package:flutter/material.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class InvoiceTableRowData {
  final dynamic product;
  final double unitPrice;
  final Widget quantityWidget;
  final double amount;

  const InvoiceTableRowData({
    required this.product,
    required this.unitPrice,
    required this.quantityWidget,
    required this.amount,
  });
}

class InvoiceTable extends StatelessWidget {
  final List<InvoiceTableRowData> rows;

  const InvoiceTable({
    super.key,
    required this.rows,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
              border: const Border(bottom: BorderSide(color: AppColors.borderLight)),
            ),
            child: Row(
              children: [
                Expanded(flex: 4, child: Text('Product', style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted))),
                Expanded(flex: 2, child: Text('Price', textAlign: TextAlign.right, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted))),
                const SizedBox(width: 8),
                Expanded(flex: 3, child: Text('Quantity', textAlign: TextAlign.center, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted))),
                Expanded(flex: 2, child: Text('Amount', textAlign: TextAlign.right, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted))),
              ],
            ),
          ),
          for (final row in rows)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: AppColors.surfaceVariant)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 4,
                    child: row.product is Widget
                        ? row.product as Widget
                        : Text(row.product.toString(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(_currency(row.unitPrice), textAlign: TextAlign.right, style: Theme.of(context).textTheme.bodySmall),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    flex: 3,
                    child: Align(alignment: Alignment.center, child: row.quantityWidget),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(_currency(row.amount), textAlign: TextAlign.right, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';
}
