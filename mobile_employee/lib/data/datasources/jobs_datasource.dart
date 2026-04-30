import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/data/datasources/api_service.dart';
import 'package:mobile_employee/data/models/job_models.dart';

final jobsApiDatasourceProvider = Provider<JobsApiDatasource>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return JobsApiDatasource(apiService);
});

class JobsApiDatasource {
  final ApiService _apiService;

  JobsApiDatasource(this._apiService);

  Future<List<AssignedJob>> getAssignedJobs(String technicianId) async {
    try {
      final response = await _apiService.get('/jobs');

      if (response.statusCode == 200 && response.data is List) {
        final List data = response.data as List;
        final matchingJobs = data.where((json) {
          final assignedTechnician = json['technicianId']?.toString();
          return assignedTechnician == technicianId;
        });

        return matchingJobs.map<AssignedJob>((json) {
          final map = <String, dynamic>{
            'id': json['id'] ?? '',
            'customer_id': json['customerId'] ?? '',
            'customer_name': json['customerName'] ?? json['customerId'] ?? '',
            'customer_phone': json['customerPhone'] ?? '',
            'service_type': json['serviceType'] ?? '',
            'location': json['location'] ?? '',
            'latitude': (json['latitude'] as num?)?.toDouble() ?? 0.0,
            'longitude': (json['longitude'] as num?)?.toDouble() ?? 0.0,
            'scheduled_date_time': _parseScheduledDate(json['scheduledDate']),
            'status': json['status'] ?? 'pending',
            'estimated_amount': (json['amount'] as num?)?.toDouble() ?? 0.0,
            'notes': json['notes'] ?? ''
          };
          return AssignedJob.fromJson(map);
        }).toList();
      } else {
        throw Exception('Failed to load jobs: Invalid response format');
      }
    } catch (e) {
      // Re-throw the exception to be handled by the caller
      throw Exception('Failed to fetch assigned jobs: $e');
    }
  }

  Future<void> submitWorkCompletion(
    String jobId,
    String completionNotes,
    double actualAmount,
    double collectedAmount,
  ) async {
    try {
      await _apiService.patch('/jobs/$jobId', {
        'status': 'completed',
        'notes': completionNotes,
        'amount': actualAmount,
        'completedDate': DateTime.now().toIso8601String(),
        'collectedAmount': collectedAmount,
      });
    } catch (e) {
      throw Exception('Failed to submit work completion: $e');
    }
  }

  String _parseScheduledDate(dynamic rawDate) {
    if (rawDate == null) {
      return DateTime.now().toIso8601String();
    }

    final value = rawDate.toString();
    final parsed = DateTime.tryParse(value);
    if (parsed != null) {
      return parsed.toIso8601String();
    }

    return DateTime.now().toIso8601String();
  }
}
