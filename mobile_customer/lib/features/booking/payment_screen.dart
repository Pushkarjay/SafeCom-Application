import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/features/booking/services/razorpay_payment_service.dart';

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
        const SnackBar(
          content: Text('Payment completed but checkout session is missing.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    try {
      final activeOrder = ref.read(activeOrderProvider);
      final booking = ref.read(bookingFlowProvider);
      final authState = ref.read(authProvider);

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

      setState(() {
        _isProcessing = false;
        _checkoutOrder = null;
      });

      if (!verification.verified) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(verification.message),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      messenger.showSnackBar(
        SnackBar(
          content: Text('Payment verified for ${booking.selectedTimeSlot}'),
          backgroundColor: Colors.green,
        ),
      );
      router.go(AppRoutes.confirmation);
    } catch (e) {
      if (!mounted) return;

      setState(() => _isProcessing = false);
      messenger.showSnackBar(
        SnackBar(
          content: Text('Payment verification failed: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    setState(() {
      _isProcessing = false;
      _checkoutOrder = null;
    });
    messenger.showSnackBar(
      SnackBar(
        content: Text(response.message ?? 'Payment failed. Please try again.'),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;

    final messenger = ScaffoldMessenger.of(context);
    messenger.showSnackBar(
      SnackBar(
        content: Text('External wallet selected: ${response.walletName}'),
      ),
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
          title: const Text('Sign in required'),
          content: const Text(
            'Please sign in before you pay. You can continue with Google or use email sign-in.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, 'cancel'),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context, 'login'),
              child: const Text('Sign In'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, 'google'),
              child: const Text('Continue with Google'),
            ),
          ],
        ),
      );

      if (choice == 'login') {
        if (mounted) {
          router.push(AppRoutes.login);
        }
        return;
      } else if (choice == 'google') {
        try {
          await ref.read(authProvider.notifier).continueWithGoogle();
        } catch (e) {
          if (!mounted) return;
          messenger.showSnackBar(
            SnackBar(
              content: Text('Google sign-in failed: $e'),
              backgroundColor: Colors.red,
            ),
          );
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
        const SnackBar(
          content: Text('Booking summary is missing. Please go back and try again.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final checkoutOrder = await ref.read(razorpayPaymentServiceProvider).createOrder(
            amountRupees: 100,
            serviceName: activeOrder.serviceName,
            packageLabel: activeOrder.packageLabel,
            customerId: customer?.id,
            customerName: customer?.name,
            customerEmail: customer?.email,
            customerPhone: customer?.phone,
            notes: {
              'scheduledDate': booking.selectedDate.toIso8601String(),
              'timeSlot': booking.selectedTimeSlot,
            },
          );

      if (!mounted) return;

      setState(() {
        _checkoutOrder = checkoutOrder;
      });

      final options = <String, Object>{
        'key': checkoutOrder.keyId,
        'amount': checkoutOrder.amountPaise,
        'currency': checkoutOrder.currency,
        'order_id': checkoutOrder.orderId,
        'name': 'SafeCom',
        'description': '${activeOrder.serviceName} - ${activeOrder.packageLabel}',
        'prefill': <String, String>{
          'contact': customer?.phone ?? '9999999999',
          'email': customer?.email ?? 'demo@safecom.com',
        },
        'theme': <String, String>{'color': '#0A84FF'},
        'retry': <String, bool>{'enabled': false},
        'modal': <String, bool>{'escape': true},
      };

      _razorpay.open(options);
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _isProcessing = false;
        _checkoutOrder = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unable to start payment checkout: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
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
            value: '${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year} • ${booking.selectedTimeSlot}',
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
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              color: const Color(0xFFEFF6FF),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Payment Method',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.credit_card,
                      color: Color(0xFF1E40AF),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _checkoutOrder?.provider == 'mock' ? 'Razorpay Test Checkout' : 'Razorpay Live Checkout',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ),
                    const Icon(
                      Icons.check_circle,
                      color: Color(0xFF16A34A),
                      size: 20,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'The backend creates the order and verifies the payment signature before confirming the booking.',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                ),
              ],
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
          onPressed: _isProcessing ? null : _openRazorpayCheckout,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: _isProcessing
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Pay Rs 100 and Confirm'),
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