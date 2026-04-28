import 'package:mobile_employee/data/datasources/jobs_datasource.dart';
import 'package:mobile_employee/data/models/job_models.dart';

class JobsRepository {
  final JobsApiDatasource _datasource;

  JobsRepository({required JobsApiDatasource datasource})
      : _datasource = datasource;

  Future<List<AssignedJob>> getAssignedJobs(String technicianId) =>
      _datasource.getAssignedJobs(technicianId);

  Future<void> submitWorkCompletion(
    String jobId,
    String completionNotes,
    double actualAmount,
    double collectedAmount,
  ) =>
      _datasource.submitWorkCompletion(
        jobId,
        completionNotes,
        actualAmount,
        collectedAmount,
      );
}
