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

  /// Fetch jobs assigned to a specific technician/employee
  Future<List<AssignedJob>> getAssignedJobs(String technicianId) async {
    try {
      final response = await _apiService.get('/jobs?employeeId=$technicianId');

      if (response.statusCode == 200) {
        final Map<String, dynamic> body = response.data as Map<String, dynamic>;
        if (body['success'] == true && body['data'] is List) {
           final List data = body['data'] as List;
           
           return data.map<AssignedJob>((json) {
              final map = <String, dynamic>{
                'id': json['jobId'] ?? json['id'] ?? '',
                'customer_id': json['customer']?['customerId'] ?? json['customerId'] ?? '',
                'customerName': json['customer']?['name'] ?? 'Customer',
                'customerPhone': json['customer']?['phone'] ?? '',
                'service_type': json['serviceType'] ?? '',
                'location': json['location']?['address'] ?? json['location'] ?? '',
                'latitude': (json['location']?['latitude'] as num?)?.toDouble() ?? 0.0,
                'longitude': (json['location']?['longitude'] as num?)?.toDouble() ?? 0.0,
                'scheduled_date_time': _parseScheduledDate(json['scheduledDate']),
                'status': json['status'] ?? 'pending',
                'estimated_amount': (json['invoice']?['grandTotal'] as num?)?.toDouble() ?? 0.0,
                'notes': json['notes'] ?? '',
                'completionNotes': json['completionNotes'],
                'actualAmount': (json['actualAmount'] as num?)?.toDouble() ?? 0,
                'collectedAmount': (json['collectedAmount'] as num?)?.toDouble() ?? 0,
                if (json['invoice'] != null) 'invoice': json['invoice'],
              };
              return AssignedJob.fromJson(map);
            }).toList();
        }
        return [];
      } else {
        throw Exception('Failed to load jobs: Invalid response status');
      }
    } catch (e) {
      throw Exception('Failed to fetch assigned jobs: $e');
    }
  }

  /// Fetch available (unassigned pending) jobs for the employee job board
  Future<List<AssignedJob>> getAvailableJobs() async {
    try {
      final response = await _apiService.get('/jobs?unassigned=true');

      if (response.statusCode == 200) {
        final Map<String, dynamic> body = response.data as Map<String, dynamic>;
        if (body['success'] == true && body['data'] is List) {
           final List data = body['data'] as List;
           
           return data.map<AssignedJob>((json) {
             final map = <String, dynamic>{
                'id': json['jobId'] ?? json['id'] ?? '',
                'customer_id': json['customer']?['customerId'] ?? json['customerId'] ?? '',
                'customerName': json['customer']?['name'] ?? 'Customer',
                'customerPhone': json['customer']?['phone'] ?? '',
                'service_type': json['serviceType'] ?? '',
                'location': json['location']?['address'] ?? json['location'] ?? '',
                'latitude': (json['location']?['latitude'] as num?)?.toDouble() ?? 0.0,
                'longitude': (json['location']?['longitude'] as num?)?.toDouble() ?? 0.0,
                'scheduled_date_time': _parseScheduledDate(json['scheduledDate']),
                'status': json['status'] ?? 'pending',
                'estimated_amount': (json['invoice']?['grandTotal'] as num?)?.toDouble() ?? 0.0,
                'notes': json['notes'] ?? '',
                'completionNotes': json['completionNotes'],
                'actualAmount': (json['actualAmount'] as num?)?.toDouble() ?? 0,
                'collectedAmount': (json['collectedAmount'] as num?)?.toDouble() ?? 0,
                if (json['invoice'] != null) 'invoice': json['invoice'],
             };
             return AssignedJob.fromJson(map);
           }).toList();
        }
        return [];
      } else {
        throw Exception('Failed to load available jobs');
      }
    } catch (e) {
      throw Exception('Failed to fetch available jobs: $e');
    }
  }

  /// Employee picks up / claims a pending job
  Future<void> pickupJob(String jobId, String employeeId, String name, String phone) async {
    try {
      await _apiService.post('/jobs/$jobId/pickup', {
        'employeeId': employeeId,
        'name': name,
        'phone': phone,
      });
    } catch (e) {
      throw Exception('Failed to pick up job: $e');
    }
  }

  /// Mark job as in-progress
  Future<void> startJob(String jobId) async {
    try {
      await _apiService.patch('/jobs/$jobId', {
        'status': 'in_progress',
      });
    } catch (e) {
      throw Exception('Failed to start job: $e');
    }
  }

  /// Submit work completion
  Future<void> submitWorkCompletion(
    String jobId,
    String completionNotes,
    double actualAmount,
    double collectedAmount,
  ) async {
    try {
      await _apiService.post('/jobs/$jobId/complete', {
        'notes': completionNotes,
        'actualAmount': actualAmount,
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
