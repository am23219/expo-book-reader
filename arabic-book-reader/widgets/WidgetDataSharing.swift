import Foundation
import React
// If using WidgetKit (iOS 14+)
import WidgetKit

@objc(WidgetDataSharing)
class WidgetDataSharing: NSObject {
  
  private let userDefaults = UserDefaults(suiteName: "group.com.barakatmakkiyyah.app")
  
  @objc
  func updateWidgetData(_ data: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      guard let userDefaults = userDefaults else {
        reject("ERROR", "Failed to access App Group UserDefaults", nil)
        return
      }
      
      // Save the widget data to the shared UserDefaults
      userDefaults.set(data, forKey: "widget_data")
      
      // Save next up section data specifically
      if let jsonData = data.data(using: .utf8),
         let dict = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
         let sections = dict["readingDays"] as? [[String: Any]],
         !sections.isEmpty {
        
        // Get the first section which should be today
        if let firstSection = sections.first,
           let didRead = firstSection["didRead"] as? Bool,
           let completedSections = firstSection["completedSections"] as? Int {
          
          // Save next up section data
          userDefaults.set(didRead, forKey: "next_up_completed")
          userDefaults.set(completedSections, forKey: "next_up_sections_completed")
          
          // Get page info if available
          if let pageInfo = dict["currentPageInfo"] as? [String: Any],
             let currentPage = pageInfo["currentPage"] as? Int,
             let totalPages = pageInfo["totalPages"] as? Int {
            userDefaults.set(currentPage, forKey: "next_up_current_page")
            userDefaults.set(totalPages, forKey: "next_up_total_pages")
          }
        }
      }
      
      // Save book title if available
      if let jsonData = data.data(using: .utf8),
         let dict = try JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
         let bookTitle = dict["bookTitle"] as? String {
        userDefaults.set(bookTitle, forKey: "widget_book_title")
      }
      
      // Reload widgets
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
      
      resolve(true)
    } catch {
      reject("ERROR", "Failed to update widget data: \(error.localizedDescription)", nil)
    }
  }

  @objc
  func updateNextUpProgress(_ sectionId: NSNumber, currentPage: NSNumber, totalPages: NSNumber, completed: Bool, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let userDefaults = userDefaults else {
      reject("ERROR", "Failed to access App Group UserDefaults", nil)
      return
    }
    
    userDefaults.set(sectionId.intValue, forKey: "next_up_section_id")
    userDefaults.set(currentPage.intValue, forKey: "next_up_current_page")
    userDefaults.set(totalPages.intValue, forKey: "next_up_total_pages")
    userDefaults.set(completed, forKey: "next_up_completed")
    
    // Store the last updated date for "checked today" feature
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd"
    let currentDateString = dateFormatter.string(from: Date())
    userDefaults.set(currentDateString, forKey: "next_up_last_updated_date")
    
    // Reload widgets
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
    
    resolve(true)
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
} 