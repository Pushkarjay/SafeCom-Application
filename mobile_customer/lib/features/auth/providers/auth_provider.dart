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
      
      // If Firebase says we're logged out but our state says we're logged in, sync it
      if (user == null && state.isAuthenticated) {
        logout();
      }
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
        
        // Check if Firebase still has a signed-in user
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          try {
            final idToken = await user.getIdToken();
            if (idToken == null) throw Exception('Null token');
            state = AuthState(
              customer: customer,
              token: idToken,
              isAuthenticated: true,
              isLoading: false,
            );
            
            // Silently refresh customer profile from backend in background
            _refreshCustomerProfile(idToken);
            return;
          } catch (e) {
            // Token refresh failed, but Firebase user is still signed in
            // Restore session anyway with stored token
            state = AuthState(
              customer: customer,
              token: tokenStr,
              isAuthenticated: true,
              isLoading: false,
            );
            return;
          }
        }
        
        // Firebase user is null, clear session
        await _clearSession();
        state = AuthState();
      }
    } catch (e) {
      state = AuthState();
    }
  }

  Future<void> _refreshCustomerProfile(String token) async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;
      final fresh = await authService.getProfile(token, user.uid);
      await _saveSession(token, fresh);
      if (mounted) {
        state = state.copyWith(customer: fresh);
      }
    } catch (_) {
      // Silently ignore — cached data is fine
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
      // Silently refresh profile from backend to get saved data
      _refreshCustomerProfile(token);
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
      // Silently refresh profile from backend to get saved data
      _refreshCustomerProfile(token);
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
    if (state.customer == null) throw Exception('No customer found');
    
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await authService.updateProfile(state.token!, state.customer?.id ?? '', customer);
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
