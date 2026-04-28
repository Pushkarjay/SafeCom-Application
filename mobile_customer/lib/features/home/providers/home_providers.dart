import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';

final homeServicesProvider = FutureProvider<List<HomeServiceItem>>((ref) async {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  final services = await repository.getCustomerServices();
  return services
      .map(
        (item) => HomeServiceItem(
          id: item.id,
          icon: item.icon,
          title: item.title,
          enabled: item.enabled,
        ),
      )
      .toList(growable: false);
});

class HomeServiceItem {
  final String id;
  final String icon;
  final String title;
  final bool enabled;

  const HomeServiceItem({
    required this.id,
    required this.icon,
    required this.title,
    this.enabled = true,
  });
}
