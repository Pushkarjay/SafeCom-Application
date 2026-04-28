import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';

class PaymentScreen extends ConsumerWidget {
  const PaymentScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeOrder = ref.watch(activeOrderProvider);
    final booking = ref.watch(bookingFlowProvider);
    const bookingAmount = 100.0;

    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SummaryTile(
            title: 'Service',
            value: activeOrder == null
                ? 'Service details unavailable'
                : '${activeOrder.serviceName} (${activeOrder.packageLabel})',
          ),
          _SummaryTile(
            title: 'Schedule',
            value:
                '${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year} • ${booking.selectedTimeSlot}',
          ),
          _SummaryTile(
            title: 'Total Estimate',
            value: _currency(activeOrder?.estimatedTotal ?? 0),
          ),
          _SummaryTile(
            title: 'Booking Amount',
            value: _currency(bookingAmount),
            isHighlight: true,
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: const Color(0xFFF8FAFC),
            ),
            child: const Text(
              'You pay only Rs 100 now to confirm booking. Remaining amount is payable after service completion.',
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        ),
        child: FilledButton(
          onPressed: () => context.go(AppRoutes.confirmation),
          child: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('Pay Rs 100 and Confirm'),
          ),
        ),
      ),
    );
  }

  String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';
}

class _SummaryTile extends StatelessWidget {
  final String title;
  final String value;
  final bool isHighlight;

  const _SummaryTile({
    required this.title,
    required this.value,
    this.isHighlight = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: isHighlight ? const Color(0xFF16A34A) : null,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
