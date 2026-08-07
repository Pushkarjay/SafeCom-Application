import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/profile/models/saved_address.dart';
import 'package:mobile_customer/features/profile/providers/address_provider.dart';
import 'package:mobile_customer/features/profile/screens/address_form_screen.dart';

class AddressListScreen extends ConsumerStatefulWidget {
  const AddressListScreen({super.key});

  @override
  ConsumerState<AddressListScreen> createState() => _AddressListScreenState();
}

class _AddressListScreenState extends ConsumerState<AddressListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAddresses());
  }

  void _loadAddresses() {
    final customer = ref.read(authProvider).customer;
    final cid = customer?.id;
    if (cid != null) {
      ref.read(addressProvider.notifier).loadAddresses(cid);
    }
  }

  Future<void> _deleteAddress(SavedAddress address) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Address'),
        content: Text('Are you sure you want to delete "${address.label}" address?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      final customer = ref.read(authProvider).customer;
      final cid = customer?.id;
      if (cid != null) {
        final success = await ref.read(addressProvider.notifier).deleteAddress(cid, address.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(success ? 'Address deleted' : 'Failed to delete address'),
              backgroundColor: success ? AppColors.success : AppColors.error,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  void _openForm({SavedAddress? address}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AddressFormScreen(existingAddress: address),
      ),
    ).then((_) {
      _loadAddresses();
    });
  }

  IconData _labelIcon(String label) {
    switch (label.toLowerCase()) {
      case 'home':
        return Icons.home_rounded;
      case 'office':
      case 'work':
        return Icons.work_rounded;
      default:
        return Icons.location_on_rounded;
    }
  }

  Color _labelColor(String label) {
    switch (label.toLowerCase()) {
      case 'home':
        return AppColors.secondary;
      case 'office':
      case 'work':
        return AppColors.accent;
      default:
        return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    final addressState = ref.watch(addressProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Saved Addresses'),
        actions: [
          TextButton.icon(
            onPressed: () => _openForm(),
            icon: const Icon(Icons.add_rounded, size: 20),
            label: const Text('Add'),
          ),
        ],
      ),
      body: _buildBody(addressState),
    );
  }

  Widget _buildBody(AddressState state) {
    if (state.isLoading && state.addresses.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.errorMessage != null && state.addresses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.cloud_off_rounded, size: 56, color: AppColors.textMuted.withValues(alpha: 0.5)),
              const SizedBox(height: 16),
              Text(state.errorMessage!, style: const TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadAddresses,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (state.addresses.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.location_on_rounded, size: 48, color: AppColors.secondary),
              ),
              const SizedBox(height: 24),
              const Text(
                'No saved addresses',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 8),
              const Text(
                'Add your home or office address for quick bookings',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: () => _openForm(),
                icon: const Icon(Icons.add_rounded, size: 20),
                label: const Text('Add Address'),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => _loadAddresses(),
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        itemCount: state.addresses.length,
        itemBuilder: (context, index) {
          final address = state.addresses[index];
          final isDefault = address.id == state.defaultAddressId || address.isDefault;
          return _buildAddressCard(address, isDefault, state);
        },
      ),
    );
  }

  Widget _buildAddressCard(SavedAddress address, bool isDefault, AddressState state) {
    final color = _labelColor(address.label);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDefault ? AppColors.secondary.withValues(alpha: 0.4) : AppColors.borderLight,
          width: isDefault ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadowLight,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(_labelIcon(address.label), size: 14, color: color),
                        const SizedBox(width: 4),
                        Text(
                          address.label,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isDefault) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.secondaryLight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'DEFAULT',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: AppColors.secondary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                  const Spacer(),
                  PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (value == 'edit') {
                        _openForm(address: address);
                      } else if (value == 'delete') {
                        _deleteAddress(address);
                      } else if (value == 'setDefault') {
                        final customer = ref.read(authProvider).customer;
                        final cid = customer?.id;
                        if (cid != null) {
                          await ref.read(addressProvider.notifier).setDefaultAddress(cid, address.id);
                        }
                      }
                    },
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: 'edit', child: Row(
                        children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit')],
                      )),
                      if (!isDefault)
                        const PopupMenuItem(value: 'setDefault', child: Row(
                          children: [Icon(Icons.star_outline_rounded, size: 18), SizedBox(width: 8), Text('Set as Default')],
                        )),
                      const PopupMenuItem(value: 'delete', child: Row(
                        children: [Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.error), SizedBox(width: 8), Text('Delete', style: TextStyle(color: AppColors.error))],
                      )),
                    ],
                    icon: const Icon(Icons.more_vert_rounded, color: AppColors.textMuted, size: 20),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                address.address,
                style: const TextStyle(fontSize: 14, color: AppColors.textPrimary, height: 1.4),
              ),
              if (address.pincode != null && address.pincode!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Pincode: ${address.pincode}',
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
