import Foundation
import WidgetKit

// Define App Group constants
struct AppGroupConstants {
    static let appGroupIdentifier = "group.com.barakatmakiyyah.arabicbookreader"
}

// Define React Native promise types directly
typealias RCTPromiseResolveBlock = (Any?) -> Void
typealias RCTPromiseRejectBlock = (String?, String?, Error?) -> Void

@objc(WidgetDataSharing)
class WidgetDataSharing: NSObject {
  
  @objc
  func updateWidgetData(_ data: String,
                       resolver resolve: RCTPromiseResolveBlock,
                       rejecter reject: RCTPromiseRejectBlock) {
    do {
      // Save the data to the shared UserDefaults
      let userDefaults = UserDefaults(suiteName: AppGroupConstants.appGroupIdentifier)
      userDefaults?.set(data, forKey: "widget_data")
      userDefaults?.synchronize()
      
      // Reload the widget timeline
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
      
      resolve(true)
    } catch {
      reject("ERROR", "Failed to update widget data: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
