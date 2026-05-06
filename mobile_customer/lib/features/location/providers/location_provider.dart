import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/services/location_service.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';

class LocationState {
  final String location;
  final double? latitude;
  final double? longitude;
  final bool isLoading;
  final String? errorMessage;
  final bool isServiceable;
  final String? serviceabilityMessage;

  const LocationState({
    required this.location,
    this.latitude,
    this.longitude,
    required this.isLoading,
    this.errorMessage,
    this.isServiceable = true,
    this.serviceabilityMessage,
  });

  LocationState copyWith({
    String? location,
    double? latitude,
    double? longitude,
    bool? isLoading,
    String? errorMessage,
    bool? isServiceable,
    String? serviceabilityMessage,
  }) {
    return LocationState(
      location: location ?? this.location,
      latitude: latitude, // Allow null to clear
      longitude: longitude, // Allow null to clear
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage, // Allow null to clear
      isServiceable: isServiceable ?? this.isServiceable,
      serviceabilityMessage: serviceabilityMessage, // Allow null to clear
    );
  }
}

class LocationNotifier extends StateNotifier<LocationState> {
  final LocationService _service;
  final ApiService _apiService;

  LocationNotifier(this._service, this._apiService)
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
      await checkServiceability(position.latitude, position.longitude);
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

  Future<void> checkServiceability(double lat, double lng) async {
     try {
        final res = await _apiService.checkServiceability(lat: lat, lng: lng);
        state = state.copyWith(
           isServiceable: res['isServiceable'] ?? false,
           serviceabilityMessage: res['message'],
        );
     } catch (e) {
        state = state.copyWith(
           isServiceable: true, // Fail open if API fails
           serviceabilityMessage: 'Could not verify coverage area.',
        );
     }
  }

  void setManualLocation(String value) {
    state = state.copyWith(location: value, errorMessage: null);
  }

  Future<void> setSelectedLocation({
    required String address,
    required double latitude,
    required double longitude,
  }) async {
    state = state.copyWith(
      location: address,
      latitude: latitude,
      longitude: longitude,
      errorMessage: null,
    );
    await checkServiceability(latitude, longitude);
  }
}

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>(
  (ref) => LocationNotifier(
     ref.watch(locationServiceProvider),
     ref.watch(apiServiceProvider),
  ),
);
