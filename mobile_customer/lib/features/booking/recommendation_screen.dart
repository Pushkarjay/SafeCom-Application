import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';

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

final recommendationProvider = FutureProvider<RecommendationCatalogResponse>((ref) async {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  return repository.getRecommendations(placement: 'checkout');
});

class RecommendationScreen extends ConsumerWidget {
  const RecommendationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedIds = ref.watch(selectedAccessoriesProvider);
    final recommendations = ref.watch(recommendationProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Recommended Accessories'),
        elevation: 0,
      ),
  body: recommendations.when(
        data: (payload) {
          final recommendation = payload.recommendations.isNotEmpty
              ? payload.recommendations.first
              : null;
          final productIds = recommendation?.productIds ?? [];

          final selectedItems = productIds
              .where((id) => selectedIds.contains(id))
              .toList(growable: false);

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (productIds.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'No recommendations available right now.',
                              style: TextStyle(fontSize: 16),
                            ),
                          ),
                        )
                      else ...[
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
                              Text(
                                recommendation?.name ?? 'Optional Add-ons',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF1E40AF),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                recommendation?.description ??
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
                          itemCount: productIds.length,
                          itemBuilder: (context, index) {
                            final productId = productIds[index];
                            final isSelected = selectedIds.contains(productId);

                            return GestureDetector(
                              onTap: () => ref
                                  .read(selectedAccessoriesProvider.notifier)
                                  .toggleAccessory(productId),
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
                                          .toggleAccessory(productId),
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
                                            productId,
                                            style: Theme.of(context)
                                                .textTheme
                                                .titleSmall
                                                ?.copyWith(
                                                  fontWeight: FontWeight.w700,
                                                ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Recommended accessory',
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
                                        recommendation?.placement ?? 'checkout',
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
                              ),
                            );
                          },
                        ),
                        if (selectedItems.isNotEmpty) ...[
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
                                ...selectedItems.map(
                                  (id) => Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          id,
                                          style:
                                              Theme.of(context).textTheme.bodySmall,
                                        ),
                                        const Text(
                                          'Added',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w700,
                                            color: Color(0xFF16A34A),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
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
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(error.toString())),
      ),
    );
  }
}
