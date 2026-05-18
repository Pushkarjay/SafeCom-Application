import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:mobile_employee/data/datasources/api_service.dart';
import 'package:mobile_employee/data/datasources/employee_datasource.dart';
import 'package:mobile_employee/data/datasources/earnings_datasource.dart';
import 'package:mobile_employee/data/models/employee_models.dart';
import 'package:mobile_employee/features/auth/services/auth_service.dart';

// Initialize authService with Dio
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(dioProvider));
});

final authStateProvider = StreamProvider<User?>((ref) {
  final auth = FirebaseAuth.instance;
  return auth.authStateChanges();
});

final activeEmployeeIdProvider = Provider<String>((ref) {
  if (kIsWeb) {
    return 'TECH001';
  }
  final authState = ref.watch(authStateProvider);
  final uid = authState.value?.uid;
  if (uid != null) return uid;
  final fallback = FirebaseAuth.instance.currentUser?.uid;
  return fallback ?? '';
});

final employeeDatasourceProvider = Provider<EmployeeDatasource>((ref) {
  return EmployeeDatasource(ref.watch(apiServiceProvider));
});

final earningsDatasourceProvider = Provider<EarningsDatasource>((ref) {
  return EarningsDatasource(ref.watch(apiServiceProvider));
});

final employeeProfileProvider = FutureProvider.family<EmployeeProfile, String>((ref, employeeId) {
  return ref.watch(employeeDatasourceProvider).getEmployeeProfile(employeeId);
});

final employeeEarningsProvider = FutureProvider.family<List<EarningEntry>, String>((ref, employeeId) {
  return ref.watch(earningsDatasourceProvider).getEarnings(employeeId);
});
