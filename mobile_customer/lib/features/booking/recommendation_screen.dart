import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';

// Model for recommended accessories
class RecommendedAccessory {
  final String id;
  final String name;
  final String category;
  final double price;
  final String description;
  final String imageUrl;
  final bool isOptional;

  const RecommendedAccessory({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.description,
    required this.imageUrl,
    this.isOptional = true,
  });
}

// Provider for selected accessories
final selectedAccessoriesProvider =
    StateNotifierProvider<SelectedAccessoriesNotifier, List<String>>((ref) {
  return SelectedAccessoriesNotifier();
});

class SelectedAccessoriesNotifier extends StateNotifier<List<String>> {
  SelectedAccessoriesNotifier() : super([]);

  void toggleAccessory(String id) {
    if (state.contains(id)) {
      state = state.where((item) => item != id).toList();
    } else {
      state = [...state, id];
    }
  }

  void clear() {
    state = [];
  }
}

class RecommendationScreen extends ConsumerWidget {
  const RecommendationScreen({super.key});

  // Mock data for recommended accessories
  static const List<RecommendedAccessory> mockAccessories = [
    RecommendedAccessory(
      id: 'junction_box',
      name: 'Junction Box',
      category: 'Electrical',
      price: 150.0,
      description: 'IP65 rated weatherproof junction box for outdoor installation',
      imageUrl: 'assets/icons/junction_box.png',
      isOptional: true,
    ),
    RecommendedAccessory(
      id: 'cable_box',
      name: 'Cable Box',
      category: 'Cable Management',
      price: 200.0,
      description: 'Heavy-duty cable box for safe wire management and organization',
      imageUrl: 'assets/icons/cable_box.png',
      isOptional: true,
    ),
    RecommendedAccessory(
      id: 'poe_switch',
      name: 'POE Switch',
      category: 'Network Equipment',
      price: 500.0,
      description: 'Power over Ethernet switch for simplified installations',
      imageUrl: 'assets/icons/poe_switch.png',
      isOptional: true,
    ),
    RecommendedAccessory(
      id: 'cable_gland',
      name: 'Cable Gland Set',
      category: 'Accessories',
      price: 100.0,
      description: 'Set of cable glands for secure cable sealing',
      imageUrl: 'assets/icons/cable_gland.png',
      isOptional: true,
    ),
  ];

  double _calculateTotal(List<String> selectedIds) {
    double total = 0;
    for (final accessory in mockAccessories) {
      if (selectedIds.contains(accessory.id)) {
        total += accessory.price;
      }
    }
    return total;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIds = ref.watch(selectedAccessoriesProvider);
    final selectedAccessories = mockAccessories
        .where((acc) => selectedIds.contains(acc.id))
        .toList();
    final totalAccessoryCost = _calculateTotal(selectedIds);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recommended Accessories'),
        elevation: 0,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFFBFDBFE),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Optional Add-ons',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E40AF),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'These accessories are optional but recommended to optimize your service.',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                color: const Color(0xFF1E3A8A),
                              ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: mockAccessories.length,
                    itemBuilder: (context, index) {
                      final accessory = mockAccessories[index];
                      final isSelected = selectedIds.contains(accessory.id);

                      return GestureDetector(
                        onTap: () => ref
                            .read(selectedAccessoriesProvider.notifier)
                            .toggleAccessory(accessory.id),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFFF0F9FF)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF3B82F6)
                                  : const Color(0xFFE2E8F0),
                              width: isSelected ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Checkbox(
                                value: isSelected,
                                onChanged: (_) => ref
                                    .read(selectedAccessoriesProvider.notifier)
                                    .toggleAccessory(accessory.id),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      accessory.name,
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleSmall
                                          ?.copyWith(
                                            fontWeight: FontWeight.w700,
                                          ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      accessory.description,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodySmall
                                          ?.copyWith(
                                            color: const Color(0xFF64748B),
                                          ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '₹${accessory.price.toStringAsFixed(0)}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleSmall
                                        ?.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF3E8FF),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      accessory.category,
                                      style: Theme.of(context)
                                          .textTheme
                                          .labelSmall
                                          ?.copyWith(
                                            color: const Color(0xFF6B21A8),
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                  if (selectedAccessories.isNotEmpty) ...[
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Selected Accessories',
                            style: Theme.of(context).textTheme.titleSmall,
                          ),
                          const SizedBox(height: 10),
                          ...selectedAccessories.map(
                            (acc) => Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    acc.name,
                                    style:
                                        Theme.of(context).textTheme.bodySmall,
                                  ),
                                  Text(
                                    '₹${acc.price.toStringAsFixed(0)}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodySmall
                                        ?.copyWith(
                                          fontWeight: FontWeight.w700,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Divider(),
                          const SizedBox(height: 10),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Accessories Total',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              Text(
                                '₹${totalAccessoryCost.toStringAsFixed(0)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleSmall
                                    ?.copyWith(
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF16A34A),
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(
                top: BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                FilledButton(
                  onPressed: () => context.go(AppRoutes.payment),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('Continue with Selection'),
                  ),
                ),
                const SizedBox(height: 10),
                OutlinedButton(
                  onPressed: () {
                    ref.read(selectedAccessoriesProvider.notifier).clear();
                    context.go(AppRoutes.payment);
                  },
                  child: const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('Skip & Continue'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
