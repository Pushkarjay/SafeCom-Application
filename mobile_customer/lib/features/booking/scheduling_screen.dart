import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';

class SchedulingScreen extends ConsumerWidget {
  const SchedulingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(bookingFlowProvider);
    final activeOrder = ref.watch(activeOrderProvider);
    final notifier = ref.read(bookingFlowProvider.notifier);

    final dateOptions = List.generate(
      6,
      (index) => DateTime.now().add(Duration(days: index + 1)),
    );

    const timeSlots = [
      '08:00 AM - 10:00 AM',
      '10:00 AM - 12:00 PM',
      '12:00 PM - 02:00 PM',
      '02:00 PM - 04:00 PM',
      '04:00 PM - 06:00 PM',
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Schedule Service')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (activeOrder != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                '${activeOrder.serviceName} (${activeOrder.packageLabel})',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
            ),
          Text(
            'Select Date',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final date in dateOptions)
                ChoiceChip(
                  label: Text(_dateLabel(date)),
                  selected: _isSameDate(booking.selectedDate, date),
                  onSelected: (_) => notifier.selectDate(date),
                ),
            ],
          ),
          const SizedBox(height: 18),
          Text(
            'Select Time Slot',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 10),
          for (final slot in timeSlots)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => notifier.selectTimeSlot(slot),
                child: Ink(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: booking.selectedTimeSlot == slot
                          ? const Color(0xFF0A84FF)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(child: Text(slot)),
                      Icon(
                        booking.selectedTimeSlot == slot
                            ? Icons.radio_button_checked
                            : Icons.radio_button_unchecked,
                        color: booking.selectedTimeSlot == slot
                            ? const Color(0xFF0A84FF)
                            : const Color(0xFF94A3B8),
                      ),
                    ],
                  ),
                ),
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
          onPressed: () => context.push(AppRoutes.recommendation),
          child: const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text('Continue to Payment'),
          ),
        ),
      ),
    );
  }

  bool _isSameDate(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _dateLabel(DateTime value) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return '${days[value.weekday - 1]}, ${value.day}/${value.month}';
  }
}
