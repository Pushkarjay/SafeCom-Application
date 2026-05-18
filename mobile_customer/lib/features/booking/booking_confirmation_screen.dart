import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/config/api_config.dart' show ApiConfig;
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class BookingConfirmationScreen extends ConsumerStatefulWidget {
  const BookingConfirmationScreen({super.key});

  @override
  ConsumerState<BookingConfirmationScreen> createState() =>
      _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState
    extends ConsumerState<BookingConfirmationScreen> {
  String _selectedPaymentOption = 'full';

  @override
  Widget build(BuildContext context) {
    final booking = ref.watch(bookingFlowProvider);
    final activeOrder = ref.watch(activeOrderProvider);

    const double minimumPaymentAmount = ApiConfig.minimumPaymentAmount;
    final double remainingAmount =
        (activeOrder?.estimatedTotal ?? 0) - minimumPaymentAmount;

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go(AppRoutes.home),
        ),
        title: const Text('Booking Confirmed'),
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 20),
              Container(
                height: 88,
                width: 88,
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.success.withOpacity(0.2), width: 3),
                ),
                child: const Icon(Icons.check_rounded, size: 44, color: AppColors.success),
              ),
              const SizedBox(height: 20),
              Text(
                'Booking Confirmed!',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your service has been scheduled successfully.',
                style: Theme.of(context).textTheme.bodyMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(color: AppColors.shadowLight, blurRadius: 10, offset: const Offset(0, 4)),
                  ],
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
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.calendar_today_outlined, color: AppColors.secondary, size: 18),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            activeOrder == null ? 'Service details unavailable' : '${activeOrder.serviceName} (${activeOrder.packageLabel})',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _infoRow(Icons.calendar_month_outlined, 'Date: ${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year}'),
                    const SizedBox(height: 6),
                    _infoRow(Icons.access_time_rounded, 'Time: ${booking.selectedTimeSlot}'),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.accentLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Booking Amount Paid: Rs ${minimumPaymentAmount.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.warningLight,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.warning.withOpacity(0.2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Important Information',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: AppColors.warning,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Technician will start the work after accessories payment has been done. The service charge will be applicable and payable after work completion.',
                      style: TextStyle(color: AppColors.warning.withOpacity(0.8), fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              Text(
                'Payment Options',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),

              _PaymentOptionCard(
                selected: _selectedPaymentOption == 'full',
                title: 'Pay Full Amount Now',
                description: 'Complete full payment at service time.',
                amount: 'Rs ${(activeOrder?.estimatedTotal ?? 0).toStringAsFixed(0)}',
                onTap: () => setState(() => _selectedPaymentOption = 'full'),
              ),
              const SizedBox(height: 12),

              _PaymentOptionCard(
                selected: _selectedPaymentOption == 'partial',
                title: 'Pay Partial & Later',
                description: 'Pay Rs ${minimumPaymentAmount.toStringAsFixed(0)} now. Remaining Rs ${remainingAmount.toStringAsFixed(0)} after work.',
                amount: 'Rs ${minimumPaymentAmount.toStringAsFixed(0)}',
                onTap: () => setState(() => _selectedPaymentOption = 'partial'),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.borderLight)),
        ),
        child: SizedBox(
          height: 48,
          child: FilledButton(
            onPressed: () => context.go(AppRoutes.home),
            child: const Text('Back to Home', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textMuted),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
      ],
    );
  }
}

class _PaymentOptionCard extends StatelessWidget {
  final bool selected;
  final String title;
  final String description;
  final String amount;
  final VoidCallback onTap;

  const _PaymentOptionCard({
    required this.selected,
    required this.title,
    required this.description,
    required this.amount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? AppColors.accentLight : AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? AppColors.accent : AppColors.borderLight,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: selected ? AppColors.accent : AppColors.border, width: 2),
              ),
              child: selected
                  ? Center(child: Container(width: 12, height: 12, decoration: const BoxDecoration(shape: BoxShape.circle, color: AppColors.accent)))
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(description, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary)),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(amount, style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.success)),
          ],
        ),
      ),
    );
  }
}
