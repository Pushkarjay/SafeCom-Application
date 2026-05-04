import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:mobile_customer/features/auth/models/customer_model.dart';
import '../../../core/config/api_config.dart';

class AuthService {
  static const String baseUrl = ApiConfig.baseUrl;
  final Dio _dio;

  AuthService(this._dio);





  /// Login with email and password
  Future<({String token, Customer customer})> login({
    required String email,
    required String password,
  }) async {
    // Prefer Firebase Authentication first
    try {
      final fb = FirebaseAuth.instance;
      final cred = await fb.signInWithEmailAndPassword(email: email, password: password);
      final idToken = await cred.user?.getIdToken();
      final customer = Customer(
        id: cred.user?.uid,
        name: cred.user?.displayName ?? email.split('@').first,
        email: email,
        phone: '',
        totalOrders: 0,
        totalSpent: 0.0,
        registeredDate: cred.user?.metadata.creationTime,
        status: 'active',
      );

      // Link Firebase user to backend Firestore (non-blocking)
      if (cred.user != null) {
        await linkUserToBackend(
          firebaseUid: cred.user!.uid,
          email: email,
          displayName: cred.user!.displayName ?? email.split('@').first,
          phone: '',
        );
      }

      return (token: idToken ?? (throw Exception('No Firebase ID token')), customer: customer);
    } catch (fbErr) {
      // If Firebase auth fails, fallback to backend auth (existing behavior)
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
        rethrow;
      }
    }
  }

  Future<({String token, Customer customer})> continueWithGoogle() async {
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) {
        throw Exception('Google sign-in canceled');
      }
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final user = userCredential.user;
      if (user == null) {
        throw Exception('Google sign-in failed');
      }
      final idToken = await user.getIdToken();
      final customer = Customer(
        id: user.uid,
        name: user.displayName ?? user.email?.split('@').first ?? 'Customer',
        email: user.email ?? '',
        phone: user.phoneNumber ?? '',
        totalOrders: 0,
        totalSpent: 0.0,
        registeredDate: user.metadata.creationTime,
        status: 'active',
      );

      await linkUserToBackend(
        firebaseUid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? customer.name ?? 'Customer',
        phone: user.phoneNumber ?? '',
      );

      return (token: idToken ?? (throw Exception('No Firebase ID token')), customer: customer);
    } catch (e) {
      rethrow;
    }
  }

  /// Signup a new customer
  Future<({String token, Customer customer})> signup({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    // Try to create user in Firebase first
    try {
      final fb = FirebaseAuth.instance;
      final cred = await fb.createUserWithEmailAndPassword(email: email, password: password);
      // Optionally set displayName
      if (cred.user != null) {
        await cred.user!.updateDisplayName(name);
      }
      final idToken = await cred.user?.getIdToken();
      final customer = Customer(
        id: cred.user?.uid,
        name: name,
        email: email,
        phone: phone,
        totalOrders: 0,
        totalSpent: 0.0,
        registeredDate: cred.user?.metadata.creationTime,
        status: 'active',
      );

      // Link Firebase user to backend Firestore (non-blocking)
      if (cred.user != null) {
        await linkUserToBackend(
          firebaseUid: cred.user!.uid,
          email: email,
          displayName: name,
          phone: phone,
        );
      }

      return (token: idToken ?? (throw Exception('No Firebase ID token')), customer: customer);
    } catch (fbErr) {
      // Fallback to backend signup
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
        rethrow;
      }
    }
  }

  /// Helper to get current Firebase ID token if signed in
  Future<String?> getFirebaseIdToken() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      return user == null ? null : await user.getIdToken();
    } catch (_) {
      return null;
    }
  }

  /// Link Firebase user to backend Firestore document after successful authentication
  Future<void> linkUserToBackend({
    required String firebaseUid,
    required String email,
    required String displayName,
    required String phone,
    String? address,
  }) async {
    try {
      final idToken = await getFirebaseIdToken();
      if (idToken == null) {
        throw Exception('No Firebase ID token available for linking');
      }

      await _dio.post(
        '$baseUrl/users/link',
        data: {
          'email': email,
          'displayName': displayName,
          'name': displayName,
          'phone': phone,
          'address': address,
          'role': 'customer',
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $idToken',
          },
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );
    } catch (e) {
      // Log but don't fail - user is already authenticated
      // ignore: avoid_print
      print('Warning: Failed to link user to backend: $e');
    }
  }

  /// Request password reset
  Future<void> requestPasswordReset(String email) async {
    try {
      await FirebaseAuth.instance.sendPasswordResetEmail(email: email);
    } catch (_) {
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
        rethrow;
      }
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
      rethrow;
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
      rethrow;
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

