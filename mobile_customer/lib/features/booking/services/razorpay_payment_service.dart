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
    return RazorpayCheckoutOrder(
      provider: json['provider'] as String? ?? 'razorpay',
      keyId: json['keyId'] as String? ?? RazorpayPaymentService.getRazorpayConfig().keyId,
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
      provider: json['provider'] as String? ?? 'razorpay',
      verified: json['verified'] as bool? ?? false,
      message: json['message'] as String? ?? '',
      payment: json['payment'] == null
          ? null
          : Map<String, dynamic>.from(json['payment'] as Map),
    );
  }
}

class RazorpayConfig {
  final String keyId;
  final bool hasSecret;
  final String provider; // 'razorpay' or 'mock'
  
  const RazorpayConfig({
    required this.keyId,
    required this.hasSecret,
    required this.provider,
  });
}

class RazorpayPaymentService {
  static const String baseUrl = ApiConfig.baseUrl;

  final Dio _dio;

  RazorpayPaymentService(this._dio);

  static RazorpayConfig getRazorpayConfig() {
    final keyId = String.fromEnvironment('RAZORPAY_KEY_ID', defaultValue: '');
    final keySecret = String.fromEnvironment('RAZORPAY_KEY_SECRET', defaultValue: '');
    final isMockMode = !(keyId.isNotEmpty && keySecret.isNotEmpty);
    final provider = isMockMode ? 'mock' : 'razorpay';
    
    // Warn if running in mock mode in production-like environments
    if (isMockMode) {
      // In a real app, you might check for production flavors or build types
      // For now, we'll just log a warning if the key is explicitly empty
      if (keyId.isEmpty && keySecret.isEmpty) {
        // Silent in dev, but could be noisy in prod - adjust as needed
        // print('Razorpay: Running in mock mode - no API keys configured');
      }
    }
    
    return RazorpayConfig(
      keyId: keyId,
      hasSecret: keySecret.isNotEmpty,
      provider: provider,
    );
  }

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
    final config = RazorpayPaymentService.getRazorpayConfig();
    
    // Validate configuration for live mode
    if (config.provider == 'razorpay' && config.keyId.isEmpty) {
      throw Exception('Razorpay keyId is missing. Please set RAZORPAY_KEY_ID environment variable.');
    }

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
    final config = RazorpayPaymentService.getRazorpayConfig();
    
    // Validate configuration for live mode
    if (config.provider == 'razorpay' && config.keyId.isEmpty) {
      throw Exception('Razorpay keyId is missing. Please set RAZORPAY_KEY_ID environment variable.');
    }

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
