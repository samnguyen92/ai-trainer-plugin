# Psychedelics.com Content Guarantee System

## Overview

The Psychedelics.com Content Guarantee System ensures that every query processed by the AI Trainer includes relevant content from psychedelics.com. This system implements a dual-query strategy with intelligent result merging and positioning to maintain content quality while prioritizing psychedelics.com as the primary source.

## How It Works

### 1. Primary Search
- **EXA API Search**: Performs the main search with domain priorities
- **Tier-based Prioritization**: psychedelics.com is set to Tier 1 (highest priority)
- **Domain Priorities**: Uses EXA's `domainPriorities` parameter for optimal ranking

### 2. Fallback Search
- **Automatic Detection**: If no psychedelics.com results are found in the primary search
- **Site-specific Query**: Runs a `site:psychedelics.com` search as a fallback
- **Guaranteed Results**: Ensures psychedelics.com content is always available

### 3. Smart Result Merging
- **Priority Positioning**: Places psychedelics.com results at the top of the results list
- **Deduplication**: Removes duplicate URLs while maintaining relevance
- **Configurable Limits**: Controls minimum and maximum psychedelics.com results per query

### 4. Enhanced Reordering
- **Tier-based Sorting**: Ensures results respect the established priority system
- **Psychedelics.com First**: Guarantees psychedelics.com results appear in the first few positions
- **Quality Maintenance**: Balances relevance with source priority

## Configuration

### Constants (ai-trainer.php)

```php
// Enable/disable the entire guarantee system
define('PSYCHEDELICS_COM_GUARANTEE', true);

// Enable/disable fallback search
define('PSYCHEDELICS_COM_FALLBACK_ENABLED', true);

// Control result quantity
define('PSYCHEDELICS_COM_MIN_RESULTS', 3);  // Minimum results required
define('PSYCHEDELICS_COM_MAX_RESULTS', 8);  // Maximum results allowed
```

### Domain Tiers

The system uses a 4-tier domain prioritization system:

- **Tier 1 (Highest)**: psychedelics.com, doubleblindmag.com, psychedelicstoday.com, etc.
- **Tier 2 (High)**: dancesafe.org, blossomanalysis.com, erowid.org, etc.
- **Tier 3 (Medium)**: psychedelicspotlight.com, psychedelicalpha.com, etc.
- **Tier 4 (Low)**: Other trusted domains

## Monitoring & Analytics

### Admin Interface
- **Psychedelics.com Monitor**: New admin tab for tracking guarantee compliance
- **Real-time Statistics**: Success rates, inclusion rates, and failure tracking
- **Query History**: Recent queries with their guarantee status
- **Performance Metrics**: Detailed breakdown of system effectiveness

### Database Tracking
New columns added to `ai_chat_log` table:

- `psychedelics_com_included`: Boolean flag (0/1)
- `psychedelics_com_count`: Number of results included
- `psychedelics_com_guarantee_status`: Status (Passed/Warning/Failed/Unknown)
- `psychedelics_com_guarantee_details`: Detailed status information

### Logging
Comprehensive logging for debugging and monitoring:

```
[INFO] Executing psychedelics.com fallback search with query: ...
[INFO] Psychedelics.com fallback search returned X results
[INFO] Merged results: X psychedelics.com + Y primary = Z total
[INFO] Enhanced reordering - Psychedelics.com: X, Other Tier 1: Y, Tier 2: Z...
[INFO] Psychedelics.com guarantee status: Passed - X results included
```

## Benefits

### For Users
- **Consistent Content**: Every query includes psychedelics.com information
- **Quality Assurance**: Content is prioritized by relevance and source authority
- **Comprehensive Coverage**: Multiple perspectives from trusted sources

### For Content Creators
- **Guaranteed Visibility**: psychedelics.com content is always featured
- **Optimal Positioning**: Content appears in top search results
- **Performance Tracking**: Monitor how well content is being included

### For Administrators
- **Transparent Monitoring**: Real-time visibility into system performance
- **Configurable Controls**: Adjust guarantee parameters as needed
- **Quality Metrics**: Track success rates and identify issues

## Troubleshooting

### Common Issues

1. **No Psychedelics.com Results**
   - Check if fallback search is enabled
   - Verify EXA API key and permissions
   - Review domain blocking settings

2. **Too Many/Few Results**
   - Adjust `PSYCHEDELICS_COM_MIN_RESULTS` and `PSYCHEDELICS_COM_MAX_RESULTS`
   - Check tier configuration for psychedelics.com

3. **Poor Result Positioning**
   - Verify tier assignments in database
   - Check domain priority calculations
   - Review reordering logic

### Performance Optimization

- **Fallback Search**: Only runs when necessary (no psychedelics.com results found)
- **Result Caching**: Uses WordPress transients for query caching
- **Efficient Merging**: Smart deduplication and positioning algorithms

## Future Enhancements

### Planned Features
- **Machine Learning**: Adaptive result positioning based on user feedback
- **A/B Testing**: Compare different guarantee strategies
- **Advanced Analytics**: Deep dive into content performance metrics
- **API Endpoints**: REST API for external monitoring and control

### Integration Opportunities
- **Google Analytics**: Track content performance and user engagement
- **Search Console**: Monitor search performance and indexing
- **Custom Dashboards**: External monitoring and reporting tools

## Support

For technical support or feature requests related to the Psychedelics.com Content Guarantee System:

1. Check the admin interface for real-time status
2. Review error logs for specific issues
3. Verify configuration constants
4. Test with sample queries to isolate problems

## Technical Details

### Database Schema Changes
```sql
ALTER TABLE wp_ai_chat_log 
ADD COLUMN psychedelics_com_included TINYINT(1) DEFAULT 0,
ADD COLUMN psychedelics_com_count INT DEFAULT 0,
ADD COLUMN psychedelics_com_guarantee_status VARCHAR(50) DEFAULT 'Unknown',
ADD COLUMN psychedelics_com_guarantee_details TEXT NULL;
```

### API Integration
- **EXA Search API**: Primary and fallback search functionality
- **OpenAI Embeddings**: Content similarity and relevance scoring
- **WordPress Hooks**: Integration with existing plugin architecture

### Performance Considerations
- **Query Optimization**: Efficient database queries and indexing
- **Memory Management**: Smart result handling and cleanup
- **Caching Strategy**: Transient-based caching for repeated queries
