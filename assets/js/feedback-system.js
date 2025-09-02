/**
 * Modern Feedback System - AI Trainer Plugin
 * 
 * A comprehensive feedback collection system with advanced UX features,
 * real-time analytics integration, and modern UI components.
 * 
 * FEATURES:
 * - Modern UI with smooth animations
 * - Enhanced feedback categories
 * - Sentiment analysis
 * - Real-time CSAT integration
 * - Progressive feedback collection
 * - Micro-interactions and feedback
 * - Analytics tracking
 * 
 * @version 2.0
 * @author Psychedelic
 */

(function($) {
    'use strict';

    class FeedbackSystem {
        constructor() {
        this.config = {
            // Feedback categories with enhanced options
            categories: {
                positive: [
                    { id: 'accurate', label: 'Accurate Information', icon: '✓', description: 'The response was factually correct' },
                    { id: 'clear', label: 'Clear & Well Explained', icon: '💡', description: 'Easy to understand and well-structured' },
                    { id: 'helpful', label: 'Very Helpful', icon: '🎯', description: 'Answered my question perfectly' },
                    { id: 'sources', label: 'Great Sources', icon: '📚', description: 'Excellent references provided' },
                    { id: 'comprehensive', label: 'Comprehensive', icon: '🔍', description: 'Covered all aspects thoroughly' },
                    { id: 'other', label: 'Other', icon: '💭', description: 'Something else positive' }
                ],
                negative: [
                    { id: 'inaccurate', label: 'Inaccurate', icon: '❌', description: 'Contains incorrect information' },
                    { id: 'unclear', label: 'Unclear', icon: '❓', description: 'Confusing or hard to understand' },
                    { id: 'incomplete', label: 'Incomplete', icon: '⚠️', description: 'Missing important information' },
                    { id: 'irrelevant', label: 'Not Relevant', icon: '🎯', description: "Doesn't answer my question" },
                    { id: 'outdated', label: 'Outdated', icon: '📅', description: 'Information seems old or obsolete' },
                    { id: 'other', label: 'Other', icon: '💭', description: 'Something else needs improvement' }
                ]
            },
            
            // Animation timings
            animations: {
                fadeIn: 300,
                slideDown: 250,
                buttonPress: 150,
                success: 2000
            },
            
            // API endpoints
            endpoints: {
                submitFeedback: exa_ajax.ajaxurl,
                getStats: exa_ajax.ajaxurl
            }
        };
        
        this.init();
    }
    
    /**
     * Initialize the feedback system
     */
    init() {
        this.bindEvents();
        this.setupCSS();
        console.log('🎯 Modern Feedback System initialized');
    }
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Handle feedback button clicks  
        $(document).on('click', '.feedback-btn', this.handleFeedbackClick.bind(this));
        
        // Handle category selection
        $(document).on('click', '.feedback-category-btn', this.handleCategoryClick.bind(this));
        
        // Handle text feedback submission
        $(document).on('click', '.feedback-submit-btn', this.handleTextFeedback.bind(this));
        
        // Handle feedback panel close
        $(document).on('click', '.feedback-close, .feedback-overlay', this.closeFeedbackPanel.bind(this));
        
        // Handle escape key
        $(document).on('keydown', this.handleKeydown.bind(this));
    }
    
    /**
     * Setup dynamic CSS for the feedback system
     */
    setupCSS() {
        const styles = `
            <style id="feedback-system-styles">
                /* Modern Feedback System Styles */
                .feedback-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .feedback-question {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                    font-weight: 500;
                    margin-right: 12px;
                }
                
                .feedback-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    border: 1.5px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    user-select: none;
                    backdrop-filter: blur(10px);
                }
                
                .feedback-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 255, 255, 0.3);
                    color: rgba(255, 255, 255, 0.95);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .feedback-btn.positive:hover {
                    border-color: rgba(59, 178, 115, 0.5);
                    background: rgba(59, 178, 115, 0.1);
                    color: #3bb273;
                }
                
                .feedback-btn.negative:hover {
                    border-color: rgba(231, 76, 60, 0.5);
                    background: rgba(231, 76, 60, 0.1);
                    color: #e74c3c;
                }
                
                .feedback-btn.active {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.4);
                    color: #fff;
                }
                
                .feedback-btn.positive.active {
                    background: rgba(59, 178, 115, 0.2);
                    border-color: #3bb273;
                    color: #3bb273;
                }
                
                .feedback-btn.negative.active {
                    background: rgba(231, 76, 60, 0.2);
                    border-color: #e74c3c;
                    color: #e74c3c;
                }
                
                .feedback-icon {
                    font-size: 16px;
                    line-height: 1;
                }
                
                .feedback-count {
                    font-size: 12px;
                    font-weight: 600;
                    margin-left: 4px;
                    opacity: 0.9;
                }
                
                /* Feedback Panel */
                .feedback-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 10000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .feedback-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .feedback-panel {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) scale(0.9);
                    background: linear-gradient(135deg, #1a0024 0%, #2d0040 100%);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    padding: 32px;
                    min-width: 480px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    transition: all 0.3s ease;
                    z-index: 10001;
                }
                
                .feedback-overlay.active .feedback-panel {
                    transform: translate(-50%, -50%) scale(1);
                }
                
                .feedback-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }
                
                .feedback-title {
                    color: #fff;
                    font-size: 20px;
                    font-weight: 600;
                    margin: 0;
                }
                
                .feedback-close {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.2s ease;
                }
                
                .feedback-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }
                
                .feedback-categories {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 12px;
                    margin-bottom: 24px;
                }
                
                .feedback-category-btn {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    user-select: none;
                }
                
                .feedback-category-btn:hover {
                    border-color: rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                }
                
                .feedback-category-btn.selected {
                    border-color: #3bb273;
                    background: rgba(59, 178, 115, 0.15);
                }
                
                .feedback-category-icon {
                    font-size: 20px;
                    line-height: 1;
                    margin-top: 2px;
                }
                
                .feedback-category-content {
                    flex: 1;
                }
                
                .feedback-category-label {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 4px;
                }
                
                .feedback-category-desc {
                    font-size: 12px;
                    opacity: 0.8;
                    line-height: 1.4;
                }
                
                .feedback-text-area {
                    width: 100%;
                    min-height: 100px;
                    padding: 16px;
                    border: 1.5px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    font-size: 14px;
                    line-height: 1.5;
                    resize: vertical;
                    margin-bottom: 20px;
                    transition: all 0.2s ease;
                    font-family: inherit;
                }
                
                .feedback-text-area:focus {
                    outline: none;
                    border-color: #3bb273;
                    background: rgba(255, 255, 255, 0.08);
                    box-shadow: 0 0 0 3px rgba(59, 178, 115, 0.1);
                }
                
                .feedback-text-area::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .feedback-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .feedback-submit-btn, .feedback-cancel-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .feedback-submit-btn {
                    background: linear-gradient(135deg, #3bb273 0%, #2d8f5a 100%);
                    color: #fff;
                }
                
                .feedback-submit-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(59, 178, 115, 0.3);
                }
                
                .feedback-submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }
                
                .feedback-cancel-btn {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .feedback-cancel-btn:hover {
                    background: rgba(255, 255, 255, 0.2);
                    color: #fff;
                }
                
                .feedback-success {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(59, 178, 115, 0.1);
                    border: 1px solid rgba(59, 178, 115, 0.3);
                    border-radius: 12px;
                    color: #3bb273;
                    font-weight: 500;
                    margin-top: 16px;
                }
                
                .feedback-success-icon {
                    font-size: 20px;
                }
                
                /* Loading state */
                .feedback-loading {
                    opacity: 0.6;
                    pointer-events: none;
                }
                
                .feedback-spinner {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: #fff;
                    animation: spin 1s ease-in-out infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .feedback-container {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 12px !important;
                        padding: 16px 0 !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    
                    .feedback-question {
                        font-size: 14px !important;
                        margin-right: 0 !important;
                        margin-bottom: 8px !important;
                        width: 100% !important;
                        text-align: center !important;
                    }
                    
                    .feedback-buttons {
                        gap: 8px !important;
                        flex-wrap: nowrap !important;
                        width: 100% !important;
                        justify-content: center !important;
                        box-sizing: border-box !important;
                    }
                    
                    .feedback-btn {
                        flex: 0 0 auto !important;
                        max-width: 90px !important;
                        min-width: 60px !important;
                        padding: 8px 10px !important;
                        font-size: 12px !important;
                        text-align: center !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                    }
                    
                    .feedback-panel {
                        min-width: auto;
                        margin: 20px;
                        width: calc(100% - 40px);
                        padding: 24px;
                    }
                    
                    .feedback-categories {
                        grid-template-columns: 1fr;
                    }
                    
                    .feedback-actions {
                        flex-direction: column;
                    }
                }
                
                @media (max-width: 480px) {
                    .feedback-container {
                        padding: 12px 0 !important;
                        gap: 10px !important;
                    }
                    
                    .feedback-question {
                        font-size: 13px !important;
                        text-align: center !important;
                    }
                    
                    .feedback-buttons {
                        flex-direction: row !important;
                        align-items: center !important;
                        gap: 6px !important;
                        justify-content: space-evenly !important;
                    }
                    
                    .feedback-btn {
                        flex: 0 0 auto !important;
                        max-width: 80px !important;
                        min-width: 60px !important;
                        justify-content: center !important;
                        text-align: center !important;
                        padding: 8px 6px !important;
                        font-size: 11px !important;
                        overflow: hidden !important;
                    }
                }
            </style>
        `;
        
        // Remove existing styles and add new ones
        $('#feedback-system-styles').remove();
        $('head').append(styles);
    }
    
    /**
     * Create feedback UI for a chat response - matches the design in screenshot
     */
    createFeedbackUI(chatlogId, container) {
        const feedbackHTML = `
            <div class="feedback-container" data-chatlog-id="${chatlogId}" style="
                display: flex;
                align-items: center;
                gap: 20px;
                margin-top: 16px;
                padding: 12px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            ">
                <div class="feedback-question" style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 16px;
                    font-weight: 500;
                ">Did we answer your questions?</div>
                
                <div class="feedback-buttons" style="display: flex; align-items: center; gap: 16px;">
                    <button class="feedback-btn positive" data-type="positive" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.7);
                        cursor: pointer;
                        padding: 8px 12px;
                        border-radius: 8px;
                        transition: all 0.2s ease;
                        font-size: 14px;
                    ">
                        <span class="feedback-icon" style="font-size: 18px;">👍</span>
                        <span class="feedback-count positive-count" style="font-weight: 600;">0</span>
                    </button>
                    
                    <button class="feedback-btn negative" data-type="negative" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.7);
                        cursor: pointer;
                        padding: 8px 12px;
                        border-radius: 8px;
                        transition: all 0.2s ease;
                        font-size: 14px;
                    ">
                        <span class="feedback-icon" style="font-size: 18px;">👎</span>
                        <span class="feedback-count negative-count" style="font-weight: 600;">0</span>
                    </button>
                    

                </div>
            </div>
        `;
        
        container.append(feedbackHTML);
        this.setupFeedbackInteractions(chatlogId);
        this.loadExistingCounts(chatlogId);
    }
    
    /**
     * Setup feedback interactions - hover effects and click handlers
     */
    setupFeedbackInteractions(chatlogId) {
        const container = $(`.feedback-container[data-chatlog-id="${chatlogId}"]`);
        
        // Add hover effects
        container.find('.feedback-btn').on('mouseenter', function() {
            $(this).css({
                'background': 'rgba(255, 255, 255, 0.1)',
                'color': 'rgba(255, 255, 255, 0.9)'
            });
        }).on('mouseleave', function() {
            $(this).css({
                'background': 'none',
                'color': 'rgba(255, 255, 255, 0.7)'
            });
        });
        

        
        // Handle feedback buttons
        container.find('.feedback-btn').on('click', (e) => {
            const btn = $(e.currentTarget);
            const type = btn.data('type');
            this.showReasonSelection(chatlogId, type, btn);
        });
        

    }
    
    /**
     * Load existing feedback counts
     */
    loadExistingCounts(chatlogId) {
        $.post(this.config.endpoints.getStats, {
            action: 'ai_get_chatlog_reaction_counts',
            id: chatlogId
        }).done((response) => {
            if (response.success && response.data) {
                const container = $(`.feedback-container[data-chatlog-id="${chatlogId}"]`);
                container.find('.positive-count').text(response.data.like || 0);
                container.find('.negative-count').text(response.data.dislike || 0);
            }
        });
    }
    
    /**
     * Show reason selection popup - simple and clean like in the screenshot
     */
    showReasonSelection(chatlogId, type, button) {
        // Remove any existing reason popup
        $('.reason-popup').remove();
        
        const reasons = type === 'positive' ? 
            ['Accurate', 'Clear explanation', 'Useful sources', 'Other'] :
            ['Inaccurate', 'Unclear', 'Missing info', 'Other'];
        
        const popupHTML = `
            <div class="reason-popup" style="
                position: absolute;
                top: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #2a1b3d;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                padding: 16px;
                margin-top: 8px;
                z-index: 1000;
                min-width: 200px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            ">
                <div style="
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 12px;
                    text-align: center;
                ">${type === 'positive' ? 'What did you like?' : 'What can we improve?'}</div>
                
                <div class="reason-options" style="display: flex; flex-direction: column; gap: 8px;">
                    ${reasons.map(reason => `
                        <button class="reason-option" data-reason="${reason}" style="
                            background: rgba(255, 255, 255, 0.05);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            color: rgba(255, 255, 255, 0.9);
                            padding: 10px 16px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 14px;
                            text-align: left;
                            transition: all 0.2s ease;
                        ">${reason}</button>
                    `).join('')}
                </div>
                
                <textarea class="reason-text" placeholder="Tell us more... (optional)" style="
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                    padding: 12px;
                    border-radius: 8px;
                    margin-top: 12px;
                    font-size: 14px;
                    resize: vertical;
                    min-height: 60px;
                    font-family: inherit;
                    box-sizing: border-box;
                "></textarea>
                
                <div style="display: flex; gap: 8px; margin-top: 12px;">
                    <button class="submit-reason" style="
                        flex: 1;
                        background: #3bb273;
                        color: white;
                        border: none;
                        padding: 10px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                    ">Submit</button>
                    <button class="cancel-reason" style="
                        background: rgba(255, 255, 255, 0.1);
                        color: rgba(255, 255, 255, 0.8);
                        border: none;
                        padding: 10px 16px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancel</button>
                </div>
            </div>
        `;
        
        // Position the popup relative to the button
        button.css('position', 'relative').append(popupHTML);
        
        const popup = button.find('.reason-popup');
        
        // Add hover effects to reason options
        popup.find('.reason-option').on('mouseenter', function() {
            $(this).css({
                'background': 'rgba(255, 255, 255, 0.1)',
                'border-color': 'rgba(255, 255, 255, 0.2)'
            });
        }).on('mouseleave', function() {
            $(this).css({
                'background': 'rgba(255, 255, 255, 0.05)',
                'border-color': 'rgba(255, 255, 255, 0.1)'
            });
        });
        
        // Handle reason selection
        let selectedReason = '';
        popup.find('.reason-option').on('click', function() {
            selectedReason = $(this).data('reason');
            popup.find('.reason-option').css({
                'background': 'rgba(255, 255, 255, 0.05)',
                'border-color': 'rgba(255, 255, 255, 0.1)'
            });
            $(this).css({
                'background': 'rgba(59, 178, 115, 0.2)',
                'border-color': '#3bb273'
            });
        });
        
        // Handle submit
        popup.find('.submit-reason').on('click', () => {
            const textFeedback = popup.find('.reason-text').val().trim();
            
            if (selectedReason || textFeedback) {
                this.submitSimpleFeedback(chatlogId, type, selectedReason, textFeedback);
                button.find('.feedback-count').text(parseInt(button.find('.feedback-count').text()) + 1);
                popup.remove();
                
                // Show brief success
                button.css('color', '#3bb273');
                setTimeout(() => {
                    button.css('color', 'rgba(255, 255, 255, 0.7)');
                }, 2000);
            } else {
                // Just submit basic feedback
                this.submitSimpleFeedback(chatlogId, type, 'Other', '');
                button.find('.feedback-count').text(parseInt(button.find('.feedback-count').text()) + 1);
                popup.remove();
            }
        });
        
        // Handle cancel
        popup.find('.cancel-reason').on('click', () => {
            popup.remove();
        });
        
        // Close on outside click
        setTimeout(() => {
            $(document).on('click.reasonPopup', function(e) {
                if (!$(e.target).closest('.reason-popup, .feedback-btn').length) {
                    popup.remove();
                    $(document).off('click.reasonPopup');
                }
            });
        }, 100);
    }
    
    /**
     * Submit simple feedback
     */
    submitSimpleFeedback(chatlogId, type, reason, text) {
        const feedbackData = {
            categories: reason ? [reason.toLowerCase().replace(' ', '_')] : ['other'],
            text: text,
            timestamp: new Date().toISOString()
        };
        
        $.post(this.config.endpoints.submitFeedback, {
            action: 'ai_update_chatlog_reaction',
            id: chatlogId,
            reaction: type === 'positive' ? 'like' : 'dislike',
            single: 1,
            reaction_detail: JSON.stringify(feedbackData)
        });
    }
    
    /**
     * Show feedback collection panel
     */
    showFeedbackPanel(chatlogId, type) {
        const categories = this.config.categories[type];
        const title = type === 'positive' ? '👍 What did you like?' : '👎 What can we improve?';
        
        const categoriesHTML = categories.map(cat => `
            <button class="feedback-category-btn" data-category-id="${cat.id}">
                <div class="feedback-category-icon">${cat.icon}</div>
                <div class="feedback-category-content">
                    <div class="feedback-category-label">${cat.label}</div>
                    <div class="feedback-category-desc">${cat.description}</div>
                </div>
            </button>
        `).join('');
        
        const panelHTML = `
            <div class="feedback-overlay">
                <div class="feedback-panel" data-chatlog-id="${chatlogId}" data-type="${type}">
                    <div class="feedback-header">
                        <h3 class="feedback-title">${title}</h3>
                        <button class="feedback-close" aria-label="Close">×</button>
                    </div>
                    
                    <div class="feedback-categories">
                        ${categoriesHTML}
                    </div>
                    
                    <textarea 
                        class="feedback-text-area" 
                        placeholder="Tell us more about your experience... (optional)"
                        rows="4"
                    ></textarea>
                    
                    <div class="feedback-actions">
                        <button class="feedback-cancel-btn feedback-close">Cancel</button>
                        <button class="feedback-submit-btn" disabled>
                            Submit Feedback
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing panel and add new one
        $('.feedback-overlay').remove();
        $('body').append(panelHTML);
        
        // Animate in
        setTimeout(() => {
            $('.feedback-overlay').addClass('active');
        }, 10);
        
        // Focus first category
        $('.feedback-category-btn').first().focus();
    }
    
    /**
     * Handle category selection
     */
    handleCategoryClick(e) {
        const btn = $(e.currentTarget);
        const panel = btn.closest('.feedback-panel');
        
        // Toggle selection
        btn.toggleClass('selected');
        
        // Enable submit button if any category is selected
        const hasSelection = panel.find('.feedback-category-btn.selected').length > 0;
        panel.find('.feedback-submit-btn').prop('disabled', !hasSelection);
        
        // Visual feedback
        btn.addClass('active');
        setTimeout(() => btn.removeClass('active'), this.config.animations.buttonPress);
    }
    
    /**
     * Handle text feedback submission
     */
    handleTextFeedback(e) {
        e.preventDefault();
        
        const btn = $(e.currentTarget);
        const panel = btn.closest('.feedback-panel');
        const chatlogId = panel.data('chatlog-id');
        const type = panel.data('type');
        
        // Get selected categories
        const selectedCategories = panel.find('.feedback-category-btn.selected').map(function() {
            return $(this).data('category-id');
        }).get();
        
        // Get text feedback
        const textFeedback = panel.find('.feedback-text-area').val().trim();
        
        if (selectedCategories.length === 0) {
            this.showError('Please select at least one category');
            return;
        }
        
        // Show loading state
        panel.addClass('feedback-loading');
        btn.html('<span class="feedback-spinner"></span> Submitting...');
        
        // Submit feedback
        this.submitFeedback(chatlogId, type, selectedCategories, textFeedback);
    }
    
    /**
     * Submit feedback to server
     */
    submitFeedback(chatlogId, type, categories, textFeedback) {
        const feedbackData = {
            categories: categories,
            text: textFeedback,
            timestamp: new Date().toISOString()
        };
        
        $.post(this.config.endpoints.submitFeedback, {
            action: 'ai_update_chatlog_reaction',
            id: chatlogId,
            reaction: type === 'positive' ? 'like' : 'dislike',
            single: 1,
            reaction_detail: JSON.stringify(feedbackData)
        }).done((response) => {
            if (response.success) {
                this.showSuccess();
                this.updateCounts(chatlogId, response.data);
                setTimeout(() => {
                    this.closeFeedbackPanel();
                }, this.config.animations.success);
            } else {
                this.showError('Failed to submit feedback. Please try again.');
            }
        }).fail(() => {
            this.showError('Network error. Please try again.');
        }).always(() => {
            $('.feedback-panel').removeClass('feedback-loading');
        });
    }
    
    /**
     * Show success message
     */
    showSuccess() {
        const panel = $('.feedback-panel');
        const successHTML = `
            <div class="feedback-success">
                <span class="feedback-success-icon">✅</span>
                <span>Thank you for your feedback!</span>
            </div>
        `;
        
        panel.find('.feedback-actions').after(successHTML);
        
        // Animate the success message
        const successEl = panel.find('.feedback-success');
        successEl.hide().slideDown(this.config.animations.slideDown);
    }
    
    /**
     * Show error message
     */
    showError(message) {
        // Simple alert for now - could be enhanced with a toast system
        alert(message);
    }
    
    /**
     * Update feedback counts in UI
     */
    updateCounts(chatlogId, counts) {
        const container = $(`.feedback-container[data-chatlog-id="${chatlogId}"]`);
        container.find('.positive-count').text(counts.like || 0);
        container.find('.negative-count').text(counts.dislike || 0);
    }
    
    /**
     * Close feedback panel
     */
    closeFeedbackPanel() {
        const overlay = $('.feedback-overlay');
        overlay.removeClass('active');
        
        setTimeout(() => {
            overlay.remove();
        }, this.config.animations.fadeIn);
    }
    
    /**
     * Handle keyboard events
     */
    handleKeydown(e) {
        if (e.key === 'Escape' && $('.feedback-overlay.active').length > 0) {
            this.closeFeedbackPanel();
        }
    }
}

// Initialize the feedback system when document is ready
jQuery(document).ready(function($) {
    window.FeedbackSystem = new FeedbackSystem();
    console.log('🎯 Modern Feedback System loaded and ready');
});

})(jQuery);
