import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/profile/models/saved_address.dart';
import 'package:mobile_customer/features/profile/providers/address_provider.dart';
import 'package:mobile_customer/features/profile/screens/address_form_screen.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class SchedulingScreen extends ConsumerStatefulWidget {
  const SchedulingScreen({super.key});

  @override
  ConsumerState<SchedulingScreen> createState() => _SchedulingScreenState();
}

class _SchedulingScreenState extends ConsumerState<SchedulingScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initAddresses());
  }

  void _initAddresses() {
    final customer = ref.read(authProvider).customer;
    final cid = customer?.id;
    if (cid != null) {
      ref.read(addressProvider.notifier).loadAddresses(cid).then((_) {
        final state = ref.read(addressProvider);
        final defaultAddr = state.defaultAddress;
        if (defaultAddr != null) {
          ref.read(bookingFlowProvider.notifier).selectAddress(defaultAddr);
        }
      });
    }
  }

  void _openAddAddress() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const AddressFormScreen()),
    ).then((_) {
      final customer = ref.read(authProvider).customer;
      final cid = customer?.id;
      if (cid != null) {
        ref.read(addressProvider.notifier).loadAddresses(cid);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final booking = ref.watch(bookingFlowProvider);
    final activeOrder = ref.watch(activeOrderProvider);
    final authState = ref.watch(authProvider);
    final locationState = ref.watch(locationProvider);
    final addressState = ref.watch(addressProvider);
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
      if (booking.selectedAddress == null) {
        ScaffoldMessenger.maybeOf(context)?.showSnackBar(
          const SnackBar(content: Text('Please select a service address.'), behavior: SnackBarBehavior.floating),
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

      if (activeOrder?.serviceName == 'Product Purchase' || activeOrder?.serviceTypeId == 'accessories') {
        context.push(AppRoutes.payment);
      } else {
        context.push(AppRoutes.recommendation, extra: {
          'serviceType': activeOrder?.serviceTypeId,
          'serviceName': activeOrder?.serviceName,
        });
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
          Container(
            margin: const EdgeInsets.only(bottom: 24),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
              boxShadow: [
                BoxShadow(color: AppColors.shadowLight, blurRadius: 8, offset: const Offset(0, 2)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on_rounded, size: 18, color: AppColors.secondary),
                    const SizedBox(width: 8),
                    const Text(
                      'Service Address',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    const Spacer(),
                    if (authState.isAuthenticated)
                      TextButton.icon(
                        onPressed: _openAddAddress,
                        icon: const Icon(Icons.add_rounded, size: 16),
                        label: const Text('Add', style: TextStyle(fontSize: 12)),
                        style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8)),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                if (!authState.isAuthenticated)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warningLight,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, size: 16, color: AppColors.warning),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Sign in to manage your addresses',
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                  )
                else if (addressState.isLoading)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ))
                else if (addressState.addresses.isEmpty)
                  _buildEmptyAddress()
                else
                  ...addressState.addresses.map((addr) => _buildAddressTile(addr, booking)),
                if (addressState.addresses.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _openAddAddress,
                        icon: const Icon(Icons.add_location_alt_outlined, size: 16),
                        label: const Text('Add New Address'),
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

  Widget _buildEmptyAddress() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(Icons.location_off_rounded, size: 32, color: AppColors.textMuted.withOpacity(0.5)),
          const SizedBox(height: 8),
          const Text(
            'No saved addresses',
            style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _openAddAddress,
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text('Add Address'),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressTile(SavedAddress addr, BookingFlowState booking) {
    final isSelected = booking.selectedAddress?.id == addr.id;
    final isDefault = addr.isDefault;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => ref.read(bookingFlowProvider.notifier).selectAddress(addr),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.secondaryLight : AppColors.surfaceVariant,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.secondary : AppColors.borderLight,
              width: isSelected ? 1.5 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 20, height: 20,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? AppColors.secondary : Colors.transparent,
                  border: Border.all(
                    color: isSelected ? AppColors.secondary : AppColors.border,
                    width: isSelected ? 5 : 2,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          addr.label,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.textPrimary),
                        ),
                        if (isDefault) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.secondary.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'DEFAULT',
                              style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.secondary, letterSpacing: 0.3),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      addr.address,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
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
