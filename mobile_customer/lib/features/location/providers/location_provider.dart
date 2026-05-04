import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/services/location_service.dart';

class LocationState {
  final String location;
  final double? latitude;
  final double? longitude;
  final bool isLoading;
  final String? errorMessage;

  const LocationState({
    required this.location,
    this.latitude,
    this.longitude,
    required this.isLoading,
    this.errorMessage,
  });

  LocationState copyWith({
    String? location,
    double? latitude,
    double? longitude,
    bool? isLoading,
    String? errorMessage,
  }) {
    return LocationState(
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
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
            location: 'Patna, Bihar',
            latitude: 25.5941,
            longitude: 85.1376,
            isLoading: false,
          ),
        );

  Future<bool> requestAndFetchLocation() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final position = await _service.fetchCurrentPosition();
      final address = await _service.reverseGeocode(
        position.latitude,
        position.longitude,
      );
      state = state.copyWith(
        location: address,
        latitude: position.latitude,
        longitude: position.longitude,
        isLoading: false,
      );
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

  void setSelectedLocation({
    required String address,
    required double latitude,
    required double longitude,
  }) {
    state = state.copyWith(
      location: address,
      latitude: latitude,
      longitude: longitude,
      errorMessage: null,
    );
  }
}

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>(
  (ref) => LocationNotifier(ref.watch(locationServiceProvider)),
);
