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
        $reaction_data = json_decode($reaction->reaction, true);
        
        if (is_array($reaction_data)) {
            // Count thumbs up
            if (isset($reaction_data['like']) && $reaction_data['like'] > 0) {
                $thumbs_up_total += $reaction_data['like'];
                
                // Get breakdown from reaction detail
                if (!empty($reaction->reaction_detail)) {
                    // Handle escaped JSON strings (with backslashes before quotes)
                    $detail = $reaction->reaction_detail;
                    if (is_string($detail)) {
                        // First, try to decode as-is
                        $detail = json_decode($detail, true);
                        
                        // If that fails or returns null, try with stripslashes
                        if ($detail === null) {
                            $detail = json_decode(stripslashes($detail), true);
                        }
                        
                        // If still fails, try with addslashes removed
                        if ($detail === null) {
                            $detail = json_decode(str_replace('\\"', '"', $reaction->reaction_detail), true);
                        }
                    }
                    if (is_array($detail) && isset($detail['option'])) {
                        $option = $detail['option'];
                        // Map common variations to our standard categories
                        $mapped_option = map_feedback_option($option, 'positive');
                        
                        if (isset($thumbs_up_breakdown[$mapped_option])) {
                            $thumbs_up_breakdown[$mapped_option] += $reaction_data['like'];
                        } else {
                            $thumbs_up_breakdown['Other'] += $reaction_data['like'];
                        }
                    } else {
                        // No specific category, count as "Other"
                        $thumbs_up_breakdown['Other'] += $reaction_data['like'];
                    }
                } else {
                    // No reaction detail, count as "Other"
                    $thumbs_up_breakdown['Other'] += $reaction_data['like'];
                }
            }
            
            // Count thumbs down
            if (isset($reaction_data['dislike']) && $reaction_data['dislike'] > 0) {
                $thumbs_down_total += $reaction_data['dislike'];
                
                // Get breakdown from reaction detail
                if (!empty($reaction->reaction_detail)) {
                    // Handle escaped JSON strings (with backslashes before quotes)
                    $detail = $reaction->reaction_detail;
                    if (is_string($detail)) {
                        // First, try to decode as-is
                        $detail = json_decode($detail, true);
                        
                        // If that fails or returns null, try with stripslashes
                        if ($detail === null) {
                            $detail = json_decode(stripslashes($detail), true);
                        }
                        
                        // If still fails, try with addslashes removed
                        if ($detail === null) {
                            $detail = json_decode(str_replace('\\"', '"', $reaction->reaction_detail), true);
                        }
                    }
                    if (is_array($detail) && isset($detail['option'])) {
                        $option = $detail['option'];
                        // Map common variations to our standard categories
                        $mapped_option = map_feedback_option($option, 'negative');
                        
                        if (isset($thumbs_down_breakdown[$mapped_option])) {
                            $thumbs_down_breakdown[$mapped_option] += $reaction_data['dislike'];
                        } else {
                            $thumbs_down_breakdown['Other'] += $reaction_data['dislike'];
                        }
                    } else {
                        // No specific category, count as "Other"
                        $thumbs_down_breakdown['Other'] += $reaction_data['dislike'];
                    }
                } else {
                    // No reaction detail, count as "Other"
                    $thumbs_down_breakdown['Other'] += $reaction_data['dislike'];
                }
            }
        }
    }
    

    
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


?>

