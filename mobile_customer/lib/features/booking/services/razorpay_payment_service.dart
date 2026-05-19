import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import '../../../core/config/api_config.dart';

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
    // Support both wrapped { success, data: {...} } and flat formats
    final d = json['data'] as Map<String, dynamic>? ?? json;
    return RazorpayCheckoutOrder(
      provider: d['provider'] as String? ?? 'razorpay',
      keyId: d['keyId'] as String? ?? '',
      orderId: d['orderId'] as String? ?? '',
      amountPaise: (d['amountPaise'] as num?)?.toInt() ?? 0,
      currency: d['currency'] as String? ?? 'INR',
      receipt: d['receipt'] as String? ?? '',
      notes: Map<String, dynamic>.from(d['notes'] as Map? ?? const {}),
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
    // Support both wrapped { success, data: {...} } and flat formats
    final d = json['data'] as Map<String, dynamic>? ?? json;
    return RazorpayVerificationResult(
      provider: d['provider'] as String? ?? 'razorpay',
      verified: d['verified'] as bool? ?? false,
      message: d['message'] as String? ?? '',
      payment: d['payment'] == null
          ? null
          : Map<String, dynamic>.from(d['payment'] as Map),
    );
  }
}

class RazorpayPaymentService {
  static const String baseUrl = ApiConfig.baseUrl;

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
    // Validate required fields for payment
    if (customerPhone == null || customerPhone.trim().isEmpty) {
      throw Exception('MISSING_PHONE:Please add your phone number in Profile to complete booking');
    }

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
  }
}

final razorpayPaymentServiceProvider = Provider<RazorpayPaymentService>((ref) {
  return RazorpayPaymentService(ref.watch(dioProvider));
});
