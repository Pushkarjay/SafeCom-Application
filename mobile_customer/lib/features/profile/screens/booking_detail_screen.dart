import 'package:flutter/material.dart';
import 'package:mobile_customer/features/profile/providers/booking_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class BookingDetailScreen extends StatelessWidget {
  final BookingModel booking;

  const BookingDetailScreen({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    final statusInfo = _getStatusInfo(booking.status);
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Booking Details',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
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
                  _SectionHeader(title: 'Service Information'),
                  _InfoTile(
                    label: 'Service Type',
                    value: _formatServiceType(booking.serviceType),
                    icon: Icons.settings_outlined,
                  ),
                  _InfoTile(
                    label: 'Amount Paid',
                    value: '₹${booking.amountPaid.toStringAsFixed(2)}',
                    icon: Icons.payments_outlined,
                  ),
                  const SizedBox(height: 24),

                  _SectionHeader(title: 'Schedule & Location'),
                  _InfoTile(
                    label: 'Scheduled For',
                    value: booking.scheduledAt != null 
                        ? _formatDateTime(booking.scheduledAt!)
                        : 'Not scheduled yet',
                    icon: Icons.calendar_today_outlined,
                  ),
                  if (booking.location != null)
                    _InfoTile(
                      label: 'Location',
                      value: booking.location!,
                      icon: Icons.location_on_outlined,
                    ),
                  const SizedBox(height: 24),

                  _SectionHeader(title: 'History'),
                  _InfoTile(
                    label: 'Booked On',
                    value: _formatDateTime(booking.createdAt),
                    icon: Icons.history_outlined,
                  ),
                  if (booking.completedAt != null)
                    _InfoTile(
                      label: 'Completed On',
                      value: _formatDateTime(booking.completedAt!),
                      icon: Icons.check_circle_outline,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (String, IconData, Color) _getStatusInfo(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
        return ('COMPLETED', Icons.check_circle, AppColors.success);
      case 'in_progress':
      case 'in-progress':
      case 'assigned':
        return ('IN PROGRESS', Icons.hourglass_top, const Color(0xFF3B82F6));
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
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
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
