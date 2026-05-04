// ============================================
// INVOICE LINE ITEM (from canonical contract)
// ============================================
class InvoiceLineItem {
  final String productId;
  final String productName;
  final String? category;
  final int quantity;
  final double unitPrice;
  final double lineTotal;
  final Map<String, String>? variants;

  InvoiceLineItem({
    required this.productId,
    required this.productName,
    this.category,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
    this.variants,
  });

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) {
    return InvoiceLineItem(
      productId: json['productId'] ?? '',
      productName: json['productName'] ?? '',
      category: json['category'],
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0.0,
      variants: Map<String, String>.from(json['variants'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'productName': productName,
      'category': category,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'lineTotal': lineTotal,
      'variants': variants,
    };
  }
}

// ============================================
// INVOICE (from canonical contract)
// ============================================
class CanonicalInvoice {
  final String invoiceId;
  final String bookingId;
  final String serviceType;
  final String customerId;
  final String customerName;
  final String customerPhone;
  final String customerAddress;
  final String serviceLocation;
  final double serviceLatitude;
  final double serviceLongitude;
  final List<InvoiceLineItem> lineItems;
  final double subtotal;
  final double subtotalAfterDiscount;
  final List<Map<String, dynamic>> taxes;
  final double totalTax;
  final double grandTotal;
  final String scheduledDate;
  final String scheduledTimeSlot;
  final String paymentStatus;
  final double advanceAmount;
  final double remainingAmount;
  final String generatedAt;
  final String? notes;

  CanonicalInvoice({
    required this.invoiceId,
    required this.bookingId,
    required this.serviceType,
    required this.customerId,
    required this.customerName,
    required this.customerPhone,
    required this.customerAddress,
    required this.serviceLocation,
    required this.serviceLatitude,
    required this.serviceLongitude,
    required this.lineItems,
    required this.subtotal,
    required this.subtotalAfterDiscount,
    required this.taxes,
    required this.totalTax,
    required this.grandTotal,
    required this.scheduledDate,
    required this.scheduledTimeSlot,
    required this.paymentStatus,
    required this.advanceAmount,
    required this.remainingAmount,
    required this.generatedAt,
    this.notes,
  });

  factory CanonicalInvoice.fromJson(Map<String, dynamic> json) {
    return CanonicalInvoice(
      invoiceId: json['invoiceId'] ?? '',
      bookingId: json['bookingId'] ?? '',
      serviceType: json['serviceType'] ?? '',
      customerId: json['customerId'] ?? '',
      customerName: json['customerName'] ?? '',
      customerPhone: json['customerPhone'] ?? '',
      customerAddress: json['customerAddress'] ?? '',
      serviceLocation: json['serviceLocation'] ?? '',
      serviceLatitude: (json['serviceLatitude'] as num?)?.toDouble() ?? 0.0,
      serviceLongitude: (json['servicelongitude'] as num?)?.toDouble() ?? 0.0,
      lineItems: (json['lineItems'] as List<dynamic>?)
              ?.map((item) => InvoiceLineItem.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      subtotalAfterDiscount: (json['subtotalAfterDiscount'] as num?)?.toDouble() ?? 0.0,
      taxes: List<Map<String, dynamic>>.from(json['taxes'] ?? []),
      totalTax: (json['totalTax'] as num?)?.toDouble() ?? 0.0,
      grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0.0,
      scheduledDate: json['scheduledDate'] ?? '',
      scheduledTimeSlot: json['scheduledTimeSlot'] ?? '',
      paymentStatus: json['paymentStatus'] ?? 'pending',
      advanceAmount: (json['advanceAmount'] as num?)?.toDouble() ?? 0.0,
      remainingAmount: (json['remainingAmount'] as num?)?.toDouble() ?? 0.0,
      generatedAt: json['generatedAt'] ?? '',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'invoiceId': invoiceId,
      'bookingId': bookingId,
      'serviceType': serviceType,
      'customerId': customerId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerAddress': customerAddress,
      'serviceLocation': serviceLocation,
      'serviceLatitude': serviceLatitude,
      'serviceLongitude': serviceLongitude,
      'lineItems': lineItems.map((item) => item.toJson()).toList(),
      'subtotal': subtotal,
      'subtotalAfterDiscount': subtotalAfterDiscount,
      'taxes': taxes,
      'totalTax': totalTax,
      'grandTotal': grandTotal,
      'scheduledDate': scheduledDate,
      'scheduledTimeSlot': scheduledTimeSlot,
      'paymentStatus': paymentStatus,
      'advanceAmount': advanceAmount,
      'remainingAmount': remainingAmount,
      'generatedAt': generatedAt,
      'notes': notes,
    };
  }
}

// ============================================
// ASSIGNED JOB (includes invoice from backend)
// ============================================
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
  final CanonicalInvoice? invoice; // NEW: Full invoice data from backend

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
    this.invoice,
  });

  factory AssignedJob.fromJson(Map<String, dynamic> json) {
    return AssignedJob(
      id: json['id'] ?? '',
      customerId: json['customer_id'] ?? json['customerId'] ?? '',
      customerName: json['customer_name'] ?? json['customerName'] ?? 'N/A',
      customerPhone: json['customer_phone'] ?? json['customerPhone'] ?? '',
      serviceType: json['service_type'] ?? json['serviceType'] ?? '',
      location: json['location'] ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      scheduledDateTime: json['scheduled_date_time'] != null
          ? DateTime.parse(json['scheduled_date_time'])
          : (json['scheduledDate'] != null ? DateTime.parse(json['scheduledDate']) : DateTime.now()),
      status: json['status'] ?? 'pending',
      estimatedAmount: (json['estimated_amount'] as num?)?.toDouble() ??
          (json['amount'] as num?)?.toDouble() ??
          0.0,
      notes: json['notes'],
      invoice: json['invoice'] != null ? CanonicalInvoice.fromJson(json['invoice'] as Map<String, dynamic>) : null,
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
      if (invoice != null) 'invoice': invoice!.toJson(),
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
