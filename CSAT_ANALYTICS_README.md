# CSAT Analytics Dashboard

## Overview

The CSAT (Customer Satisfaction) Analytics Dashboard is a comprehensive tool for measuring and analyzing customer satisfaction based on thumbs up/down reactions from your AI chat system. It provides real-time insights into how well your AI responses are meeting user needs with flexible time-based filtering.

## Features

### 🎯 **Core Metrics**
- **Overall CSAT Score**: Percentage of positive reactions vs. total reactions
- **Reaction Counts**: Total thumbs up, thumbs down, and overall volume
- **Trend Analysis**: Week-over-week comparison of CSAT scores and volume (All Time view)

### 📊 **Detailed Breakdowns**
- **Thumbs Up Categories**: 
  - Accurate responses
  - Clear explanations
  - Useful sources
  - Other positive feedback
- **Thumbs Down Categories**:
  - Inaccurate responses
  - Unclear explanations
  - Missing information
  - Other negative feedback

### ⏰ **Time-Based Filtering**
- **Today**: Current day's reactions only
- **Last 7 Days**: Rolling 7-day window
- **This Week**: Current calendar week (Monday-Sunday)
- **This Month**: Current calendar month
- **This Year**: Current calendar year
- **All Time**: Complete historical data with trend analysis

### 🔄 **Interactive Features**
- **Real-time Updates**: Data refreshes automatically from your database
- **Export Functionality**: Download analytics data as CSV files (filtered by time period)
- **Responsive Design**: Works on desktop and mobile devices
- **Smart UI**: Trends section only shows for All Time view

## Installation & Setup

### 1. **WordPress Admin Integration**
The CSAT Analytics tab is automatically added to your WordPress admin menu under **AI Trainer > CSAT Analytics**.

### 2. **Database Requirements**
The system uses your existing `ai_chat_log` table with these columns:
- `reaction`: JSON field storing like/dislike counts
- `reaction_detail`: JSON field storing feedback categories
- `created_at`: Timestamp for trend calculations

### 3. **File Structure**
```
admin/tabs/csat-analytics.php    # Main admin tab with time filtering
csat-demo.html                   # Demo page with interactive filtering
CSAT_ANALYTICS_README.md        # This documentation
```

## Usage

### **Accessing the Dashboard**
1. Log into your WordPress admin
2. Navigate to **AI Trainer > CSAT Analytics**
3. Use the time period filter to view different time ranges
4. View your real-time CSAT metrics

### **Time Filtering**

#### **Filter Options**
- **Today**: Shows only reactions from the current day
- **Last 7 Days**: Rolling window of the past 7 days
- **This Week**: Current calendar week (Monday through Sunday)
- **This Month**: Current calendar month
- **This Year**: Current calendar year
- **All Time**: Complete historical data with trend analysis

#### **Filter Behavior**
- **Trend Indicators**: Only visible in "All Time" view
- **Data Context**: Shows which time period is currently filtered
- **Export Naming**: CSV files include the selected time period
- **Quick Navigation**: Easy switching between time periods

### **Understanding the Data**

#### **CSAT Score Calculation**
```
CSAT Score = (Positive Reactions / Total Reactions) × 100
```

#### **Trend Indicators (All Time View Only)**
- **Last 7 Days CSAT**: Current week's satisfaction score
- **Last 7 Days Volume**: Number of reactions this week
- **Change Indicators**: ↗ for improvement, ↘ for decline

#### **Breakdown Analysis**
- **Progress Bars**: Visual representation of category distribution
- **Percentages**: Relative importance of each feedback category
- **Counts**: Absolute numbers for each category

### **Action Buttons**

#### **🔄 Refresh CSAT Data**
- Reloads the dashboard with latest data
- Useful after new reactions are logged

#### **📊 Export Data**
- Downloads a CSV file with all analytics data for the selected time period
- Includes breakdowns and summary metrics
- Perfect for external analysis or reporting

## Data Sources

### **Reaction Collection**
The system automatically collects data from:
- User thumbs up/down reactions on AI responses
- Feedback category selections
- Timestamp data for trend analysis

### **Database Queries**
```sql
-- Time-filtered queries (examples)
-- Today
WHERE DATE(created_at) = CURDATE()

-- Last 7 Days
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)

-- This Week
WHERE YEARWEEK(created_at) = YEARWEEK(NOW())

-- This Month
WHERE YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())

-- This Year
WHERE YEAR(created_at) = YEAR(NOW())
```

## Customization

