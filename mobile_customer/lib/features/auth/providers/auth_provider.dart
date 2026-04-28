import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/features/auth/models/customer_model.dart';
import 'package:mobile_customer/features/auth/services/auth_service.dart';

final dioProvider = Provider((ref) => Dio());

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
      error: error ?? this.error,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService authService;

  AuthNotifier(this.authService) : super(AuthState());

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final (:token, :customer) = await authService.login(
        email: email,
        password: password,
      );
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

  Future<void> signup({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final (:token, :customer) = await authService.signup(
        name: name,
        email: email,
        phone: phone,
        password: password,
      );
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
    state = AuthState();
  }

  Future<void> updateProfile(Customer customer) async {
    if (state.token == null) throw Exception('Not authenticated');
    
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updated = await authService.updateProfile(state.token!, customer);
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

  Future<void> requestPasswordReset(String email) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await authService.requestPasswordReset(email);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      rethrow;
    }
  }

  Future<bool> verifyOTP({
    required String email,
    required String otp,
  }) async {
    try {
      return await authService.verifyOTP(email: email, otp: otp);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> resetPassword({
    required String email,
    required String newPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await authService.resetPassword(email: email, newPassword: newPassword);
      state = state.copyWith(isLoading: false);
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
  return AuthNotifier(authService);
});
