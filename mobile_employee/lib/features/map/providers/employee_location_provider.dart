import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/core/services/location_service.dart';

class EmployeeLocationState {
  final String location;
  final double? latitude;
  final double? longitude;
  final bool isLoading;
  final String? errorMessage;

  const EmployeeLocationState({
    required this.location,
    this.latitude,
    this.longitude,
    required this.isLoading,
    this.errorMessage,
  });

  EmployeeLocationState copyWith({
    String? location,
    double? latitude,
    double? longitude,
    bool? isLoading,
    String? errorMessage,
  }) {
    return EmployeeLocationState(
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
    );
  }
}

class EmployeeLocationNotifier extends StateNotifier<EmployeeLocationState> {
  final LocationService _service;

  EmployeeLocationNotifier(this._service)
      : super(
          const EmployeeLocationState(
            location: 'Bhubaneswar, Odisha',
            isLoading: false,
          ),
        );

  Future<void> fetchCurrentLocation() async {
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
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Could not fetch current location.',
      );
    }
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

final employeeLocationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final employeeLocationProvider =
    StateNotifierProvider<EmployeeLocationNotifier, EmployeeLocationState>(
  (ref) => EmployeeLocationNotifier(ref.watch(employeeLocationServiceProvider)),
);