### **Adding New Time Filters**
To add new time filters, modify the `get_csat_data()` function in `csat-analytics.php`:

```php
switch ($time_filter) {
    case 'custom_period':
        $where_clause .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
    // ... existing cases
}
```

### **Modifying Filter Labels**
Update the `$filter_options` array:

```php
$filter_options = [
    'today' => 'Today',
    '7_days' => 'Last 7 Days',
    'custom_period' => 'Custom Period',  // Add new filter
    // ... existing options
];
```

### **Adding New Feedback Categories**
To add new feedback categories, modify the default breakdown arrays:

```php
if (empty($thumbs_up_breakdown)) {
    $thumbs_up_breakdown = [
        'Accurate' => 0,
        'Clear explanation' => 0,
        'Useful sources' => 0,
        'Your New Category' => 0,  // Add here
        'Other' => 0
    ];
}
```

### **Modifying the UI**
The dashboard uses inline CSS for styling. To customize:
1. Edit the `<style>` section in `csat-analytics.php`
2. Modify colors, spacing, and layout as needed
3. Update the responsive breakpoints for mobile devices

## API Integration

### **AJAX Endpoints**
The system provides these AJAX endpoints:

#### **Data Export**
```javascript
// Export functionality is built into the dashboard
// No additional API calls needed
```

### **Time Filter Integration**
```javascript
// Filter by time period
const filterUrl = '?page=ai-trainer-csat-analytics&time_filter=today';
window.location.href = filterUrl;
```

## Troubleshooting

### **Common Issues**

#### **No Data Displayed**
- Check if reactions exist in your `ai_chat_log` table
- Verify the `reaction` column contains valid JSON data
- Ensure user permissions allow access to the analytics
- Check if the selected time filter has data

#### **CSAT Score Not Calculating**
- Confirm reaction data format: `{"like": 5, "dislike": 2}`
- Check for JavaScript errors in browser console
- Verify database connection and table structure

#### **Export Not Working**
- Ensure browser supports file downloads
- Check for JavaScript errors
- Verify data exists before attempting export

#### **Time Filter Not Working**
- Check if `created_at` column exists and has valid timestamps
- Verify database timezone settings
- Ensure the filter parameter is properly passed in the URL

### **Debug Mode**
Enable WordPress debug mode to see detailed error logs:
```php
// In wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## Performance Considerations

### **Database Optimization**
- The system queries the `ai_chat_log` table with time-based WHERE clauses
- Consider adding indexes on `reaction`, `created_at`, and `reaction_detail` columns
- Monitor query performance with large reaction volumes
- Time filters help reduce data load for specific periods

### **Caching**
- Consider implementing caching for large datasets
- Cache trend calculations for better performance
- Use WordPress transients for temporary data storage
- Cache filtered results for frequently accessed time periods

## Security

### **Access Control**
- Only users with `manage_options` capability can access analytics
- Input sanitization protects against malicious data
- Time filter parameters are properly sanitized

### **Data Privacy**
- Reaction data is stored in your local database
- No external data transmission
- User IPs and personal data are not logged
- Time filters respect data boundaries

## Future Enhancements

### **Planned Features**
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Filtering**: Custom date ranges, user segments, response types
- **Comparative Analysis**: Benchmark against industry standards
- **Alert System**: Notifications for significant CSAT changes
- **Scheduled Reports**: Automated analytics summaries

### **Integration Possibilities**
- **Slack/Teams**: Automated reporting with time period context
- **Email Reports**: Scheduled analytics summaries for different time periods
- **External Analytics**: Google Analytics, Mixpanel integration
- **Custom Dashboards**: Embed analytics in other admin pages

## Support

### **Getting Help**
1. Check this documentation first
2. Review the demo file (`csat-demo.html`) for examples
3. Examine the source code for implementation details
4. Check WordPress error logs for debugging information

### **Contributing**
To contribute improvements:
1. Test changes thoroughly across different time filters
2. Follow WordPress coding standards
3. Document new features
4. Ensure backward compatibility

## Version History

- **v1.0**: Initial release with core CSAT analytics
- **v1.1**: Added trend analysis and export functionality
- **v1.2**: Enhanced UI and responsive design
- **v1.3**: Added time-based filtering capabilities
- **v1.4**: Removed reset functionality, enhanced filtering UI

---

**Note**: This CSAT Analytics system is designed to work with your existing AI chat infrastructure. The time filtering feature provides flexible data analysis while maintaining performance. Ensure your reaction logging system is properly configured before using the analytics dashboard.
