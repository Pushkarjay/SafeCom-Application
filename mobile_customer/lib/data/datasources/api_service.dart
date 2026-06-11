import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/config/api_config.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    // Base URL for the backend API
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
    },
  ));
  
  // Add interceptors for logging in debug mode
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));
  
  // Attach Firebase ID token for authenticated requests
  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      try {
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          final token = await user.getIdToken();
          options.headers['Authorization'] = 'Bearer $token';
        }
      } catch (e) {
        // ignore token attach errors
      }
      return handler.next(options);
    },
  ));
  
  return dio;
});

// API Service for fetching data from backend
class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  // Get all services
  Future<Map<String, dynamic>> getServices() async {
    try {
      final response = await _dio.get('/catalog-public/services');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch services: $e');
    }
  }

  // Get recommendations
  Future<Map<String, dynamic>> getRecommendations({
    String placement = 'checkout',
    String? serviceType,
  }) async {
    try {
      final params = <String, dynamic>{
        'placement': placement,
        if (serviceType != null && serviceType.isNotEmpty) 'serviceType': serviceType,
        'available': 'true'
      };
      final response = await _dio.get('/catalog/recommendations', queryParameters: params);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch recommendations: $e');
    }
  }

  // Get installation pricing
  Future<Map<String, dynamic>> getInstallationPricing() async {
    try {
      final response = await _dio.get('/catalog-public/pricing/installation');
      print('*** INSTALL RESPONSE *** status=${response.statusCode} type=${response.data.runtimeType}');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      print('*** INSTALL ERROR *** ApiService.getInstallationPricing: $e');
      throw Exception('Failed to fetch installation pricing: $e');
    }
  }

  // Get maintenance pricing
  Future<Map<String, dynamic>> getMaintenancePricing() async {
    try {
      final response = await _dio.get('/catalog-public/pricing/maintenance');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch maintenance pricing: $e');
    }
  }

  // Get repair pricing
  Future<Map<String, dynamic>> getRepairPricing() async {
    try {
      final response = await _dio.get('/catalog-public/pricing/repair');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch repair pricing: $e');
    }
  }

  // Get upgrade bundles
  Future<Map<String, dynamic>> getUpgradeBundles() async {
    try {
      final response = await _dio.get('/catalog-public/upgrade');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch upgrade bundles: $e');
    }
  }

  // Get accessories
  Future<Map<String, dynamic>> getAccessories() async {
    try {
      final response = await _dio.get('/catalog-public/accessories');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch accessories: $e');
    }
  }

  // Get AMC config
  Future<Map<String, dynamic>> getAmcPricing() async {
    try {
      final response = await _dio.get('/catalog-public/pricing/amc');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch AMC pricing: $e');
    }
  }

  // Get single product by ID
  Future<Map<String, dynamic>> getProduct(String productId) async {
    try {
      final response = await _dio.get('/catalog/products/$productId');
      final data = response.data as Map<String, dynamic>;
      // The backend returns { success: true, data: product }, so extract product
      if (data.containsKey('success') && data.containsKey('data')) {
        return data['data'] as Map<String, dynamic>;
      }
      return data;
    } catch (e) {
      throw Exception('Failed to fetch product: $e');
    }
  }

  // Get all master products
  Future<Map<String, dynamic>> getAllProducts() async {
    try {
      final response = await _dio.get('/catalog-public/products');
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch all products: $e');
    }
  }
  // Get SDUI screen layout
  Future<Map<String, dynamic>> getScreenLayout(
    String screen, {
    double? lat,
    double? lng,
  }) async {
    try {
      final params = <String, dynamic>{
        'screen': screen,
        if (lat != null) 'lat': lat.toString(),
        if (lng != null) 'lng': lng.toString(),
      };
      final response = await _dio.get('/sdui/layout', queryParameters: params);
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to fetch screen layout: $e');
    }
  }

// Check serviceability
  Future<Map<String, dynamic>> checkServiceability({
    required double lat,
    required double lng,
  }) async {
    try {
      final response = await _dio.post('/serviceability/check', data: {
        'latitude': lat,
        'longitude': lng,
      });
      final resData = response.data as Map<String, dynamic>;
      if (resData.containsKey('data')) {
         return resData['data'] as Map<String, dynamic>;
      }
      return resData;
    } catch (e) {
      if (e is DioException && e.response?.data != null) {
         final resData = e.response!.data as Map<String, dynamic>;
         if (resData.containsKey('data')) {
            return resData['data'] as Map<String, dynamic>;
         }
         return resData;
      }
      throw Exception('Failed to check serviceability: $e');
    }
  }

  // Create a new booking after payment
  Future<Map<String, dynamic>> createBooking({
    required String customerId,
    required String serviceType,
    required Map<String, dynamic> serviceConfig,
    required Map<String, dynamic> location,
    required String scheduledDate,
    required String scheduledTimeSlot,
    required List<Map<String, dynamic>> lineItems,
    double? totalAmount,
    double? amountPaid,
    String? paymentId,
    String? orderId,
    String? notes,
  }) async {
    try {
      final response = await _dio.post('/bookings', data: {
        'customerId': customerId,
        'serviceType': serviceType,
        'serviceConfig': serviceConfig,
        'location': location,
        'scheduledDate': scheduledDate,
        'scheduledTimeSlot': scheduledTimeSlot,
        'lineItems': lineItems,
        if (totalAmount != null) 'totalAmount': totalAmount,
        if (amountPaid != null) 'amountPaid': amountPaid,
        if (paymentId != null) 'paymentId': paymentId,
        if (orderId != null) 'orderId': orderId,
        if (notes != null) 'notes': notes,
      });
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Failed to create booking: $e');
    }
  }
}

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(dioProvider));
});
