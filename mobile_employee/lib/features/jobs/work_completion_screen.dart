import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/data/models/job_models.dart';

class WorkCompletionScreen extends StatelessWidget {
  final WorkCompletion completion;

  const WorkCompletionScreen({super.key, required this.completion});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Work Completion'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green.shade700, size: 32),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Work Submitted',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                color: Colors.green.shade700,
                              ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Your work completion has been submitted for verification.',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Job Summary',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSummaryRow(context, 'Job ID', completion.jobId),
                    const Divider(),
                    _buildSummaryRow(
                      context,
                      'Completion Notes',
                      completion.completionNotes,
                    ),
                    const Divider(),
                    _buildSummaryRow(
                      context,
                      'Actual Amount',
                      'Rs ${completion.actualAmount.toStringAsFixed(0)}',
                    ),
                    const Divider(),
                    _buildSummaryRow(
                      context,
                      'Amount Collected',
                      'Rs ${completion.collectedAmount.toStringAsFixed(0)}',
                    ),
                    const Divider(),
                    _buildSummaryRow(
                      context,
                      'Pending Amount',
                      'Rs ${(completion.actualAmount - completion.collectedAmount).toStringAsFixed(0)}',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            FilledButton(
              onPressed: () {
                context.go(AppRoutes.home);
              },
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const SizedBox(
                width: double.infinity,
                child: Text('Back to Jobs', textAlign: TextAlign.center),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.grey.shade600,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
        ],
      ),
    );
  }
}
