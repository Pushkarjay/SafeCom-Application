import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/features/profile/models/saved_address.dart';

class AddressState {
  final List<SavedAddress> addresses;
  final String? defaultAddressId;
  final bool isLoading;
  final String? errorMessage;

  const AddressState({
    this.addresses = const [],
    this.defaultAddressId,
    this.isLoading = false,
    this.errorMessage,
  });

  AddressState copyWith({
    List<SavedAddress>? addresses,
    String? defaultAddressId,
    bool? isLoading,
    String? errorMessage,
  }) {
    return AddressState(
      addresses: addresses ?? this.addresses,
      defaultAddressId: defaultAddressId ?? this.defaultAddressId,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }

  SavedAddress? get defaultAddress {
    if (defaultAddressId == null) return addresses.isNotEmpty ? addresses.first : null;
    try {
      return addresses.firstWhere((a) => a.id == defaultAddressId);
    } catch (_) {
      try {
        return addresses.firstWhere((a) => a.isDefault);
      } catch (_) {
        return addresses.isNotEmpty ? addresses.first : null;
      }
    }
  }
}

class AddressNotifier extends StateNotifier<AddressState> {
  final ApiService _apiService;

  AddressNotifier(this._apiService) : super(const AddressState());

  Future<void> loadAddresses(String customerId) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final result = await _apiService.getAddresses(customerId);
      final list = (result['addresses'] as List? ?? [])
          .map((e) => SavedAddress.fromJson(e as Map<String, dynamic>))
          .toList();
      state = AddressState(
        addresses: list,
        defaultAddressId: result['defaultAddressId'] as String?,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Failed to load addresses');
    }
  }

  Future<bool> addAddress(String customerId, SavedAddress address) async {
    try {
      await _apiService.addAddress(customerId, address.toJson());
      await loadAddresses(customerId);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to add address');
      return false;
    }
  }

  Future<bool> updateAddress(String customerId, SavedAddress address) async {
    try {
      await _apiService.updateAddress(customerId, address.id, address.toJson());
      await loadAddresses(customerId);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to update address');
      return false;
    }
  }

  Future<bool> deleteAddress(String customerId, String addressId) async {
    try {
      await _apiService.deleteAddress(customerId, addressId);
      await loadAddresses(customerId);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to delete address');
      return false;
    }
  }

  Future<bool> setDefaultAddress(String customerId, String addressId) async {
    try {
      await _apiService.setDefaultAddress(customerId, addressId);
      await loadAddresses(customerId);
      return true;
    } catch (e) {
      state = state.copyWith(errorMessage: 'Failed to set default address');
      return false;
    }
  }
}

final addressProvider = StateNotifierProvider<AddressNotifier, AddressState>((ref) {
  final apiService = ref.read(apiServiceProvider);
  return AddressNotifier(apiService);
});
