class EmployeeProfile {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String location;
  final DateTime joinDate;
  final double rating;
  final int totalJobs;
  final int completedJobs;
  final List<String> skills;
  final String status;
  final String? profileImageUrl;

  const EmployeeProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.location,
    required this.joinDate,
    required this.rating,
    required this.totalJobs,
    required this.completedJobs,
    required this.skills,
    required this.status,
    this.profileImageUrl,
  });

  factory EmployeeProfile.fromJson(Map<String, dynamic> json) {
    return EmployeeProfile(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      location: json['location']?.toString() ?? '',
      joinDate: json['joinDate'] != null
          ? DateTime.tryParse(json['joinDate'].toString()) ?? DateTime.now()
          : DateTime.now(),
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      totalJobs: (json['totalJobs'] as num?)?.toInt() ?? 0,
      completedJobs: (json['completedJobs'] as num?)?.toInt() ?? 0,
      skills: (json['skills'] as List<dynamic>? ?? const []).map((item) => item.toString()).toList(),
      status: json['status']?.toString() ?? 'inactive',
      profileImageUrl: json['profileImageUrl']?.toString(),
    );
  }
}

class EarningEntry {
  final String id;
  final String jobId;
  final String customer;
  final double amount;
  final DateTime date;
  final String status;

  const EarningEntry({
    required this.id,
    required this.jobId,
    required this.customer,
    required this.amount,
    required this.date,
    required this.status,
  });

  factory EarningEntry.fromJson(Map<String, dynamic> json) {
    return EarningEntry(
      id: json['id']?.toString() ?? '',
      jobId: json['jobId']?.toString() ?? '',
      customer: json['customer']?.toString() ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0,
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      status: json['status']?.toString() ?? 'pending',
    );
  }
}
