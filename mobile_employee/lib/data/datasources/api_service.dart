import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../../core/config/api_config.dart';

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    connectTimeout: const Duration(milliseconds: 5000),
    receiveTimeout: const Duration(milliseconds: 3000),
    headers: {'Content-Type': 'application/json'},
  ));

  // Logging
  dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true, error: true));

  // Attach Firebase ID token when available
  dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user != null) {
        final token = await user.getIdToken();
        options.headers['Authorization'] = 'Bearer $token';
      }
    } catch (_) {}
    return handler.next(options);
  }));

  return dio;
});

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService(ref.watch(dioProvider));
});

class ApiService {
  final Dio _dio;

  ApiService(this._dio);

  Future<Response> get(String path) async {
    try {
      final response = await _dio.get(path);
      return response;
    } on DioException catch (e) {
      throw Exception('Failed to load data: ${e.message}');
    } catch (e) {
      throw Exception('An unknown error occurred: $e');
    }
  }

  Future<Response> patch(String path, Map<String, dynamic> body) async {
    try {
      final response = await _dio.patch(path, data: body);
      return response;
    } on DioException catch (e) {
      throw Exception('Failed to update data: ${e.message}');
    } catch (e) {
      throw Exception('An unknown error occurred: $e');
    }
  }

  Future<Response> post(String path, Map<String, dynamic> body) async {
    try {
      final response = await _dio.post(path, data: body);
      return response;
    } on DioException catch (e) {
      throw Exception('Failed to post data: ${e.message}');
    } catch (e) {
      throw Exception('An unknown error occurred: $e');
    }
  }
}
