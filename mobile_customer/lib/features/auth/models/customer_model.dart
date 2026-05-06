class Customer {
  final String? id;
  final String name;
  final String email;
  final String phone;
  final String? profileImage;
  final String? address;
  final DateTime? registeredDate;
  final int totalOrders;
  final double totalSpent;
  final String? status;

  Customer({
    this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.profileImage,
    this.address,
    this.registeredDate,
    this.totalOrders = 0,
    this.totalSpent = 0.0,
    this.status,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      phone: json['phone'],
      profileImage: json['profileImage'],
      address: json['address'],
      registeredDate: json['registeredDate'] != null 
        ? DateTime.parse(json['registeredDate'])
        : null,
      totalOrders: json['totalOrders'] ?? 0,
      totalSpent: (json['totalSpent'] ?? 0).toDouble(),
      status: json['status'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'phone': phone,
    'profileImage': profileImage,
    'address': address,
    'registeredDate': registeredDate?.toIso8601String(),
    'totalOrders': totalOrders,
    'totalSpent': totalSpent,
    'status': status,
  };

  Customer copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? profileImage,
    String? address,
    DateTime? registeredDate,
    int? totalOrders,
    double? totalSpent,
    String? status,
  }) {
    return Customer(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      profileImage: profileImage, // Allow null to clear
      address: address, // Allow null to clear
      registeredDate: registeredDate, // Allow null to clear
      totalOrders: totalOrders ?? this.totalOrders,
      totalSpent: totalSpent ?? this.totalSpent,
      status: status, // Allow null to clear
    );
  }
}
