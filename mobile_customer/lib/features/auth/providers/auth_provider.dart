import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile_customer/features/auth/models/customer_model.dart';
import 'package:mobile_customer/features/auth/services/auth_service.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/core/sdui/sdui_provider.dart';

final sharedPreferencesProvider = Provider<SharedPreferences?>((ref) => null);

final authServiceProvider = Provider((ref) {
  return AuthService(ref.watch(dioProvider));
});

// Auth state notifier
class AuthState {
  final Customer? customer;
  final String? token;
  final bool isLoading;
  final String? error;
  final bool isAuthenticated;

  AuthState({
    this.customer,
    this.token,
    this.isLoading = false,
    this.error,
    this.isAuthenticated = false,
  });

  AuthState copyWith({
    Customer? customer,
    String? token,
    bool? isLoading,
    String? error,
    bool? isAuthenticated,
  }) {
    return AuthState(
      customer: customer ?? this.customer,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error, // Allow null to clear error
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService authService;
  final SharedPreferences? prefs;

  AuthNotifier(this.authService, this.prefs) : super(AuthState()) {
    _restoreSession();
    // Listen to Firebase auth state changes
    FirebaseAuth.instance.authStateChanges().listen((user) {
      // Invalidate SDUI cache on auth state change
      invalidateSduiCache();
    });
  }

  void _restoreSession() async {
    try {
      final prefs = this.prefs;
      if (prefs == null) {
        return;
      }

      final tokenStr = prefs.getString('auth_token');
      final customerStr = prefs.getString('auth_customer');

      if (tokenStr != null && customerStr != null) {
        final customer = Customer.fromJson(
          jsonDecode(customerStr) as Map<String, dynamic>,
        );
        
        // Verify the token is still valid by checking with Firebase
        try {
          final user = FirebaseAuth.instance.currentUser;
          if (user != null) {
            final idToken = await user.getIdToken(/* forceRefresh */ false);
            if (idToken == tokenStr) {
              // Token matches current user, session is valid
              state = AuthState(
                customer: customer,
                token: tokenStr,
                isAuthenticated: true,
                isLoading: false,
              );
              return;
            }
          }
        } catch (e) {
          // Token verification failed, fall through to clear session
        }
        
        // If we reach here, token is invalid or user changed
        await _clearSession();
        state = AuthState();
      }
    } catch (e) {
      // Silently ignore session restoration errors
      state = AuthState();
    }
  }

  Future<void> _saveSession(String token, Customer customer) async {
    try {
      final prefs = this.prefs;
      if (prefs == null) {
        return;
      }

      await prefs.setString('auth_token', token);
      await prefs.setString('auth_customer', jsonEncode(customer.toJson()));
    } catch (e) {
      // Continue even if save fails
    }
  }

  Future<void> _clearSession() async {
    try {
      final prefs = this.prefs;
      if (prefs == null) {
        return;
      }

      await prefs.remove('auth_token');
      await prefs.remove('auth_customer');
    } catch (e) {
      // Continue even if clear fails
    }
  }

  Future<void> continueWithGoogle() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final (:token, :customer) = await authService.continueWithGoogle();
      await _saveSession(token, customer);
      state = AuthState(
        customer: customer,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        isAuthenticated: false,
      );
      rethrow;
    }
  }

  Future<void> signInWithPhoneCredential(PhoneAuthCredential credential) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final (:token, :customer) = await authService.signInWithPhoneCredential(credential);
      await _saveSession(token, customer);
      state = AuthState(
        customer: customer,
        token: token,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        isAuthenticated: false,
      );
      rethrow;
    }
  }

  Future<void> logout() async {
    if (state.token != null) {
      try {
        await authService.logout(state.token!);
      } catch (e) {
        // Continue even if logout fails
      }
    }
    await _clearSession();
    state = AuthState();
  }

  Future<void> updateProfile(Customer customer) async {
    if (state.token == null) throw Exception('Not authenticated');
    
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await authService.updateProfile(state.token!, customer);
      await _saveSession(state.token!, updated);
      state = state.copyWith(
        customer: updated,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  final prefs = ref.watch(sharedPreferencesProvider);
  return AuthNotifier(authService, prefs);
});
