import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/services/location_service.dart';

class LocationState {
  final String location;
  final bool isLoading;
  final String? errorMessage;

  const LocationState({
    required this.location,
    required this.isLoading,
    this.errorMessage,
  });

  LocationState copyWith({
    String? location,
    bool? isLoading,
    String? errorMessage,
  }) {
    return LocationState(
      location: location ?? this.location,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class LocationNotifier extends StateNotifier<LocationState> {
  final LocationService _service;

  LocationNotifier(this._service)
      : super(
          const LocationState(
            location: 'Bhubaneswar, Odisha',
            isLoading: false,
          ),
        );

  Future<bool> requestAndFetchLocation() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final address = await _service.fetchCurrentAddress();
      state = state.copyWith(location: address, isLoading: false);
      return true;
    } on LocationServiceDisabledException {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Location service is disabled on this device.',
      );
      return false;
    } on LocationPermissionDeniedException {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Location permission was denied.',
      );
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Could not fetch location right now.',
      );
      return false;
    }
  }

  void setManualLocation(String value) {
    state = state.copyWith(location: value, errorMessage: null);
  }
}

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>(
  (ref) => LocationNotifier(ref.watch(locationServiceProvider)),
);
