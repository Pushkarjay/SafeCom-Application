import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';


// ─── Model ───────────────────────────────────────────────────────────────────

class BookingLineItem {
  final String name;
  final int quantity;
  final double unitPrice;

  const BookingLineItem({
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  factory BookingLineItem.fromJson(Map<String, dynamic> json) {
    return BookingLineItem(
      name: json['productName'] as String? ?? json['name'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

class BookingModel {
  final String id;
  final String serviceType;
  final String? packageLabel;
  final double totalAmount;
  final double amountPaid;
  final String status;
  final DateTime createdAt;
  final DateTime? scheduledAt;
  final String? timeSlot;
  final DateTime? completedAt;
  final String? location;
  final List<BookingLineItem>? lineItems;

  BookingModel({
    required this.id,
    required this.serviceType,
    this.packageLabel,
    required this.totalAmount,
    required this.amountPaid,
    required this.status,
    required this.createdAt,
    this.scheduledAt,
    this.timeSlot,
    this.completedAt,
    this.location,
    this.lineItems,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final invoice = json['invoice'] as Map<String, dynamic>?;
    final lineItemsRaw = (json['lineItems'] ?? invoice?['lineItems'] ?? []) as List<dynamic>?;
    return BookingModel(
      id: json['bookingId'] as String? ?? json['id'] as String? ?? '',
      serviceType: json['serviceType'] as String? ?? 'Service',
      packageLabel: json['packageLabel'] as String? ?? invoice?['packageLabel'] as String?,
      totalAmount: ((invoice?['grandTotal'] ?? json['totalAmount'] ?? 0.0) as num).toDouble(),
      amountPaid: ((json['amountPaid'] ?? invoice?['advanceAmount'] ?? 0.0) as num).toDouble(),
      status: json['status'] as String? ?? 'pending',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      scheduledAt: DateTime.tryParse(json['scheduledDate'] as String? ?? ''),
      timeSlot: json['scheduledTimeSlot'] as String?,
      completedAt: DateTime.tryParse(json['completedAt'] as String? ?? ''),
      location: json['location']?['address'] as String?,
      lineItems: lineItemsRaw?.map((e) => BookingLineItem.fromJson(e as Map<String, dynamic>)).toList(),
    );
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────

/// Fetches bookings for the currently authenticated user from the backend.
/// The backend filters by Firebase UID via the auth middleware.
final bookingsProvider = FutureProvider<List<BookingModel>>((ref) async {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return [];

  final idToken = await user.getIdToken();
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get(
      '/bookings',
      options: Options(
        headers: {'Authorization': 'Bearer $idToken'},
        receiveTimeout: const Duration(seconds: 10),
      ),
    );

    final data = response.data as Map<String, dynamic>?;
    final list = data?['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  } on DioException {
    // Re-throw the error so the UI can handle it appropriately
    rethrow;
  }
});
