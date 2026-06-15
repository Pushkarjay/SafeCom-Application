import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/features/profile/models/saved_address.dart';

class BookingFlowState {
  final DateTime selectedDate;
  final String selectedTimeSlot;
  final SavedAddress? selectedAddress;

  const BookingFlowState({
    required this.selectedDate,
    required this.selectedTimeSlot,
    this.selectedAddress,
  });

  BookingFlowState copyWith({
    DateTime? selectedDate,
    String? selectedTimeSlot,
    SavedAddress? selectedAddress,
    bool clearAddress = false,
  }) {
    return BookingFlowState(
      selectedDate: selectedDate ?? this.selectedDate,
      selectedTimeSlot: selectedTimeSlot ?? this.selectedTimeSlot,
      selectedAddress: clearAddress ? null : (selectedAddress ?? this.selectedAddress),
    );
  }
}

class BookingFlowNotifier extends StateNotifier<BookingFlowState> {
  BookingFlowNotifier()
      : super(
          BookingFlowState(
            selectedDate: DateTime.now().add(const Duration(days: 1)),
            selectedTimeSlot: '10:00 AM - 12:00 PM',
          ),
        );

  void selectDate(DateTime value) {
    state = state.copyWith(selectedDate: value);
  }

  void selectTimeSlot(String value) {
    state = state.copyWith(selectedTimeSlot: value);
  }

  void selectAddress(SavedAddress? address) {
    state = state.copyWith(selectedAddress: address);
  }

  void reset() {
    state = BookingFlowState(
      selectedDate: DateTime.now().add(const Duration(days: 1)),
      selectedTimeSlot: '10:00 AM - 12:00 PM',
    );
  }
}

final bookingFlowProvider =
    StateNotifierProvider<BookingFlowNotifier, BookingFlowState>(
  (ref) => BookingFlowNotifier(),
);