<div class="wrap">
    <h1>🧠 CSAT Analytics</h1>
    <p>Customer Satisfaction Score and Detailed Feedback Analysis</p>
    

    
    <!-- Action Buttons -->
    <div style="margin-bottom: 30px;">
        <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #000; font-size: 16px;">Data Management</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center;">
                <button id="refresh-csat" class="button button-primary" style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 16px;">🔄</span>
                    Refresh CSAT Data
                </button>
                <button id="export-csat" class="button" style="display: flex; align-items: center; gap: 8px; border: 1px solid #3bb273; color: #3bb273;">
                    <span style="font-size: 16px;">📊</span>
                    Export Data
                </button>
                <button id="clear-csat-data" class="button button-danger" style="display: flex; align-items: center; gap: 8px; background: #dc3545; border-color: #dc3545; color: white;">
                    <span style="font-size: 16px;">🗑️</span>
                    Clear All CSAT Data
                </button>
            </div>
        </div>
    </div>

    <!-- 3-Phase Approval Modal for Clearing CSAT Data -->
    <div id="clear-csat-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; min-width: 500px; max-width: 600px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div id="phase-1" class="approval-phase">
                <h3 style="margin: 0 0 20px 0; color: #dc3545; text-align: center;">⚠️ Phase 1: Confirmation</h3>
                <p style="margin: 0 0 20px 0; line-height: 1.6; color: #333;">
                    You are about to <strong>permanently delete ALL CSAT feedback data</strong>. This action cannot be undone.
                </p>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <h4 style="margin: 0 0 10px 0; color: #856404;">What will be deleted:</h4>
                    <ul style="margin: 0; padding-left: 20px; color: #856404;">
                        <li>All thumbs up/down reactions</li>
                        <li>All feedback categorization data</li>
                        <li>All CSAT scores and analytics</li>
                        <li>All reaction details and comments</li>
                    </ul>
                </div>
                <p style="margin: 20px 0; color: #666; font-size: 14px;">
                    <strong>Current data:</strong> <?php echo $csat_data['total_reactions']; ?> total reactions
                </p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px;">
                    <button type="button" class="button" onclick="jQuery.closeClearModal()">Cancel</button>
                    <button type="button" class="button button-danger" onclick="jQuery.proceedToPhase2()" style="background: #dc3545; border-color: #dc3545; color: white;">
                        I Understand, Continue to Phase 2
                    </button>
                </div>
            </div>

            <div id="phase-2" class="approval-phase" style="display: none;">
                <h3 style="margin: 0 0 20px 0; color: #fd7e14; text-align: center;">🔒 Phase 2: Security Check</h3>
                <p style="margin: 0 0 20px 0; line-height: 1.6; color: #333;">
                    To proceed, you must confirm your identity and acknowledge the consequences.
                </p>
                <div style="margin: 20px 0;">
                    <label for="admin-password" style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                        Type "1234" to confirm:
                    </label>
                    <input type="text" id="admin-password" placeholder="Type 1234" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; text-align: center; font-size: 18px; letter-spacing: 2px;">
                </div>
                <div style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                        <input type="checkbox" id="confirm-deletion" style="margin-right: 8px;">
                        I confirm that I want to permanently delete all CSAT data
                    </label>
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #333;">
                        <input type="checkbox" id="confirm-backup" style="margin-right: 8px;">
                        I have backed up any important data I need to keep
                    </label>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px;">
                    <button type="button" class="button" onclick="jQuery.backToPhase1()">Back to Phase 1</button>
                    <button type="button" class="button button-danger" id="phase2-continue" onclick="jQuery.proceedToPhase3()" style="background: #fd7e14; border-color: #fd7e14; color: white;" disabled>
                        Continue to Phase 3
                    </button>
                </div>
            </div>

            <div id="phase-3" class="approval-phase" style="display: none;">
                <h3 style="margin: 0 0 20px 0; color: #dc3545; text-align: center;">🚨 Phase 3: Final Warning</h3>
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                    <h4 style="margin: 0 0 15px 0; color: #721c24; font-size: 18px;">⚠️ FINAL WARNING ⚠️</h4>
                    <p style="margin: 0; color: #721c24; font-size: 16px; font-weight: 500;">
                        This is your last chance to cancel. Clicking "DELETE ALL DATA" will permanently remove all CSAT feedback.
                    </p>
                </div>
                <p style="margin: 20px 0; color: #666; font-size: 14px; text-align: center;">
                    <strong>Type "DELETE"</strong> in the box below to confirm:
                </p>
                <div style="margin: 20px 0; text-align: center;">
                    <input type="text" id="final-confirmation" placeholder="Type DELETE to confirm" style="width: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; text-align: center; text-transform: uppercase;">
                </div>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 25px;">
                    <button type="button" class="button" onclick="jQuery.backToPhase2()">Back to Phase 2</button>
                    <button type="button" class="button button-danger" id="final-delete-btn" onclick="jQuery.executeDataDeletion()" style="background: #dc3545; border-color: #dc3545; color: white; font-size: 16px; padding: 12px 24px;" disabled>
                        🗑️ DELETE ALL DATA
                    </button>
                </div>
            </div>
        </div>
    </div>

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
// Define ajaxurl for WordPress admin
var ajaxurl = '<?php echo admin_url('admin-ajax.php'); ?>';

