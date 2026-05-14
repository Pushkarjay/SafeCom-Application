import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;

  /// Initialize Firebase Cloud Messaging and set up handlers
  Future<void> initialize() async {
    try {
      // Request permission for iOS
      await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: true,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      // Get the FCM token for this device
      final token = await _firebaseMessaging.getToken();
      print('FCM Token: $token');

      // Handle foreground messages (app is open)
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        print('Foreground message received: ${message.notification?.title}');
        _handleMessage(message);
      });

      // Handle background message tap (app is closed or in background)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        print('App opened from background message: ${message.notification?.title}');
        _handleMessage(message);
      });

      // Handle terminated state message (app was terminated)
      RemoteMessage? initialMessage = await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        print('App launched from terminated message: ${initialMessage.notification?.title}');
        _handleMessage(initialMessage);
      }

      print('Firebase Cloud Messaging initialized successfully');
    } catch (e) {
      print('Error initializing FCM: $e');
    }
  }

  /// Handle incoming notification messages
  void _handleMessage(RemoteMessage message) {
    print('Handling message:');
    print('  Title: ${message.notification?.title}');
    print('  Body: ${message.notification?.body}');
    print('  Data: ${message.data}');

    // Parse notification type and handle accordingly
    final notificationType = message.data['type'] ?? 'generic';
    final jobId = message.data['jobId'];
    final bookingId = message.data['bookingId'];

    switch (notificationType) {
      case 'new_booking':
        _handleNewBookingNotification(bookingId, message.data);
        break;
      case 'booking_updated':
        _handleBookingUpdatedNotification(bookingId, message.data);
        break;
      case 'booking_cancelled':
        _handleBookingCancelledNotification(bookingId, message.data);
        break;
      default:
        print('Unknown notification type: $notificationType');
    }
  }

  /// Handle new booking notification
  void _handleNewBookingNotification(String? bookingId, Map<String, dynamic> data, [WidgetRef? ref]) {
    print('New booking notification: $bookingId');
    
    if (ref != null) {
      // Invalidate the jobs provider to trigger a fresh fetch from the server
      // ref.invalidate(jobsProvider); 
      print('Triggered jobs list refresh via provider');
    }
  }

  /// Handle booking updated notification
  void _handleBookingUpdatedNotification(String? bookingId, Map<String, dynamic> data) {
    print('Booking updated notification: $bookingId');
    print('  Status: ${data['status']}');
  }

  /// Handle booking cancelled notification
  void _handleBookingCancelledNotification(String? bookingId, Map<String, dynamic> data) {
    print('Booking cancelled notification: $bookingId');
    print('  Reason: ${data['reason']}');
  }

  /// Get device token for push notifications
  Future<String?> getDeviceToken() async {
    try {
      final token = await _firebaseMessaging.getToken();
      return token;
    } catch (e) {
      print('Error getting device token: $e');
      return null;
    }
  }

  /// Subscribe to a topic for broadcast notifications
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      print('Subscribed to topic: $topic');
    } catch (e) {
      print('Error subscribing to topic: $e');
    }
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      print('Unsubscribed from topic: $topic');
    } catch (e) {
      print('Error unsubscribing from topic: $e');
    }
  }
}

/// Background message handler (runs in isolate when app is terminated)
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('Background message received: ${message.notification?.title}');
  // Handle background messages here if needed
}
