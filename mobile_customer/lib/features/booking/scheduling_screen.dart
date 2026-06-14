import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class SchedulingScreen extends ConsumerWidget {
  const SchedulingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(bookingFlowProvider);
    final activeOrder = ref.watch(activeOrderProvider);
    final authState = ref.watch(authProvider);
    final locationState = ref.watch(locationProvider);
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

    void handleContinue() {
      if (locationState.location == 'Fetching location...' || locationState.location.isEmpty || locationState.latitude == null) {
        ScaffoldMessenger.maybeOf(context)?.showSnackBar(
          const SnackBar(content: Text('Please set your delivery location first.'), behavior: SnackBarBehavior.floating),
        );
        return;
      }
      if (!authState.isAuthenticated || authState.customer == null) {
        showModalBottomSheet(
          context: context,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          builder: (ctx) => Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.secondaryLight,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(Icons.lock_outline, color: AppColors.secondary, size: 24),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Sign In Required',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.3),
                ),
                const SizedBox(height: 8),
                Text(
                  'Please sign in or create an account to proceed with your booking.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () { Navigator.pop(ctx); context.push(AppRoutes.login); },
                    child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 10),
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
              ],
            ),
          ),
        );
        return;
      }

      if (activeOrder?.serviceName == 'Product Purchase') {
        context.push(AppRoutes.payment);
      } else {
        context.push(AppRoutes.recommendation, extra: activeOrder?.serviceTypeId);
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule Service'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (activeOrder != null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 24),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFFFFF3E0),
                    Color(0xFFFFFBF5),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.secondary.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 44, height: 44,
                    decoration: BoxDecoration(
                      color: AppColors.secondary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.build_outlined, color: AppColors.secondary, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Selected Service',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${activeOrder.serviceName} (${activeOrder.packageLabel})',
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w700),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: locationState.latitude == null ? AppColors.error.withOpacity(0.5) : AppColors.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        locationState.latitude == null ? Icons.location_off : Icons.location_on,
                        color: locationState.latitude == null ? AppColors.error : AppColors.primary, size: 22,
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Delivery Location',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            locationState.location,
                            style: TextStyle(
                              color: locationState.latitude == null ? AppColors.error : AppColors.textPrimary,
                              fontSize: 14, fontWeight: FontWeight.w600,
                            ),
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => context.push(AppRoutes.locationPicker),
                    icon: const Icon(Icons.edit_location_alt_outlined, size: 18),
                    label: Text(
                      locationState.latitude == null ? 'Set Location' : 'Change',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Text(
            'Select Date',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: dateOptions.map((date) {
                final isSelected = _isSameDate(booking.selectedDate, date);
                return Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: InkWell(
                    onTap: () => notifier.selectDate(date),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary : AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? AppColors.primary : AppColors.borderLight,
                        ),
                        boxShadow: isSelected
                            ? [BoxShadow(color: AppColors.primary.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))]
                            : null,
                      ),
                      child: Column(
                        children: [
                          Text(
                            _dayName(date),
                            style: TextStyle(
                              color: isSelected ? Colors.white.withOpacity(0.9) : AppColors.textSecondary,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${date.day}',
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppColors.primary,
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 28),
          const Text(
            'Select Time Slot',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
          const SizedBox(height: 12),
          for (final slot in timeSlots)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => notifier.selectTimeSlot(slot),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: booking.selectedTimeSlot == slot ? AppColors.secondary : AppColors.borderLight,
                      width: booking.selectedTimeSlot == slot ? 1.5 : 1,
                    ),
                    boxShadow: booking.selectedTimeSlot == slot
                        ? [BoxShadow(color: AppColors.secondary.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2))]
                        : null,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36, height: 36,
                        decoration: BoxDecoration(
                          color: booking.selectedTimeSlot == slot ? AppColors.secondaryLight : AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          Icons.access_time_rounded,
                          color: booking.selectedTimeSlot == slot ? AppColors.secondary : AppColors.textMuted,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          slot,
                          style: TextStyle(
                            fontWeight: booking.selectedTimeSlot == slot ? FontWeight.w700 : FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      Container(
                        width: 22,
                        height: 22,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: booking.selectedTimeSlot == slot ? AppColors.secondary : AppColors.border,
                            width: booking.selectedTimeSlot == slot ? 6 : 2,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          boxShadow: [
            BoxShadow(color: AppColors.shadowLight, blurRadius: 10, offset: const Offset(0, -4)),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: handleContinue,
              child: const Text('Continue', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      ),
    );
  }

  bool _isSameDate(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  String _dayName(DateTime value) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[value.weekday - 1];
  }
}
