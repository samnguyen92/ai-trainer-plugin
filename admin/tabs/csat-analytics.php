<?php
/**
 * CSAT Analytics Tab
 * Displays customer satisfaction metrics based on thumbs up/down reactions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get reaction data from database with time filtering
function get_csat_data($time_filter = 'all_time') {
    global $wpdb;
    
    $chatlog_table = $wpdb->prefix . 'ai_chat_log';
    
    // Build WHERE clause based on time filter
    $where_clause = "WHERE reaction IS NOT NULL AND reaction != ''";
    
    switch ($time_filter) {
        case 'today':
            // Use WordPress timezone for today's date
            $today = current_time('Y-m-d'); // Get current date in WordPress timezone
            $where_clause .= $wpdb->prepare(" AND DATE(created_at) = %s", $today);
            break;
        case '7_days':
            $where_clause .= " AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            break;
        case 'this_week':
            $where_clause .= " AND YEARWEEK(created_at, 1) = YEARWEEK(NOW(), 1)";
            break;
        case 'this_month':
            $where_clause .= " AND YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())";
            break;
        case 'this_year':
            $where_clause .= " AND YEAR(created_at) = YEAR(NOW())";
            break;
        case 'all_time':
        default:
            // No additional filtering
            break;
    }
    
    // Debug: Log the query being executed
    error_log("CSAT Query WHERE clause: " . $where_clause);
    
    // Get all reactions with time filter
    $reactions = $wpdb->get_results("
        SELECT reaction, reaction_detail, created_at
        FROM {$chatlog_table} 
        {$where_clause}
        ORDER BY created_at DESC
    ");
    
    // Debug: Log the number of reactions found
    error_log("CSAT Found " . count($reactions) . " reactions for filter: " . $time_filter);
    
    $thumbs_up_total = 0;
    $thumbs_down_total = 0;
    $thumbs_up_breakdown = [
        'Accurate' => 0,
        'Clear explanation' => 0,
        'Useful sources' => 0,
        'Other' => 0
    ];
    $thumbs_down_breakdown = [
        'Inaccurate' => 0,
        'Unclear' => 0,
        'Missing info' => 0,
        'Other' => 0
    ];
    
    foreach ($reactions as $reaction) {
        // Debug: Log each reaction for troubleshooting
        error_log("Processing reaction: " . print_r($reaction, true));
        
        $reaction_data = json_decode($reaction->reaction, true);
        
        if (is_array($reaction_data)) {
            // Count thumbs up
            if (isset($reaction_data['like']) && $reaction_data['like'] > 0) {
                $thumbs_up_total += $reaction_data['like'];
                
                // Get breakdown from reaction detail
                if (!empty($reaction->reaction_detail)) {
                    $detail = json_decode($reaction->reaction_detail, true);
                    error_log("Reaction detail decoded: " . print_r($detail, true));
                    
                    if (is_array($detail) && isset($detail['option'])) {
                        $option = $detail['option'];
                        // Map common variations to our standard categories
                        $mapped_option = map_feedback_option($option, 'positive');
                        error_log("Mapped option '{$option}' to '{$mapped_option}'");
                        
                        if (isset($thumbs_up_breakdown[$mapped_option])) {
                            $thumbs_up_breakdown[$mapped_option] += $reaction_data['like'];
                        } else {
                            $thumbs_up_breakdown['Other'] += $reaction_data['like'];
                        }
                    } else {
                        // No specific category, count as "Other"
                        $thumbs_up_breakdown['Other'] += $reaction_data['like'];
                        error_log("No specific category found, counting as Other");
                    }
                } else {
                    // No reaction detail, count as "Other"
                    $thumbs_up_breakdown['Other'] += $reaction_data['like'];
                    error_log("No reaction detail, counting as Other");
                }
            }
            
            // Count thumbs down
            if (isset($reaction_data['dislike']) && $reaction_data['dislike'] > 0) {
                $thumbs_down_total += $reaction_data['dislike'];
                
                // Get breakdown from reaction detail
                if (!empty($reaction->reaction_detail)) {
                    $detail = json_decode($reaction->reaction_detail, true);
                    error_log("Reaction detail decoded: " . print_r($detail, true));
                    
                    if (is_array($detail) && isset($detail['option'])) {
                        $option = $detail['option'];
                        // Map common variations to our standard categories
                        $mapped_option = map_feedback_option($option, 'negative');
                        error_log("Mapped option '{$option}' to '{$mapped_option}'");
                        
                        if (isset($thumbs_down_breakdown[$mapped_option])) {
                            $thumbs_down_breakdown[$mapped_option] += $reaction_data['dislike'];
                        } else {
                            $thumbs_down_breakdown['Other'] += $reaction_data['dislike'];
                        }
                    } else {
                        // No specific category, count as "Other"
                        $thumbs_down_breakdown['Other'] += $reaction_data['dislike'];
                        error_log("No specific category found, counting as Other");
                    }
                } else {
                    // No reaction detail, count as "Other"
                    $thumbs_down_breakdown['Other'] += $reaction_data['dislike'];
                    error_log("No reaction detail, counting as Other");
                }
            }
        }
    }
    
    // Debug: Log final counts
    error_log("Final counts - Thumbs up: {$thumbs_up_total}, Thumbs down: {$thumbs_down_total}");
    error_log("Thumbs up breakdown: " . print_r($thumbs_up_breakdown, true));
    error_log("Thumbs down breakdown: " . print_r($thumbs_down_breakdown, true));
    
    $total_reactions = $thumbs_up_total + $thumbs_down_total;
    $csat_score = $total_reactions > 0 ? round(($thumbs_up_total / $total_reactions) * 100) : 0;
    
    return [
        'csat_score' => $csat_score,
        'total_reactions' => $total_reactions,
        'thumbs_up' => [
            'total' => $thumbs_up_total,
            'breakdown' => $thumbs_up_breakdown
        ],
        'thumbs_down' => [
            'total' => $thumbs_down_total,
            'breakdown' => $thumbs_down_breakdown
        ],
        'time_filter' => $time_filter
    ];
}

// Map feedback options to standard categories
function map_feedback_option($option, $type) {
    $option = strtolower(trim($option));
    
    if ($type === 'positive') {
        // Map positive feedback options
        if (strpos($option, 'accurate') !== false || strpos($option, 'correct') !== false || strpos($option, 'right') !== false) {
            return 'Accurate';
        }
        if (strpos($option, 'clear') !== false || strpos($option, 'explanation') !== false || strpos($option, 'understand') !== false) {
            return 'Clear explanation';
        }
        if (strpos($option, 'source') !== false || strpos($option, 'reference') !== false || strpos($option, 'link') !== false) {
            return 'Useful sources';
        }
        return 'Other';
    } else {
        // Map negative feedback options
        if (strpos($option, 'inaccurate') !== false || strpos($option, 'wrong') !== false || strpos($option, 'incorrect') !== false) {
            return 'Inaccurate';
        }
        if (strpos($option, 'unclear') !== false || strpos($option, 'confusing') !== false || strpos($option, 'hard to understand') !== false) {
            return 'Unclear';
        }
        if (strpos($option, 'missing') !== false || strpos($option, 'incomplete') !== false || strpos($option, 'not enough') !== false) {
            return 'Missing info';
        }
        return 'Other';
    }
}

// Get current time filter from URL parameter
$current_filter = isset($_GET['time_filter']) ? sanitize_text_field($_GET['time_filter']) : 'all_time';
$csat_data = get_csat_data($current_filter);

// Get filter options with current selection
$filter_options = [
    'today' => 'Today',
    '7_days' => 'Last 7 Days',
    'this_week' => 'This Week',
    'this_month' => 'This Month',
    'this_year' => 'This Year',
    'all_time' => 'All Time'
];

// Debug: Show current filter and data
error_log("Current filter: " . $current_filter);
error_log("CSAT data: " . print_r($csat_data, true));
?>

<div class="wrap">
    <h1>🧠 CSAT Analytics</h1>
    <p>Customer Satisfaction Score and Detailed Feedback Analysis</p>
    
    <!-- Debug Info (remove in production) -->
    <?php if (defined('WP_DEBUG') && WP_DEBUG): ?>
    <div style="background: #f0f0f0; border: 1px solid #ccc; padding: 10px; margin: 10px 0; border-radius: 5px;">
        <strong>Debug Info:</strong><br>
        Current Filter: <?php echo $current_filter; ?><br>
        Total Reactions: <?php echo $csat_data['total_reactions']; ?><br>
        Thumbs Up: <?php echo $csat_data['thumbs_up']['total']; ?><br>
        Thumbs Down: <?php echo $csat_data['thumbs_down']['total']; ?><br>
        CSAT Score: <?php echo $csat_data['csat_score']; ?>%
    </div>
    <?php endif; ?>
    
    <!-- Time Filter Controls -->
    <div class="csat-filters" style="margin-bottom: 30px;">
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #000; font-size: 16px;">Time Period Filter</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <?php foreach ($filter_options as $value => $label): ?>
                    <a href="?page=ai-trainer-csat-analytics&time_filter=<?php echo $value; ?>" 
                       class="filter-btn <?php echo $current_filter === $value ? 'active' : ''; ?>"
                       style="
                           padding: 8px 16px;
                           border-radius: 6px;
                           text-decoration: none;
                           font-size: 14px;
                           font-weight: 500;
                           transition: all 0.3s ease;
                           <?php if ($current_filter === $value): ?>
                               background: #3bb273;
                               color: white;
                               border: 1px solid #3bb273;
                           <?php else: ?>
                               background: rgba(255,255,255,0.1);
                               color: #000;
                               border: 1px solid rgba(255,255,255,0.2);
                           <?php endif; ?>
                       ">
                        <?php echo $label; ?>
                    </a>
                <?php endforeach; ?>
            </div>
            <div style="margin-top: 15px; font-size: 12px; color: #000;">
                Currently showing: <strong><?php echo $filter_options[$current_filter]; ?></strong>
                <?php if ($current_filter !== 'all_time'): ?>
                    • <a href="?page=ai-trainer-csat-analytics&time_filter=all_time" style="color: #3bb273; text-decoration: none;">View All Time</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
    
    <div id="csat-dashboard">
        <!-- CSAT Overview -->
        <div class="csat-overview" style="margin-bottom: 30px;">
            <div class="csat-score-card" style="background: linear-gradient(135deg, #3bb273, #2d8f5a); padding: 30px; border-radius: 16px; text-align: center;">
                <h2 style="font-size: 48px; margin: 0; color: #fff; font-weight: 700;"><?php echo $csat_data['csat_score']; ?>%</h2>
                <p style="font-size: 18px; margin: 10px 0 0 0; color: rgba(255,255,255,0.9);">Customer Satisfaction Score</p>
                <div style="margin-top: 15px; font-size: 14px; color: rgba(255,255,255,0.8);">
                    <?php echo $csat_data['thumbs_up']['total']; ?> positive • <?php echo $csat_data['thumbs_down']['total']; ?> negative • <?php echo $csat_data['total_reactions']; ?> total
                </div>
                <?php if ($current_filter !== 'all_time'): ?>
                    <div style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.7);">
                        Filtered by: <?php echo $filter_options[$current_filter]; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- CSAT Breakdown -->
        <div class="csat-breakdown" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
            <!-- Thumbs Up Breakdown -->
            <div class="thumbs-up-breakdown" style="background: rgba(59, 178, 115, 0.1); border: 1px solid rgba(59, 178, 115, 0.3); border-radius: 12px; padding: 20px;">
                <h4 style="color: #3bb273; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 8px;">
                    👍 Thumbs Up Breakdown (<?php echo $csat_data['thumbs_up']['total']; ?>)
                </h4>
                <?php foreach ($csat_data['thumbs_up']['breakdown'] as $option => $count): ?>
                    <?php 
                    $percentage = $csat_data['thumbs_up']['total'] > 0 ? round(($count / $csat_data['thumbs_up']['total']) * 100) : 0;
                    ?>
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span style="color: #000; font-weight: 500;"><?php echo esc_html($option); ?></span>
                            <span style="color: #3bb273; font-weight: 600;"><?php echo $count; ?> (<?php echo $percentage; ?>%)</span>
                        </div>
                        <div class="progress-bar" style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div class="progress-fill positive" style="width: <?php echo $percentage; ?>%; height: 100%; background: #3bb273; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Thumbs Down Breakdown -->
            <div class="thumbs-down-breakdown" style="background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.3); border-radius: 12px; padding: 20px;">
                <h4 style="color: #e74c3c; margin: 0 0 20px 0; font-size: 20px; display: flex; align-items: center; gap: 8px;">
                    👎 Thumbs Down Breakdown (<?php echo $csat_data['thumbs_down']['total']; ?>)
                </h4>
                <?php foreach ($csat_data['thumbs_down']['breakdown'] as $option => $count): ?>
                    <?php 
                    $percentage = $csat_data['thumbs_down']['total'] > 0 ? round(($count / $csat_data['thumbs_down']['total']) * 100) : 0;
                    ?>
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <span style="color: #000; font-weight: 500;"><?php echo esc_html($option); ?></span>
                            <span style="color: #e74c3c; font-weight: 600;"><?php echo $count; ?> (<?php echo $percentage; ?>%)</span>
                        </div>
                        <div class="progress-bar" style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                            <div class="progress-fill negative" style="width: <?php echo $percentage; ?>%; height: 100%; background: #e74c3c; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- CSAT Summary -->
        <div class="csat-summary" style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <h4 style="margin: 0 0 15px 0; color: #000;">Summary</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #3bb273;"><?php echo $csat_data['csat_score']; ?>%</div>
                    <div style="font-size: 14px; color: #000;">Overall Satisfaction</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #3bb273;"><?php echo $csat_data['thumbs_up']['total']; ?></div>
                    <div style="font-size: 14px; color: #000;">Positive Reactions</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #e74c3c;"><?php echo $csat_data['thumbs_down']['total']; ?></div>
                    <div style="font-size: 14px; color: #000;">Negative Reactions</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #fff;"><?php echo $csat_data['total_reactions']; ?></div>
                    <div style="font-size: 14px; color: #000;">Total Responses</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Buttons -->
    <div style="margin-top: 30px; text-align: center; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
        <button type="button" class="button button-primary" id="refresh-csat" style="padding: 10px 20px; font-size: 16px;">
            🔄 Refresh CSAT Data
        </button>
        <button type="button" class="button button-secondary" id="export-csat" style="padding: 10px 20px; font-size: 16px;">
            📊 Export Data
        </button>
    </div>
</div>

<style>
/* CSAT Dashboard Styles */
.csat-score-card {
    background: linear-gradient(135deg, #3bb273, #2d8f5a);
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    margin-bottom: 20px;
}

.thumbs-up-breakdown {
    background: rgba(59, 178, 115, 0.1);
    border: 1px solid rgba(59, 178, 115, 0.3);
    border-radius: 12px;
    padding: 20px;
}

.thumbs-down-breakdown {
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 12px;
    padding: 20px;
}

.csat-breakdown {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.csat-summary {
    margin-top: 30px;
    padding: 20px;
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
}

.progress-bar {
    background: rgba(255,255,255,0.1);
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    transition: width 0.3s ease;
}

.progress-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.progress-fill.positive {
    background: #3bb273;
}

.progress-fill.negative {
    background: #e74c3c;
}

.filter-btn:hover {
    background: rgba(255,255,255,0.2) !important;
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .csat-breakdown {
        grid-template-columns: 1fr;
    }
    
    .csat-filters .filter-btn {
        flex: 1;
        text-align: center;
        min-width: 120px;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    // Refresh CSAT data
    $('#refresh-csat').on('click', function() {
        const button = $(this);
        const originalText = button.text();
        
        button.prop('disabled', true).text('🔄 Refreshing...');
        
        // Reload the page to refresh data
        setTimeout(function() {
            location.reload();
        }, 1000);
    });
    
    // Export CSAT data
    $('#export-csat').on('click', function() {
        const button = $(this);
        button.prop('disabled', true).text('📊 Exporting...');
        
        // Create CSV data
        const csvData = createCSVData();
        downloadCSV(csvData, 'csat-analytics-<?php echo $current_filter; ?>.csv');
        
        setTimeout(function() {
            button.prop('disabled', false).text('📊 Export Data');
        }, 1000);
    });
    
    function createCSVData() {
        const data = <?php echo json_encode($csat_data); ?>;
        let csv = 'CSAT Analytics Report - <?php echo $filter_options[$current_filter]; ?>\n\n';
        csv += 'Overall CSAT Score,' + data.csat_score + '%\n';
        csv += 'Total Reactions,' + data.total_reactions + '\n';
        csv += 'Positive Reactions,' + data.thumbs_up.total + '\n';
        csv += 'Negative Reactions,' + data.thumbs_down.total + '\n\n';
        
        csv += 'Thumbs Up Breakdown\n';
        Object.entries(data.thumbs_up.breakdown).forEach(([option, count]) => {
            csv += option + ',' + count + '\n';
        });
        
        csv += '\nThumbs Down Breakdown\n';
        Object.entries(data.thumbs_down.breakdown).forEach(([option, count]) => {
            csv += option + ',' + count + '\n';
        });
        
        return csv;
    }
    
    function downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
});
</script>
