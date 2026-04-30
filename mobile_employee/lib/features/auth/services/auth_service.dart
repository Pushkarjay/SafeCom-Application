import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';

class AuthService {
  static const String baseUrl = 'https://safecom-backend-177425757120.asia-south1.run.app/api';
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final Dio _dio;

  AuthService(this._dio);

  Stream<User?> authStateChanges() => _auth.authStateChanges();

  User? currentUser() => _auth.currentUser;

  Future<String?> getIdToken() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    return await user.getIdToken();
  }

  Future<UserCredential> signInWithEmail(String email, String password) async {
    return await _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential> signUpWithEmail(String email, String password) async {
    return await _auth.createUserWithEmailAndPassword(email: email, password: password);
  }

  Future<void> signOut() async {
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
    } catch (e) {
      // Log but don't fail - user is already authenticated
      // ignore: avoid_print
      print('Warning: Failed to link user to backend: $e');
    }
  }
}

late AuthService authService;
