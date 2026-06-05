import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import 'package:mobile_customer/core/config/api_config.dart' show ApiConfig;
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/utils/error_handler.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/booking/services/razorpay_payment_service.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/services/providers/product_selection_provider.dart';
import 'package:mobile_customer/data/providers/cart_provider.dart' as data_cart;
import 'package:mobile_customer/core/theme/app_theme.dart';

class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});

  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  late final Razorpay _razorpay;
  RazorpayCheckoutOrder? _checkoutOrder;
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    final checkoutOrder = _checkoutOrder;
    if (checkoutOrder == null) {
      setState(() => _isProcessing = false);
      messenger.showSnackBar(
        const SnackBar(content: Text('Payment completed but checkout session is missing.'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating),
      );
      return;
    }

    try {
      final activeOrder = ref.read(activeOrderProvider);
      final booking = ref.read(bookingFlowProvider);
      final authState = ref.read(authProvider);
      final locationState = ref.read(locationProvider);

      final verification = await ref.read(razorpayPaymentServiceProvider).verifyPayment(
            orderId: checkoutOrder.orderId,
            paymentId: response.paymentId ?? '',
            signature: response.signature ?? '',
            amountRupees: checkoutOrder.amountPaise / 100,
            customerId: authState.customer?.id,
            customerName: authState.customer?.name,
            customerEmail: authState.customer?.email,
            jobId: null,
            serviceName: activeOrder?.serviceName ?? 'SafeCom Service',
            packageLabel: activeOrder?.packageLabel ?? 'Booking',
          );

      if (!mounted) return;

      if (!verification.verified) {
        setState(() { _isProcessing = false; _checkoutOrder = null; });
        messenger.showSnackBar(
          SnackBar(content: Text(verification.message), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating),
        );
        return;
      }

      final serviceType = _mapServiceNameToType(activeOrder?.serviceName ?? 'installation');

      final lineItems = (activeOrder?.items ?? []).map((item) => {
        'productId': item.name.replaceAll(' ', '_').toLowerCase(),
        'productName': item.name,
        'quantity': item.quantity,
        'unitPrice': item.unitPrice,
        'lineTotal': item.unitPrice * item.quantity,
      }).toList();

      final createBookingData = {
        'customerId': authState.customer?.id ?? '',
        'serviceType': serviceType,
        'serviceConfig': {'packageLabel': activeOrder?.packageLabel ?? 'Standard'},
        'location': {
          'address': locationState.location,
          'latitude': locationState.latitude ?? 25.5941,
          'longitude': locationState.longitude ?? 85.1376,
        },
        'scheduledDate': '${booking.selectedDate.year}-${booking.selectedDate.month.toString().padLeft(2, '0')}-${booking.selectedDate.day.toString().padLeft(2, '0')}',
        'scheduledTimeSlot': booking.selectedTimeSlot,
        'lineItems': lineItems,
        'notes': 'Payment ID: ${response.paymentId}',
      };

      try {
        await ref.read(apiServiceProvider).createBooking(
          customerId: authState.customer?.id ?? '',
          serviceType: serviceType,
          serviceConfig: createBookingData['serviceConfig'] as Map<String, dynamic>,
          location: createBookingData['location'] as Map<String, dynamic>,
          scheduledDate: createBookingData['scheduledDate'] as String,
          scheduledTimeSlot: createBookingData['scheduledTimeSlot'] as String,
          lineItems: createBookingData['lineItems'] as List<Map<String, dynamic>>,
          totalAmount: activeOrder?.estimatedTotal,
          amountPaid: checkoutOrder.amountPaise / 100,
          paymentId: response.paymentId,
          orderId: checkoutOrder.orderId,
          notes: createBookingData['notes'] as String?,
        );
      } catch (bookingError) {
        debugPrint('Failed to create booking: $bookingError');
      }

      if (!mounted) return;

      setState(() { _isProcessing = false; _checkoutOrder = null; });

      ref.read(activeOrderProvider.notifier).clear();
      ref.read(bookingFlowProvider.notifier).reset();
      ref.read(productSelectionProvider.notifier).clearAll();
      ref.read(data_cart.cartProvider.notifier).clearCart();

      messenger.showSnackBar(
        SnackBar(
          content: Text('Payment verified! Booking created for ${booking.selectedTimeSlot}'),
          backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating,
        ),
      );
      router.go(AppRoutes.confirmation);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessing = false);
      AppErrorHandler.showSnackbar(context, e);
    }
  }

  String _mapServiceNameToType(String serviceName) {
    final name = serviceName.toLowerCase();
    if (name.contains('install')) return 'installation';
    if (name.contains('maintenance') || name.contains('amc')) return 'amc';
    if (name.contains('repair')) return 'repair';
    if (name.contains('upgrade')) return 'upgrade';
    if (name.contains('accessories')) return 'accessories';
    if (name.contains('product') || name.contains('purchase') || name.contains('cart')) return 'installation';
    return 'installation';
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() { _isProcessing = false; _checkoutOrder = null; });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(response.message ?? 'Payment failed. Please try again.'),
        backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External wallet selected: ${response.walletName}'), behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _openRazorpayCheckout() async {
    final messenger = ScaffoldMessenger.of(context);
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated) {
      final router = GoRouter.of(context);
      final choice = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('Sign in required'),
          content: const Text('Please sign in before you pay.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, 'cancel'),
              child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, 'login'),
              child: const Text('Sign In', style: TextStyle(fontWeight: FontWeight.w600)),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, 'google'),
              child: const Text('Continue with Google'),
            ),
          ],
        ),
      );

      if (choice == 'login') {
        if (mounted) router.push(AppRoutes.login);
        return;
      } else if (choice == 'google') {
        try {
          await ref.read(authProvider.notifier).continueWithGoogle();
        } catch (e) {
          if (!mounted) return;
          AppErrorHandler.showSnackbar(context, e);
          return;
        }
      } else {
        return;
      }
    }

    final activeOrder = ref.read(activeOrderProvider);
    final booking = ref.read(bookingFlowProvider);
    final customer = ref.read(authProvider).customer;

    if (activeOrder == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text('Booking summary is missing. Please go back and try again.'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating),
      );
      return;
    }

    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final checkoutOrder = await ref.read(razorpayPaymentServiceProvider).createOrder(
            amountRupees: ApiConfig.bookingAmount,
            serviceName: activeOrder.serviceName,
            packageLabel: activeOrder.packageLabel,
            customerId: customer?.id,
            customerName: customer?.name,
            customerEmail: customer?.email,
            customerPhone: customer?.phone,
            notes: {
              'scheduledDate': booking.selectedDate.toIso8601String(),
              'timeSlot': booking.selectedTimeSlot,
              'totalAmount': activeOrder.estimatedTotal.toString(),
            },
          );

      if (!mounted) return;

      setState(() { _checkoutOrder = checkoutOrder; });

      final options = <String, Object>{
        'key': checkoutOrder.keyId,
        'amount': checkoutOrder.amountPaise,
        'currency': checkoutOrder.currency,
        'order_id': checkoutOrder.orderId,
        'name': 'SafeCom',
        'description': '${activeOrder.serviceName} - ${activeOrder.packageLabel}',
        'prefill': <String, String>{
          'contact': customer?.phone ?? '9999999999',
          'email': customer?.email ?? '',
        },
        'theme': <String, String>{'color': '#0F172A'},
        'retry': <String, bool>{'enabled': false},
        'modal': <String, bool>{'escape': true},
      };

      _razorpay.open(options);
    } catch (e) {
      if (!mounted) return;
      setState(() { _isProcessing = false; _checkoutOrder = null; });

      final errorStr = e.toString();
      if (errorStr.contains('MISSING_PHONE')) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Phone Number Required'),
            content: const Text('Please add your phone number in your Profile to complete booking.'),
            actions: [
              TextButton(
                onPressed: () { Navigator.pop(ctx); context.push(AppRoutes.profile); },
                child: const Text('Go to Profile', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel'),
              ),
            ],
          ),
        );
        return;
      }

      AppErrorHandler.showSnackbar(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeOrder = ref.watch(activeOrderProvider);
    final booking = ref.watch(bookingFlowProvider);
    final locationState = ref.watch(locationProvider);

    const bookingAmount = ApiConfig.bookingAmount;
    final productTotal = activeOrder?.estimatedTotal ?? 0;
    final grandTotal = productTotal + bookingAmount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Invoice & Payment'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (locationState.location == 'Fetching location...' || locationState.latitude == null)
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Delivery location not set. Please go back and set your location.',
                      style: TextStyle(color: AppColors.error, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(20),
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
                      child: const Icon(Icons.receipt_long_outlined, color: AppColors.secondary, size: 20),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Order Summary',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                _SummaryRow(label: 'Service', value: activeOrder == null ? 'Service details unavailable' : '${activeOrder.serviceName} (${activeOrder.packageLabel})'),
                _SummaryRow(label: 'Schedule', value: '${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year} • ${booking.selectedTimeSlot}'),
                _SummaryRow(label: 'Location', value: locationState.location),

                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(color: AppColors.borderLight),
                ),

                if (activeOrder != null && activeOrder.items.isNotEmpty) ...[
                  Text(
                    'Invoice Breakdown',
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  ...activeOrder.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 3, child: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w500))),
                        Expanded(flex: 1, child: Text('${item.quantity}x', textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted))),
                        Expanded(flex: 2, child: Text(_currency(item.amount), textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600))),
                      ],
                    ),
                  )),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(color: AppColors.borderLight),
                  ),
                ],

                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Product / Service Total', style: TextStyle(color: AppColors.textSecondary)),
                  Text(_currency(productTotal), style: const TextStyle(fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 6),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Booking Charge', style: TextStyle(color: AppColors.textSecondary)),
                  Text(_currency(bookingAmount), style: const TextStyle(fontWeight: FontWeight.w600)),
                ]),
                const SizedBox(height: 6),
                const Divider(color: AppColors.borderLight),
                const SizedBox(height: 6),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Grand Total', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.primary)),
                  Text(_currency(grandTotal), style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.secondary)),
                ]),
                const SizedBox(height: 10),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    const Expanded(
                      child: Text(
                        'All product prices are inclusive of GST. Booking charge of Rs 100 is added on top and paid now.',
                        style: TextStyle(color: AppColors.textMuted, fontSize: 12, height: 1.3),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.accentLight,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.accent.withOpacity(0.15)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Pay Now (Booking Charge)', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700, color: AppColors.accent)),
                  Text(_currency(bookingAmount), style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: AppColors.success)),
                ]),
                const SizedBox(height: 8),
                Text(
                  'Pay Rs ${bookingAmount.toInt()} now to confirm. Remaining Rs ${productTotal.toInt()} will be paid on-site to the technician.',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.payments_outlined, size: 16, color: AppColors.secondary),
                      SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'The remaining payment must be made directly to the technician before the work starts. The technician will handle the payment process via QR, card, cash, or other methods. Currently, the app is only used to collect the booking amount.',
                          style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.shield_outlined, color: AppColors.success, size: 18),
              const SizedBox(width: 8),
              Text('Secure Checkout via Razorpay', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ],
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.borderLight)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 48,
            child: FilledButton(
              onPressed: _isProcessing ? null : _openRazorpayCheckout,
              child: _isProcessing
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Pay Rs 100 & Confirm Booking', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ),
        ),
      ),
    );
  }

  String _currency(double value) => 'Rs ${value.toStringAsFixed(0)}';
}

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;

  const _SummaryRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 90,
            child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}
