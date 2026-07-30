import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/features/location/location_picker_screen.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/features/profile/models/saved_address.dart';
import 'package:mobile_customer/features/profile/providers/address_provider.dart';

class AddressFormScreen extends ConsumerStatefulWidget {
  final SavedAddress? existingAddress;

  const AddressFormScreen({super.key, this.existingAddress});

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _addressController;
  late TextEditingController _pincodeController;
  late String _selectedLabel;
  late bool _isDefault;
  bool _isSaving = false;
  double? _pickedLat;
  double? _pickedLng;
  String? _pickedAddress;

  bool get _isEditing => widget.existingAddress != null;

  @override
  void initState() {
    super.initState();
    _addressController = TextEditingController(text: widget.existingAddress?.address ?? '');
    _pincodeController = TextEditingController(text: widget.existingAddress?.pincode ?? '');
    _selectedLabel = widget.existingAddress?.label ?? 'Home';
    _isDefault = widget.existingAddress?.isDefault ?? false;
    if (widget.existingAddress != null && widget.existingAddress!.latitude != 0.0) {
      _pickedLat = widget.existingAddress!.latitude;
      _pickedLng = widget.existingAddress!.longitude;
      _pickedAddress = widget.existingAddress!.address;
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  Future<void> _openLocationPicker() async {
    await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const LocationPickerScreen()),
    );
    final locationState = ref.read(locationProvider);
    if (locationState.latitude != null && locationState.longitude != null) {
      setState(() {
        _pickedLat = locationState.latitude;
        _pickedLng = locationState.longitude;
        _pickedAddress = locationState.location;
      });
      if (_addressController.text.trim().isEmpty && _pickedAddress != null) {
        _addressController.text = _pickedAddress!;
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    if ((_pickedLat == null || _pickedLat == 0.0) && !_isEditing) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please pick a location on the map'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);

    final customer = ref.read(authProvider).customer;
    if (customer == null) {
      if (mounted) setState(() => _isSaving = false);
      return;
    }

    final address = SavedAddress(
      id: _isEditing ? widget.existingAddress!.id : '',
      label: _selectedLabel,
      address: _addressController.text.trim(),
      pincode: _pincodeController.text.trim().isNotEmpty ? _pincodeController.text.trim() : null,
      latitude: _pickedLat ?? widget.existingAddress?.latitude ?? 0.0,
      longitude: _pickedLng ?? widget.existingAddress?.longitude ?? 0.0,
      isDefault: _isDefault,
    );

    bool success;
    final cid = customer.id;
    if (cid == null) return;
    if (_isEditing) {
      success = await ref.read(addressProvider.notifier).updateAddress(cid, address);
    } else {
      success = await ref.read(addressProvider.notifier).addAddress(cid, address);
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Address updated' : 'Address added'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(ref.read(addressProvider).errorMessage ?? 'Failed to save address'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Address' : 'Add Address'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.shadowLight,
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Address Label',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 10,
                      runSpacing: 8,
                      children: ['Home', 'Office', 'Other'].map((label) {
                        final selected = _selectedLabel == label;
                        IconData icon;
                        switch (label) {
                          case 'Home':
                            icon = Icons.home_rounded;
                            break;
                          case 'Office':
                            icon = Icons.work_rounded;
                            break;
                          default:
                            icon = Icons.location_on_rounded;
                        }
                        return ChoiceChip(
                          selected: selected,
                          label: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(icon, size: 16, color: selected ? Colors.white : AppColors.textSecondary),
                              const SizedBox(width: 6),
                              Text(label),
                            ],
                          ),
                          selectedColor: AppColors.secondary,
                          backgroundColor: AppColors.surfaceVariant,
                          labelStyle: TextStyle(
                            color: selected ? Colors.white : AppColors.textPrimary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                          side: BorderSide.none,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          onSelected: (val) => setState(() => _selectedLabel = label),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: _addressController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        labelText: 'Address',
                        hintText: 'Enter full address',
                        prefixIcon: Padding(
                          padding: EdgeInsets.only(bottom: 64),
                          child: Icon(Icons.location_on_outlined),
                        ),
                      ),
                      textInputAction: TextInputAction.newline,
                      validator: (v) => v == null || v.trim().isEmpty ? 'Address is required' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _pincodeController,
                      decoration: const InputDecoration(
                        labelText: 'Pincode (optional)',
                        hintText: 'Enter pincode',
                        prefixIcon: Icon(Icons.markunread_mailbox_outlined),
                      ),
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                    ),
                    const SizedBox(height: 8),
                    InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: _openLocationPicker,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: _pickedLat != null ? AppColors.secondaryLight : AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _pickedLat != null ? AppColors.secondary.withOpacity(0.3) : AppColors.borderLight,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              _pickedLat != null ? Icons.location_on_rounded : Icons.map_outlined,
                              size: 20,
                              color: _pickedLat != null ? AppColors.secondary : AppColors.textMuted,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _pickedLat != null ? 'Location Set' : 'Pick on Map',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: _pickedLat != null ? AppColors.secondary : AppColors.textPrimary,
                                    ),
                                  ),
                                  if (_pickedAddress != null)
                                    Text(
                                      _pickedAddress!,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                    ),
                                  if (_pickedLat != null)
                                    Text(
                                      '${_pickedLat!.toStringAsFixed(6)}, ${_pickedLng!.toStringAsFixed(6)}',
                                      style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                                    ),
                                ],
                              ),
                            ),
                            if (_pickedLat != null)
                              IconButton(
                                icon: const Icon(Icons.close, size: 16),
                                onPressed: () => setState(() {
                                  _pickedLat = null;
                                  _pickedLng = null;
                                  _pickedAddress = null;
                                }),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                color: AppColors.textMuted,
                              )
                            else
                              const Icon(Icons.chevron_right, size: 18, color: AppColors.textMuted),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    CheckboxListTile(
                      value: _isDefault,
                      onChanged: (v) => setState(() => _isDefault = v ?? false),
                      title: const Text(
                        'Set as default address',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                      ),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                      activeColor: AppColors.secondary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _save,
                  child: _isSaving
                      ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
                      : Text(_isEditing ? 'Update Address' : 'Save Address', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
