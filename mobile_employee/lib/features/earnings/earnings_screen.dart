import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:mobile_employee/data/models/employee_models.dart';
import 'package:mobile_employee/data/providers/employee_providers.dart';

class EarningsDashboardScreen extends ConsumerStatefulWidget {
  const EarningsDashboardScreen({super.key});

  @override
  ConsumerState<EarningsDashboardScreen> createState() => _EarningsDashboardScreenState();
}

class _EarningsDashboardScreenState extends ConsumerState<EarningsDashboardScreen> {
  String _selectedPeriod = 'this_month';

  @override
  Widget build(BuildContext context) {
    final employeeId = ref.watch(activeEmployeeIdProvider);
    final earningsAsync = ref.watch(employeeEarningsProvider(employeeId));
    final currencyFormat = NumberFormat.currency(symbol: 'Rs ', decimalDigits: 0);
    final dateFormat = DateFormat('MMM dd, yyyy');

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
      body: earningsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              'Failed to load earnings: $error',
              textAlign: TextAlign.center,
            ),
          ),
        ),
        data: (earnings) {
          final filteredEarnings = earnings.where(_matchesSelectedPeriod).toList();
          final totalEarnings = filteredEarnings.fold<double>(0, (sum, entry) => sum + entry.amount);
          final paidAmount = filteredEarnings
              .where((entry) => entry.status == 'paid')
              .fold<double>(0, (sum, entry) => sum + entry.amount);
          final pendingAmount = filteredEarnings
              .where((entry) => entry.status == 'pending')
              .fold<double>(0, (sum, entry) => sum + entry.amount);
          final jobCount = filteredEarnings.length;

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(employeeEarningsProvider(employeeId));
              await ref.read(employeeEarningsProvider(employeeId).future);
            },
            child: Column(
              children: [
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
                Expanded(
                  child: filteredEarnings.isEmpty
                      ? _buildEmptyState(context)
                      : ListView.builder(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredEarnings.length,
                          itemBuilder: (context, index) {
                            return _buildEarningItem(context, filteredEarnings[index], currencyFormat, dateFormat);
                          },
                        ),
                ),
              ],
            ),
          );
        },
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

  Widget _buildEarningItem(
    BuildContext context,
    EarningEntry entry,
    NumberFormat format,
    DateFormat dateFormat,
  ) {
    final isPaid = entry.status == 'paid';

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

  bool _matchesSelectedPeriod(EarningEntry entry) {
    final now = DateTime.now();
    final startOfToday = DateTime(now.year, now.month, now.day);
    final entryDay = DateTime(entry.date.year, entry.date.month, entry.date.day);

    switch (_selectedPeriod) {
      case 'today':
        return entryDay == startOfToday;
      case 'this_week':
        return entry.date.isAfter(now.subtract(const Duration(days: 7)));
      case 'this_month':
        return entry.date.year == now.year && entry.date.month == now.month;
      case 'last_month':
        final lastMonth = DateTime(now.year, now.month - 1);
        return entry.date.year == lastMonth.year && entry.date.month == lastMonth.month;
      case 'all_time':
      default:
        return true;
    }
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
