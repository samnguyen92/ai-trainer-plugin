<?php
if (!defined('ABSPATH')) exit;

// Get recent chat logs to analyze psychedelics.com inclusion
global $wpdb;

// Check if the new columns exist
$psychedelics_columns_exist = $wpdb->get_results("SHOW COLUMNS FROM {$wpdb->prefix}ai_chat_log LIKE 'psychedelics_com_included'");

if (empty($psychedelics_columns_exist)) {
    echo '<div class="notice notice-warning"><p><strong>Database Update Required:</strong> The psychedelics.com guarantee tracking columns have not been added yet. Please deactivate and reactivate the plugin to create these columns.</p></div>';
    $psychedelics_stats = [
        'total_queries' => 0,
        'with_psychedelics_com' => 0,
        'guarantee_met' => 0,
        'guarantee_warnings' => 0,
        'guarantee_failures' => 0
    ];
    $recent_logs = [];
} else {
    // Get statistics from the database
    $psychedelics_stats = [
        'total_queries' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log"),
        'with_psychedelics_com' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log WHERE psychedelics_com_included = 1"),
        'guarantee_met' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log WHERE psychedelics_com_guarantee_status = 'Passed'"),
        'guarantee_warnings' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log WHERE psychedelics_com_guarantee_status = 'Warning'"),
        'guarantee_failures' => $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}ai_chat_log WHERE psychedelics_com_guarantee_status = 'Failed'")
    ];
    
    // Get recent logs with psychedelics.com data
    $recent_logs = $wpdb->get_results("
        SELECT question, answer, psychedelics_com_included, psychedelics_com_count, 
               psychedelics_com_guarantee_status, psychedelics_com_guarantee_details, created_at
        FROM {$wpdb->prefix}ai_chat_log 
        ORDER BY created_at DESC 
        LIMIT 20
    ", ARRAY_A);
}

$current_config = [
    'guarantee_enabled' => defined('PSYCHEDELICS_COM_GUARANTEE') ? PSYCHEDELICS_COM_GUARANTEE : false,
    'fallback_enabled' => defined('PSYCHEDELICS_COM_FALLBACK_ENABLED') ? PSYCHEDELICS_COM_FALLBACK_ENABLED : false,
    'min_results' => defined('PSYCHEDELICS_COM_MIN_RESULTS') ? PSYCHEDELICS_COM_MIN_RESULTS : 3,
    'max_results' => defined('PSYCHEDELICS_COM_MAX_RESULTS') ? PSYCHEDELICS_COM_MAX_RESULTS : 8
];
?>

<div class="wrap">
    <h1>Psychedelics.com Content Guarantee Monitor</h1>
    
    <div class="notice notice-info">
        <p><strong>Purpose:</strong> This monitor tracks how well the system is ensuring psychedelics.com content is featured in every query.</p>
    </div>
    
    <!-- Configuration Status -->
    <div class="card">
        <h2>Current Configuration</h2>
        <table class="form-table">
            <tr>
                <th>Content Guarantee</th>
                <td>
                    <span class="dashicons dashicons-<?php echo $current_config['guarantee_enabled'] ? 'yes' : 'no'; ?>"></span>
                    <?php echo $current_config['guarantee_enabled'] ? 'Enabled' : 'Disabled'; ?>
                </td>
            </tr>
            <tr>
                <th>Fallback Search</th>
                <td>
                    <span class="dashicons dashicons-<?php echo $current_config['fallback_enabled'] ? 'yes' : 'no'; ?>"></span>
                    <?php echo $current_config['fallback_enabled'] ? 'Enabled' : 'Disabled'; ?>
                </td>
            </tr>
            <tr>
                <th>Target Results Range</th>
                <td><?php echo $current_config['min_results']; ?> - <?php echo $current_config['max_results']; ?> psychedelics.com results per query</td>
            </tr>
        </table>
    </div>
    
    <!-- Statistics -->
    <div class="card">
        <h2>Query Statistics</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <h3><?php echo $psychedelics_stats['total_queries']; ?></h3>
                <p>Total Queries</p>
            </div>
            <div class="stat-box">
                <h3><?php echo $psychedelics_stats['with_psychedelics_com']; ?></h3>
                <p>With Psychedelics.com</p>
            </div>
            <div class="stat-box">
                <h3><?php echo $psychedelics_stats['guarantee_met']; ?></h3>
                <p>Guarantee Met</p>
            </div>
            <div class="stat-box">
                <h3><?php echo $psychedelics_stats['guarantee_warnings']; ?></h3>
                <p>Warnings</p>
            </div>
            <div class="stat-box">
                <h3><?php echo $psychedelics_stats['guarantee_failures']; ?></h3>
                <p>Failures</p>
            </div>
        </div>
        
        <?php if ($psychedelics_stats['total_queries'] > 0): ?>
        <div class="stats-summary">
            <p><strong>Success Rate:</strong> <?php echo round(($psychedelics_stats['guarantee_met'] / $psychedelics_stats['total_queries']) * 100, 1); ?>%</p>
            <p><strong>Psychedelics.com Inclusion Rate:</strong> <?php echo round(($psychedelics_stats['with_psychedelics_com'] / $psychedelics_stats['total_queries']) * 100, 1); ?>%</p>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Recent Activity -->
    <?php if (!empty($recent_logs)): ?>
    <div class="card">
        <h2>Recent Queries</h2>
        <table class="widefat striped">
            <thead>
                <tr>
                    <th>Question</th>
                    <th>Psychedelics.com</th>
                    <th>Count</th>
                    <th>Status</th>
                    <th>Details</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($recent_logs as $log): ?>
                <tr>
                    <td><?php echo esc_html(substr($log['question'], 0, 60)) . (strlen($log['question']) > 60 ? '...' : ''); ?></td>
                    <td>
                        <span class="dashicons dashicons-<?php echo $log['psychedelics_com_included'] ? 'yes' : 'no'; ?>"></span>
                        <?php echo $log['psychedelics_com_included'] ? 'Yes' : 'No'; ?>
                    </td>
                    <td><?php echo $log['psychedelics_com_count']; ?></td>
                    <td>
                        <span class="status-badge status-<?php echo strtolower($log['psychedelics_com_guarantee_status']); ?>">
                            <?php echo esc_html($log['psychedelics_com_guarantee_status']); ?>
                        </span>
                    </td>
                    <td><?php echo esc_html(substr($log['psychedelics_com_guarantee_details'], 0, 50)) . (strlen($log['psychedelics_com_guarantee_details']) > 50 ? '...' : ''); ?></td>
                    <td><?php echo date('M j, Y g:i A', strtotime($log['created_at'])); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    <?php endif; ?>
    
    <!-- Configuration Instructions -->
    <div class="card">
        <h2>Configuration</h2>
        <p>To modify the psychedelics.com guarantee settings, edit the constants in <code>ai-trainer.php</code>:</p>
        <pre><code>// ENHANCED: Configuration for psychedelics.com guarantee
