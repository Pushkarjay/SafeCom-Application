import 'package:flutter/material.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class QuantityStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback? onIncrement;
  final VoidCallback? onDecrement;

  const QuantityStepper({
    super.key,
    required this.quantity,
    this.onIncrement,
    this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final disabled = onIncrement == null || onDecrement == null;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: disabled ? AppColors.surfaceVariant : const Color(0xFFEFF6FF),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove,
            onTap: onDecrement,
            disabled: disabled,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              '$quantity',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          _StepButton(
            icon: Icons.add,
            onTap: onIncrement,
            disabled: disabled,
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  final bool disabled;

  const _StepButton({
    required this.icon,
    this.onTap,
    required this.disabled,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        height: 22,
        width: 22,
        decoration: BoxDecoration(
          color: disabled ? AppColors.border : Colors.white,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 14,
          color: disabled ? AppColors.textMuted : AppColors.primary,
        ),
      ),
    );
  }
}
