import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';

class AmcPlanScreen extends ConsumerWidget {
  const AmcPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plans = [
      _AmcPlan(
        name: 'Bronze AMC',
        subtitle: '2 preventive visits/year',
        price: 2999,
      ),
      _AmcPlan(
        name: 'Silver AMC',
        subtitle: '4 preventive visits/year + priority support',
        price: 4999,
      ),
      _AmcPlan(
        name: 'Gold AMC',
        subtitle: '6 visits/year + emergency response support',
        price: 7999,
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('AMC Plans')),
      body: ListView.separated(
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
                      estimatedTotal: plan.price.toDouble(),
                    ),
                  );
              context.push(AppRoutes.scheduling);
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
                  Text(
                    plan.name,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    plan.subtitle,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Rs ${plan.price}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: const Color(0xFF0A84FF),
                          fontWeight: FontWeight.w800,
                        ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _AmcPlan {
  final String name;
  final String subtitle;
  final int price;

  const _AmcPlan({
    required this.name,
    required this.subtitle,
    required this.price,
  });
}
