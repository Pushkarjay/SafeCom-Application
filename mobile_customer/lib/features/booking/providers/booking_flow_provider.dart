import 'package:flutter_riverpod/flutter_riverpod.dart';

class BookingFlowState {
  final DateTime selectedDate;
  final String selectedTimeSlot;

  const BookingFlowState({
    required this.selectedDate,
    required this.selectedTimeSlot,
  });

  BookingFlowState copyWith({
    DateTime? selectedDate,
    String? selectedTimeSlot,
  }) {
    return BookingFlowState(
      selectedDate: selectedDate ?? this.selectedDate,
      selectedTimeSlot: selectedTimeSlot ?? this.selectedTimeSlot,
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
