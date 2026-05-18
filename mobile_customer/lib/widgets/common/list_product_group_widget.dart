import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/features/services/providers/installation_flow_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

/// Phase 1.1 — LIST Render Mode Widget
///
/// Renders a "Camera Selection"-style grouped block where every child product
/// has its own independent [-] qty [+] stepper, and the total is validated
/// collectively against the group's [minQty] / [maxQty].
///
/// Usage:
///   ListProductGroupWidget(group: myGroup)
///
/// The widget reads [installationFlowProvider] for child items and dispatches
/// [incrementListChild] / [decrementListChild] on the notifier.
class ListProductGroupWidget extends ConsumerWidget {
  final InvoiceListGroup group;

  const ListProductGroupWidget({super.key, required this.group});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final flow = ref.watch(installationFlowProvider);
    final notifier = ref.read(installationFlowProvider.notifier);

    final children = flow.items
        .where((i) => i.isListChild && i.listGroupKey == group.key)
        .toList();

    final total = flow.listGroupTotal(group.key);
    final isValid = !group.collectiveValidation ||
        (total >= group.minQty && total <= group.maxQty);
    final isAtMax =
        group.collectiveValidation && total >= group.maxQty;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isAtMax
              ? const Color(0xFF22C55E)
              : (!isValid ? AppColors.error : AppColors.border),
          width: isAtMax || !isValid ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              border: const Border(
                bottom: BorderSide(color: AppColors.border),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        group.label,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                            ),
                      ),
                      if (group.collectiveValidation)
                        Text(
                          'Select ${group.minQty == group.maxQty ? group.maxQty : "${group.minQty}–${group.maxQty}"}',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: AppColors.textSecondary,
                              ),
                        ),
                    ],
                  ),
                ),
                // Total counter pill
                if (group.collectiveValidation)
                  _TotalPill(total: total, max: group.maxQty, isValid: isValid),
              ],
            ),
          ),

          // ── Child rows ──
          ...children.map((item) => _ListChildRow(
                item: item,
                isAtMax: isAtMax,
                onIncrement: () =>
                    notifier.incrementListChild(item.key, group.key),
                onDecrement: () => notifier.decrementListChild(item.key),
              )),

          // ── Validation error ──
          if (!isValid && total > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: Row(
                children: [
                  const Icon(Icons.info_outline,
                      size: 14, color: AppColors.error),
                  const SizedBox(width: 6),
                  Text(
                    total < group.minQty
                        ? 'Minimum ${group.minQty} required (${group.minQty - total} more needed)'
                        : 'Maximum ${group.maxQty} allowed',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.error,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Individual row inside a LIST group — product name + [-] qty [+].
class _ListChildRow extends StatelessWidget {
  final InvoiceLineItem item;
  final bool isAtMax;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const _ListChildRow({
    required this.item,
    required this.isAtMax,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final hasQty = item.quantity > 0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: hasQty ? const Color(0xFFEFF6FF) : Colors.transparent,
        border: const Border(
          bottom: BorderSide(color: AppColors.surfaceVariant),
        ),
      ),
      child: Row(
        children: [
          // Product name
          Expanded(
            child: Text(
              item.name,
              style: TextStyle(
                fontSize: 14,
                fontWeight:
                    hasQty ? FontWeight.w600 : FontWeight.w400,
                color: hasQty
                    ? AppColors.primary
                    : const Color(0xFF475569),
              ),
            ),
          ),

          // Amount label
          if (hasQty)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Text(
                '₹${(item.unitPrice * item.quantity).toStringAsFixed(0)}',
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
            ),

          // Qty stepper
          Row(
            children: [
              _StepButton(
                icon: Icons.remove,
                onTap: item.quantity > 0 ? onDecrement : null,
              ),
              SizedBox(
                width: 32,
                child: Text(
                  '${item.quantity}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: AppColors.primary,
                  ),
                ),
              ),
              _StepButton(
                icon: Icons.add,
                onTap: isAtMax ? null : onIncrement,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Small [-] / [+] tappable button.
class _StepButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;

  const _StepButton({required this.icon, this.onTap});

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          color: enabled ? const Color(0xFFEFF6FF) : AppColors.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: enabled ? const Color(0xFF93C5FD) : AppColors.border,
          ),
        ),
        child: Icon(
          icon,
          size: 16,
          color: enabled ? AppColors.primary : AppColors.border,
        ),
      ),
    );
  }
}

/// Pill showing "8 / 8 ✅" or "3 / 8".
class _TotalPill extends StatelessWidget {
  final int total;
  final int max;
  final bool isValid;

  const _TotalPill({
    required this.total,
    required this.max,
    required this.isValid,
  });

  @override
  Widget build(BuildContext context) {
    final full = total == max;
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: full
            ? const Color(0xFFDCFCE7)
            : (!isValid && total > 0
                ? const Color(0xFFFEE2E2)
                : const Color(0xFFEFF6FF)),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: full
              ? const Color(0xFF22C55E)
              : (!isValid && total > 0
                  ? AppColors.error
                  : const Color(0xFF93C5FD)),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$total / $max',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: full
                  ? AppColors.success
                  : (!isValid && total > 0
                      ? AppColors.error
                      : AppColors.primary),
            ),
          ),
          if (full) ...[
            const SizedBox(width: 4),
            const Icon(Icons.check_circle,
                size: 14, color: AppColors.success),
          ],
        ],
      ),
    );
  }
}
