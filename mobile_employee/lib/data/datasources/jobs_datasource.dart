import 'package:mobile_employee/data/models/job_models.dart';
import 'package:dio/dio.dart';

const _backendBase = 'http://localhost:4000/api';

class JobsApiDatasource {
  final Dio? _dio;

  JobsApiDatasource([this._dio]);

  Future<List<AssignedJob>> getAssignedJobs(String technicianId) async {
    // Try backend first
    if (_dio != null) {
      try {
        final resp = await _dio!.get('$_backendBase/jobs');
        if (resp.statusCode == 200 && resp.data is List) {
          final List data = resp.data as List;
          final filtered = data.where((j) => j['technicianId'] == technicianId).toList();
          return filtered.map<AssignedJob>((json) {
            final map = <String, dynamic>{
              'id': json['id'] ?? '',
              'customer_id': json['customerId'] ?? '',
              'customer_name': json['customerName'] ?? json['customerId'] ?? '',
              'customer_phone': json['customerPhone'] ?? '',
              'service_type': json['serviceType'] ?? '',
              'location': json['location'] ?? '',
              'latitude': (json['latitude'] as num?)?.toDouble() ?? 0.0,
              'longitude': (json['longitude'] as num?)?.toDouble() ?? 0.0,
              'scheduled_date_time': json['scheduledDate'] ?? DateTime.now().toIso8601String(),
              'status': json['status'] ?? 'pending',
              'estimated_amount': (json['amount'] as num?)?.toDouble() ?? 0.0,
              'notes': json['notes'] ?? ''
            };
            return AssignedJob.fromJson(map);
          }).toList();
        }
      } catch (_) {
        // fallback to mock
      }
    }

    await Future.delayed(const Duration(milliseconds: 500));

    return [
      AssignedJob(
        id: 'JOB001',
        customerId: 'CUST001',
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 9876543210',
        serviceType: 'Installation',
        location: 'Plot 123, Business Park, Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        scheduledDateTime: DateTime.now().add(const Duration(hours: 2)),
        status: 'pending',
        estimatedAmount: 8000,
        notes: '4-camera DVR system installation',
      ),
      AssignedJob(
        id: 'JOB002',
        customerId: 'CUST002',
        customerName: 'Priya Sharma',
        customerPhone: '+91 9123456789',
        serviceType: 'Repair',
        location: 'Apartment 5B, Tech Towers, Bangalore',
        latitude: 12.9750,
        longitude: 77.6050,
        scheduledDateTime: DateTime.now().add(const Duration(hours: 4)),
        status: 'pending',
        estimatedAmount: 1500,
        notes: 'Camera lens replacement - camera 2',
      ),
      AssignedJob(
        id: 'JOB003',
        customerId: 'CUST003',
        customerName: 'Vikas Patel',
        customerPhone: '+91 8765432109',
        serviceType: 'Maintenance',
        location: 'Factory Building, Industrial Area, Bangalore',
        latitude: 12.9550,
        longitude: 77.5850,
        scheduledDateTime: DateTime.now().add(const Duration(hours: 6)),
        status: 'pending',
        estimatedAmount: 2500,
        notes: 'Monthly preventive maintenance',
      ),
      AssignedJob(
        id: 'JOB004',
        customerId: 'CUST004',
        customerName: 'Anjali Singh',
        customerPhone: '+91 9345678901',
        serviceType: 'Upgrade',
        location: 'Corporate Office, MG Road, Bangalore',
        latitude: 12.9716,
        longitude: 77.6412,
        scheduledDateTime: DateTime.now().add(const Duration(days: 1)),
        status: 'pending',
        estimatedAmount: 5500,
        notes: 'Upgrade to 8-camera system',
      ),
    ];
  }

  Future<void> submitWorkCompletion(String jobId, String completionNotes,
      double actualAmount, double collectedAmount) async {
    if (_dio != null) {
      try {
        await _dio!.patch('$_backendBase/jobs/$jobId', data: {
          'status': 'completed',
          'completed_date': DateTime.now().toIso8601String(),
          'notes': completionNotes,
          'actual_amount': actualAmount,
          'collected_amount': collectedAmount,
        });
        return;
      } catch (_) {
        // fallback to mock
      }
    }

    await Future.delayed(const Duration(milliseconds: 500));
  }
}
