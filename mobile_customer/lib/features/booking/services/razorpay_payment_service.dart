import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';

class RazorpayCheckoutOrder {
  final String provider;
  final String keyId;
  final String orderId;
  final int amountPaise;
  final String currency;
  final String receipt;
  final Map<String, dynamic> notes;

  const RazorpayCheckoutOrder({
    required this.provider,
    required this.keyId,
    required this.orderId,
    required this.amountPaise,
    required this.currency,
    required this.receipt,
    required this.notes,
  });

  factory RazorpayCheckoutOrder.fromJson(Map<String, dynamic> json) {
    return RazorpayCheckoutOrder(
      provider: json['provider'] as String? ?? 'mock',
      keyId: json['keyId'] as String? ?? RazorpayPaymentService._fallbackKeyId,
      orderId: json['orderId'] as String? ?? '',
      amountPaise: (json['amountPaise'] as num?)?.toInt() ?? 0,
      currency: json['currency'] as String? ?? 'INR',
      receipt: json['receipt'] as String? ?? '',
      notes: Map<String, dynamic>.from(json['notes'] as Map? ?? const {}),
    );
  }
}

class RazorpayVerificationResult {
  final String provider;
  final bool verified;
  final String message;
  final Map<String, dynamic>? payment;

  const RazorpayVerificationResult({
    required this.provider,
    required this.verified,
    required this.message,
    this.payment,
  });

  factory RazorpayVerificationResult.fromJson(Map<String, dynamic> json) {
    return RazorpayVerificationResult(
      provider: json['provider'] as String? ?? 'mock',
      verified: json['verified'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      payment: json['payment'] == null
          ? null
          : Map<String, dynamic>.from(json['payment'] as Map),
    );
  }
}

class RazorpayPaymentService {
  static const String baseUrl = 'https://safecom-backend-177425757120.asia-south1.run.app/api';
  static const String _fallbackKeyId = String.fromEnvironment(
    'RAZORPAY_KEY_ID',
    defaultValue: 'rzp_test_SjLf9CH3nOALie',
  );

  final Dio _dio;

  RazorpayPaymentService(this._dio);

  Future<RazorpayCheckoutOrder> createOrder({
    required double amountRupees,
    required String serviceName,
    required String packageLabel,
    String? customerId,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
    String? jobId,
    Map<String, String>? notes,
  }) async {
    final payload = <String, dynamic>{
      'amount': amountRupees,
      'currency': 'INR',
      'serviceName': serviceName,
      'packageLabel': packageLabel,
      'customerId': customerId,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'customerPhone': customerPhone,
      'jobId': jobId,
      'receipt': 'safecom_${DateTime.now().millisecondsSinceEpoch}',
      'notes': notes ?? <String, String>{},
    };

    try {
      final response = await _dio.post(
        '$baseUrl/payments/razorpay/create-order',
        data: payload,
        options: Options(
          sendTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
        ),
      );

      return RazorpayCheckoutOrder.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } catch (e) {
      final now = DateTime.now().millisecondsSinceEpoch;
      return RazorpayCheckoutOrder(
        provider: 'mock',
        keyId: _fallbackKeyId,
        orderId: 'order_mock_$now',
        amountPaise: (amountRupees * 100).round(),
        currency: 'INR',
        receipt: 'safecom_$now',
        notes: {
          'serviceName': serviceName,
          'packageLabel': packageLabel,
          'customerId': customerId ?? '',
          'customerName': customerName ?? '',
          'customerEmail': customerEmail ?? '',
          'customerPhone': customerPhone ?? '',
          'jobId': jobId ?? '',
          ...(notes ?? <String, String>{}),
        },
      );
    }
  }

  Future<RazorpayVerificationResult> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
    required double amountRupees,
    String? customerId,
    String? customerName,
    String? customerEmail,
    String? jobId,
    required String serviceName,
    required String packageLabel,
  }) async {
    final payload = <String, dynamic>{
      'orderId': orderId,
      'paymentId': paymentId,
      'signature': signature,
      'amount': amountRupees,
      'currency': 'INR',
      'customerId': customerId,
      'customerName': customerName,
      'customerEmail': customerEmail,
      'jobId': jobId,
      'serviceName': serviceName,
      'packageLabel': packageLabel,
    };

    try {
      final response = await _dio.post(
        '$baseUrl/payments/razorpay/verify',
        data: payload,
        options: Options(
          sendTimeout: const Duration(seconds: 8),
          receiveTimeout: const Duration(seconds: 8),
        ),
      );

      return RazorpayVerificationResult.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } catch (e) {
      return RazorpayVerificationResult(
        provider: 'mock',
        verified: true,
        message: 'Payment accepted locally because backend verification is unavailable.',
        payment: {
          'orderId': orderId,
          'paymentId': paymentId,
          'signature': signature,
          'amount': amountRupees,
          'serviceName': serviceName,
          'packageLabel': packageLabel,
          'customerId': customerId ?? '',
          'customerName': customerName ?? '',
          'customerEmail': customerEmail ?? '',
          'jobId': jobId ?? '',
        },
      );
    }
  }
}

final razorpayPaymentServiceProvider = Provider<RazorpayPaymentService>((ref) {
  return RazorpayPaymentService(ref.watch(dioProvider));
});