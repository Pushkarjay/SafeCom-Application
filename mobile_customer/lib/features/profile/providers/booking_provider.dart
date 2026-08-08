import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';


// ─── Model ───────────────────────────────────────────────────────────────────

class BookingLineItem {
  final String name;
  final int quantity;
  final double unitPrice;
  final String? variantValue;
  final String? category;

  const BookingLineItem({
    required this.name,
    required this.quantity,
    required this.unitPrice,
    this.variantValue,
    this.category,
  });

  factory BookingLineItem.fromJson(Map<String, dynamic> json) {
    final variants = json['variants'] as Map<String, dynamic>?;
    return BookingLineItem(
      name: json['productName'] as String? ?? json['name'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      variantValue: variants?['value'] as String?,
      category: json['category'] as String?,
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
  final String? customMessage;
  final String? notes;

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
    this.customMessage,
    this.notes,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final invoice = json['invoice'] as Map<String, dynamic>?;
    final lineItemsRaw = (json['lineItems'] ?? invoice?['lineItems'] ?? []) as List<dynamic>?;

    // The custom text box message can live in three places depending on when the
    // booking was created: invoice.customTextBox.value, serviceConfig.customTextBox.value,
    // or as a line item with category 'text_box' / variants.value.
    final invoiceText = invoice?['customTextBox'] as Map<String, dynamic>?;
    final serviceConfig = json['serviceConfig'] as Map<String, dynamic>?;
    final configText = serviceConfig?['customTextBox'] as Map<String, dynamic>?;
    final lineItems = lineItemsRaw
        ?.map((e) => BookingLineItem.fromJson(e as Map<String, dynamic>))
        .toList();
    final textLineItem = lineItems
        ?.where((i) => i.category == 'text_box' || (i.variantValue != null && i.variantValue!.isNotEmpty))
        .toList();
    final lineItemText = textLineItem != null && textLineItem.isNotEmpty
        ? (textLineItem.first.variantValue ?? '')
        : '';

    final invoiceMessage = (invoiceText?['value'] as String? ?? '').trim();
    final configMessage = (configText?['value'] as String? ?? '').trim();
    final String? customMessage = invoiceMessage.isNotEmpty
        ? invoiceMessage
        : (configMessage.isNotEmpty
            ? configMessage
            : (lineItemText.isNotEmpty ? lineItemText : null));

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
      lineItems: lineItems,
      customMessage: customMessage,
      notes: json['notes'] as String?,
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
