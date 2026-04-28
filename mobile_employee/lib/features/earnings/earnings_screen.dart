import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class EarningsDashboardScreen extends ConsumerStatefulWidget {
  const EarningsDashboardScreen({super.key});

  @override
  ConsumerState<EarningsDashboardScreen> createState() => _EarningsDashboardScreenState();
}

class _EarningsDashboardScreenState extends ConsumerState<EarningsDashboardScreen> {
  String _selectedPeriod = 'this_month';
  
  // Mock earnings data
  final List<_EarningEntry> _earnings = [
    _EarningEntry(jobId: 'JOB-001', customer: 'Rahul Sharma', amount: 2500, date: DateTime.now().subtract(const Duration(days: 1)), status: 'paid'),
    _EarningEntry(jobId: 'JOB-002', customer: 'Priya Patel', amount: 1800, date: DateTime.now().subtract(const Duration(days: 2)), status: 'paid'),
    _EarningEntry(jobId: 'JOB-003', customer: 'Amit Kumar', amount: 3200, date: DateTime.now().subtract(const Duration(days: 3)), status: 'pending'),
    _EarningEntry(jobId: 'JOB-004', customer: 'Sneha Gupta', amount: 1500, date: DateTime.now().subtract(const Duration(days: 4)), status: 'paid'),
    _EarningEntry(jobId: 'JOB-005', customer: 'Vikram Singh', amount: 2800, date: DateTime.now().subtract(const Duration(days: 5)), status: 'paid'),
    _EarningEntry(jobId: 'JOB-006', customer: 'Anjali Reddy', amount: 2100, date: DateTime.now().subtract(const Duration(days: 7)), status: 'paid'),
    _EarningEntry(jobId: 'JOB-007', customer: 'Raj Malhotra', amount: 4500, date: DateTime.now().subtract(const Duration(days: 8)), status: 'pending'),
    _EarningEntry(jobId: 'JOB-008', customer: 'Meera Joshi', amount: 1900, date: DateTime.now().subtract(const Duration(days: 10)), status: 'paid'),
  ];

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: 'Rs ', decimalDigits: 0);
    
    // Calculate totals based on selected period
    final totalEarnings = _earnings.fold<double>(0, (sum, e) => sum + e.amount);
    final paidAmount = _earnings.where((e) => e.status == 'paid').fold<double>(0, (sum, e) => sum + e.amount);
    final pendingAmount = _earnings.where((e) => e.status == 'pending').fold<double>(0, (sum, e) => sum + e.amount);
    final jobCount = _earnings.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Earnings'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () => _showEarningsInfo(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Period selector
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Select Period',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildPeriodChip('today', 'Today'),
                      const SizedBox(width: 8),
                      _buildPeriodChip('this_week', 'This Week'),
                      const SizedBox(width: 8),
                      _buildPeriodChip('this_month', 'This Month'),
                      const SizedBox(width: 8),
                      _buildPeriodChip('last_month', 'Last Month'),
                      const SizedBox(width: 8),
                      _buildPeriodChip('all_time', 'All Time'),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Summary cards
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _buildSummaryCard(
                        context,
                        'Total Earnings',
                        currencyFormat.format(totalEarnings),
                        Icons.account_balance_wallet,
                        Colors.green,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildSummaryCard(
                        context,
                        'Jobs Completed',
                        jobCount.toString(),
                        Icons.check_circle,
                        Colors.blue,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildSummaryCard(
                        context,
                        'Paid',
                        currencyFormat.format(paidAmount),
                        Icons.check,
                        Colors.teal,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildSummaryCard(
                        context,
                        'Pending',
                        currencyFormat.format(pendingAmount),
                        Icons.pending,
                        Colors.orange,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Earnings list
          Expanded(
            child: _earnings.isEmpty
                ? _buildEmptyState(context)
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _earnings.length,
                    itemBuilder: (context, index) {
                      return _buildEarningItem(context, _earnings[index], currencyFormat);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildPeriodChip(String value, String label) {
    final isSelected = _selectedPeriod == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedPeriod = value);
        }
      },
    );
  }

  Widget _buildSummaryCard(
    BuildContext context,
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningItem(BuildContext context, _EarningEntry entry, NumberFormat format) {
    final isPaid = entry.status == 'paid';
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isPaid ? Colors.green.shade100 : Colors.orange.shade100,
          child: Icon(
            isPaid ? Icons.check : Icons.pending,
            color: isPaid ? Colors.green : Colors.orange,
          ),
        ),
        title: Text(entry.customer),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(entry.jobId),
            Text(
              dateFormat.format(entry.date),
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              format.format(entry.amount),
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isPaid ? Colors.green : Colors.orange,
                  ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: isPaid ? Colors.green.shade50 : Colors.orange.shade50,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                isPaid ? 'Paid' : 'Pending',
                style: TextStyle(
                  fontSize: 10,
                  color: isPaid ? Colors.green.shade700 : Colors.orange.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
        isThreeLine: true,
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.money_off, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No earnings yet',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Complete jobs to start earning',
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  void _showEarningsInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.info_outline, color: Colors.blue),
            SizedBox(width: 8),
            Text('Earnings Info'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('💰 Earnings are calculated based on completed jobs.'),
            SizedBox(height: 12),
            Text('📅 Payments are processed weekly.'),
            SizedBox(height: 12),
            Text('⏳ Pending amounts are awaiting payment processing.'),
            SizedBox(height: 12),
            Text('📊 Use the period filter to view earnings for different time ranges.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }
}

class _EarningEntry {
  final String jobId;
  final String customer;
  final double amount;
  final DateTime date;
  final String status;

  _EarningEntry({
    required this.jobId,
    required this.customer,
    required this.amount,
    required this.date,
    required this.status,
  });
}