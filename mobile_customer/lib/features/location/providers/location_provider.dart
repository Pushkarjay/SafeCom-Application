import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
  final bool isManuallySet;

  const LocationState({
    this.location = 'Fetching location...',
    this.latitude,
    this.longitude,
    this.isLoading = false,
    this.errorMessage,
    this.isServiceable = true,
    this.serviceabilityMessage,
    this.isManuallySet = false,
  });

  LocationState copyWith({
    String? location,
    double? latitude,
    double? longitude,
    bool? isLoading,
    String? errorMessage,
    bool? isServiceable,
    String? serviceabilityMessage,
    bool? isManuallySet,
  }) {
    return LocationState(
      location: location ?? this.location,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      isServiceable: isServiceable ?? this.isServiceable,
      serviceabilityMessage: serviceabilityMessage ?? this.serviceabilityMessage,
      isManuallySet: isManuallySet ?? this.isManuallySet,
    );
  }
}

class LocationNotifier extends StateNotifier<LocationState> {
  final LocationService _locationService;
  final ApiService _apiService;

  LocationNotifier(this._locationService, this._apiService) : super(const LocationState()) {
    _initLocation();
  }

  Future<void> _initLocation() async {
    final prefs = await SharedPreferences.getInstance();
    final savedLocation = prefs.getString('saved_location');
    final savedLat = prefs.getDouble('saved_latitude');
    final savedLng = prefs.getDouble('saved_longitude');
    final wasManuallySet = prefs.getBool('location_manually_set') ?? false;

    if (wasManuallySet && savedLocation != null) {
      state = LocationState(
        location: savedLocation,
        latitude: savedLat,
        longitude: savedLng,
        isManuallySet: true,
      );
      return;
    }

    final hasPermission = await _locationService.isPermissionGranted();
    if (hasPermission) {
      await fetchLocation(silent: true);
    } else {
      state = LocationState(
        location: savedLocation ?? 'Patna, Bihar',
        latitude: savedLat ?? 25.5941,
        longitude: savedLng ?? 85.1376,
      );
    }
  }

  Future<bool> hasPermission() async {
    return await _locationService.isPermissionGranted();
  }

  Future<void> fetchLocation({bool silent = false}) async {
    if (!silent) {
      state = state.copyWith(isLoading: true, errorMessage: null);
    }
    try {
      final position = await _locationService.fetchCurrentPosition();
      final address = await _locationService.reverseGeocode(position.latitude, position.longitude);

      state = state.copyWith(
        location: address,
        latitude: position.latitude,
        longitude: position.longitude,
        isLoading: false,
        errorMessage: null,
        isManuallySet: false,
      );

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_location', address);
      await prefs.setDouble('saved_latitude', position.latitude);
      await prefs.setDouble('saved_longitude', position.longitude);
      await prefs.setBool('location_manually_set', false);

      await checkServiceability(position.latitude, position.longitude);
    } on LocationPermissionDeniedException {
      state = state.copyWith(isLoading: false, errorMessage: silent ? null : 'Location permission denied');
    } on LocationServiceDisabledException {
      state = state.copyWith(isLoading: false, errorMessage: silent ? null : 'Please enable location services');
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: silent ? null : 'Could not fetch location');
    }
  }

  Future<void> requestAndFetchLocation() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      await _locationService.requestPermission();
      if (await _locationService.isPermissionGranted()) {
        await fetchLocation(silent: true);
      } else {
        state = state.copyWith(isLoading: false, errorMessage: 'Location permission denied');
      }
    } on LocationServiceDisabledException {
      state = state.copyWith(isLoading: false, errorMessage: 'Please enable location services');
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: 'Could not access location');
    }
  }

  Future<void> checkServiceability(double lat, double lng) async {
    try {
      final result = await _apiService.checkServiceability(lat: lat, lng: lng);
      state = state.copyWith(
        isServiceable: result['isServiceable'] as bool? ?? true,
        serviceabilityMessage: result['message'] as String?,
      );
    } catch (e) {
      state = state.copyWith(isServiceable: true);
    }
  }

  Future<void> setSelectedLocation(String address, double latitude, double longitude) async {
    state = state.copyWith(
      location: address,
      latitude: latitude,
      longitude: longitude,
      isManuallySet: true,
      errorMessage: null,
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('saved_location', address);
    await prefs.setDouble('saved_latitude', latitude);
    await prefs.setDouble('saved_longitude', longitude);
    await prefs.setBool('location_manually_set', true);

    await checkServiceability(latitude, longitude);
  }
}

final locationServiceProvider = Provider<LocationService>((ref) => LocationService());

final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  final service = ref.read(locationServiceProvider);
  final apiService = ref.read(apiServiceProvider);
  return LocationNotifier(service, apiService);
});
