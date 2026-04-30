import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/data/datasources/jobs_datasource.dart';
import 'package:mobile_employee/data/models/job_models.dart';

final assignedJobsProvider =
    FutureProvider.autoDispose.family<List<AssignedJob>, String>((ref, technicianId) {
  final jobsDataSource = ref.watch(jobsApiDatasourceProvider);
  return jobsDataSource.getAssignedJobs(technicianId);
});
