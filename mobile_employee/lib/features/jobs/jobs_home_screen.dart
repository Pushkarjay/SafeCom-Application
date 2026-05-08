import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/data/models/job_models.dart';
import 'package:mobile_employee/data/providers/jobs_providers.dart';
import 'package:mobile_employee/data/providers/employee_providers.dart';
import 'package:mobile_employee/data/repositories/jobs_repository.dart';

class JobsHomeScreen extends ConsumerWidget {
  const JobsHomeScreen({super.key});

@override
  Widget build(BuildContext context, WidgetRef ref) {
    final technicianId = ref.watch(activeEmployeeIdProvider);
    final jobsAsync = ref.watch(assignedJobsProvider(technicianId));
    final availableJobsAsync = ref.watch(availableJobsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs'),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {
              ref.refresh(assignedJobsProvider(technicianId));
              ref.refresh(availableJobsProvider);
            },
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            onPressed: () => context.push(AppRoutes.profile),
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: DefaultTabController(
        length: 3,
        child: Column(
          children: [
            TabBar(
              tabs: [
                Tab(
                  icon: const Icon(Icons.assignment),
                  text: jobsAsync.when(
                    data: (jobs) {
                      final pending = jobs.where((j) => j.status == 'pending').length;
                      return 'My Jobs ($pending)';
                    },
                    loading: () => 'My Jobs',
                    error: (_, __) => 'My Jobs',
                  ),
                ),
                const Tab(
                  icon: Icon(Icons.work_outline),
                  text: 'Job Board',
                ),
                Tab(
                  icon: const Icon(Icons.check_circle_outline),
                  text: jobsAsync.when(
                    data: (jobs) {
                      final completed = jobs.where((j) => j.status == 'completed').length;
                      return 'Completed ($completed)';
                    },
                    loading: () => 'Completed',
                    error: (_, __) => 'Completed',
                  ),
                ),
              ],
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _buildAssignedJobsTab(context, ref, jobsAsync),
                  _buildJobBoardTab(context, ref, availableJobsAsync, technicianId),
                  _buildCompletedJobsTab(context, jobsAsync),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAssignedJobsTab(BuildContext context, WidgetRef ref, AsyncValue<List<AssignedJob>> jobsAsync) {
    return jobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(child: Text('Error: $error')),
      data: (jobs) {
        final pendingJobs = jobs.where((j) => j.status == 'pending').toList();
        if (pendingJobs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.task_alt, size: 64, color: Colors.grey.shade300),
                const SizedBox(height: 16),
                Text('No pending jobs', style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          );
        }
        return _buildJobsList(context, pendingJobs);
      },
    );
  }

  Widget _buildJobBoardTab(BuildContext context, WidgetRef ref, AsyncValue<List<AssignedJob>> availableJobsAsync, String technicianId) {
    return availableJobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(child: Text('Error: $error')),
      data: (jobs) {
        if (jobs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.work_off_outlined, size: 64, color: Colors.grey.shade300),
                const SizedBox(height: 16),
                Text('No available jobs', style: Theme.of(context).textTheme.bodyLarge),
                const SizedBox(height: 8),
                Text('Check back later for new jobs', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          );
        }
        return _buildAvailableJobsList(context, ref, jobs, technicianId);
      },
    );
  }

  Widget _buildCompletedJobsTab(BuildContext context, AsyncValue<List<AssignedJob>> jobsAsync) {
    return jobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(child: Text('Error: $error')),
      data: (jobs) {
        final completedJobs = jobs.where((j) => j.status == 'completed').toList();
        if (completedJobs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle_outline, size: 64, color: Colors.grey.shade300),
                const SizedBox(height: 16),
                Text('No completed jobs', style: Theme.of(context).textTheme.bodyLarge),
              ],
            ),
          );
        }
        return _buildJobsList(context, completedJobs);
      },
    );
  }

  Widget _buildAvailableJobsList(BuildContext context, WidgetRef ref, List<AssignedJob> jobs, String technicianId) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: jobs.length,
      itemBuilder: (context, index) {
        final job = jobs[index];
        return _AvailableJobCard(job: job, technicianId: technicianId);
      },
    );
  }

  Widget _buildJobsList(BuildContext context, List<AssignedJob> jobs) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: jobs.length,
      itemBuilder: (context, index) {
        final job = jobs[index];
        return _JobCard(job: job);
      },
    );
  }
}

class _JobCard extends ConsumerWidget {
  final AssignedJob job;

  const _JobCard({required this.job});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: InkWell(
        onTap: () {
          ref.read(selectedJobProvider.notifier).state = job;
          context.push(AppRoutes.jobDetail, extra: job);
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      job.serviceType,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(job.status),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      job.status.toUpperCase(),
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                job.customerName,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 16),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      job.location,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  const Icon(Icons.schedule_outlined, size: 16),
                  const SizedBox(width: 4),
                  Text(
                    _formatDateTime(job.scheduledDateTime),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Rs ${job.estimatedAmount.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: const Color(0xFF0A84FF),
                        ),
                  ),
                  const Icon(Icons.arrow_forward, size: 20),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final jobDay = DateTime(dateTime.year, dateTime.month, dateTime.day);

    if (jobDay == today) {
      return 'Today ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (jobDay == today.add(const Duration(days: 1))) {
      return 'Tomorrow ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else {
      return '${dateTime.day}/${dateTime.month} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
}

class _AvailableJobCard extends ConsumerWidget {
  final AssignedJob job;
  final String technicianId;

  const _AvailableJobCard({required this.job, required this.technicianId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    job.serviceType,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.blue,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'AVAILABLE',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.person_outline, size: 16),
                const SizedBox(width: 4),
                Text(job.customerName, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    job.location,
                    style: Theme.of(context).textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                const Icon(Icons.schedule_outlined, size: 16),
                const SizedBox(width: 4),
                Text(
                  _formatAvailableDateTime(job.scheduledDateTime),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Rs ${job.estimatedAmount.toStringAsFixed(0)}',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: const Color(0xFF0A84FF),
                      ),
                ),
                ElevatedButton(
                  onPressed: () => _pickupJob(context, ref),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A84FF),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Pickup'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatAvailableDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final jobDay = DateTime(dateTime.year, dateTime.month, dateTime.day);

    if (jobDay == today) {
      return 'Today ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else if (jobDay == today.add(const Duration(days: 1))) {
      return 'Tomorrow ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } else {
      return '${dateTime.day}/${dateTime.month} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _pickupJob(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Pickup Job'),
        content: Text('Do you want to pickup this ${job.serviceType} job?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Pickup'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      try {
        await ref.read(jobsRepositoryProvider).pickupJob(
          job.id,
          technicianId,
          'Technician',
          '',
        );
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Job picked up successfully!')),
          );
          ref.invalidate(assignedJobsProvider(technicianId));
          ref.invalidate(availableJobsProvider);
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to pickup job: $e')),
          );
        }
      }
    }
  }
}
