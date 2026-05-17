import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/core/theme/app_theme.dart';
import 'package:mobile_employee/data/providers/theme_provider.dart';
import 'package:mobile_employee/data/models/job_models.dart';
import 'package:mobile_employee/data/providers/jobs_providers.dart';
import 'package:mobile_employee/data/providers/employee_providers.dart';
import 'package:mobile_employee/data/repositories/jobs_repository.dart';

class JobsHomeScreen extends ConsumerStatefulWidget {
  const JobsHomeScreen({super.key});

  @override
  ConsumerState<JobsHomeScreen> createState() => _JobsHomeScreenState();
}

class _JobsHomeScreenState extends ConsumerState<JobsHomeScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final technicianId = ref.watch(activeEmployeeIdProvider);
    final jobsAsync = ref.watch(assignedJobsProvider(technicianId));
    final availableJobsAsync = ref.watch(availableJobsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Jobs'),
        actions: [
          IconButton(
            onPressed: () {
              ref.refresh(assignedJobsProvider(technicianId));
              ref.refresh(availableJobsProvider);
            },
            icon: const Icon(Icons.refresh_rounded, size: 22),
            tooltip: 'Refresh',
          ),
          IconButton(
            onPressed: () => context.push(AppRoutes.profile),
            icon: const Icon(Icons.person_outline_rounded, size: 22),
            tooltip: 'Profile',
          ),
          IconButton(
            onPressed: () => ref.read(themeModeProvider.notifier).toggle(),
            icon: Icon(
              ref.watch(themeModeProvider) == ThemeMode.dark
                  ? Icons.light_mode_rounded
                  : Icons.dark_mode_rounded,
              size: 22,
            ),
          ),
          IconButton(
            onPressed: () => context.push(AppRoutes.map),
            icon: const Icon(Icons.map_outlined, size: 22),
            tooltip: 'Map',
          ),
          IconButton(
            onPressed: () => context.push(AppRoutes.earnings),
            icon: const Icon(Icons.account_balance_wallet_outlined, size: 22),
            tooltip: 'Earnings',
          ),
            tooltip: 'Toggle theme',
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadow,
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              tabs: [
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('My Jobs'),
                      const SizedBox(width: 6),
                      jobsAsync.when(
                        data: (jobs) {
                          final active = jobs.where((j) => j.status == 'pending' || j.status == 'assigned' || j.status == 'in_progress').length;
                          return _Badge(text: '$active');
                        },
                        loading: () => const SizedBox(),
                        error: (_, __) => const SizedBox(),
                      ),
                    ],
                  ),
                ),
                const Tab(text: 'Job Board'),
                Tab(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Completed'),
                      const SizedBox(width: 6),
                      jobsAsync.when(
                        data: (jobs) {
                          final count = jobs.where((j) => j.status == 'completed').length;
                          if (count > 0) return _Badge(text: '$count');
                          return const SizedBox();
                        },
                        loading: () => const SizedBox(),
                        error: (_, __) => const SizedBox(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _AssignedTab(jobsAsync: jobsAsync),
                _AvailableTab(availableJobsAsync: availableJobsAsync, technicianId: technicianId),
                _CompletedTab(jobsAsync: jobsAsync),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String text;
  const _Badge({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}

class _AssignedTab extends ConsumerWidget {
  final AsyncValue<List<AssignedJob>> jobsAsync;
  const _AssignedTab({required this.jobsAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return jobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Failed to load jobs', style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ),
      ),
      data: (jobs) {
        final active = jobs.where((j) => j.status == 'pending' || j.status == 'assigned' || j.status == 'in_progress').toList();
        if (active.isEmpty) {
          return _EmptyState(icon: Icons.assignment_outlined, message: 'No active jobs');
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: active.length,
          itemBuilder: (_, i) => _JobCard(job: active[i]),
        );
      },
    );
  }
}

class _AvailableTab extends ConsumerWidget {
  final AsyncValue<List<AssignedJob>> availableJobsAsync;
  final String technicianId;
  const _AvailableTab({required this.availableJobsAsync, required this.technicianId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return availableJobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Failed to load jobs', style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ),
      ),
      data: (jobs) {
        if (jobs.isEmpty) {
          return _EmptyState(icon: Icons.work_off_outlined, message: 'No available jobs', hint: 'Check back later for new jobs');
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: jobs.length,
          itemBuilder: (_, i) => _AvailableJobCard(job: jobs[i], technicianId: technicianId),
        );
      },
    );
  }
}

class _CompletedTab extends ConsumerWidget {
  final AsyncValue<List<AssignedJob>> jobsAsync;
  const _CompletedTab({required this.jobsAsync});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return jobsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
              const SizedBox(height: 12),
              Text('Failed to load jobs', style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ),
      ),
      data: (jobs) {
        final completed = jobs.where((j) => j.status == 'completed').toList();
        if (completed.isEmpty) {
          return _EmptyState(icon: Icons.check_circle_outline, message: 'No completed jobs');
        }
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 8),
          itemCount: completed.length,
          itemBuilder: (_, i) => _JobCard(job: completed[i]),
        );
      },
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? hint;
  const _EmptyState({required this.icon, required this.message, this.hint});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Icon(icon, size: 36, color: AppColors.textMuted),
          ),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          if (hint != null) ...[
            const SizedBox(height: 6),
            Text(hint!, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
          ],
        ],
      ),
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
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: _statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(_statusIcon, color: _statusColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                job.serviceType[0].toUpperCase() + job.serviceType.substring(1),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            _StatusChip(status: job.status),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.person_outline_rounded, size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Text(job.customerName, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                            const SizedBox(width: 12),
                            Icon(Icons.location_on_outlined, size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                job.location.split(',').last.trim(),
                                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.schedule_outlined, size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    _formatDate(job.scheduledDateTime),
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  const Spacer(),
                  Text(
                    'Rs ${job.estimatedAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color get _statusColor {
    switch (job.status) {
      case 'pending': return AppColors.warning;
      case 'assigned': return AppColors.accent;
      case 'in_progress': return AppColors.primary;
      case 'completed': return AppColors.success;
      case 'cancelled': return AppColors.error;
      default: return AppColors.textMuted;
    }
  }

  IconData get _statusIcon {
    switch (job.status) {
      case 'pending': return Icons.schedule_rounded;
      case 'assigned': return Icons.person_pin_rounded;
      case 'in_progress': return Icons.engineering_rounded;
      case 'completed': return Icons.check_circle_rounded;
      case 'cancelled': return Icons.cancel_rounded;
      default: return Icons.help_outline_rounded;
    }
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final jobDay = DateTime(dt.year, dt.month, dt.day);
    if (jobDay == today) return 'Today ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    if (jobDay == today.add(const Duration(days: 1))) return 'Tomorrow ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    return '${dt.day}/${dt.month} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
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
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.successLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.work_outline_rounded, color: AppColors.success, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              job.serviceType[0].toUpperCase() + job.serviceType.substring(1),
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.successLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'AVAILABLE',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: AppColors.success,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(Icons.person_outline_rounded, size: 14, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(job.customerName, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(job.location, style: const TextStyle(fontSize: 12, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.schedule_outlined, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(_formatDate(job.scheduledDateTime), style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Rs ${job.estimatedAmount.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primary),
                ),
                SizedBox(
                  height: 38,
                  child: ElevatedButton(
                    onPressed: () => _pickupJob(context, ref),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.handyman_rounded, size: 16),
                        SizedBox(width: 6),
                        Text('Pickup'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final jobDay = DateTime(dt.year, dt.month, dt.day);
    if (jobDay == today) return 'Today ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    if (jobDay == today.add(const Duration(days: 1))) return 'Tomorrow';
    return '${dt.day}/${dt.month}';
  }

  Future<void> _pickupJob(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.handyman_rounded, color: AppColors.primary, size: 24),
            SizedBox(width: 10),
            Text('Pickup Job', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          ],
        ),
        content: Text('Pick up this ${job.serviceType} job?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Pickup')),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await ref.read(jobsRepositoryProvider).pickupJob(job.id, technicianId, 'Technician', '');
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Job picked up!'),
          backgroundColor: AppColors.success,
        ),
      );
      ref.invalidate(assignedJobsProvider(technicianId));
      ref.invalidate(availableJobsProvider);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color fg, String label) = switch (status) {
      'pending' => (AppColors.warningLight, AppColors.warning, 'Pending'),
      'assigned' => (AppColors.accentLight, AppColors.accent, 'Assigned'),
      'in_progress' => (AppColors.primaryLight, AppColors.primary, 'In Progress'),
      'completed' => (AppColors.successLight, AppColors.success, 'Completed'),
      'cancelled' => (AppColors.errorLight, AppColors.error, 'Cancelled'),
      _ => (AppColors.surfaceVariant, AppColors.textMuted, status),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: fg, letterSpacing: 0.5),
      ),
    );
  }
}
