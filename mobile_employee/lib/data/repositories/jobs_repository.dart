import 'package:mobile_employee/data/datasources/jobs_datasource.dart';
import 'package:mobile_employee/data/models/job_models.dart';

class JobsRepository {
  final JobsApiDatasource _datasource;

  JobsRepository({required JobsApiDatasource datasource})
      : _datasource = datasource;

  Future<List<AssignedJob>> getAssignedJobs(String technicianId) =>
      _datasource.getAssignedJobs(technicianId);

  Future<List<AssignedJob>> getAvailableJobs() =>
      _datasource.getAvailableJobs();

  Future<void> pickupJob(String jobId, String employeeId, String name, String phone) =>
      _datasource.pickupJob(jobId, employeeId, name, phone);

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
