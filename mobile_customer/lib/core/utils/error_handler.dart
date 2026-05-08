import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';

/// Global error handler — maps raw Firebase/Dio errors to user-friendly messages.
/// NEVER show raw exception strings to users.
class AppErrorHandler {
  AppErrorHandler._();

  /// Map a Firebase error code to a friendly message.
  static String mapFirebaseCode(String code) {
    switch (code) {
      case 'user-not-found':
        return 'No account found. Try signing in with Google.';
      case 'wrong-password':
        return 'Incorrect credentials. Please try again.';
      case 'invalid-email':
        return 'Please enter a valid email address.';
      case 'user-disabled':
        return 'Your account has been disabled. Contact support.';
      case 'too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'network-request-failed':
        return 'No internet connection. Check your network and try again.';
      case 'invalid-verification-code':
        return 'Incorrect OTP. Please check and try again.';
      case 'invalid-phone-number':
        return 'Enter a valid Indian phone number (e.g. +91 98765 43210).';
      case 'session-expired':
        return 'OTP session expired. Please request a new OTP.';
      case 'quota-exceeded':
        return 'SMS limit reached. Please try again later.';
      case 'sign_in_canceled':
      case 'canceled':
        return 'Sign-in was cancelled.';
      case 'account-exists-with-different-credential':
        return 'An account already exists with this email. Try another sign-in method.';
      case 'PERMISSION_DENIED':
        return 'Access denied. Please contact support.';
      case 'ERROR_INVALID_CREDENTIALS':
      case 'ERROR_INVALID_USER_TOKEN':
        return 'Authentication failed. Try again or use Guest mode.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  /// Map any error object to a friendly message.
  static String mapError(dynamic error) {
    if (error is FirebaseAuthException) {
      return mapFirebaseCode(error.code);
    }
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Request timed out. Please try again.';
        case DioExceptionType.connectionError:
          return 'No internet connection. Check your network and try again.';
        case DioExceptionType.badResponse:
          final statusCode = error.response?.statusCode ?? 0;
          if (statusCode == 401) return 'Session expired. Please sign in again.';
          if (statusCode == 403) return 'Access denied. Please contact support.';
          if (statusCode == 404) return 'Service not found. Please try again later.';
          if (statusCode >= 500) return 'Server error. Please try again later.';
          return 'Something went wrong. Please try again.';
        case DioExceptionType.cancel:
          return 'Request was cancelled.';
        default:
          return 'Something went wrong. Please try again.';
      }
    }
    final msg = error?.toString() ?? '';
    if (msg.contains('network') || msg.contains('SocketException')) {
      return 'No internet connection. Check your network and try again.';
    }
    if (msg.contains('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (msg.contains('canceled') || msg.contains('cancelled')) {
      return 'Sign-in was cancelled.';
    }
    return 'Something went wrong. Please try again.';
  }

  /// Show a user-friendly error dialog.
  static void showDialog(context, dynamic error, {String? title}) {
    final message = mapError(error);
    showAdaptiveDialog(
      context: context,
      builder: (ctx) => AlertDialog.adaptive(
        title: Text(title ?? 'Oops!'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  /// Show a lightweight snackbar for non-critical errors.
  static void showSnackbar(context, dynamic error) {
    final message = mapError(error);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: const Color(0xFFDC2626),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 4),
      ),
    );
  }
}
