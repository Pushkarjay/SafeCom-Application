import 'package:flutter/material.dart';
import 'package:mobile_customer/core/config/api_config.dart';
import 'package:mobile_customer/features/profile/providers/booking_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class BookingDetailScreen extends StatelessWidget {
  final BookingModel booking;

  const BookingDetailScreen({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    final statusInfo = _getStatusInfo(booking.status);
    final productTotal = booking.totalAmount;
    final bookingCharge = booking.amountPaid;
    final grandTotal = productTotal + bookingCharge;
    final remainingAmount = productTotal;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Booking Details'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              color: statusInfo.$3.withOpacity(0.1),
              child: Column(
                children: [
                  Icon(statusInfo.$2, size: 48, color: statusInfo.$3),
                  const SizedBox(height: 12),
                  Text(
                    statusInfo.$1,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: statusInfo.$3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Booking ID: ${booking.id}',
                    style: TextStyle(
                      fontSize: 13,
                      color: statusInfo.$3.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Service Information
                  _SectionHeader(title: 'Service Information'),
                  _InfoTile(label: 'Service Type', value: _formatServiceType(booking.serviceType), icon: Icons.settings_outlined),
                  if (booking.packageLabel != null)
                    _InfoTile(label: 'Package', value: booking.packageLabel!, icon: Icons.category_outlined),

                  const SizedBox(height: 24),

                  // Schedule & Location
                  _SectionHeader(title: 'Schedule & Location'),
                  _InfoTile(
                    label: 'Scheduled For',
                    value: booking.scheduledAt != null ? _formatDateTime(booking.scheduledAt!) : 'Not scheduled yet',
                    icon: Icons.calendar_today_outlined,
                  ),
                  if (booking.timeSlot != null)
                    _InfoTile(label: 'Time Slot', value: booking.timeSlot!, icon: Icons.access_time_rounded),
                  if (booking.location != null)
                    _InfoTile(label: 'Location', value: booking.location!, icon: Icons.location_on_outlined),

                  const SizedBox(height: 24),

                  // Payment Details
                  _SectionHeader(title: 'Payment Details'),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      children: [
                        _paymentRow('Product / Service Total', 'Rs ${productTotal.toStringAsFixed(0)}', AppColors.textPrimary, FontWeight.w600),
                        const SizedBox(height: 8),
                        _paymentRow('Booking Charge', 'Rs ${bookingCharge.toStringAsFixed(0)}', AppColors.textPrimary, FontWeight.w600),
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 8),
                          child: Divider(color: AppColors.borderLight),
                        ),
                        _paymentRow('Grand Total', 'Rs ${grandTotal.toStringAsFixed(0)}', AppColors.primary, FontWeight.w800),
                        const SizedBox(height: 8),
                        const Divider(color: AppColors.borderLight),
                        const SizedBox(height: 8),
                        _paymentRow('Paid Now (Booking)', 'Rs ${bookingCharge.toStringAsFixed(0)}', AppColors.success, FontWeight.w700),
                        const SizedBox(height: 8),
                        _paymentRow('Remaining (Pay On-Site)', 'Rs ${remainingAmount.toStringAsFixed(0)}', AppColors.secondary, FontWeight.w800),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // On-Site Payment Info
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.accentLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.accent.withOpacity(0.15)),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.info_outline, size: 16, color: AppColors.accent),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'The remaining payment must be made directly to the technician before installation begins. '
                            'Payment can be made via QR, card, or cash.',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Products / Items
                  if (booking.lineItems != null && booking.lineItems!.isNotEmpty) ...[
                    _SectionHeader(title: 'Products & Installation Details'),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.borderLight),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          for (final item in booking.lineItems!) ...[
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: AppColors.secondaryLight,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.videocam_outlined, size: 16, color: AppColors.secondary),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                      const SizedBox(height: 2),
                                      Text('Qty: ${item.quantity} × Rs ${item.unitPrice.toStringAsFixed(0)}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                    ],
                                  ),
                                ),
                                Text('Rs ${(item.quantity * item.unitPrice).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                              ],
                            ),
                            if (item != booking.lineItems!.last) const Padding(
                              padding: EdgeInsets.symmetric(vertical: 10),
                              child: Divider(color: AppColors.borderLight, height: 1),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Invoice Note
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F2ED),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.receipt_long_outlined, size: 16, color: AppColors.textMuted),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'All product prices are inclusive of GST. No additional GST or extra charges are applicable.',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

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
                            Text(
                              'Important Information',
                              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                                color: AppColors.warning,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Text(
                          '• Technician will visit and explain the complete setup before starting work.\n'
                          '• Remaining payment must be made before installation begins.\n'
                          '• The technician will accept payment via QR, card, cash, or other methods.\n'
                          '• Products will be unboxed and installed only after payment confirmation.\n'
                          '• Full invoice will be provided by the technician at the time of installation.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // History
                  _SectionHeader(title: 'History'),
                  _InfoTile(label: 'Booked On', value: _formatDateTime(booking.createdAt), icon: Icons.history_outlined),
                  if (booking.completedAt != null)
                    _InfoTile(label: 'Completed On', value: _formatDateTime(booking.completedAt!), icon: Icons.check_circle_outline),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _paymentRow(String label, String value, Color color, FontWeight weight) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        Text(value, style: TextStyle(fontWeight: weight, fontSize: 15, color: color)),
      ],
    );
  }

  (String, IconData, Color) _getStatusInfo(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return ('COMPLETED', Icons.check_circle, AppColors.success);
      case 'in_progress':
      case 'in-progress':
      case 'assigned':
        return ('IN PROGRESS', Icons.hourglass_top, AppColors.secondary);
      case 'confirmed':
        return ('CONFIRMED', Icons.thumb_up, const Color(0xFF6366F1));
      case 'cancelled':
        return ('CANCELLED', Icons.cancel, AppColors.error);
      case 'pending':
      default:
        return ('PENDING', Icons.schedule, const Color(0xFFF59E0B));
    }
  }

  String _formatServiceType(String type) {
    return type
        .split('_')
        .map((w) => w.isEmpty ? '' : '${w[0].toUpperCase()}${w.substring(1)}')
        .join(' ');
  }

  String _formatDateTime(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    final time = "${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
    return '${date.day} ${months[date.month - 1]} ${date.year}, $time';
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textMuted,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _InfoTile({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Icon(icon, size: 20, color: AppColors.textSecondary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
