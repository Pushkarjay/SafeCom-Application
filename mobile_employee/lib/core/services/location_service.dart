import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class LocationServiceDisabledException implements Exception {
  const LocationServiceDisabledException();
}

class LocationPermissionDeniedException implements Exception {
  const LocationPermissionDeniedException();
}

class LocationService {
  Future<LocationPermission> requestPermission() async {
    final isEnabled = await Geolocator.isLocationServiceEnabled();
    if (!isEnabled) {
      throw const LocationServiceDisabledException();
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission;
  }

  Future<Position> fetchCurrentPosition() async {
    final permission = await requestPermission();
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw const LocationPermissionDeniedException();
    }

    return Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  Future<String> reverseGeocode(double latitude, double longitude) async {
    final placeMarks = await placemarkFromCoordinates(latitude, longitude);

    if (placeMarks.isEmpty) {
      return 'Unknown Location';
    }

    final place = placeMarks.first;
    final city = place.locality?.trim();
    final area = place.subLocality?.trim();
    final state = place.administrativeArea?.trim();

    final chunks = [
      if (area != null && area.isNotEmpty) area,
      if (city != null && city.isNotEmpty) city,
      if (state != null && state.isNotEmpty) state,
    ];

    if (chunks.isEmpty) {
      return 'Current Location';
    }
    return chunks.join(', ');
  }
}
