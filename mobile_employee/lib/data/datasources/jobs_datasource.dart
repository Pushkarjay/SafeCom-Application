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
      final response = await _apiService.get('/jobs?employeeId=$technicianId');

      if (response.statusCode == 200 && response.data is List) {
        final List data = response.data as List;
        final matchingJobs = data;

        return matchingJobs.map<AssignedJob>((json) {
          final map = <String, dynamic>{
            'id': json['jobId'] ?? json['id'] ?? '',
            'customer_id': json['customerId'] ?? '',
            'customerName': json['customer']?['name'] ?? json['customerId'] ?? '',
            'customerPhone': json['customer']?['phone'] ?? '',
            'service_type': json['serviceType'] ?? '',
            'location': json['location']?['address'] ?? json['location'] ?? '',
            'latitude': (json['location']?['latitude'] as num?)?.toDouble() ?? (json['latitude'] as num?)?.toDouble() ?? 0.0,
            'longitude': (json['location']?['longitude'] as num?)?.toDouble() ?? (json['longitude'] as num?)?.toDouble() ?? 0.0,
            'scheduled_date_time': _parseScheduledDate(json['scheduledDate'] ?? json['scheduled_date_time']),
            'status': json['status'] ?? 'pending',
            'estimated_amount': (json['invoice']?['grandTotal'] as num?)?.toDouble() ?? (json['amount'] as num?)?.toDouble() ?? 0.0,
            'notes': json['notes'] ?? '',
            if (json['invoice'] != null) 'invoice': json['invoice'],
          };
          return AssignedJob.fromJson(map);
        }).toList();
      } else {
        throw Exception('Failed to load jobs: Invalid response format');
      }
    } catch (e) {
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
