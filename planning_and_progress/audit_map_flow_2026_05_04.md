# Customer App Map Flow Audit (2026-05-04)

## CRITICAL FINDINGS

### 1. 🔴 Google Maps API Key Not Configured
**Location:** `mobile_customer/android/app/src/main/res/values/strings.xml`  
**Current:** `YOUR_GOOGLE_MAPS_API_KEY` (placeholder)  
**Impact:** Map will NOT render on Android devices  
**Fix:** Configure with actual GCP-generated API key  
**Priority:** CRITICAL — blocks entire map feature  

### 2. 🟡 Default Location Incorrect
**Location:** `mobile_customer/lib/features/location/providers/location_provider.dart` (line 42)  
**Current:** `'Bhubaneswar, Odisha'`  
**Required:** `'Patna, Bihar'`  
**Impact:** Wrong fallback shown when permission denied  
**Fix:** Update LocationNotifier initial state  
**Priority:** HIGH  

### 3. 🟡 Promo Banner is Hardcoded Static
**Location:** `mobile_customer/lib/features/home/widgets/promo_banner.dart`  
**Current:** `'Get 10% OFF on your first installation'`  
**Issue:** Static text; user directive to remove or make dynamic  
**Fix:** Replace with backend-driven banners collection or remove for now  
**Priority:** MEDIUM  

### 4. 🟡 Announcements are Hardcoded Static
**Location:** `mobile_customer/lib/features/home/home_screen.dart` (lines show _AnnouncementCard widgets)  
**Current:** Hard-coded static cards ('New CCTV packages', 'Support 24x7')  
**Issue:** Non-operational placeholder content  
**Fix:** Replace with backend-driven announcements or remove  
**Priority:** MEDIUM  

### 5. 🟠 "View All Products" Route Missing
**Location:** Not implemented  
**Current:** No discovery/catalog page  
**Issue:** User directive requires search/filter/sort page for all products  
**Fix:** Create products_discovery route and screen  
**Priority:** HIGH  

### 6. 🟠 Serviceability Check Not Implemented
**Location:** Map selection flow  
**Current:** No check for out-of-service areas  
**Issue:** Should validate location against backend coverage before booking  
**Fix:** Add backend serviceability API call in map flow  
**Priority:** MEDIUM  

## WORKING ASPECTS

✅ **Location Permission Flow**: Exists and prompts correctly  
✅ **Reverse Geocoding**: Working via geocoding package  
✅ **Location Service Integration**: geolocator + geocoding wired correctly  
✅ **Map UI Structure**: location_picker_screen scaffolding is good  
✅ **Google Maps Plugin**: Dependency declared (v2.6.1)  
✅ **Android Manifest**: Properly configured for com.google.android.geo.API_KEY  

## SUMMARY

Map feature is **architecturally sound but cannot function without**:
1. Valid Google Maps API key
2. Default location set to Patna, Bihar
3. Backend serviceability check integration
4. Removal of static banners/announcements (or backend-driven replacement)

**Est. Fix Time:** 2-3 hours for complete map + discovery + serviceability flow
