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
  final String name;
  final List<InstallationCategory> categories;

  const InstallationPricingContract({
    required this.name,
    required this.categories,
  });

  factory InstallationPricingContract.fromJson(Map<String, dynamic> json) {
    final categoriesJson = (json['categories'] as List<dynamic>? ?? []);
    return InstallationPricingContract(
      name: (json['name'] ?? '').toString(),
      categories: categoriesJson
          .map((entry) => InstallationCategory.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class InstallationCategory {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final List<InstallationGroup> groups;

  const InstallationCategory({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.groups,
  });

  factory InstallationCategory.fromJson(Map<String, dynamic> json) {
    final groupsJson = (json['groups'] as List<dynamic>? ?? []);
    return InstallationCategory(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      imageUrl: (json['imageUrl'] ?? '').toString(),
      groups: groupsJson
          .map((entry) => InstallationGroup.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class InstallationGroup {
  final String id;
  final String name;
  final String description;
  final List<MappedProduct> mappedProducts;

  const InstallationGroup({
    required this.id,
    required this.name,
    required this.description,
    required this.mappedProducts,
  });

  factory InstallationGroup.fromJson(Map<String, dynamic> json) {
    final mappedJson = (json['mappedProducts'] as List<dynamic>? ?? []);
    return InstallationGroup(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      mappedProducts: mappedJson
          .map((entry) => MappedProduct.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class MappedProduct {
  final String productId;
  final String productKey;
  final int defaultQty;
  final int minQty;
  final int maxQty;
  final MasterProduct product;
  final bool isClubbed;
  final List<ClubbedOption> clubbedOptions;
  // Phase 1.1 — render type (inherited from top-level product slot node)
  final String renderType;          // 'option' | 'list'
  final bool collectiveValidation;  // true: validate sum of children collectively
  final String? displayLabel;
  // Phase 1.5 — dependency engine: auto-map quantity from another product
  final String? dependsOn;          // product key of the parent product this depends on

  const MappedProduct({
    required this.productId,
    required this.productKey,
    required this.defaultQty,
    required this.minQty,
    required this.maxQty,
    required this.product,
    this.isClubbed = false,
    this.clubbedOptions = const [],
    this.renderType = 'option',
    this.collectiveValidation = false,
    this.displayLabel,
    this.dependsOn,
  });

  factory MappedProduct.fromJson(Map<String, dynamic> json) {
    final clubbedJson = (json['clubbedOptions'] as List<dynamic>? ?? []);
    final isClubbed = json['isClubbed'] as bool? ?? clubbedJson.length > 1;
    return MappedProduct(
      productId: (json['productId'] ?? '').toString(),
      productKey: (json['productKey'] ?? '').toString(),
      defaultQty: json['defaultQty'] as int? ?? 1,
      minQty: json['minQty'] as int? ?? 0,
      maxQty: json['maxQty'] as int? ?? 999,
      product: MasterProduct.fromJson(json['product'] as Map<String, dynamic>? ?? {}),
      isClubbed: isClubbed,
      clubbedOptions: clubbedJson
          .map((e) => ClubbedOption.fromJson(e as Map<String, dynamic>))
          .toList(growable: false),
      renderType: (json['renderType'] as String?) ?? 'option',
      collectiveValidation: json['collectiveValidation'] as bool? ?? false,
      displayLabel: json['displayLabel'] as String?,
      dependsOn: json['dependsOn'] as String?,
    );
  }
}

/// Represents one node in the recursive clubbed product tree.
///
/// - If [isLeaf] is true: this is a terminal product with price/qty details.
/// - If [isLeaf] is false: this is a branch — user must choose from [children].
///
/// Supports infinite nesting depth (map→map→map→...→leaf).
class ClubbedOption {
  final String optionKey;
  final String productId;
  final String productName;
  final double price;
  final String category;
  final int defaultQty;
  final int minQty;
  final int maxQty;
  final bool available;
  final bool rigid;
  final bool isLeaf;
  final List<ClubbedOption> children;
  // Phase 1.1 — render type system
  final String renderType;           // 'option' | 'list'
  final String? selectionType;       // 'single' | 'multi' (for renderType=option)
  final bool collectiveValidation;   // true: sum(children.qty) validated collectively
  final String? displayLabel;        // human-readable override for key name
  final bool mandatory;
  // Phase 1.5 — dependency engine
  final String? dependsOn;           // product key this leaf's quantity depends on

  const ClubbedOption({
    required this.optionKey,
    required this.productId,
    required this.productName,
    required this.price,
    required this.category,
    required this.defaultQty,
    required this.minQty,
    required this.maxQty,
    required this.available,
    required this.rigid,
    this.isLeaf = true,
    this.children = const [],
    this.renderType = 'option',
    this.selectionType,
    this.collectiveValidation = false,
    this.displayLabel,
    this.mandatory = true,
    this.dependsOn,
  });

  /// The label shown to the user — uses displayLabel if set, else optionKey.
  /// For leaf nodes, falls back to productName (catalog product name) instead
  /// of optionKey (Firestore slot key) so that LIST mode displays the actual
  /// product name rather than the admin-assigned slot key.
  String get label {
    if (displayLabel?.isNotEmpty == true) return displayLabel!;
    if (isLeaf && productName.isNotEmpty) return productName;
    return optionKey;
  }

  factory ClubbedOption.fromJson(Map<String, dynamic> json) {
    final childrenJson = json['children'] as List<dynamic>? ?? [];
    return ClubbedOption(
      optionKey: (json['optionKey'] ?? '').toString(),
      productId: (json['productId'] ?? '').toString(),
      productName: (json['productName'] ?? '').toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
      category: (json['category'] ?? '').toString(),
      defaultQty: json['defaultQty'] as int? ?? 1,
      minQty: json['minQty'] as int? ?? 0,
      maxQty: json['maxQty'] as int? ?? 999,
      available: json['available'] as bool? ?? true,
      rigid: json['rigid'] as bool? ?? false,
      isLeaf: json['isLeaf'] as bool? ?? (childrenJson.isEmpty),
      children: childrenJson
          .map((c) => ClubbedOption.fromJson(c as Map<String, dynamic>))
          .toList(growable: false),
      renderType: (json['renderType'] as String?) ?? 'option',
      selectionType: json['selectionType'] as String?,
      collectiveValidation: json['collectiveValidation'] as bool? ?? false,
      displayLabel: json['displayLabel'] as String?,
      mandatory: json['mandatory'] as bool? ?? true,
      dependsOn: json['dependsOn'] as String?,
    );
  }
}

class MasterProduct {
  final String id;
  final String productName;
  final String description;
  final double basePrice;
  final String category;
  final String? group;
  final String? imageUrl;
  final List<ProductVariant> variants;

  const MasterProduct({
    required this.id,
    required this.productName,
    required this.description,
    required this.basePrice,
    required this.category,
    this.group,
    this.imageUrl,
    required this.variants,
  });

  String get name => productName;
  double get price => basePrice;

  factory MasterProduct.fromJson(Map<String, dynamic> json) {
    final variantsJson = (json['variants'] as List<dynamic>? ?? []);
    return MasterProduct(
      id: (json['id'] ?? json['productId'] ?? '').toString(),
      productName: (json['productName'] ?? json['name'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      basePrice: (json['basePrice'] ?? json['price'] as num?)?.toDouble() ?? 0,
      category: (json['category'] ?? '').toString(),
      group: json['group']?.toString(),
      imageUrl: json['imageUrl']?.toString(),
      variants: variantsJson
          .map((entry) => ProductVariant.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class ProductVariant {
  final String variantId;
  final String name;
  final List<String> options;
  final bool allowMultiple;
  final bool required;

  const ProductVariant({
    required this.variantId,
    required this.name,
    required this.options,
    required this.allowMultiple,
    required this.required,
  });

  factory ProductVariant.fromJson(Map<String, dynamic> json) {
    return ProductVariant(
      variantId: (json['variantId'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      options: (json['options'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(growable: false),
      allowMultiple: json['allowMultiple'] as bool? ?? false,
      required: json['required'] as bool? ?? false,
    );
  }
}

class MaintenancePricingContract {
  final List<MaintenanceTypeEntry> maintenanceTypes;
  final Map<String, int> planVisits;
  final List<MaintenanceContractItem> itemTemplates;

  const MaintenancePricingContract({
    this.maintenanceTypes = const [],
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
    final typesJson = (json['maintenanceTypes'] as List<dynamic>? ?? []);
    return MaintenancePricingContract(
      maintenanceTypes: typesJson
          .map((entry) => MaintenanceTypeEntry.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
      planVisits: visits,
      itemTemplates: itemJson
          .map((entry) =>
              MaintenanceContractItem.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class MaintenanceTypeEntry {
  final String id;
  final String name;
  final String icon;

  const MaintenanceTypeEntry({
    required this.id,
    required this.name,
    required this.icon,
  });

  factory MaintenanceTypeEntry.fromJson(Map<String, dynamic> json) {
    return MaintenanceTypeEntry(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      icon: (json['icon'] ?? '').toString(),
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
  final String category;
  final String group;
  final double price;

  const AccessoryItem({
    required this.id,
    required this.name,
    required this.category,
    required this.group,
    required this.price,
  });

  factory AccessoryItem.fromJson(Map<String, dynamic> json) {
    return AccessoryItem(
      id: (json['id'] ?? json['productId'] ?? '').toString(),
      name: (json['name'] ?? json['productName'] ?? '').toString(),
      category: (json['category'] ?? '').toString(),
      group: (json['group'] ?? '').toString(),
      price: (json['price'] ?? json['basePrice'] as num?)?.toDouble() ?? 0,
    );
  }
}

class AmcPricingContract {
  final List<AmcPlan> plans;

  const AmcPricingContract({required this.plans});

  factory AmcPricingContract.fromJson(Map<String, dynamic> json) {
    final plansJson = (json['plans'] as List<dynamic>? ?? []);
    return AmcPricingContract(
      plans: plansJson
          .map((entry) => AmcPlan.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}

class AmcPlan {
  final String id;
  final String name;
  final String subtitle;
  final double price;
  final List<String> features;
  final int order;

  const AmcPlan({
    required this.id,
    required this.name,
    required this.subtitle,
    required this.price,
    required this.features,
    required this.order,
  });

  factory AmcPlan.fromJson(Map<String, dynamic> json) {
    return AmcPlan(
      id: (json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      subtitle: (json['subtitle'] ?? '').toString(),
      price: (json['price'] as num?)?.toDouble() ?? 0,
      features: (json['features'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(growable: false),
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}

class MasterProductResponse {
  final List<MasterProduct> products;

  const MasterProductResponse({required this.products});

  factory MasterProductResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>? ?? {};
    final items = data['products'] as List<dynamic>? ?? [];
    return MasterProductResponse(
      products: items
          .map((entry) => MasterProduct.fromJson(entry as Map<String, dynamic>))
          .toList(growable: false),
    );
  }
}
