import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

final amcPricingProvider = FutureProvider<AmcPricingContract>((ref) {
  return ref.watch(pricingRepositoryProvider).getAmcPricing();
});

class AmcPlanScreen extends ConsumerWidget {
  const AmcPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final amcAsync = ref.watch(amcPricingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('AMC Plans'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go(AppRoutes.home);
            }
          },
        ),
      ),
      body: amcAsync.when(
        data: (contract) {
          final plans = contract.plans;
          if (plans.isEmpty) {
            return const Center(child: Text('No AMC plans available'));
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: plans.length,
            separatorBuilder: (_, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final plan = plans[index];
              return InkWell(
                borderRadius: BorderRadius.circular(16),
                onTap: () {
                  ref.read(activeOrderProvider.notifier).setSummary(
                        ActiveOrderSummary(
                          serviceName: 'AMC Service',
                          packageLabel: plan.name,
                          estimatedTotal: plan.price,
                          serviceTypeId: 'amc',
                          items: [
                            ActiveOrderLineItem(
                              name: plan.name,
                              quantity: 1,
                              unitPrice: plan.price,
                            ),
                          ],
                        ),
                      );
                  _showAmcConfirmationSheet(context, ref, plan);
                },
                child: Ink(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              plan.name,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ),
                          Text(
                            'Rs ${plan.price.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w800,
                                ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        plan.subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      if (plan.features.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        ...plan.features.map((feature) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Row(
                                children: [
                                  const Icon(Icons.check_circle_outline, size: 16, color: AppColors.success),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      feature,
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ),
                                ],
                              ),
                            )),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => _FallbackAmcPlans(),
      ),
    );
  }
}

/// Fallback in case the backend is unreachable
class _FallbackAmcPlans extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 48, color: AppColors.textMuted),
            const SizedBox(height: 16),
            Text(
              'Unable to load AMC plans',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please check your internet connection and try again.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

void _showAmcConfirmationSheet(BuildContext context, WidgetRef ref, AmcPlan plan) {
  showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (context) => Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            plan.name,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Rs ${plan.price.toStringAsFixed(0)} / year',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 16),
          const Text(
            'This AMC plan provides annual maintenance coverage. Want to add recommended accessories or proceed directly to scheduling?',
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              context.push(AppRoutes.recommendation);
            },
            style: FilledButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Add Accessories'),
          ),
          const SizedBox(height: 12),
          OutlinedButton(
            onPressed: () {
              Navigator.pop(context);
              context.push(AppRoutes.scheduling);
            },
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Skip — Book AMC Now'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Go Back'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    ),
  );
}
