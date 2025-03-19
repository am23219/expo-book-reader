import WidgetKit
import SwiftUI

struct NextUpProvider: TimelineProvider {
    func placeholder(in context: Context) -> NextUpEntry {
        NextUpEntry(date: Date(), bookTitle: "Barakaat Makkiyyah", currentPage: 1, totalPages: 10, isCompleted: false, lastUpdatedDate: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (NextUpEntry) -> ()) {
        let entry = NextUpEntry(date: Date(), bookTitle: "Barakaat Makkiyyah", currentPage: 3, totalPages: 10, isCompleted: false, lastUpdatedDate: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        let userDefaults = UserDefaults(suiteName: "group.com.barakatmakkiyyah.app")
        
        // Get data from shared UserDefaults
        let currentPage = userDefaults?.integer(forKey: "next_up_current_page") ?? 1
        let totalPages = userDefaults?.integer(forKey: "next_up_total_pages") ?? 10
        let isCompleted = userDefaults?.bool(forKey: "next_up_completed") ?? false
        let bookTitle = userDefaults?.string(forKey: "widget_book_title") ?? "Barakaat Makkiyyah"
        
        // Get the last updated date if available
        let lastUpdatedDateString = userDefaults?.string(forKey: "next_up_last_updated_date")
        var lastUpdatedDate: Date? = nil
        
        if let dateString = lastUpdatedDateString {
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            lastUpdatedDate = dateFormatter.date(from: dateString)
        }
        
        // Create an entry with the data
        let entry = NextUpEntry(
            date: Date(),
            bookTitle: bookTitle,
            currentPage: currentPage,
            totalPages: totalPages,
            isCompleted: isCompleted,
            lastUpdatedDate: lastUpdatedDate
        )
        
        // Update every 30 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        
        completion(timeline)
    }
}

struct NextUpEntry: TimelineEntry {
    let date: Date
    let bookTitle: String
    let currentPage: Int
    let totalPages: Int
    let isCompleted: Bool
    let lastUpdatedDate: Date?
    
    var checkedToday: Bool {
        guard let lastUpdated = lastUpdatedDate else { return false }
        return Calendar.current.isDateInToday(lastUpdated)
    }
    
    var percentComplete: Int {
        guard totalPages > 0 else { return 0 }
        return Int((Double(currentPage) / Double(totalPages)) * 100)
    }
}

struct NextUpWidgetEntryView : View {
    var entry: NextUpProvider.Entry
    @Environment(\.widgetFamily) var family
    
    // Theme colors
    let primaryColor = Color(red: 0.0, green: 0.5, blue: 0.5)
    let accentColor = Color(red: 0.1, green: 0.7, blue: 0.7)
    let backgroundColor = Color(red: 0.05, green: 0.1, blue: 0.2)
    
    var body: some View {
        ZStack {
            // Background
            backgroundColor
                .edgesIgnoringSafeArea(.all)
            
            VStack(alignment: .leading, spacing: 6) {
                // Book title
                Text(entry.bookTitle)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                
                // Status text
                if entry.isCompleted {
                    Text("🎉 Section Completed!")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.green)
                } else if !entry.checkedToday {
                    Text("Today's section is pending")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.yellow)
                } else {
                    Text("In Progress")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(accentColor)
                }
                
                // Progress text
                Text("Page \(entry.currentPage) of \(entry.totalPages)")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.8))
                
                // Progress bar
                ZStack(alignment: .leading) {
                    // Background bar
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.3))
                        .frame(height: 8)
                    
                    // Filled bar
                    if entry.totalPages > 0 {
                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    gradient: Gradient(colors: [primaryColor, accentColor]),
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: max(8, CGFloat(entry.currentPage) / CGFloat(entry.totalPages) * (family == .systemSmall ? 120 : 240)), height: 8)
                            .shadow(color: accentColor.opacity(0.6), radius: 4, x: 0, y: 0)
                    }
                }
                
                // Percentage
                Text("\(entry.percentComplete)% Complete")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
            }
            .padding()
        }
    }
}

@main
struct NextUpWidget: Widget {
    let kind: String = "NextUpWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: NextUpProvider()) { entry in
            NextUpWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Next Up Progress")
        .description("Track your progress in the current reading section.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct NextUpWidget_Previews: PreviewProvider {
    static var previews: some View {
        let entry = NextUpEntry(
            date: Date(),
            bookTitle: "Barakaat Makkiyyah",
            currentPage: 7,
            totalPages: 10,
            isCompleted: false,
            lastUpdatedDate: Date()
        )
        
        return Group {
            NextUpWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemSmall))
            
            NextUpWidgetEntryView(entry: entry)
                .previewContext(WidgetPreviewContext(family: .systemMedium))
            
            // Preview completed state
            NextUpWidgetEntryView(entry: NextUpEntry(
                date: Date(),
                bookTitle: "Barakaat Makkiyyah",
                currentPage: 10,
                totalPages: 10,
                isCompleted: true,
                lastUpdatedDate: Date()
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
        }
    }
} 