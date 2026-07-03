import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/data/models/job_models.dart';
import 'package:mobile_employee/features/auth/login_screen.dart';
import 'package:mobile_employee/features/auth/splash_screen.dart';
import 'package:mobile_employee/features/jobs/job_detail_screen.dart';
import 'package:mobile_employee/features/jobs/jobs_home_screen.dart';
import 'package:mobile_employee/features/jobs/work_completion_screen.dart';
import 'package:mobile_employee/features/map/map_screen.dart';
import 'package:mobile_employee/features/map/location_picker_screen.dart';
import 'package:mobile_employee/features/earnings/earnings_screen.dart';
import 'package:mobile_employee/features/profile/employee_profile_screen.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: AppRoutes.splash,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const JobsHomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.jobDetail,
        builder: (context, state) {
          final job = state.extra;
          if (job is AssignedJob) {
            return JobDetailScreen(job: job);
          }
          return const Scaffold(
            body: Center(child: Text('Job not found')),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.workCompletion,
        builder: (context, state) {
          final completion = state.extra;
          if (completion is WorkCompletion) {
            return WorkCompletionScreen(completion: completion);
          }
          return const Scaffold(
            body: Center(child: Text('Completion data not found')),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.profile,
        builder: (context, state) => const EmployeeProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.map,
        builder: (context, state) {
          final params = state.extra as Map<String, dynamic>?;
          if (params != null && params['job'] != null) {
            return MapScreen(job: params['job'] as AssignedJob);
          } else if (params != null && params['jobs'] != null) {
            return MapScreen(jobs: params['jobs'] as List<AssignedJob>);
          }
          return const MapScreen();
        },
      ),
      GoRoute(
        path: AppRoutes.locationPicker,
        builder: (context, state) => const LocationPickerScreen(),
      ),
      GoRoute(
        path: AppRoutes.earnings,
        builder: (context, state) => const EarningsDashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.employeeProfile,
        builder: (context, state) => const EmployeeProfileScreen(),
      ),
    ],
  );
});
