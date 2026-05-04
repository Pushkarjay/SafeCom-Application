class ServiceCatalogResponse {
  final List<ServiceCatalogEntry> services;

  const ServiceCatalogResponse({required this.services});

  factory ServiceCatalogResponse.fromJson(Map<String, dynamic> json) {
    final servicesJson = (json['services'] as List<dynamic>? ?? []);
    return ServiceCatalogResponse(
      services: servicesJson
          .map((entry) => ServiceCatalogEntry.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class ServiceCatalogEntry {
  final String id;
  final String title;
  final String icon;
  final bool enabled;

  const ServiceCatalogEntry({
    required this.id,
    required this.title,
    required this.icon,
    required this.enabled,
  });

  factory ServiceCatalogEntry.fromJson(Map<String, dynamic> json) {
    return ServiceCatalogEntry(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      icon: (json['icon'] ?? '').toString(),
      enabled: json['enabled'] as bool? ?? true,
    );
  }
}

class RecommendationCatalogResponse {
  final List<RecommendationEntry> recommendations;

  const RecommendationCatalogResponse({required this.recommendations});

  factory RecommendationCatalogResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? {};
    final items = data['recommendations'] as List<dynamic>? ?? [];
    return RecommendationCatalogResponse(
      recommendations: items
          .map((entry) => RecommendationEntry.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class RecommendationEntry {
  final String recommendationId;
  final String name;
  final String description;
  final List<String> productIds;
  final String placement;
  final List<String> serviceTypes;
  final bool isAvailable;
  final int displayPriority;

  const RecommendationEntry({
    required this.recommendationId,
    required this.name,
    required this.description,
    required this.productIds,
    required this.placement,
    required this.serviceTypes,
    required this.isAvailable,
    required this.displayPriority,
  });

  factory RecommendationEntry.fromJson(Map<String, dynamic> json) {
    return RecommendationEntry(
      recommendationId: (json['recommendationId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      productIds: (json['productIds'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(growable: false),
      placement: (json['placement'] ?? '').toString(),
      serviceTypes: (json['serviceTypes'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(growable: false),
      isAvailable: json['isAvailable'] as bool? ?? true,
      displayPriority: (json['displayPriority'] as num?)?.toInt() ?? 0,
    );
  }
}

class InstallationPricingContract {
  final Map<int, double> nvrByPackage;
  final Map<String, double> cameraByMp;
  final Map<String, double> hddBySize;
  final double cableKitPrice;
  final double connectorPrice;
  final double wiringPrice;
  final double installationChargePrice;

  const InstallationPricingContract({
    required this.nvrByPackage,
    required this.cameraByMp,
    required this.hddBySize,
    required this.cableKitPrice,
    required this.connectorPrice,
    required this.wiringPrice,
    required this.installationChargePrice,
  });

  factory InstallationPricingContract.fromJson(Map<String, dynamic> json) {
    Map<int, double> parseNumericMap(Map<String, dynamic>? source) {
      final map = <int, double>{};
      for (final entry in (source ?? {}).entries) {
        final key = int.tryParse(entry.key);
        final value = (entry.value as num?)?.toDouble();
        if (key != null && value != null) {
          map[key] = value;
        }
      }
      return map;
    }

    Map<String, double> parseStringMap(Map<String, dynamic>? source) {
      final map = <String, double>{};
      for (final entry in (source ?? {}).entries) {
        final value = (entry.value as num?)?.toDouble();
        if (value != null) {
          map[entry.key] = value;
        }
      }
      return map;
    }

    return InstallationPricingContract(
      nvrByPackage: parseNumericMap(json['nvrByPackage'] as Map<String, dynamic>?),
      cameraByMp: parseStringMap(json['cameraByMp'] as Map<String, dynamic>?),
      hddBySize: parseStringMap(json['hddBySize'] as Map<String, dynamic>?),
      cableKitPrice: (json['cableKitPrice'] as num?)?.toDouble() ?? 0,
      connectorPrice: (json['connectorPrice'] as num?)?.toDouble() ?? 0,
      wiringPrice: (json['wiringPrice'] as num?)?.toDouble() ?? 0,
      installationChargePrice:
          (json['installationChargePrice'] as num?)?.toDouble() ?? 0,
    );
  }
}

class MaintenancePricingContract {
  final Map<String, int> planVisits;
  final List<MaintenanceContractItem> itemTemplates;

  const MaintenancePricingContract({
    required this.planVisits,
    required this.itemTemplates,
  });

  factory MaintenancePricingContract.fromJson(Map<String, dynamic> json) {
    final visits = <String, int>{};
    for (final entry in (json['planVisits'] as Map<String, dynamic>? ?? {}).entries) {
      final value = entry.value as int?;
      if (value != null) {
        visits[entry.key] = value;
      }
    }

    final itemJson = (json['itemTemplates'] as List<dynamic>? ?? []);
    return MaintenancePricingContract(
      planVisits: visits,
      itemTemplates: itemJson
          .map((entry) =>
              MaintenanceContractItem.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class MaintenanceContractItem {
  final String key;
  final String name;
  final double unitPrice;
  final int baseQuantity;
  final bool multiplyByVisitCount;
  final bool canEditQuantity;

  const MaintenanceContractItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.baseQuantity,
    required this.multiplyByVisitCount,
    required this.canEditQuantity,
  });

  factory MaintenanceContractItem.fromJson(Map<String, dynamic> json) {
    return MaintenanceContractItem(
      key: (json['key'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
      baseQuantity: json['baseQuantity'] as int? ?? 1,
      multiplyByVisitCount: json['multiplyByVisitCount'] as bool? ?? false,
      canEditQuantity: json['canEditQuantity'] as bool? ?? true,
    );
  }
}

class RepairPricingContract {
  final List<RepairIssueType> issues;
  final List<RepairContractItem> itemTemplates;

  const RepairPricingContract({
    required this.issues,
    required this.itemTemplates,
  });

  factory RepairPricingContract.fromJson(Map<String, dynamic> json) {
    final issuesJson = (json['issues'] as List<dynamic>? ?? []);
    final templatesJson = (json['itemTemplates'] as List<dynamic>? ?? []);

    return RepairPricingContract(
      issues: issuesJson
          .map((entry) => RepairIssueType.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
      itemTemplates: templatesJson
          .map((entry) => RepairContractItem.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class RepairIssueType {
  final String id;
  final String title;
  final double visitFee;
  final double diagnosticFee;

  const RepairIssueType({
    required this.id,
    required this.title,
    required this.visitFee,
    required this.diagnosticFee,
  });

  factory RepairIssueType.fromJson(Map<String, dynamic> json) {
    return RepairIssueType(
      id: (json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      visitFee: (json['visitFee'] as num?)?.toDouble() ?? 0,
      diagnosticFee: (json['diagnosticFee'] as num?)?.toDouble() ?? 0,
    );
  }
}

class RepairContractItem {
  final String key;
  final String name;
  final double unitPrice;
  final int quantity;
  final bool canEditQuantity;

  const RepairContractItem({
    required this.key,
    required this.name,
    required this.unitPrice,
    required this.quantity,
    required this.canEditQuantity,
  });

  factory RepairContractItem.fromJson(Map<String, dynamic> json) {
    return RepairContractItem(
      key: (json['key'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0,
      quantity: json['quantity'] as int? ?? 1,
      canEditQuantity: json['canEditQuantity'] as bool? ?? true,
    );
  }
}

class UpgradeCatalogContract {
  final List<UpgradeBundle> bundles;

  const UpgradeCatalogContract({required this.bundles});

  factory UpgradeCatalogContract.fromJson(Map<String, dynamic> json) {
    final bundlesJson = (json['bundles'] as List<dynamic>? ?? []);
    return UpgradeCatalogContract(
      bundles: bundlesJson
          .map((entry) => UpgradeBundle.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class UpgradeBundle {
  final String id;
  final String name;
  final String description;
  final double price;

  const UpgradeBundle({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
  });

  factory UpgradeBundle.fromJson(Map<String, dynamic> json) {
    return UpgradeBundle(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
    );
  }
}

class AccessoryCatalogContract {
  final List<AccessoryItem> items;

  const AccessoryCatalogContract({required this.items});

  factory AccessoryCatalogContract.fromJson(Map<String, dynamic> json) {
    final itemsJson = (json['items'] as List<dynamic>? ?? []);
    return AccessoryCatalogContract(
      items: itemsJson
          .map((entry) => AccessoryItem.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class AccessoryItem {
  final String id;
  final String name;
  final double price;

  const AccessoryItem({
    required this.id,
    required this.name,
    required this.price,
  });

  factory AccessoryItem.fromJson(Map<String, dynamic> json) {
    return AccessoryItem(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
    );
  }
}
