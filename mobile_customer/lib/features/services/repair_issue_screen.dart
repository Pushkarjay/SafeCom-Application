import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/services/providers/repair_flow_provider.dart';

class RepairIssueScreen extends ConsumerWidget {
  const RepairIssueScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(repairFlowProvider);
    final notifier = ref.read(repairFlowProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Select Repair Issue')),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: state.issues.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final issue = state.issues[index];
          final selected = state.selectedIssue.id == issue.id;

          return InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () {
              notifier.selectIssue(issue);
              context.push(AppRoutes.repairEstimate);
            },
            child: Ink(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: selected ? const Color(0xFF0A84FF) : const Color(0xFFE2E8F0),
                ),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    backgroundColor: Color(0xFFEFF6FF),
                    child: Icon(Icons.build_circle_outlined,
                        color: Color(0xFF0A84FF)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          issue.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Visit + diagnostics starts at Rs ${(issue.visitFee + issue.diagnosticFee).toStringAsFixed(0)}',
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
