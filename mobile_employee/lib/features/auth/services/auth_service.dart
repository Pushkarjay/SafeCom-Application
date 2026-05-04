import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../../core/config/api_config.dart';

class AuthService {
  static const String baseUrl = ApiConfig.baseUrl;
  final FirebaseAuth? _auth = kIsWeb ? null : FirebaseAuth.instance;
  final Dio _dio;

  AuthService(this._dio);

  Stream<User?> authStateChanges() =>
      _auth == null ? const Stream<User?>.empty() : _auth.authStateChanges();

  User? currentUser() => _auth?.currentUser;

  Future<String?> getIdToken() async {
    if (_auth == null) return null;
    final user = _auth.currentUser;
    if (user == null) return null;
    return await user.getIdToken();
  }

  Future<UserCredential> signInWithEmail(String email, String password) async {
    if (_auth == null) {
      throw Exception('Firebase auth not available on web for employee app');
    }
    return await _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential> signUpWithEmail(String email, String password) async {
    if (_auth == null) {
      throw Exception('Firebase auth not available on web for employee app');
    }
    return await _auth.createUserWithEmailAndPassword(email: email, password: password);
  }

  Future<void> signOut() async {
    if (_auth == null) return;
    await _auth.signOut();
  }

  /// Link Firebase user to backend Firestore document after successful authentication
  Future<void> linkUserToBackend({
    required String firebaseUid,
    required String email,
    required String displayName,
    required String phone,
    required String location,
    List<String>? skills,
  }) async {
    try {
      final idToken = await getIdToken();
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
          'location': location,
          'skills': skills ?? [],
          'role': 'employee',
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $idToken',
          },
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );

      final deviceToken = await FirebaseMessaging.instance.getToken();
      if (deviceToken != null && deviceToken.isNotEmpty) {
        await _dio.post(
          '$baseUrl/employees/device-token',
          data: { 'token': deviceToken },
          options: Options(
            headers: {
              'Authorization': 'Bearer $idToken',
            },
            sendTimeout: const Duration(seconds: 10),
            receiveTimeout: const Duration(seconds: 10),
          ),
        );
      }
    } catch (e) {
      // Log but don't fail - user is already authenticated
      // ignore: avoid_print
      print('Warning: Failed to link user to backend: $e');
    }
  }
}

late AuthService authService;
