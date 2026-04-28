import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/data/datasources/jobs_datasource.dart';
import 'package:dio/dio.dart';
import 'package:mobile_employee/data/models/job_models.dart';
import 'package:mobile_employee/data/repositories/jobs_repository.dart';

final jobsDatasourceProvider = Provider<JobsApiDatasource>(
  (ref) => JobsApiDatasource(Dio()),
);

final jobsRepositoryProvider = Provider<JobsRepository>(
  (ref) => JobsRepository(datasource: ref.watch(jobsDatasourceProvider)),
);

final assignedJobsProvider = FutureProvider<List<AssignedJob>>(
  (ref) => ref.watch(jobsRepositoryProvider).getAssignedJobs('TECH001'),
);

final selectedJobProvider = StateProvider<AssignedJob?>((ref) => null);
