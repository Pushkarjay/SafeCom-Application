class ServiceCatalogItem {
  final String id;
  final String title;
  final String icon;
  final bool enabled;

  const ServiceCatalogItem({
    required this.id,
    required this.title,
    required this.icon,
    this.enabled = true,
  });
}
