import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/data/models/job_models.dart';

class JobDetailScreen extends StatefulWidget {
  final AssignedJob job;

  const JobDetailScreen({super.key, required this.job});

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  late TextEditingController _notesController;
  late TextEditingController _amountController;
  late TextEditingController _collectedController;

  @override
  void initState() {
    super.initState();
    _notesController = TextEditingController();
    _amountController = TextEditingController(
      text: widget.job.estimatedAmount.toStringAsFixed(0),
    );
    _collectedController = TextEditingController(
      text: widget.job.estimatedAmount.toStringAsFixed(0),
    );
  }

  @override
  void dispose() {
    _notesController.dispose();
    _amountController.dispose();
    _collectedController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInfoCard(
              context,
              'Service Information',
              [
                _buildInfoRow('Service Type', widget.job.serviceType),
                _buildInfoRow('Status', widget.job.status),
                _buildInfoRow('Scheduled', _formatDate(widget.job.scheduledDateTime)),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoCard(
              context,
              'Customer Information',
              [
                _buildInfoRow('Name', widget.job.customerName),
                _buildInfoRow('Phone', widget.job.customerPhone),
              ],
            ),
            const SizedBox(height: 16),
            _buildInfoCard(
              context,
              'Location',
              [
                _buildInfoRow('Address', widget.job.location),
                _buildInfoRow(
                  'Coordinates',
                  '${widget.job.latitude.toStringAsFixed(4)}, ${widget.job.longitude.toStringAsFixed(4)}',
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (widget.job.notes != null)
              _buildInfoCard(
                context,
                'Notes',
                [
                  Text(widget.job.notes!),
                ],
              ),
            const SizedBox(height: 16),
            if (widget.job.status == 'pending')
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Complete Work',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _notesController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Work Completion Notes',
                      hintText: 'Describe what was done...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Actual Amount (Rs)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _collectedController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Amount Collected (Rs)',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () {
                      if (_notesController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please enter completion notes'),
                          ),
                        );
                        return;
                      }
                      context.push(
                        AppRoutes.workCompletion,
                        extra: WorkCompletion(
                          jobId: widget.job.id,
                          completionNotes: _notesController.text,
                          photoPaths: [],
                          actualAmount:
                              double.tryParse(_amountController.text) ?? 0,
                          collectedAmount:
                              double.tryParse(_collectedController.text) ?? 0,
                        ),
                      );
                    },
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const SizedBox(
                      width: double.infinity,
                      child: Text('Submit Completion', textAlign: TextAlign.center),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(
    BuildContext context,
    String title,
    List<Widget> children,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
