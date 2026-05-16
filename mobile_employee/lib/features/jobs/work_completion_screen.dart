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
                      completion.completionNotes.isNotEmpty
                          ? completion.completionNotes
                          : 'No notes provided',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Settlement Summary',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    _buildAmountRow(context, 'Actual Amount', completion.actualAmount, Colors.black87),
                    const Divider(),
                    _buildAmountRow(context, 'Amount Collected', completion.collectedAmount, Colors.green.shade700),
                    const Divider(),
                    _buildAmountRow(
                      context,
                      'Pending Amount',
                      completion.actualAmount - completion.collectedAmount,
                      (completion.actualAmount - completion.collectedAmount) > 0
                          ? Colors.red.shade700
                          : Colors.green.shade700,
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

  Widget _buildAmountRow(BuildContext context, String label, double amount, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(
            'Rs ${amount.toStringAsFixed(0)}',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: color,
                ),
          ),
        ],
      ),
    );
  }
}
