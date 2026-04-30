import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:mobile_employee/data/datasources/api_service.dart';
import 'package:mobile_employee/data/datasources/employee_datasource.dart';
import 'package:mobile_employee/data/datasources/earnings_datasource.dart';
import 'package:mobile_employee/data/models/employee_models.dart';
import 'package:mobile_employee/features/auth/services/auth_service.dart';

// Initialize authService with Dio
final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(dioProvider));
});

final activeEmployeeIdProvider = Provider<String>((ref) {
  final user = FirebaseAuth.instance.currentUser;
  return user?.uid ?? 'TECH001';
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
