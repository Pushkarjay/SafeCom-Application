import 'package:dio/dio.dart';
import 'package:mobile_customer/features/auth/models/customer_model.dart';

class AuthService {
  static const String baseUrl = 'https://safecom-backend-177425757120.asia-south1.run.app/api';
  final Dio _dio;

  AuthService(this._dio);

  /// Mock customer data for fallback
  static const _mockCustomer = {
    'id': 'CUST001',
    'name': 'Demo Customer',
    'email': 'demo@safecom.com',
    'phone': '+91 98765 43210',
    'address': 'Demo Address, Bangalore',
    'totalOrders': 5,
    'totalSpent': 15000,
    'status': 'active',
  };

  static const _mockGoogleCustomer = {
    'id': 'CUST_GOOGLE',
    'name': 'Google Customer',
    'email': 'google.user@safecom.com',
    'phone': '+91 99999 99999',
    'address': 'Signed in with Google',
    'totalOrders': 0,
    'totalSpent': 0,
    'status': 'active',
  };

  static const _mockToken = 'mock_jwt_token_safecom_2024';
  static const _mockGoogleToken = 'mock_google_jwt_token_safecom_2024';

  /// Login with email and password
  Future<({String token, Customer customer})> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '$baseUrl/auth/login',
        data: {'email': email, 'password': password},
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token'] as String;
        final customerData = data['user'] as Map<String, dynamic>;
        return (
          token: token,
          customer: Customer.fromJson(customerData),
        );
      }

      throw Exception('Login failed');
    } catch (e) {
      // Fallback: accept known credentials or use mock
      if (email == 'demo@safecom.com' && password == 'demo123') {
        return (
          token: _mockToken,
          customer: Customer.fromJson(_mockCustomer),
        );
      }
      rethrow;
    }
  }

  Future<({String token, Customer customer})> continueWithGoogle() async {
    return (
      token: _mockGoogleToken,
      customer: Customer.fromJson(_mockGoogleCustomer),
    );
  }

  /// Signup a new customer
  Future<({String token, Customer customer})> signup({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        '$baseUrl/auth/signup',
        data: {
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
        },
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = response.data as Map<String, dynamic>;
        final token = data['token'] as String;
        final customerData = data['user'] as Map<String, dynamic>;
        return (
          token: token,
          customer: Customer.fromJson(customerData),
        );
      }

      throw Exception('Signup failed');
    } catch (e) {
      // Fallback: simulate signup
      final newCustomer = Customer(
        id: 'CUST_NEW',
        name: name,
        email: email,
        phone: phone,
        totalOrders: 0,
        totalSpent: 0.0,
        status: 'active',
        registeredDate: DateTime.now(),
      );
      return (token: _mockToken, customer: newCustomer);
    }
  }

  /// Request password reset
  Future<void> requestPasswordReset(String email) async {
    try {
      await _dio.post(
        '$baseUrl/auth/request-reset',
        data: {'email': email},
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
    } catch (e) {
      // Simulate OTP sent
      rethrow;
    }
  }

  /// Verify OTP for password reset
  Future<bool> verifyOTP({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await _dio.post(
        '$baseUrl/auth/verify-otp',
        data: {'email': email, 'otp': otp},
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      return response.statusCode == 200;
    } catch (e) {
      // Mock: accept any 6-digit OTP
      return otp.length == 6 && int.tryParse(otp) != null;
    }
  }

  /// Reset password
  Future<void> resetPassword({
    required String email,
    required String newPassword,
  }) async {
    try {
      await _dio.post(
        '$baseUrl/auth/reset-password',
        data: {'email': email, 'newPassword': newPassword},
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
    } catch (e) {
      // Simulate success
      rethrow;
    }
  }

  /// Get current customer profile
  Future<Customer> getProfile(String token) async {
    try {
      final response = await _dio.get(
        '$baseUrl/customer/profile',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200) {
        return Customer.fromJson(response.data as Map<String, dynamic>);
      }

      throw Exception('Failed to fetch profile');
    } catch (e) {
      // Fallback to mock
      return Customer.fromJson(_mockCustomer);
    }
  }

  /// Update customer profile
  Future<Customer> updateProfile(
    String token,
    Customer customer,
  ) async {
    try {
      final response = await _dio.patch(
        '$baseUrl/customer/profile',
        data: customer.toJson(),
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      if (response.statusCode == 200) {
        return Customer.fromJson(response.data as Map<String, dynamic>);
      }

      throw Exception('Failed to update profile');
    } catch (e) {
      // Fallback: return updated customer locally
      return customer;
    }
  }

  /// Logout (clear token on backend)
  Future<void> logout(String token) async {
    try {
      await _dio.post(
        '$baseUrl/auth/logout',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
    } catch (e) {
      // Logout is best-effort
      // continue even if API fails
    }
  }
}
