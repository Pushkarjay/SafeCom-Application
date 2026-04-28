class AssignedJob {
  final String id;
  final String customerId;
  final String customerName;
  final String customerPhone;
  final String serviceType;
  final String location;
  final double latitude;
  final double longitude;
  final DateTime scheduledDateTime;
  final String status;
  final double estimatedAmount;
  final String? notes;

  AssignedJob({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    required this.serviceType,
    required this.location,
    required this.latitude,
    required this.longitude,
    required this.scheduledDateTime,
    required this.status,
    required this.estimatedAmount,
    this.notes,
  });

  factory AssignedJob.fromJson(Map<String, dynamic> json) {
    return AssignedJob(
      id: json['id'] ?? '',
      customerId: json['customer_id'] ?? '',
      customerName: json['customer_name'] ?? 'N/A',
      customerPhone: json['customer_phone'] ?? '',
      serviceType: json['service_type'] ?? '',
      location: json['location'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      scheduledDateTime: json['scheduled_date_time'] != null
          ? DateTime.parse(json['scheduled_date_time'])
          : DateTime.now(),
      status: json['status'] ?? 'pending',
      estimatedAmount: (json['estimated_amount'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_id': customerId,
      'customer_name': customerName,
      'customer_phone': customerPhone,
      'service_type': serviceType,
      'location': location,
      'latitude': latitude,
      'longitude': longitude,
      'scheduled_date_time': scheduledDateTime.toIso8601String(),
      'status': status,
      'estimated_amount': estimatedAmount,
      'notes': notes,
    };
  }
}

class WorkCompletion {
  final String jobId;
  final String completionNotes;
  final List<String> photoPaths;
  final double actualAmount;
  final double collectedAmount;

  WorkCompletion({
    required this.jobId,
    required this.completionNotes,
    required this.photoPaths,
    required this.actualAmount,
    required this.collectedAmount,
  });

  Map<String, dynamic> toJson() {
    return {
      'job_id': jobId,
      'completion_notes': completionNotes,
      'photo_paths': photoPaths,
      'actual_amount': actualAmount,
      'collected_amount': collectedAmount,
    };
  }
}
