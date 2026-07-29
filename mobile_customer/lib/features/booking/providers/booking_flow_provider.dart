import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/features/profile/models/saved_address.dart';

class BookingFlowState {
  final DateTime selectedDate;
  final String selectedTimeSlot;
  final SavedAddress? selectedAddress;
  final String? customTextBoxValue;

  const BookingFlowState({
    required this.selectedDate,
    required this.selectedTimeSlot,
    this.selectedAddress,
    this.customTextBoxValue,
  });

  BookingFlowState copyWith({
    DateTime? selectedDate,
    String? selectedTimeSlot,
    SavedAddress? selectedAddress,
    bool clearAddress = false,
    String? customTextBoxValue,
    bool clearCustomTextBox = false,
  }) {
    return BookingFlowState(
      selectedDate: selectedDate ?? this.selectedDate,
      selectedTimeSlot: selectedTimeSlot ?? this.selectedTimeSlot,
      selectedAddress: clearAddress ? null : (selectedAddress ?? this.selectedAddress),
      customTextBoxValue: clearCustomTextBox ? null : (customTextBoxValue ?? this.customTextBoxValue),
    );
  }
}

class BookingFlowNotifier extends StateNotifier<BookingFlowState> {
  BookingFlowNotifier()
      : super(
          BookingFlowState(
            selectedDate: DateTime.now().add(const Duration(days: 1)),
            selectedTimeSlot: '08:00',
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

  void setCustomTextBoxValue(String? value) {
    state = state.copyWith(customTextBoxValue: value);
  }

  void reset() {
    state = BookingFlowState(
      selectedDate: DateTime.now().add(const Duration(days: 1)),
      selectedTimeSlot: '08:00',
    );
  }
}

final bookingFlowProvider =
    StateNotifierProvider<BookingFlowNotifier, BookingFlowState>(
  (ref) => BookingFlowNotifier(),
);
