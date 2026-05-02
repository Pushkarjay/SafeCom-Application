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

  // Get installation pricing
  Future<Map<String, dynamic>> getInstallationPricing() async {
    try {
      final response = await _dio.get('/catalog-public/pricing/installation');
      return response.data as Map<String, dynamic>;
    } catch (e) {
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
}

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(dioProvider));
});