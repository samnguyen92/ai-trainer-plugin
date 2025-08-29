# Parallel Search Debugging Guide

## Quick Test

To test if the parallel search system is working, add this shortcode to any page:

```
[parallel_search_test]
```

This will show a test button that you can click to verify the system.

## Common Issues & Solutions

### 1. No Speed Improvement

**Possible Causes:**
- No domains configured in database
- API key not set
- Parallel search falling back to sequential
- cURL multi-handle not available

**Debug Steps:**
1. Check WordPress error logs for DEBUG messages
2. Use the test shortcode `[parallel_search_test]`
3. Verify domains exist in database
4. Check if EXA_API_KEY is set

### 2. Check Error Logs

Look for these debug messages in your WordPress error logs:

```
DEBUG: Starting parallel search for query: [your query]
DEBUG: Raw tiered domains: [domain list]
DEBUG: Domain groups by tier: [tier structure]
DEBUG: Total domains to search: [number]
DEBUG: Prepared [X] parallel search requests across [Y] tiers
```

### 3. Verify Domain Configuration

Check if domains exist in the database:

```sql
SELECT * FROM wp_ai_allowed_domains ORDER BY tier ASC;
```

If no domains exist, the system will automatically add sample domains.

### 4. Check API Key

Verify your EXA_API_KEY is set in your environment or .env file:

```bash
# Check if key is defined
echo $EXA_API_KEY
```

### 5. Test Individual Components

#### Test cURL Availability
```php
$ai_trainer = new Exa_AI_Integration();
$test_results = $ai_trainer->test_parallel_search('test');
```

#### Test Domain Setup
```php
$ai_trainer = new Exa_AI_Integration();
$domain_status = $ai_trainer->ensure_domains_exist();
```

## Expected Behavior

### Successful Parallel Search
```
DEBUG: Starting parallel search for query: [query]
DEBUG: API key available: Yes
DEBUG: Raw tiered domains: Array([psychedelics.com] => 1, [reddit.com] => 2)
DEBUG: Domain groups by tier: Array([1] => Array([0] => psychedelics.com), [2] => Array([0] => reddit.com))
DEBUG: Total domains to search: 2
DEBUG: Prepared 2 parallel search requests across 2 tiers
DEBUG: Using cURL multi-handle for optimal parallel performance
DEBUG: Parallel search completed: 2 requests in 1850.45ms (925.23ms per request), results: 15
```

### Fallback to Sequential
```
WARNING: No domains found in database, falling back to sequential search
DEBUG: Fallback sequential search completed in 45000.00ms with 12 results
```

## Performance Metrics

### Before (Sequential)
- **Total Time**: 60+ seconds
- **API Calls**: One at a time
- **User Experience**: Long wait times

### After (Parallel)
- **Total Time**: 15-20 seconds
- **API Calls**: All simultaneously
- **User Experience**: Fast responses

## Troubleshooting Steps

1. **Check Error Logs First**
   - Look for DEBUG, WARNING, and ERROR messages
   - Note the exact error messages

2. **Test Basic Functionality**
   - Use `[parallel_search_test]` shortcode
   - Check if domains exist
   - Verify API key is available

3. **Check Database**
   - Ensure `ai_allowed_domains` table exists
   - Verify domains have tier values (1-4)

4. **Check Server Environment**
   - PHP version 7.4+
   - cURL extension enabled
   - Sufficient memory allocation

5. **Test API Connectivity**
   - Verify Exa.ai API key is valid
   - Check network connectivity
   - Test with simple API call

## Common Error Messages

### "No domains found in database"
**Solution**: The system will auto-add sample domains, or manually add domains via admin

### "EXA API key is not available"
**Solution**: Set EXA_API_KEY environment variable or in .env file

### "cURL multi-handle not available"
**Solution**: System automatically falls back to WordPress HTTP API

### "Parallel execution timeout"
**Solution**: Check network connectivity and API response times

## Performance Monitoring

Monitor these metrics in your logs:

- **Request preparation time**
- **Parallel execution time**
- **Results count per tier**
- **Success/failure rates**
- **Fallback frequency**

## Getting Help

If issues persist:

1. **Collect Debug Information**
   - Error logs
   - Test results from shortcode
   - Database domain count
   - API key status

2. **Check System Requirements**
   - PHP version
   - WordPress version
   - Server specifications

3. **Test in Isolation**
   - Disable other plugins temporarily
   - Test on fresh WordPress installation
   - Verify with minimal configuration

## Expected Results

With proper configuration, you should see:

- **70-80% reduction** in search time
- **Parallel execution** of all API calls
- **Automatic fallback** if parallel fails
- **Comprehensive logging** for monitoring
- **Sample domains** added automatically if none exist

The system is designed to be robust and will automatically fall back to sequential search if parallel execution fails, ensuring your users always get results.
