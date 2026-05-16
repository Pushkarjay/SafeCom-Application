import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/data/models/job_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/data/datasources/jobs_datasource.dart';
import 'package:mobile_employee/data/providers/jobs_providers.dart';
import 'package:mobile_employee/data/providers/employee_providers.dart';

class JobDetailScreen extends ConsumerStatefulWidget {
  final AssignedJob job;

  const JobDetailScreen({super.key, required this.job});

  @override
  ConsumerState<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends ConsumerState<JobDetailScreen> {
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
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _navigateToSite,
              icon: const Icon(Icons.location_on),
              label: const Text('Navigate to Site'),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.green,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
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
            if (widget.job.completionNotes != null)
              _buildInfoCard(
                context,
                'Completion Notes',
                [
                  Text(widget.job.completionNotes!),
                ],
              ),
            if (widget.job.status == 'completed' && widget.job.actualAmount > 0)
              _buildInfoCard(
                context,
                'Settlement',
                [
                  _buildInfoRow('Actual Amount', 'Rs ${widget.job.actualAmount.toStringAsFixed(0)}'),
                  _buildInfoRow('Collected', 'Rs ${widget.job.collectedAmount.toStringAsFixed(0)}'),
                  _buildInfoRow('Pending', 'Rs ${(widget.job.actualAmount - widget.job.collectedAmount).toStringAsFixed(0)}'),
                ],
              ),
            const SizedBox(height: 16),
            if (widget.job.invoice != null)
              _buildInvoiceCard(context, widget.job.invoice!),
            const SizedBox(height: 16),
            if (widget.job.status == 'assigned')
              Column(
                children: [
                  FilledButton.icon(
                    onPressed: () async {
                      try {
                        await ref.read(jobsApiDatasourceProvider).startJob(widget.job.id);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Job started!')),
                          );
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to start job: $e')),
                          );
                        }
                      }
                    },
                    icon: const Icon(Icons.play_arrow),
                    label: const Text('Start Job'),
                    style: FilledButton.styleFrom(
                      backgroundColor: Colors.orange,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            if (widget.job.status != 'completed' && widget.job.status != 'cancelled')
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
                    onPressed: () async {
                      if (_notesController.text.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Please enter completion notes'),
                          ),
                        );
                        return;
                      }

                      try {
                        // Submit to backend
                        await ref.read(jobsApiDatasourceProvider).submitWorkCompletion(
                              widget.job.id,
                              _notesController.text,
                              double.tryParse(_amountController.text) ?? 0,
                              double.tryParse(_collectedController.text) ?? 0,
                            );

                        if (context.mounted) {
                          // Refresh jobs list
                          ref.refresh(assignedJobsProvider(ref.read(activeEmployeeIdProvider)));

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
                        }
                      } catch (e) {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Failed to submit: $e')),
                          );
                        }
                      }
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

  Widget _buildInvoiceCard(BuildContext context, CanonicalInvoice invoice) {
    return Card(
      color: Colors.blue.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Invoice Details',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: 12),
            _buildInvoiceRow('Invoice ID', invoice.invoiceId),
            _buildInvoiceRow('Payment Status', invoice.paymentStatus),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),
            Text(
              'Line Items',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 8),
            ...invoice.lineItems.map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.productName,
                          style: const TextStyle(fontWeight: FontWeight.w500),
                        ),
                        Text(
                          'Qty: ${item.quantity} × Rs ${item.unitPrice.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    'Rs ${item.lineTotal.toStringAsFixed(0)}',
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            )),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),
            _buildInvoiceRow('Subtotal', 'Rs ${invoice.subtotal.toStringAsFixed(0)}'),
            if (invoice.totalTax > 0)
              _buildInvoiceRow('Tax (18%)', 'Rs ${invoice.totalTax.toStringAsFixed(0)}'),
            _buildInvoiceRow(
              'Total',
              'Rs ${invoice.grandTotal.toStringAsFixed(0)}',
              isBold: true,
            ),
            if (invoice.paymentStatus != 'completed')
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  _buildInvoiceRow('Advance Paid', 'Rs ${invoice.advanceAmount.toStringAsFixed(0)}'),
                  _buildInvoiceRow('Remaining', 'Rs ${invoice.remainingAmount.toStringAsFixed(0)}'),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInvoiceRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: TextStyle(
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
              fontSize: isBold ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  Future<void> _navigateToSite() async {
    final latitude = widget.job.latitude;
    final longitude = widget.job.longitude;
    final locationName = widget.job.location;

    // Google Maps URI scheme
    final googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=$latitude,$longitude';

    try {
      if (await canLaunchUrl(Uri.parse(googleMapsUrl))) {
        await launchUrl(
          Uri.parse(googleMapsUrl),
          mode: LaunchMode.externalApplication,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open Google Maps')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error opening maps: $e')),
      );
    }
  }
}