define('PSYCHEDELICS_COM_GUARANTEE', true); // Set to false to disable the guarantee
define('PSYCHEDELICS_COM_FALLBACK_ENABLED', true); // Set to false to disable fallback search
define('PSYCHEDELICS_COM_MIN_RESULTS', 3); // Minimum psychedelics.com results to include
define('PSYCHEDELICS_COM_MAX_RESULTS', 8); // Maximum psychedelics.com results to include</code></pre>
    </div>
    
    <!-- How It Works -->
    <div class="card">
        <h2>How the Guarantee Works</h2>
        <ol>
            <li><strong>Primary Search:</strong> EXA search with domain priorities (psychedelics.com gets highest priority)</li>
            <li><strong>Fallback Check:</strong> If no psychedelics.com results found, runs a specific site:psychedelics.com search</li>
            <li><strong>Smart Merging:</strong> Combines results with psychedelics.com content prioritized at the top</li>
            <li><strong>Enhanced Reordering:</strong> Ensures psychedelics.com results appear in the first few positions</li>
            <li><strong>Quality Monitoring:</strong> Tracks guarantee compliance and logs any issues</li>
        </ol>
    </div>
</div>

<style>
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.stat-box {
    text-align: center;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
    border: 1px solid #ddd;
}

.stat-box h3 {
    margin: 0 0 10px 0;
    font-size: 2em;
    color: #0073aa;
}

.stat-box p {
    margin: 0;
    color: #666;
    font-weight: 500;
}

.stats-summary {
    margin-top: 20px;
    padding: 15px;
    background: #f0f8ff;
    border-radius: 4px;
    border-left: 4px solid #0073aa;
}

.stats-summary p {
    margin: 5px 0;
    font-weight: 500;
}

.status-badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.status-passed {
    background: #d4edda;
    color: #155724;
}

.status-warning {
    background: #fff3cd;
    color: #856404;
}

.status-failed {
    background: #f8d7da;
    color: #721c24;
}

.status-unknown {
    background: #e2e3e5;
    color: #383d41;
}

.card {
    background: white;
    border: 1px solid #ccd0d4;
    border-radius: 4px;
    padding: 20px;
    margin: 20px 0;
    box-shadow: 0 1px 1px rgba(0,0,0,.04);
}

.card h2 {
    margin-top: 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
}

pre {
    background: #f6f8fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
}

code {
    background: #f6f8fa;
    padding: 2px 4px;
    border-radius: 3px;
}

.widefat th {
    font-weight: 600;
}

.widefat td {
    vertical-align: top;
}
</style>
