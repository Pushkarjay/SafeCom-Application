import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:mobile_customer/features/auth/models/customer_model.dart';
import '../../../core/config/api_config.dart';

class AuthService {
  static const String baseUrl = ApiConfig.baseUrl;
  // Use the Web Client ID from google-services.json (client_type: 3)
  static const String googleClientId = '177425757120-8qjlgdfeen9tf3n58r5ctfnilnnvc88u.apps.googleusercontent.com';
  
  final Dio _dio;

  AuthService(this._dio);

  // ─── Google Sign-In ───────────────────────────────────────────────────────

  Future<({String token, Customer customer})> continueWithGoogle() async {
    try {
      // ignore: avoid_print
      print('01: Starting Google Sign-In...');
      
      final googleSignIn = GoogleSignIn(
        clientId: googleClientId,
      );
      
      final googleUser = await googleSignIn.signIn();
      // ignore: avoid_print
      print('02: googleUser: $googleUser');
      if (googleUser == null) {
        throw Exception('sign_in_canceled');
      }
      // ignore: avoid_print
      print('03: Got Google user: ${googleUser.email}');
      final googleAuth = await googleUser.authentication;
      // ignore: avoid_print
      print('04: Got auth tokens, accessToken: ${googleAuth.accessToken?.substring(0, 10)}...');
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      // ignore: avoid_print
      print('05: Created credential, signing in to Firebase...');
      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      // ignore: avoid_print
      print('06: Got userCredential');
      final user = userCredential.user;
      if (user == null) {
        throw Exception('Firebase sign-in failed - no user returned');
      }
      // ignore: avoid_print
      print('07: Firebase user: ${user.uid}, email: ${user.email}');
      final idToken = await user.getIdToken();
      // ignore: avoid_print
      print('08: Got ID token');
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
        displayName: user.displayName ?? customer.name,
        phone: user.phoneNumber ?? '',
      );

      return (token: idToken ?? (throw Exception('No Firebase ID token')), customer: customer);
    } catch (_) {
      rethrow;
    }
  }

  // ─── Phone OTP Sign-In ────────────────────────────────────────────────────

  /// Initiates phone number verification. Firebase calls the callbacks
  /// for auto-verification, code sent, and errors. The UI should listen
  /// to these callbacks and drive the OTP input step.
  Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required void Function(PhoneAuthCredential) onVerificationCompleted,
    required void Function(FirebaseAuthException) onVerificationFailed,
    required void Function(String verificationId, int? resendToken) onCodeSent,
    required void Function(String verificationId) onCodeAutoRetrievalTimeout,
    Duration timeout = const Duration(seconds: 60),
  }) async {
    // Normalise to +91 if no country code supplied
    final formatted = phoneNumber.startsWith('+') ? phoneNumber : '+91$phoneNumber';

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: formatted,
      timeout: timeout,
      verificationCompleted: onVerificationCompleted,
      verificationFailed: onVerificationFailed,
      codeSent: onCodeSent,
      codeAutoRetrievalTimeout: onCodeAutoRetrievalTimeout,
    );
  }

  /// Signs in with a manually entered OTP.
  Future<({String token, Customer customer})> signInWithOtp({
    required String verificationId,
    required String smsCode,
  }) async {
    final credential = PhoneAuthProvider.credential(
      verificationId: verificationId,
      smsCode: smsCode,
    );
    return signInWithPhoneCredential(credential);
  }

  /// Signs in with a PhoneAuthCredential (either from OTP or auto-verify).
  Future<({String token, Customer customer})> signInWithPhoneCredential(
    PhoneAuthCredential credential,
  ) async {
    final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
    final user = userCredential.user;
    if (user == null) throw Exception('Phone sign-in failed');

    final idToken = await user.getIdToken();
    final customer = Customer(
      id: user.uid,
      name: user.displayName ?? 'Customer',
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
      displayName: user.displayName ?? 'Customer',
      phone: user.phoneNumber ?? '',
    );

    return (token: idToken ?? (throw Exception('No Firebase ID token')), customer: customer);
  }

  // ─── Duplicate Checks ──────────────────────────────────────────────────────

  /// Check if an email is already registered by another customer.
  Future<bool> checkEmailExists(String email, {String? excludeCustomerId}) async {
    try {
      final idToken = await getFirebaseIdToken();
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (idToken != null) headers['Authorization'] = 'Bearer $idToken';
      final response = await _dio.get(
        '$baseUrl/users/by-email/${Uri.encodeComponent(email)}',
        options: Options(headers: headers, sendTimeout: const Duration(seconds: 5), receiveTimeout: const Duration(seconds: 5)),
      );
      if (response.statusCode == 200 && response.data != null) {
        final existingId = response.data['id'] as String?;
        if (existingId != null && existingId != excludeCustomerId) return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Check if a phone number is already registered by another customer.
  Future<bool> checkPhoneExists(String phone, {String? excludeCustomerId}) async {
    try {
      final idToken = await getFirebaseIdToken();
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (idToken != null) headers['Authorization'] = 'Bearer $idToken';
      final response = await _dio.get(
        '$baseUrl/users/by-phone/${Uri.encodeComponent(phone)}',
        options: Options(headers: headers, sendTimeout: const Duration(seconds: 5), receiveTimeout: const Duration(seconds: 5)),
      );
      if (response.statusCode == 200 && response.data != null) {
        final existingId = response.data['id'] as String?;
        if (existingId != null && existingId != excludeCustomerId) return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // ─── Backend Link ─────────────────────────────────────────────────────────

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

  // ─── Profile ──────────────────────────────────────────────────────────────

  /// Get current customer profile
  Future<Customer> getProfile(String token, String customerId) async {
    final response = await _dio.get(
      '$baseUrl/customers/$customerId',
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        sendTimeout: const Duration(seconds: 5),
        receiveTimeout: const Duration(seconds: 5),
      ),
    );

    if (response.statusCode == 200) {
      final body = response.data as Map<String, dynamic>;
      // Backend returns { success: true, data: {...} }; unwrap it so the
      // profile actually loads instead of silently failing on the wrapper.
      final payload = (body['data'] as Map<String, dynamic>?) ?? body;
      return Customer.fromJson(payload);
    }

    throw Exception('Failed to fetch profile');
  }

  /// Update customer profile and sync the users collection.
  Future<Customer> updateProfile(
    String token,
    String customerId,
    Customer customer,
  ) async {
    try {
      final response = await _dio.patch(
        '$baseUrl/customers/$customerId',
        data: customer.toJson(),
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );

      Customer updated;
      if (response.statusCode == 200) {
        final body = response.data as Map<String, dynamic>;
        // Backend returns { success: true, data: {...} }; unwrap it so the
        // updated profile isn't parsed as the wrapper (which has no fields).
        final payload = (body['data'] as Map<String, dynamic>?) ?? body;
        updated = Customer.fromJson(payload);
      } else {
        throw Exception('Failed to update profile');
      }

      // Sync the users collection so Firebase Auth / users doc stays in sync
      await linkUserToBackend(
        firebaseUid: customerId,
        email: customer.email ?? '',
        displayName: customer.name,
        phone: customer.phone,
        address: customer.address,
      );

      return updated;
    } catch (e) {
      // Fallback: return updated customer locally
      return customer;
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

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
    // Always sign out of Firebase locally
    await FirebaseAuth.instance.signOut();
    await GoogleSignIn().signOut();
  }
}
