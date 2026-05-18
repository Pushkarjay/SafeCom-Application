import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/config/api_config.dart' show ApiConfig;
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class BookingConfirmationScreen extends ConsumerWidget {
  const BookingConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(bookingFlowProvider);
    final activeOrder = ref.watch(activeOrderProvider);
    final locationState = ref.watch(locationProvider);
    const bookingAmount = ApiConfig.minimumPaymentAmount;
    final productTotal = activeOrder?.estimatedTotal ?? 0;
    final grandTotal = productTotal + bookingAmount;
    final remainingAmount = productTotal;
    final hasItems = activeOrder != null && activeOrder.items.isNotEmpty;

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

              // Service Summary Card
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
                    _infoRow(Icons.location_on_outlined, 'Location: ${locationState.location}'),
                    const SizedBox(height: 6),
                    _infoRow(Icons.calendar_month_outlined, 'Date: ${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year}'),
                    const SizedBox(height: 6),
                    _infoRow(Icons.access_time_rounded, 'Time: ${booking.selectedTimeSlot}'),
                    if (hasItems) ...[
                      const SizedBox(height: 12),
                      const Divider(color: AppColors.borderLight),
                      const SizedBox(height: 8),
                      Text(
                        'Products / Services',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w700, color: AppColors.textMuted,
                        ),
                      ),
                      const SizedBox(height: 8),
                      ...activeOrder!.items.map((item) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            Expanded(
                              child: Text('${item.name} × ${item.quantity}', style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            ),
                            Text('Rs ${item.amount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      )),
                    ],
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.accentLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Booking Charge Paid: Rs ${bookingAmount.toStringAsFixed(0)} (extra)',
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

              // Amount Summary
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Payment Summary',
                      style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.primary),
                    ),
                    const SizedBox(height: 12),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Product / Service Total', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      Text('Rs ${productTotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    ]),
                    const SizedBox(height: 6),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Booking Charge', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      Text('Rs ${bookingAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                    ]),
                    const SizedBox(height: 6),
                    const Divider(color: AppColors.borderLight),
                    const SizedBox(height: 6),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Grand Total', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.primary)),
                      Text('Rs ${grandTotal.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.secondary)),
                    ]),
                    const SizedBox(height: 8),
                    const Divider(color: AppColors.borderLight),
                    const SizedBox(height: 8),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Paid Now (Booking)', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                      Text('Rs ${bookingAmount.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.success)),
                    ]),
                    const SizedBox(height: 6),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      const Text('Remaining (Pay On-Site)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      Text('Rs ${remainingAmount.toStringAsFixed(0)}', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: remainingAmount > 0 ? AppColors.secondary : AppColors.success)),
                    ]),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Important Information
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
                    const SizedBox(height: 10),
                    const Text(
                      '• The Rs 100 booking charge is an extra fee added on top of the product price to confirm the visit.\n'
                      '• The remaining product/service amount must be paid directly to the technician before work starts.\n'
                      '• The technician will handle payment via QR, card, cash, or other methods.\n'
                      '• Work will start only after on-site payment confirmation.',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
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