jQuery(document).ready(function($) {
    // CSAT Data Management Functions
    
    // Refresh CSAT Data
    $('#refresh-csat').on('click', function() {
        const button = $(this);
        button.prop('disabled', true).text('🔄 Refreshing...');
        
        setTimeout(function() {
            location.reload();
        }, 1000);
    });
    
    // Export CSAT Data
    $('#export-csat').on('click', function() {
        const button = $(this);
        button.prop('disabled', true).text('📊 Exporting...');
        
        // Create CSV data
        const csvData = createCSATData();
        downloadCSV(csvData, 'csat-analytics-<?php echo $current_filter; ?>.csv');
        
        setTimeout(function() {
            button.prop('disabled', false).text('📊 Export Data');
        }, 1000);
    });
    
    // Clear CSAT Data - Start 3-phase approval
    $('#clear-csat-data').on('click', function() {
        $('#clear-csat-modal').show();
    });
    
    // Phase 2 validation
    $('#admin-password, #confirm-deletion, #confirm-backup').on('input change', function() {
        validatePhase2();
    });
    
    // Phase 3 validation
    $('#final-confirmation').on('input', function() {
        validatePhase3();
    });
    
    function createCSATData() {
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

// 3-Phase Approval System Functions

// Attach functions to jQuery object for inline onclick handlers
jQuery.closeClearModal = function() {
    jQuery('#clear-csat-modal').hide();
    resetModal();
};

function resetModal() {
    // Reset all phases
    jQuery('.approval-phase').hide();
    jQuery('#phase-1').show();
    
    // Reset form fields
    jQuery('#admin-password').val('');
    jQuery('#confirm-deletion').prop('checked', false);
    jQuery('#confirm-backup').prop('checked', false);
    jQuery('#final-confirmation').val('');
    
    // Reset buttons
    jQuery('#phase2-continue').prop('disabled', true);
    jQuery('#final-delete-btn').prop('disabled', true);
}

jQuery.proceedToPhase2 = function() {
    jQuery('#phase-1').hide();
    jQuery('#phase-2').show();
    jQuery('#admin-password').focus();
};

jQuery.backToPhase1 = function() {
    jQuery('#phase-2').hide();
    jQuery('#phase-1').show();
};

function validatePhase2() {
    const password = jQuery('#admin-password').val();
    const confirmDeletion = jQuery('#confirm-deletion').is(':checked');
    const confirmBackup = jQuery('#confirm-backup').is(':checked');
    
    if (password === '1234' && confirmDeletion && confirmBackup) {
        jQuery('#phase2-continue').prop('disabled', false);
    } else {
        jQuery('#phase2-continue').prop('disabled', true);
    }
}

jQuery.proceedToPhase3 = function() {
    // Verify the confirmation code
    const password = jQuery('#admin-password').val();
    
    if (password !== '1234') {
        alert('Please type "1234" to continue.');
        return;
    }
    
    jQuery('#phase-2').hide();
    jQuery('#phase-3').show();
    jQuery('#final-confirmation').focus();
};

jQuery.backToPhase2 = function() {
    jQuery('#phase-3').hide();
    jQuery('#phase-2').show();
};

function validatePhase3() {
    const confirmation = jQuery('#final-confirmation').val().toUpperCase();
    if (confirmation === 'DELETE') {
        jQuery('#final-delete-btn').prop('disabled', false);
    } else {
        jQuery('#final-delete-btn').prop('disabled', true);
    }
}

jQuery.executeDataDeletion = function() {
    if (!confirm('Are you absolutely sure? This will permanently delete ALL CSAT data and cannot be undone!')) {
        return;
    }
    
    // Show loading state
    jQuery('#final-delete-btn').prop('disabled', true).text('🗑️ DELETING...');
    
    // Debug logging
    console.log('Executing data deletion...');
    console.log('Password:', jQuery('#admin-password').val());
    console.log('Nonce:', '<?php echo wp_create_nonce('ai_clear_csat_data'); ?>');
    
    // AJAX call to clear CSAT data
    jQuery.post(ajaxurl, {
        action: 'ai_clear_csat_data',
        password: jQuery('#admin-password').val(),
        _wpnonce: '<?php echo wp_create_nonce('ai_clear_csat_data'); ?>'
    })
    .done(function(response) {
        console.log('AJAX Response:', response);
        if (response.success) {
            alert('All CSAT data has been successfully cleared.');
            location.reload();
        } else {
            alert('Error: ' + (response.data ? response.data.message : 'Failed to clear data'));
            jQuery('#final-delete-btn').prop('disabled', false).text('🗑️ DELETE ALL DATA');
        }
    })
    .fail(function(xhr, status, error) {
        console.log('AJAX Error:', {xhr: xhr, status: status, error: error});
        alert('Network error occurred. Please try again.');
        jQuery('#final-delete-btn').prop('disabled', false).text('🗑️ DELETE ALL DATA');
    });
}
</script>
