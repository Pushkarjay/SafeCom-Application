import 'package:mobile_employee/data/models/job_models.dart';

class JobsApiDatasource {
  Future<List<AssignedJob>> getAssignedJobs(String technicianId) async {
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
    await Future.delayed(const Duration(milliseconds: 500));
  }
}
