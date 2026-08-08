import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_customer/features/profile/providers/booking_provider.dart';

void main() {
  group('BookingModel custom message parsing', () {
    test('parses message from invoice.customTextBox', () {
      final booking = BookingModel.fromJson({
        'bookingId': '20260809-001',
        'serviceType': 'installation',
        'status': 'confirmed',
        'createdAt': '2026-08-09T10:00:00.000Z',
        'invoice': {
          'grandTotal': 600,
          'advanceAmount': 100,
          'remainingAmount': 500,
          'customTextBox': {
            'title': 'Custom Message',
            'value': 'Camera near the main gate is not working',
          },
          'lineItems': [
            {
              'productName': 'CCTV Camera',
              'quantity': 1,
              'unitPrice': 600,
              'lineTotal': 600,
            },
          ],
        },
      });

      expect(booking.customMessage, 'Camera near the main gate is not working');
      expect(booking.totalAmount, 600);
      expect(booking.amountPaid, 100);
    });

    test('parses message from serviceConfig.customTextBox (fallback)', () {
      final booking = BookingModel.fromJson({
        'bookingId': '20260809-002',
        'serviceType': 'repair',
        'status': 'pending',
        'createdAt': '2026-08-09T10:00:00.000Z',
        'totalAmount': 800,
        'amountPaid': 100,
        'serviceConfig': {
          'customTextBox': {'value': 'Laptop keyboard not working'},
        },
      });

      expect(booking.customMessage, 'Laptop keyboard not working');
      expect(booking.totalAmount, 800);
      expect(booking.amountPaid, 100);
    });

    test('parses message from text-box line item variants (old bookings)', () {
      final booking = BookingModel.fromJson({
        'bookingId': '20260809-003',
        'serviceType': 'amc',
        'status': 'confirmed',
        'createdAt': '2026-08-09T10:00:00.000Z',
        'invoice': {
          'grandTotal': 1200,
          'advanceAmount': 100,
          'lineItems': [
            {
              'productName': 'Custom Text',
              'quantity': 1,
              'unitPrice': 0,
              'lineTotal': 0,
              'category': 'text_box',
              'variants': {'value': 'Please service all 4 cameras'},
            },
          ],
        },
      });

      expect(booking.customMessage, 'Please service all 4 cameras');
    });

    test('returns null when no message present', () {
      final booking = BookingModel.fromJson({
        'bookingId': '20260809-004',
        'serviceType': 'installation',
        'status': 'pending',
        'createdAt': '2026-08-09T10:00:00.000Z',
        'invoice': {
          'grandTotal': 600,
          'advanceAmount': 100,
          'lineItems': [
            {
              'productName': 'CCTV Camera',
              'quantity': 1,
              'unitPrice': 600,
              'lineTotal': 600,
            },
          ],
        },
      });

      expect(booking.customMessage, isNull);
    });
  });

  group('Inclusive booking-advance math', () {
    test('remaining = grandTotal - amountPaid (never adds charge again)', () {
      // Bill = 600, advance paid = 100 → remaining must be 500.
      final booking = BookingModel.fromJson({
        'bookingId': '20260809-005',
        'serviceType': 'installation',
        'status': 'confirmed',
        'createdAt': '2026-08-09T10:00:00.000Z',
        'invoice': {
          'grandTotal': 600,
          'advanceAmount': 100,
          'remainingAmount': 500,
        },
      });

      final grandTotal = booking.totalAmount;
      final remaining = (booking.totalAmount - booking.amountPaid).clamp(0.0, double.infinity);
      expect(grandTotal, 600);
      expect(booking.amountPaid, 100);
      expect(remaining, 500);
    });
  });
}
