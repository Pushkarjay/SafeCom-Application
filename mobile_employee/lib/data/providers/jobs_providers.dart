import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/data/datasources/jobs_datasource.dart';
import 'package:mobile_employee/data/models/job_models.dart';
import 'package:mobile_employee/data/repositories/jobs_repository.dart';

// The jobsApiDatasourceProvider is already defined in jobs_datasource.dart
// final jobsDatasourceProvider = Provider<JobsApiDatasource>(
//   (ref) => JobsApiDatasource(Dio()),
// );

final jobsRepositoryProvider = Provider<JobsRepository>(
  (ref) => JobsRepository(datasource: ref.watch(jobsApiDatasourceProvider)),
);

final assignedJobsProvider = FutureProvider.autoDispose.family<List<AssignedJob>, String>(
  (ref, technicianId) => ref.watch(jobsRepositoryProvider).getAssignedJobs(technicianId),
);

final availableJobsProvider = FutureProvider.autoDispose<List<AssignedJob>>(
  (ref) => ref.watch(jobsRepositoryProvider).getAvailableJobs(),
);

final selectedJobProvider = StateProvider<AssignedJob?>((ref) => null);
