import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';

class BookingConfirmationScreen extends ConsumerStatefulWidget {
  const BookingConfirmationScreen({super.key});

  @override
  ConsumerState<BookingConfirmationScreen> createState() =>
      _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState
    extends ConsumerState<BookingConfirmationScreen> {
  String _selectedPaymentOption = 'full'; // 'full' or 'partial'

  @override
  Widget build(BuildContext context) {
    final booking = ref.watch(bookingFlowProvider);
    final activeOrder = ref.watch(activeOrderProvider);

    // Admin-controlled minimum payment amount
    const double minimumPaymentAmount = 100.0;
    final double remainingAmount =
        (activeOrder?.estimatedTotal ?? 0) - minimumPaymentAmount;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const SizedBox(height: 20),
              Container(
                height: 90,
                width: 90,
                decoration: const BoxDecoration(
                  color: Color(0xFFDCFCE7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  size: 50,
                  color: Color(0xFF16A34A),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Booking Confirmed',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your service has been scheduled successfully.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF475569),
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),

              // Booking Details
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      activeOrder == null
                          ? 'Service details unavailable'
                          : '${activeOrder.serviceName} (${activeOrder.packageLabel})',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Date: ${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year}',
                    ),
                    Text('Time: ${booking.selectedTimeSlot}'),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Booking Amount Paid: Rs ${minimumPaymentAmount.toStringAsFixed(0)}',
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: const Color(0xFF1E40AF),
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Important Note
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFFCD34D),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.info_outline,
                          color: Color(0xFFD97706),
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Important Information',
                            style: Theme.of(context)
                                .textTheme
                                .titleSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFFD97706),
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Technician will start the work after accessories payment has been done. The service charge will be applicable and payable after work completion.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: const Color(0xFF78350F),
                          ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Payment Options
              Text(
                'Payment Options',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 12),

              // Option 1: Full Payment Now
              GestureDetector(
                onTap: () => setState(() => _selectedPaymentOption = 'full'),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _selectedPaymentOption == 'full'
                        ? const Color(0xFFF0F9FF)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _selectedPaymentOption == 'full'
                          ? const Color(0xFF3B82F6)
                          : const Color(0xFFE2E8F0),
                      width: _selectedPaymentOption == 'full' ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Radio<String>(
                        value: 'full',
                        groupValue: _selectedPaymentOption,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() => _selectedPaymentOption = value);
                          }
                        },
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Pay Full Amount Now',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Pay Rs ${(activeOrder?.estimatedTotal ?? 0).toStringAsFixed(0)} now. Complete payment at service time.',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    color: const Color(0xFF64748B),
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Rs ${(activeOrder?.estimatedTotal ?? 0).toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF16A34A),
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Option 2: Partial Payment
              GestureDetector(
                onTap: () =>
                    setState(() => _selectedPaymentOption = 'partial'),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: _selectedPaymentOption == 'partial'
                        ? const Color(0xFFF0F9FF)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _selectedPaymentOption == 'partial'
                          ? const Color(0xFF3B82F6)
                          : const Color(0xFFE2E8F0),
                      width: _selectedPaymentOption == 'partial' ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Radio<String>(
                        value: 'partial',
                        groupValue: _selectedPaymentOption,
                        onChanged: (value) {
                          if (value != null) {
                            setState(() => _selectedPaymentOption = value);
                          }
                        },
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Pay Partial & Later',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleSmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Pay Rs ${minimumPaymentAmount.toStringAsFixed(0)} now (admin minimum). Remaining Rs ${remainingAmount.toStringAsFixed(0)} after work.',
                              style: Theme.of(context)
                                  .textTheme
                                  .labelSmall
                                  ?.copyWith(
                                    color: const Color(0xFF64748B),
                                  ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Rs ${minimumPaymentAmount.toStringAsFixed(0)}',
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF16A34A),
                            ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
        child: FilledButton(
          onPressed: () => context.go(AppRoutes.home),
          child: const Padding(
            padding: EdgeInsets.symmetric(vertical: 13),
            child: Text('Back to Home'),
          ),
        ),
      ),
    );
  }
}
