import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/utils/error_handler.dart';
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
      AppErrorHandler.showSnackbar(context, e);
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
      AppErrorHandler.showSnackbar(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeOrder = ref.watch(activeOrderProvider);
    final booking = ref.watch(bookingFlowProvider);
    const bookingAmount = 100.0;
    
    final taxAmount = (activeOrder?.estimatedTotal ?? 0) * 0.18; // 18% GST estimate
    final grandTotal = (activeOrder?.estimatedTotal ?? 0) + taxAmount;

    return Scaffold(
      appBar: AppBar(title: const Text('Invoice & Payment')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Order Summary',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 16),
                _SummaryRow(
                  label: 'Service',
                  value: activeOrder == null
                      ? 'Service details unavailable'
                      : '${activeOrder.serviceName} (${activeOrder.packageLabel})',
                ),
                _SummaryRow(
                  label: 'Schedule',
                  value: '${booking.selectedDate.day}/${booking.selectedDate.month}/${booking.selectedDate.year} • ${booking.selectedTimeSlot}',
                ),
                
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(),
                ),
                
                if (activeOrder != null && activeOrder.items.isNotEmpty) ...[
                  Text(
                    'Invoice Breakdown',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 12),
                  ...activeOrder.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 3,
                          child: Text(item.name, style: const TextStyle(fontWeight: FontWeight.w500)),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text('${item.quantity}x', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                        ),
                        Expanded(
                          flex: 2,
                          child: Text(_currency(item.amount), textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  )),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(),
                  ),
                ],
                
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtotal', style: TextStyle(color: Colors.grey)),
                    Text(_currency(activeOrder?.estimatedTotal ?? 0), style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Estimated GST (18%)', style: TextStyle(color: Colors.grey)),
                    Text('+ ${_currency(taxAmount)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Estimated Grand Total', style: TextStyle(fontWeight: FontWeight.w700)),
                      Text(_currency(grandTotal), style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 20),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Amount to Pay Now',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700, color: const Color(0xFF1E40AF)),
                    ),
                    Text(
                      _currency(bookingAmount),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800, color: const Color(0xFF16A34A)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'A minimum booking charge of Rs 100 is required to confirm the technician visit. The remaining balance will be payable after the service is successfully completed.',
                  style: TextStyle(color: Color(0xFF3B82F6), fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.shield_outlined, color: Colors.green, size: 20),
              const SizedBox(width: 8),
              Text('Secure Checkout via Razorpay', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
            ],
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
        ),
        child: SafeArea(
          child: FilledButton(
            onPressed: _isProcessing ? null : _openRazorpayCheckout,
            style: FilledButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isProcessing
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Pay Rs 100 & Confirm Booking', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
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
            width: 100,
            child: Text(label, style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w500)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}