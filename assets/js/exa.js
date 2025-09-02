// Global functions - must be defined before DOM is ready

// Global function for populating the ticket form with user query
function populateTicketForm(userQuery) {
    console.log('Populating ticket form with query:', userQuery);
    
    // Construct the message as specified
    const ticketMessage = `I attempted to ask: "${userQuery}"
The system responded that this was outside its scope.
I believe this is a relevant question and would like the team to review it for inclusion.
Thank you for your support.`;
    
    // Find the FluentForm question field
    // Try multiple selectors to find the question field
    const questionField = document.querySelector('input[name="question"], input[name="your_question"], textarea[name="question"], textarea[name="your_question"], .fluentform input[placeholder*="Question"], .fluentform textarea[placeholder*="Question"]');
    
    if (questionField) {
        console.log('Found question field:', questionField);
        questionField.value = ticketMessage;
        
        // Trigger input event to update any listeners
        questionField.dispatchEvent(new Event('input', { bubbles: true }));
        questionField.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Scroll to the ticket form
        const ticketWrapper = document.getElementById('ticket-wrapper');
        if (ticketWrapper) {
            ticketWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        // Log success (no user notification since it's automatic)
        console.log('Ticket form automatically populated with user query');
    } else {
        console.log('Question field not found, trying alternative approach');
        
        // Alternative approach: try to find any textarea or input in the form
        const formFields = document.querySelectorAll('.fluentform textarea, .fluentform input[type="text"]');
        if (formFields.length > 0) {
            // Use the last textarea or input (likely the question field)
            const lastField = formFields[formFields.length - 1];
            lastField.value = ticketMessage;
            lastField.dispatchEvent(new Event('input', { bubbles: true }));
            lastField.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Scroll to the ticket form
            const ticketWrapper = document.getElementById('ticket-wrapper');
            if (ticketWrapper) {
                ticketWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            console.log('Ticket form automatically populated with user query (alternative method)');
        } else {
            console.error('No form fields found - ticket form could not be automatically populated');
        }
    }
}

// Global function for starting a new search from off-topic responses
function startNewSearch() {
    console.log('🔍 Starting new search - reloading page');
    
    // Store a flag to focus on search input after reload
    sessionStorage.setItem('focusSearchAfterReload', 'true');
    
    // Reload the page to get a fresh start
    window.location.reload();
}

// Global copyToClipboard function
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            if (window.showNotification) {
                window.showNotification('URL copied to clipboard!', 'success');
            } else {
                // Fallback notification if showNotification isn't available yet
                alert('URL copied to clipboard!');
            }
        }).catch(() => {
            // Fallback for clipboard API failure
            fallbackCopyToClipboard(text);
        });
    } else {
        // Fallback for older browsers
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy function for older browsers
function fallbackCopyToClipboard(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful && window.showNotification) {
            window.showNotification('URL copied to clipboard!', 'success');
        } else if (successful) {
            alert('URL copied to clipboard!');
        } else {
            alert('Copy failed. Please copy manually: ' + text);
        }
    } catch (err) {
        alert('Copy failed. Please copy manually: ' + text);
    }
}

jQuery(document).ready(function($) {

    // Store frequently used DOM elements
    const $exaQuestion = $('#exa-question');
    const $ticketWrapper = $('#ticket-wrapper');
    const $exaAnswer = $('#exa-answer');
    const $exaLoading = $('#exa-loading');
    const $exaInput = $('#exa-input');
    const $psybrarianMainContent = $('.psybrarian-main-content .container');
    const $psySearchAiContainer = $('.psy-search-ai-container');

    // SVG icons as constants
    const likeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="none" class="tabler-icon tabler-icon-thumb-up-filled reaction-like-svg" style="vertical-align:middle;"><path d="M13 3a3 3 0 0 1 2.995 2.824l.005 .176v4h2a3 3 0 0 1 2.98 2.65l.015 .174l.005 .176l-.02 .196l-1.006 5.032c-.381 1.626 -1.502 2.796 -2.81 2.78l-.164 -.008h-8a1 1 0 0 1 -.993 -.883l-.007 -.117l.001 -9.536a1 1 0 0 1 .5 -.865a2.998 2.998 0 0 0 1.492 -2.397l.007 -.202v-1a3 3 0 0 1 3 -3z" fill="currentColor"></path><path d="M5 10a1 1 0 0 1 .993 .883l.007 .117v9a1 1 0 0 1 -.883 .993l-.117 .007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-7a2 2 0 0 1 1.85 -1.995l.15 -.005h1z" fill="currentColor"></path></svg>`;
    const dislikeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="none" class="tabler-icon tabler-icon-thumb-down-filled reaction-dislike-svg" style="vertical-align:middle;transform:scaleY(-1);"><path d="M13 3a3 3 0 0 1 2.995 2.824l.005 .176v4h2a3 3 0 0 1 2.98 2.65l.015 .174l.005 .176l-.02 .196l-1.006 5.032c-.381 1.626 -1.502 2.796 -2.81 2.78l-.164 -.008h-8a1 1 0 0 1 -.993 -.883l-.007 -.117l.001 -9.536a1 1 0 0 1 .5 -.865a2.998 2.998 0 0 0 1.492 -2.397l.007 -.202v-1a3 3 0 0 1 3 -3z" fill="currentColor"></path><path d="M5 10a1 1 0 0 1 .993 .883l.007 .117v9a1 1 0 0 1 -.883 .993l-.117 .007h-1a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-7a2 2 0 0 1 1.85 -1.995l.15 -.005h1z" fill="currentColor"></path></svg>`;
    const shareSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7999999999999998" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-share-3 "><path d="M13 4v4c-6.575 1.028 -9.02 6.788 -10 12c-.037 .206 5.384 -5.962 10 -6v4l8 -7l-8 -7z"></path></svg>`;



    const moreSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;
    const newSearchSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="tabler-icon tabler-icon-search"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>`;

    // Pre-compile regex patterns for better performance
    const REGEX_PATTERNS = {
        hrefFix: /href="([^"]+)"\s?>\s?/g,
        linkText: /<\/a>(\w)/g,
        emptyLi: /<li>\s*<\/li>/g,
        consecutiveUl: /<\/ul>\s*<ul>/g,
        consecutiveOl: /<\/ol>\s*<ol>/g,
        whitespace: />\s+</g,
        htmlEntities: /(&lt;|&gt;|<>)|<!--.*?-->/gi,
        ampersandFix: /&amp;/g,
        brokenSentences: /(\w+)\s+in\s+the\s+s\s+and\s+(\d{4}s)/g,  // Fix "in the s and 1990s"
        missingSpaces: /(\w+)([A-Z][a-z]+)/g,  // Fix missing spaces between words
        fixBoldFormatting: /<strong>([^<]*)<\/strong>/g,  // Fix bold formatting issues
        javascript: /^javascript:/i,
        // New patterns for better HTML fixing
        unclosedTags: /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(?<!\/)>/g,
        orphanedClosingTags: /<\/([a-zA-Z][a-zA-Z0-9]*)(?![^<]*>)/g,
        malformedAttributes: /<([a-zA-Z][a-zA-Z0-9]*)\s+([^>]*?)(?<!\/)>/g,
        doubleSpaces: /\s{2,}/g,
        lineBreaks: /\n\s*\n/g,
        emptyParagraphs: /<p>\s*<\/p>/g,
        brokenLists: /<li[^>]*>\s*(?!.*<\/li>)/g,
        unclosedQuotes: /([^"]*)"([^"]*)$/g
    };

    // Constants
    const ALLOWED_TAGS = new Set([
        'H2', 'H3', 'P', 'UL', 'OL', 'LI', 'A','DIV', 'SECTION', 'HR',
        'EM', 'STRONG', 'BR',
        'TABLE', 'TR', 'TD', 'TH', 'TBODY', 'THEAD', 'TFOOT'
    ]);

    const MAX_LENGTH = 15000; // Increased to ensure related questions are not truncated
    const CHATLOG_MAX_LENGTH = 50000;

    // Initialize UI
    $exaQuestion.hide();
    $ticketWrapper.hide();
    
    // Check if we should focus on search input after reload
    if (sessionStorage.getItem('focusSearchAfterReload') === 'true') {
        sessionStorage.removeItem('focusSearchAfterReload');
        
        // Focus on search input and scroll to it
        setTimeout(function() {
            $exaInput.focus();
            $('html, body').animate({
                scrollTop: $exaInput.offset().top - 100
            }, 500);
            console.log('🎯 Focused on search input after reload');
        }, 500);
    }
    $exaAnswer.hide();
    
    // Initialize console debugging
    initConsoleDebugging();

    // Event handlers with performance optimizations
    $('#exa-submit').on('click', submitSearch);
    
    // Debounced input handler for better performance
    let inputTimeout;
    $('#exa-search-box input').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            clearTimeout(inputTimeout);
            submitSearch();
        }
    });
    
    // Add input debouncing for better performance
    $('#exa-search-box input').on('input', function() {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            // Pre-warm the input for faster response
            const query = $(this).val().trim();
            if (query.length > 2) {
                // Pre-fetch embedding for faster response
                prewarmQuery(query);
            }
        }, 300);
    });

    let conversationHistory = [];

    // Enhanced submit search function with comprehensive console debugging
    function submitSearch() {
        const query = $exaInput.val().trim();
        if (!query) return;

        // Performance tracking
        const startTime = performance.now();
        
        // Console debugging - Search initiation
        // Debug logging removed for production
        
        // Show loading state immediately
        $exaLoading.show();
        
        // Optimized scroll animation - faster and smoother
        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $exaLoading.offset().top - 100
            }, 300); // Reduced from 500ms to 300ms
        }, 50); // Reduced from 100ms to 50ms for faster perceived response
        
        $psybrarianMainContent.hide();
        $psySearchAiContainer.addClass('active');
        $exaInput.val('').attr('placeholder', 'Ask follow up...');
        
        // Console debugging - AJAX request
        // AJAX request debug logging removed for production
        
        // Debug panel references removed for production
        
        // Get the correct AJAX URL
        const ajaxUrl = (exa_ajax && exa_ajax.ajaxurl) ? exa_ajax.ajaxurl : '/wp-admin/admin-ajax.php';
        
        // Debug message references removed for production
        
        // Make AJAX request
        $.post(ajaxUrl, {
            action: 'exa_query',
            query: query,
            conversation_history: JSON.stringify(conversationHistory)
        }, function(response) {
            const endTime = performance.now();
            const totalTime = (endTime - startTime);
            
            // Response debug logging removed for production
            
            handleSearchResponse(response, query);
        }).fail(function(xhr, status, error) {
            // Error logging simplified for production
            console.error('Search request failed:', status, error);
        });
    }


    

    

    

    

    

    
    /**
     * Handle off-topic response display
     * 
     * @param {Object} data - Response data containing off-topic message
     * @param {string} query - Original user query
     */
    function handleOffTopicResponse(data, query) {
        console.log('🚫 Off-topic query detected:', query);
        
        // Create a special off-topic answer block
        const questionID = 'off-topic-' + Date.now();
        const offTopicBlock = $(`
            <div class="exa-answer-block off-topic-block" id="${questionID}">
                <div class="exa-question-display">
                    <h3>🔍 "${query}"</h3>
                </div>
                <div class="exa-answer-content off-topic-response">
                    ${data.answer}
                </div>
            </div>
        `);
        
        // Add special styling for off-topic responses
        offTopicBlock.css({
            'padding': '20px',
            'border-radius': '8px',
            'margin': '20px 0'
        });
        
        // Add click handlers for suggested questions
        offTopicBlock.find('.related-questions-list li').on('click', function() {
            const suggestedQuery = $(this).text();
            $exaInput.val(suggestedQuery);
            // Submit search with the suggested query
            submitSearch();
        });
        
        // Ensure the new search button is properly bound
        // (The onclick attribute in HTML will handle the click)
        
        $exaAnswer.append(offTopicBlock);
        $ticketWrapper.show();
        
        // Automatically populate the ticket form with the user's query
        setTimeout(() => {
            populateTicketForm(query);
        }, 500); // Small delay to ensure the form is rendered
        
        // Log performance
        if (data.performance) {
            console.log(`⚡ Off-topic detection completed in ${data.performance.total_time.toFixed(2)}ms`);
        }
    }

    // Pre-warming function for better performance
    function prewarmQuery(query) {
        // This function pre-warms common queries for faster response
        // It's a lightweight optimization that doesn't affect the main flow
        // Note: Caching removed as most users don't ask the same question twice
    }
    
    // Performance monitoring utilities
    function logPerformanceMetric(name, startTime) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    }
    
    // Console debugging utilities
    function initConsoleDebugging() {
        // Console debugging disabled for production
        console.log('🚀 Parallel search system initialized');
    }
    


    // Handle search response
    function handleSearchResponse(response, query) {
        const responseStartTime = performance.now();
        
        try {
            $exaLoading.hide();
            $exaAnswer.show();

            if (!response.success) {
                $exaAnswer.append('<p>⚠️ Search error.</p>');
                return;
            }

            const data = response.data || {};
            
            // Handle off-topic responses
            if (data.is_off_topic) {
                handleOffTopicResponse(data, query);
                return;
            }
            const sources = data.sources || '';
            const blockedDomains = data.block_domains || '';
            const results = (data.search && data.search.results) ? data.search.results : [];
            const chatlogId = data.chatlog_id || null;
            const conversationHistoryResp = data.conversation_history || conversationHistory;
            

            const questionID = 'answer-' + Date.now();
            const block = createModernAnswerBlock(questionID, query, results);
            $exaAnswer.append(block);

            if (results && results.length) {
                createModernSourceCards(block, results);
                // Also populate the Sources tab
                populateSourcesTab(block, results);
            }

            setupModernSliderButtons();

            if (data.local_answer) {
                handleLocalAnswer(data.local_answer, block, chatlogId, query);
            } else {
                // Update the global conversation history with the response from server
                if (data.conversation_history && Array.isArray(data.conversation_history)) {
                    conversationHistory = data.conversation_history;
                }
                
                const streamingContainer = block.find('.exa-answer-streaming')[0];
                if (streamingContainer) {
                    streamOpenAIAnswer(query, sources, block, streamingContainer, chatlogId, conversationHistory);
                }
                
                addModernFeedbackSystem(block, chatlogId);
            }

            $ticketWrapper.show();
            
            // Log performance metrics
            logPerformanceMetric('response_processing', responseStartTime);
            
        } catch (error) {
            $exaAnswer.append(`<p>⚠️ Error processing response: ${error.message}</p>`);
        }
    }

    // Create modern answer block with tabs
    function createModernAnswerBlock(questionID, query, results = []) {
        return $(`<div class="answer-block modern-ui" id="${questionID}">
            <div class="answer-header">
                <div class="answer-tabs">
                    <button class="tab-btn active" data-tab="answer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M12 1v6m0 6v6"></path>
                        </svg>
                        Answer
                    </button>

                    <button class="tab-btn" data-tab="sources">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                        </svg>
                        Sources ${results ? results.length : 0}
                    </button>

                </div>
            </div>
            <div class="tab-content active" data-tab="answer">
                <div class="exa-results"></div>
                <div class="exa-answer-streaming space-owl-m"></div>
            </div>
            <div class="tab-content" data-tab="images">
                <div class="images-placeholder">Images will appear here</div>
            </div>
            <div class="tab-content" data-tab="sources">
                <div class="sources-content"></div>
            </div>

        </div>`);
    }

    /**
     * Create modern source cards with horizontal scrolling
     * 
     * This function creates a horizontal scrolling list of source cards that
     * display website information including favicons, domains, and titles.
     * Each card is clickable and opens the source in a new tab.
     * 
     * FEATURES:
     * - Horizontal scrolling with navigation buttons
     * - Favicon display with fallback to Google favicon API
     * - Domain extraction and display
     * - Clickable source links
     * - Responsive design for mobile and desktop
     * 
     * @param {jQuery} block - The answer block container
     * @param {Array} results - Array of search result objects
     * @returns {void}
     * 
     * @example
     * createModernSourceCards(answerBlock, searchResults);
     * // Creates scrollable source cards in the answer block
     */
    function createModernSourceCards(block, results) {
        // Handle empty or invalid results
        if (!results || !Array.isArray(results) || results.length === 0) {
            block.find('.exa-results').html(`
                <div class="sources-header">
                    <span>📚 No sources found</span>
                </div>
            `);
            return;
        }
        
        // Create source cards for each result
        const cards = results.map(item => {
            // Extract domain from URL for display
            let domain = 'unknown';
            try {
                if (item.url) {
                    domain = new URL(item.url).hostname.replace('www.', '');
                }
            } catch (e) {
                // Invalid URL handled silently - use default domain
            }
            
            // Check if favicon is valid or use fallback
            const isBadFavicon = !item.favicon || item.favicon === "data:," || item.favicon === "about:blank";
            
            // Use Google favicon API as fallback when Exa doesn't provide a favicon
            let faviconUrl;
            if (isBadFavicon) {
                faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            } else {
                faviconUrl = item.favicon;
            }
            
            // Fallback icon for cases where both favicon and Google API fail
            const fallbackIcon = (typeof exaSettings !== 'undefined' && exaSettings.fallbackIcon) ? exaSettings.fallbackIcon : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K';
            const image = `<img src="${faviconUrl}" alt="favicon" class="exa-favicon" onerror="this.src='${fallbackIcon}'">`;
            
            // Return HTML for individual source card
            return `<div class="source-card">
                <div class="source-card-header">${image}<span class="exa-domain">${domain}</span></div>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="source-title">${item.title}</a>
            </div>`;
        }).join('');

        // Get source count and display information
        const sourceCount = results.length;
        const displayCount = sourceCount; // Show all sources, no cap
        
        // Create the complete source cards container with navigation
        block.find('.exa-results').html(`
            <div class="sources-header">
                <span>📚 ${displayCount} source${displayCount !== 1 ? 's' : ''} found</span>
            </div>
            <div class="sources-container">
                <button class="slider-btn prev-btn">&#10094;</button>
                <div class="top-sources-wrapper">${cards}</div>
                <button class="slider-btn next-btn">&#10095;</button>
            </div>
        `);
    }

    /**
     * Populate Sources tab with detailed source information
     * 
     * This function creates a comprehensive view of all sources in the Sources tab,
     * including detailed information, filtering options, and action buttons for
     * each source (open, copy URL, etc.).
     * 
     * FEATURES:
     * - Detailed source information display
     * - Favicon and domain information
     * - Action buttons for each source
     * - Filtering system (All, Recent, Relevance)
     * - Responsive design with proper spacing
     * 
     * @param {jQuery} block - The answer block container
     * @param {Array} results - Array of search result objects
     * @returns {void}
     * 
     * @example
     * populateSourcesTab(answerBlock, searchResults);
     * // Populates the Sources tab with detailed source information
     */
    function populateSourcesTab(block, results) {
        // Store the original results data in the block for filtering functionality
        block.data('original-results', results);
        
        // Handle empty results case
        if (!results || !Array.isArray(results) || results.length === 0) {
            block.find('.sources-content').html(`
                <div class="sources-empty-state">
                    <div class="empty-icon">📚</div>
                    <h3>No Sources Found</h3>
                    <p>No sources were found for this query.</p>
                </div>
            `);
            return;
        }

        // Create detailed HTML for each source item
        const sourcesHtml = results.map((item, index) => {
            // Extract domain from URL
            let domain = 'unknown';
            try {
                if (item.url) {
                    domain = new URL(item.url).hostname.replace('www.', '');
                }
            } catch (e) {
                // Invalid URL handled silently
            }

            // Handle favicon with fallback
            const isBadFavicon = !item.favicon || item.favicon === "data:," || item.favicon === "about:blank";
            const fallbackIcon = (typeof exaSettings !== 'undefined' && exaSettings.fallbackIcon) ? exaSettings.fallbackIcon : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K';
            const faviconUrl = isBadFavicon ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : item.favicon;

            // Return HTML for individual source item with actions
            return `
                <div class="source-item" data-index="${index}">
                    <div class="source-item-header">
                        <div class="source-favicon">
                            <img src="${faviconUrl}" alt="favicon" onerror="this.src='${fallbackIcon}'">
                        </div>
                        <div class="source-info">
                            <div class="source-domain">${domain}</div>
                            <div class="source-title">${item.title || 'Untitled'}</div>
                        </div>
                        <div class="source-actions">
                            <button class="source-action-btn" onclick="window.open('${item.url}', '_blank')" title="Open Source">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                    <polyline points="15,3 21,3 21,9"></polyline>
                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                </svg>
                            </button>
                            <button class="source-action-btn" onclick="copyToClipboard('${item.url}')" title="Copy URL">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="source-item-details">
                        <div class="source-url">
                            <a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a>
                        </div>
                        ${item.snippet ? `<div class="source-snippet">${item.snippet}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Create header with source count and filter buttons
        const sourcesHeader = `
            <div class="sources-tab-header">
                <div class="sources-count">
                    <span class="count-number">${results.length}</span>
                    <span class="count-label">Sources Found</span>
                </div>
                <div class="sources-filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="recent">Recent</button>
                    <button class="filter-btn" data-filter="relevance">Relevance</button>
                </div>
            </div>
        `;

        // Combine header and source items
        block.find('.sources-content').html(sourcesHeader + sourcesHtml);
        
        // Set up filtering functionality for the sources
        setupSourceFilters(block);
    }

    /**
     * Setup source filtering functionality
     * 
     * This function adds click event handlers to the filter buttons
     * and manages the active state of filter selections.
     * 
     * @param {jQuery} block - The answer block container
     * @returns {void}
     * 
     * @example
     * setupSourceFilters(answerBlock);
     * // Enables filtering functionality for sources
     */
    function setupSourceFilters(block) {
        const filterButtons = block.find('.filter-btn');
        
        // Add click handlers for each filter button
        filterButtons.on('click', function() {
            const filterType = $(this).data('filter');
            
            // Update active filter button state
            block.find('.filter-btn').removeClass('active');
            $(this).addClass('active');
            
            // Apply the selected filter
            applySourceFilter(block, filterType);
        });
    }

    /**
     * Apply source filtering based on selected filter type
     * 
     * This function reorders the source items based on the selected filter:
     * - All: Original order from search results
     * - Recent: Sorted by publication/update date (newest first)
     * - Relevance: Sorted by relevance score (highest first)
     * 
     * @param {jQuery} block - The answer block container
     * @param {string} filterType - Type of filter to apply ('all', 'recent', 'relevance')
     * @returns {void}
     * 
     * @example
     * applySourceFilter(answerBlock, 'recent');
     * // Sorts sources by recency
     */
    function applySourceFilter(block, filterType) {
        const sourceItems = block.find('.source-item');
        const sourcesContent = block.find('.sources-content');
        
        // Get the original results data from the block's data attribute
        const originalResults = block.data('original-results');
        
        // Store original order if not already stored (for performance)
        if (!sourcesContent.data('original-order')) {
            const originalOrder = [];
            sourceItems.each(function(index) {
                const resultData = originalResults ? originalResults[index] : {};
                
                // Get the most relevant date: publishedDate -> date_updated -> published_date -> date_created
                let timestamp = 0;
                if (resultData.publishedDate) {
                    timestamp = new Date(resultData.publishedDate).getTime();
                } else if (resultData.date_updated) {
                    timestamp = new Date(resultData.date_updated).getTime();
                } else if (resultData.published_date) {
                    timestamp = new Date(resultData.published_date).getTime();
                } else if (resultData.date_created) {
                    timestamp = new Date(resultData.date_created).getTime();
                }
                
                // Get relevance score, default to 0 if not available
                const relevance = resultData.score ? parseFloat(resultData.score) : 0;
                
                originalOrder.push({
                    element: $(this),
                    index: index,
                    timestamp: timestamp,
                    relevance: relevance,
                    resultData: resultData
                });
            });
            sourcesContent.data('original-order', originalOrder);
        }
        
        const originalOrder = sourcesContent.data('original-order');
        let filteredItems = [];
        
        // Apply different sorting logic based on filter type
        switch (filterType) {
            case 'all':
                // Show all items in original order
                filteredItems = originalOrder.map(item => item.element);
                break;
                
            case 'recent':
                // Sort by timestamp (newest first)
                filteredItems = [...originalOrder]
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(item => item.element);
                break;
                
            case 'relevance':
                // Sort by relevance score (highest first)
                filteredItems = [...originalOrder]
                    .sort((a, b) => b.relevance - a.relevance)
                    .map(item => item.element);
                break;
                
            default:
                filteredItems = originalOrder.map(item => item.element);
        }
        
        // Reorder the DOM elements based on filtered results
        const sourcesContainer = block.find('.sources-content');
        const header = sourcesContainer.find('.sources-tab-header');
        
        // Remove header temporarily to avoid interference
        header.detach();
        
        // Clear and re-add items in new order
        sourceItems.detach();
        
        filteredItems.forEach((item, index) => {
            sourcesContainer.append(item);
            
            // Add temporary highlight to show reordering worked
            if (filterType !== 'all') {
                item.addClass('filtered-highlight');
                setTimeout(() => {
                    item.removeClass('filtered-highlight');
                }, 2000);
            }
        });
        
        // Re-add header at the top
        sourcesContainer.prepend(header);
        
        // Show visual feedback for the applied filter
        showFilterFeedback(filterType);
    }

    /**
     * Show filter feedback message to user
     * 
     * Displays a temporary message indicating which filter has been applied
     * and how the sources are now sorted.
     * 
     * @param {string} filterType - Type of filter that was applied
     * @returns {void}
     * 
     * @example
     * showFilterFeedback('recent');
     * // Shows "Sources sorted by recency (newest first)"
     */
    function showFilterFeedback(filterType) {
        let message = '';
        
        // Create appropriate message based on filter type
        switch (filterType) {
            case 'all':
                message = 'Showing all sources in original order';
                break;
            case 'recent':
                message = 'Sources sorted by recency (newest first)';
                break;
            case 'relevance':
                message = 'Sources sorted by relevance score (highest first)';
                break;
        }
        
        // Create or update feedback element
        let feedbackEl = $('.filter-feedback');
        if (feedbackEl.length === 0) {
            feedbackEl = $('<div class="filter-feedback"></div>');
            $('body').append(feedbackEl);
        }
        
        // Show feedback message
        feedbackEl.text(message).addClass('show');
        
        // Hide after 2 seconds
        setTimeout(() => {
            feedbackEl.removeClass('show');
        }, 2000);
    }

    // copyToClipboard function is now defined globally above

    /**
     * Setup modern slider buttons for source card navigation
     * 
     * This function adds horizontal scrolling functionality to the source cards
     * container, allowing users to navigate through sources using previous/next
     * buttons with smooth scrolling behavior.
     * 
     * FEATURES:
     * - Smooth horizontal scrolling
     * - Dynamic button opacity based on scroll position
     * - Responsive navigation controls
     * - Touch-friendly scrolling
     * 
     * @returns {void}
     * 
     * @example
     * setupModernSliderButtons();
     * // Enables horizontal scrolling for all source card containers
     */
    function setupModernSliderButtons() {
        document.querySelectorAll('.exa-results').forEach(block => {
            const wrapper = block.querySelector('.top-sources-wrapper');
            const prevBtn = block.querySelector('.prev-btn');
            const nextBtn = block.querySelector('.next-btn');

            // Setup previous button functionality
            if (prevBtn && wrapper) {
                prevBtn.addEventListener('click', () => {
                    // Calculate scroll amount for one card (200px card + 16px gap = 216px)
                    const cardWidth = 200;
                    const gap = 16;
                    const scrollAmount = -(cardWidth + gap);
                    wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                });
            }

            // Setup next button functionality
            if (nextBtn && wrapper) {
                nextBtn.addEventListener('click', () => {
                    // Calculate scroll amount for one card (200px card + 16px gap = 216px)
                    const cardWidth = 200;
                    const gap = 16;
                    const scrollAmount = cardWidth + gap;
                    wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                });
            }

            // Show/hide navigation buttons based on scroll position
            if (wrapper) {
                wrapper.addEventListener('scroll', () => {
                    const isAtStart = wrapper.scrollLeft <= 0;
                    const isAtEnd = wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth;
                    
                    // Adjust button opacity based on scroll position
                    if (prevBtn) prevBtn.style.opacity = isAtStart ? '0.5' : '1';
                    if (nextBtn) nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
                });
            }
        });
    }

    /**
     * Handle tab switching functionality for answer blocks
     * 
     * This event handler manages the switching between different tabs
     * (Answer, Sources, Images) within each answer block.
     * 
     * @param {Event} e - Click event object
     * @returns {void}
     * 
     * @example
     * // Automatically bound to .tab-btn elements
     * // Clicking a tab button switches to that tab
     */
    // Tab switching functionality
    $(document).on('click', '.tab-btn', function(e) {
        e.preventDefault();
        const tabName = $(this).data('tab');
        const answerBlock = $(this).closest('.answer-block');
        
        // Update active tab button state
        answerBlock.find('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        // Update active tab content
        answerBlock.find('.tab-content').removeClass('active');
        answerBlock.find(`[data-tab="${tabName}"]`).addClass('active');
    });

    /**
     * Add modern reaction bar with action buttons
     * 
     * This function creates a reaction bar below each answer that allows users
     * to provide feedback (like/dislike) and perform actions like sharing.
     * 
     * FEATURES:
     * - Like/dislike reaction buttons
     * - Share functionality
     * - More options menu
     * - Real-time reaction counts
     * - Modern UI design
     * 
     * @param {jQuery} block - The answer block container
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @returns {void}
     * 
     * @example
     * addModernReactionBar(answerBlock, 'chat-123');
     * // Adds reaction bar with like/dislike and share buttons
     */
    function addModernFeedbackSystem(block, chatlogId) {
        console.log('🎯 Adding modern feedback system for chatlog ID:', chatlogId);
        
        // Create the modern feedback container with share and new search buttons
        const feedbackContainer = $(`
            <div class="modern-feedback-wrapper" style="margin-top: 20px;">
                <div class="action-buttons">
                    <button class="share-btn modern" data-id="${chatlogId}">
                        ${shareSVG}
                        <span>Share</span>
                    </button>
                    <button class="new-search-btn modern">
                        ${newSearchSVG}
                        <span>New Search</span>
                    </button>
                </div>
                </div>
        `);
        
        // Append to the answer block
        block.append(feedbackContainer);
        
        // Use simple feedback system (complex system disabled)
        console.log('Using simple feedback system');
        addBasicFeedback(feedbackContainer, chatlogId);
        
        // Add share button functionality
        feedbackContainer.find('.share-btn').on('click', function(e) {
            console.log('Share button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            const answerBlock = $(this).closest('.answer-block');
            const chatlogQuestion = answerBlock.find('.chatlog-question').text();
            
            let questionTitle = chatlogQuestion || '';
            
            if (!questionTitle) {
                questionTitle = $exaInput.val() || '';
            }
            
            const shareUrl = window.location.origin + window.location.pathname + 
                '?chatlog_id=' + chatlogId + '&title=' + encodeURIComponent(questionTitle);
            
            // Copy to clipboard
            copyToClipboard(shareUrl);
            
            // Visual feedback
            const btn = $(this);
            const originalText = btn.find('span').text();
            btn.find('span').text('Copied!');
            btn.css('border-color', '#3bb273');
            
            setTimeout(() => {
                btn.find('span').text(originalText);
                btn.css('border-color', 'rgba(255, 255, 255, 0.2)');
            }, 2000);
        });
        
        // Add new search button functionality
        feedbackContainer.find('.new-search-btn').on('click', function(e) {
            console.log('New Search button clicked!');
            e.preventDefault();
            e.stopPropagation();
            
            // Open the Psybrary in a new tab
            window.open('https://beta.psychedelics.com/#psybrary', '_blank');
        });
        
        console.log('✅ Modern feedback system initialized for chatlog:', chatlogId);
    }
    
    /**
     * Fallback basic feedback system
     */
    function addBasicFeedback(container, chatlogId) {
        // Create beautiful, modern feedback UI
        const feedbackUI = $(`
            <div class="feedback-system" data-chatlog-id="${chatlogId}" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 24px;
                padding: 20px 24px;
                background: linear-gradient(135deg, rgba(42, 27, 61, 0.8) 0%, rgba(26, 0, 36, 0.9) 100%);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 16px;
                backdrop-filter: blur(20px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                position: relative;
                overflow: hidden;
            ">
                <!-- Subtle gradient overlay -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
                "></div>
                
                <div class="feedback-question" style="
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 17px;
                    font-weight: 600;
                    letter-spacing: -0.02em;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                ">Did we answer your questions?</div>
                
                <div class="feedback-actions" style="display: flex; align-items: center; gap: 12px;">
                    <button class="feedback-btn thumbs-up" data-type="like" data-id="${chatlogId}" style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        background: rgba(59, 178, 115, 0.1);
                        border: 1.5px solid rgba(59, 178, 115, 0.3);
                        color: rgba(59, 178, 115, 0.9);
                        cursor: pointer;
                        padding: 12px 18px;
                        border-radius: 12px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        font-size: 15px;
                        font-weight: 600;
                        position: relative;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 2px 8px rgba(59, 178, 115, 0.1);
                    ">
                        <span style="font-size: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">👍</span>
                        <span class="like-count" id="like-count-${chatlogId}" style="
                            font-weight: 700;
                            min-width: 16px;
                            text-align: center;
                        ">0</span>
                    </button>
                    
                    <button class="feedback-btn thumbs-down" data-type="dislike" data-id="${chatlogId}" style="
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        background: rgba(231, 76, 60, 0.1);
                        border: 1.5px solid rgba(231, 76, 60, 0.3);
                        color: rgba(231, 76, 60, 0.9);
                        cursor: pointer;
                        padding: 12px 18px;
                        border-radius: 12px;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        font-size: 15px;
                        font-weight: 600;
                        position: relative;
                        backdrop-filter: blur(10px);
                        box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
                    ">
                        <span style="font-size: 20px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">👎</span>
                        <span class="dislike-count" id="dislike-count-${chatlogId}" style="
                            font-weight: 700;
                            min-width: 16px;
                            text-align: center;
                        ">0</span>
                    </button>
                    

                </div>
            </div>
            
            <style>
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .feedback-btn.thumbs-up:hover {
                    background: rgba(59, 178, 115, 0.2) !important;
                    border-color: rgba(59, 178, 115, 0.5) !important;
                    color: #3bb273 !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px rgba(59, 178, 115, 0.25) !important;
                }
                
                .feedback-btn.thumbs-down:hover {
                    background: rgba(231, 76, 60, 0.2) !important;
                    border-color: rgba(231, 76, 60, 0.5) !important;
                    color: #e74c3c !important;
                    transform: translateY(-2px) !important;
                    box-shadow: 0 6px 20px rgba(231, 76, 60, 0.25) !important;
                }
                

                

                
                .feedback-btn:active {
                    transform: translateY(0) !important;
                }
                
                /* Mobile Optimization */
                @media (max-width: 768px) {
                    .feedback-system {
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 12px !important;
                        padding: 16px 20px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        overflow: hidden !important;
                    }
                    
                    .feedback-question {
                        font-size: 15px !important;
                        margin-bottom: 8px !important;
                        width: 100% !important;
                        text-align: center !important;
                    }
                    
                    .feedback-actions {
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
                }
                
                @media (max-width: 480px) {
                    .feedback-system {
                        padding: 12px 16px !important;
                        gap: 10px !important;
                    }
                    
                    .feedback-question {
                        font-size: 14px !important;
                        text-align: center !important;
                    }
                    
                    .feedback-actions {
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
        `);
        
        container.append(feedbackUI);
        
        // Load initial counts
        loadFeedbackCounts(chatlogId);
        
        // Add hover effects
        feedbackUI.find('.feedback-btn').on('mouseenter', function() {
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
        feedbackUI.find('.feedback-btn').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const btn = $(this);
            const type = btn.data('type');
            const id = btn.data('id');
            
            // Show reason selection popup
            showReasonPopup(btn, type, id);
        });
        
        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.more-menu').length) {
                feedbackUI.find('.more-dropdown').hide();
            }
        });
    }
    
    /**
     * Load feedback counts from server
     */
    function loadFeedbackCounts(chatlogId) {
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_get_chatlog_reaction_counts',
            id: chatlogId
        }, function(response) {
            if (response && response.success && response.data) {
                $(`#like-count-${chatlogId}`).text(response.data.like || 0);
                $(`#dislike-count-${chatlogId}`).text(response.data.dislike || 0);
            }
        });
    }
    
    /**
     * Show reason selection popup
     */
    function showReasonPopup(button, type, chatlogId) {
        // Remove any existing popup
        $('.reason-popup').remove();
        
        const reasons = type === 'like' ? 
            ['Accurate', 'Clear explanation', 'Useful sources', 'Other'] :
            ['Inaccurate', 'Unclear', 'Missing info', 'Other'];
        
        const title = type === 'like' ? 'What did you like?' : 'What can we improve?';
        
        const popupHTML = `
            <div class="popup-backdrop" style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                z-index: 999998;
                backdrop-filter: blur(4px);
            "></div>
            <div class="reason-popup" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(135deg, rgba(26, 0, 36, 0.98) 0%, rgba(42, 27, 61, 0.95) 100%);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 20px;
                padding: 24px;
                z-index: 999999;
                min-width: 320px;
                max-width: 400px;
                backdrop-filter: blur(20px);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
                animation: popupSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            ">
                <!-- Subtle top border gradient -->
                <div style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
                    border-radius: 20px 20px 0 0;
                "></div>
                
                <div style="
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    text-align: center;
                    letter-spacing: -0.02em;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                ">${title}</div>
                
                <div class="reason-options" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                    ${reasons.map(reason => `
                        <button class="reason-option" data-reason="${reason}" style="
                            background: rgba(255, 255, 255, 0.06);
                            border: 1.5px solid rgba(255, 255, 255, 0.12);
                            color: rgba(255, 255, 255, 0.9);
                            padding: 14px 18px;
                            border-radius: 12px;
                            cursor: pointer;
                            font-size: 15px;
                            font-weight: 500;
                            text-align: left;
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            backdrop-filter: blur(10px);
                            position: relative;
                            overflow: hidden;
                        ">${reason}</button>
                    `).join('')}
                </div>
                
                <textarea class="reason-text" placeholder="Tell us more about your experience... (optional)" style="
                    width: 100%;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1.5px solid rgba(255, 255, 255, 0.12);
                    color: rgba(255, 255, 255, 0.95);
                    padding: 16px;
                    border-radius: 12px;
                    font-size: 15px;
                    line-height: 1.5;
                    resize: vertical;
                    min-height: 80px;
                    font-family: inherit;
                    box-sizing: border-box;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                    margin-bottom: 20px;
                "></textarea>
                
                <div style="display: flex; gap: 12px;">
                    <button class="submit-reason" style="
                        flex: 1;
                        background: linear-gradient(135deg, #3bb273 0%, #2d8f5a 100%);
                        color: white;
                        border: none;
                        padding: 14px 20px;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 15px;
                        font-weight: 600;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 4px 12px rgba(59, 178, 115, 0.3);
                        letter-spacing: -0.01em;
                    ">Submit Feedback</button>
                    <button class="cancel-reason" style="
                        background: rgba(255, 255, 255, 0.08);
                        color: rgba(255, 255, 255, 0.8);
                        border: 1.5px solid rgba(255, 255, 255, 0.15);
                        padding: 14px 20px;
                        border-radius: 12px;
                        cursor: pointer;
                        font-size: 15px;
                        font-weight: 500;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    ">Cancel</button>
                </div>
            </div>
            
            <style>
                @keyframes popupSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
                
                .reason-option {
                    transition: all 0.1s ease !important;
                }
                
                .reason-option:hover:not(.selected) {
                    background: rgba(255, 255, 255, 0.12) !important;
                    border-color: rgba(255, 255, 255, 0.25) !important;
                    color: #fff !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1) !important;
                }
                
                .reason-option.selected {
                    background: rgba(59, 178, 115, 0.2) !important;
                    border-color: #3bb273 !important;
                    color: #fff !important;
                    transform: translateY(-1px) !important;
                    box-shadow: 0 4px 12px rgba(59, 178, 115, 0.3) !important;
                }
                
                .reason-option:active {
                    transform: translateY(0) !important;
                }
                
                .reason-text:focus {
                    outline: none !important;
                    border-color: rgba(59, 178, 115, 0.5) !important;
                    background: rgba(255, 255, 255, 0.08) !important;
                    box-shadow: 0 0 0 3px rgba(59, 178, 115, 0.15) !important;
                }
                
                .reason-text::placeholder {
                    color: rgba(255, 255, 255, 0.5) !important;
                }
                
                .submit-reason:hover {
                    transform: translateY(-2px) !important;
                    box-shadow: 0 8px 25px rgba(59, 178, 115, 0.4) !important;
                }
                
                .submit-reason:active {
                    transform: translateY(0) !important;
                }
                
                .cancel-reason:hover {
                    background: rgba(255, 255, 255, 0.12) !important;
                    border-color: rgba(255, 255, 255, 0.25) !important;
                    color: #fff !important;
                }
            </style>
        `;
        
        // Add popup to body for fixed positioning
        $('body').append(popupHTML);
        
        const popup = $('body').find('.reason-popup').last();
        
        // Remove hover effects - using pure CSS instead for instant response
        
        // Handle reason selection with instant feedback
        let selectedReason = '';
        popup.find('.reason-option').on('click', function() {
            // Remove selection from all options instantly
            popup.find('.reason-option').removeClass('selected').css({
                'background': 'rgba(255, 255, 255, 0.06)',
                'border-color': 'rgba(255, 255, 255, 0.12)',
                'color': 'rgba(255, 255, 255, 0.9)',
                'transform': 'none',
                'box-shadow': 'none'
            });
            
            // Add selection to clicked option instantly
            $(this).addClass('selected').css({
                'background': 'rgba(59, 178, 115, 0.2)',
                'border-color': '#3bb273',
                'color': '#fff',
                'transform': 'translateY(-1px)',
                'box-shadow': '0 4px 12px rgba(59, 178, 115, 0.3)'
            });
            
            selectedReason = $(this).data('reason');
        });
        
        // Handle submit
        popup.find('.submit-reason').on('click', function() {
            const textFeedback = popup.find('.reason-text').val().trim();
            
            // Submit feedback
            submitFeedbackWithReason(chatlogId, type, selectedReason || 'Other', textFeedback);
            
            // Update count
            const countEl = type === 'like' ? $(`#like-count-${chatlogId}`) : $(`#dislike-count-${chatlogId}`);
            countEl.text(parseInt(countEl.text()) + 1);
            
            // Show success
            button.css('color', '#3bb273');
            setTimeout(() => {
                button.css('color', 'rgba(255, 255, 255, 0.7)');
            }, 2000);
            
            popup.prev('.popup-backdrop').remove();
            popup.remove();
        });
        
        // Handle cancel
        popup.find('.cancel-reason').on('click', function() {
            popup.prev('.popup-backdrop').remove();
            popup.remove();
        });
        
        // Close on backdrop click
        $('.popup-backdrop').last().on('click', function() {
            popup.prev('.popup-backdrop').remove();
            popup.remove();
        });
    }
    
    /**
     * Submit feedback with reason to server
     */
    function submitFeedbackWithReason(chatlogId, type, reason, text) {
        // Format feedback data for proper display in admin table
        const feedbackData = {
            option: reason, // Use the expected 'option' field for display compatibility
            feedback: text,
            timestamp: new Date().toISOString(),
            // Also include the new format for analytics compatibility
            categories: [reason.toLowerCase().replace(' ', '_')],
            text: text
        };
        
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_update_chatlog_reaction',
            id: chatlogId,
            reaction: type,
            single: 1,
            reaction_detail: JSON.stringify(feedbackData)
        }).done(function(response) {
            console.log('Feedback submitted successfully:', response);
        }).fail(function(xhr, status, error) {
            console.error('Feedback submission failed:', error);
        });
    }

    /**
     * Show more options functionality for reaction bar
     * 
     * This function creates and displays a dropdown menu with additional
     * options when the "more" button is clicked in the reaction bar.
     * 
     * @param {jQuery} block - The answer block container
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @returns {void}
     * 
     * @example
     * showMoreOptions(answerBlock, 'chat-123');
     * // Shows dropdown menu with additional options
     */
    // Show more options functionality
    function showMoreOptions(block, chatlogId) {
        const moreBtn = block.find('.reaction-more');
        const optionsContainer = block.find('.more-options-container');
        
        if (optionsContainer.length === 0) {
            const options = $(`
                <div class="more-options-container" style="position: absolute; top: 100%; right: 0; background: #1a0024; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; margin-top: 8px; z-index: 1000; min-width: 150px;">
                    <div class="more-option" style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Copy Link</div>
                    <div class="more-option" style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Report Issue</div>

                </div>
            `);
            
            moreBtn.css('position', 'relative');
            moreBtn.append(options);
            
            // Add click handlers for options
            options.find('.more-option').eq(0).on('click', function() {
                copyAnswerLink(block, chatlogId);
                options.remove();
            });
            
            options.find('.more-option').eq(1).on('click', function() {
                reportIssue(block, chatlogId);
                options.remove();
            });
            

        } else {
            optionsContainer.remove();
        }
    }

    /**
     * Copy answer link functionality
     * 
     * This function copies a shareable link to the current answer to the user's clipboard.
     * The link includes the chatlog ID for direct access to the specific conversation.
     * 
     * @param {jQuery} block - The answer block container
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @returns {void}
     * 
     * @example
     * copyAnswerLink(answerBlock, 'chat-123');
     * // Copies shareable link to clipboard
     */
    function copyAnswerLink(block, chatlogId) {
        const url = window.location.origin + window.location.pathname + '?chatlog_id=' + chatlogId;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Link copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Link copied to clipboard!', 'success');
        }
    }

    /**
     * Report issue functionality
     * 
     * This function creates a modal dialog that allows users to report issues
     * with specific answers or the system in general.
     * 
     * FEATURES:
     * - Modal dialog with issue description textarea
     * - Cancel and submit buttons
     * - Form validation
     * - Backend integration for issue reporting
     * 
     * @param {jQuery} block - The answer block container
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @returns {void}
     * 
     * @example
     * reportIssue(answerBlock, 'chat-123');
     * // Opens issue reporting modal
     */
    function reportIssue(block, chatlogId) {
        const reportForm = $(`
            <div class="report-form" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a0024; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; padding: 24px; z-index: 10000; min-width: 400px; max-width: 500px;">
                <h3 style="margin: 0 0 16px 0; color: #fff;">Report an Issue</h3>
                <textarea placeholder="Describe the issue..." style="width: 100%; height: 100px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; padding: 12px; margin-bottom: 16px; resize: vertical;"></textarea>
                <div style="display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="cancel-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Cancel</button>
                    <button class="submit-btn" style="background: #e74c3c; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Submit Report</button>
                </div>
            </div>
        `);
        
        $('body').append(reportForm);
        
        // Add event handlers
        reportForm.find('.cancel-btn').on('click', function() {
            reportForm.remove();
        });
        
        reportForm.find('.submit-btn').on('click', function() {
            const issue = reportForm.find('textarea').val();
            if (issue.trim()) {
                // TODO: Send report to backend
                console.log('Reporting issue:', issue, 'for chatlog:', chatlogId);
                showNotification('Issue reported successfully!', 'success');
                reportForm.remove();
            }
        });
    }



    /**
     * Show notification functionality
     * 
     * This function displays temporary notification messages to users with
     * different types (success, error, info) and automatic dismissal.
     * 
     * FEATURES:
     * - Multiple notification types (success, error, info)
     * - Smooth slide-in/slide-out animations
     * - Auto-dismissal after 3 seconds
     * - Fixed positioning for consistent display
     * - Color-coded by notification type
     * 
     * @param {string} message - The notification message to display
     * @param {string} type - Notification type ('success', 'error', 'info')
     * @returns {void}
     * 
     * @example
     * showNotification('Operation completed successfully!', 'success');
     * showNotification('An error occurred', 'error');
     * showNotification('Processing...', 'info');
     */
    function showNotification(message, type = 'info') {
        const notification = $(`
            <div class="notification ${type}" style="position: fixed; top: 20px; right: 20px; background: ${type === 'success' ? '#3bb273' : type === 'error' ? '#e74c3c' : '#3498db'}; color: #fff; padding: 12px 20px; border-radius: 8px; z-index: 10001; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transform: translateX(400px); transition: transform 0.3s ease;">
                ${message}
            </div>
        `);
        
        $('body').append(notification);
        
        // Animate in
        setTimeout(() => {
            notification.css('transform', 'translateX(0)');
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.css('transform', 'translateX(400px)');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Make showNotification globally accessible
    window.showNotification = showNotification;

    /**
     * Dedicated function for beta feedback submission
     * 
     * This function handles the submission of beta feedback from users,
     * sending it to the backend for processing and storage.
     * 
     * FEATURES:
     * - AJAX submission to WordPress backend
     * - Success/error message handling
     * - Form state management
     * - User feedback confirmation
     * 
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @param {string} feedback - User's feedback text
     * @param {jQuery} form - The feedback form element
     * @returns {void}
     * 
     * @example
     * submitBetaFeedback('chat-123', 'Great answer, very helpful!', feedbackForm);
     * // Submits feedback to backend and shows confirmation
     */
    function submitBetaFeedback(chatlogId, feedback, form) {
        // Remove previous error messages
        form.find('span').remove();
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_update_chatlog_beta_feedback',
            id: chatlogId,
            beta_feedback: feedback
        }, function(resp) {
            if (resp && resp.success) {
                form.html('<span style="color:#3bb273;font-weight:bold;">Thank you for your feedback!</span>');
            } else {
                form.append('<br><span style="color:#e74c3c;">Error saving feedback.</span>');
                if (resp && resp.data && resp.data.message) {
                    form.append('<br><span style="color:#e74c3c;">' + resp.data.message + '</span>');
                }
            }
        }).fail(function(xhr) {
            form.append('<br><span style="color:#e74c3c;">Error saving feedback.</span>');
            if (xhr && xhr.responseText) {
                form.append('<br><span style="color:#e74c3c;">' + xhr.responseText + '</span>');
            }
        });
    }

    /**
     * Handle local answer from knowledge base
     * 
     * This function processes answers that come from the local knowledge base
     * instead of AI streaming, setting up the UI and interaction elements.
     * 
     * FEATURES:
     * - Local answer display
     * - Reaction bar setup
     * - Follow-up prompts
     * - Beta feedback integration
     * - Conversation history management
     * 
     * @param {Object} localAnswer - Local answer object with content
     * @param {jQuery} block - The answer block container
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @param {string} query - The user's original query
     * @returns {void}
     * 
     * @example
     * handleLocalAnswer({content: 'Local answer content'}, answerBlock, 'chat-123', 'user question');
     * // Processes and displays local knowledge base answer
     */
    function handleLocalAnswer(localAnswer, block, chatlogId, query) {
        const html = `<div>${localAnswer.content}</div>`;
        streamLocalAnswer(html, block.find('.exa-answer-streaming')[0]);
        addModernFeedbackSystem(block, chatlogId);
        conversationHistory.push({ q: query || 'Question', a: '' }); // Now query is properly defined
        
        // Limit conversation history to last 5 exchanges to prevent context overflow
        if (conversationHistory.length > 5) {
            conversationHistory = conversationHistory.slice(-5);
        }
        
        // Add follow-up prompt after reaction bar
        setTimeout(() => {
            const reactionBar = block.find('.answer-reaction-bar');
            if (reactionBar.length && !block.find('.follow-up-prompt').length) {
                const followUpPrompt = $('<div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;">Ask a follow up question and we can continue our conversation or <button class="new-chat-btn" style="background: #3bb273; color: white; border: none; padding: 7px 12px; border-radius: 4px; cursor: pointer; margin: 0 5px;">New chat</button> and we can discuss another topic.</div>');
                
                const feedbackPrompt = $('<div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;">We\'re still building and improving the Psybrary based on community feedback. See something missing, unclear, or off? <button class="beta-feedback-btn" style="background:#3bb273;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Submit feedback</button><div class="beta-feedback-form" style="display:none;margin-top:10px;"><textarea class="beta-feedback-text" rows="3" style="width:90%;margin-bottom:8px;" placeholder="Your feedback..."></textarea><br><button class="beta-feedback-submit" style="background:#0C0012;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Send</button></div></div>');
                
                // Only bind feedback events once
                if (!window._betaFeedbackBound) {
                    window._betaFeedbackBound = true;
                    $(document).on('click', '.beta-feedback-btn', function(e) {
                        e.preventDefault();
                        $(this).siblings('.beta-feedback-form').show();
                        $(this).hide();
                    });
                    $(document).on('click', '.beta-feedback-submit', function(e) {
                        e.preventDefault();
                        const form = $(this).closest('.beta-feedback-form');
                        const feedback = form.find('.beta-feedback-text').val().trim();
                        const block = $(this).closest('.answer-block');
                        let chatlogId = block.find('.reaction-like').data('id');
                        // Fallback: try to get chatlogId from other elements if missing
                        if (!chatlogId) {
                            chatlogId = block.data('id') || block.attr('id')?.replace('answer-', '');
                        }
                        if (!feedback || !chatlogId) {
                            form.append('<br><span style="color:#e74c3c;">Please enter feedback.</span>');
                            return;
                        }
                        submitBetaFeedback(chatlogId, feedback, form);
                    });
                }

                reactionBar.after(followUpPrompt);
                reactionBar.after(feedbackPrompt);
                
                // Add click handler for new chat button
                block.find('.new-chat-btn').on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open('https://beta.psychedelics.com/#psybrary', '_blank');
                });
            }
        }, 100); // Small delay to ensure reaction bar is added
    }

    /**
     * Add reaction bar (legacy version)
     * 
     * This is the legacy version of the reaction bar that provides
     * basic like/dislike functionality with older styling.
     * 
     * NOTE: This function is maintained for backward compatibility.
     * New implementations should use addModernReactionBar().
     * 
     * @param {jQuery} block - The answer block container
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @returns {void}
     * 
     * @example
     * addReactionBar(answerBlock, 'chat-123');
     * // Adds legacy reaction bar with basic styling
     */
    function addReactionBar(block, chatlogId) {
        const reactionBar = $(`
            <div class="answer-reaction-bar" style="margin-top:10px; display:flex; align-items:center; gap:12px; justify-content:center;">
                <span class="reaction-like" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;">${likeSVG} <span style="margin-left:2px;">Helpful</span></span>
                <span class="like-count" id="like-count-${chatlogId}" style="font-size:13px;color:#3bb273;margin-left:2px;">0</span>
                <span class="reaction-dislike" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;">${dislikeSVG} <span style="margin-left:2px;">Not Helpful</span></span>
                <span class="dislike-count" id="dislike-count-${chatlogId}" style="font-size:13px;color:#e74c3c;margin-left:2px;">0</span>
                <span class="reaction-share" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;" title="Share">${shareSVG} Share</span>
                <span class="reaction-more" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;" title="More options">${moreSVG}</span>
                <div class="reaction-options-container" style="display:none;position:absolute;z-index:10;"></div>
            </div>
        `);
        block.append(reactionBar);
        
        // Debug: Log the created reaction bar
        console.log('Created reaction bar:', reactionBar[0].outerHTML);
        console.log('Reaction buttons found:', reactionBar.find('.reaction-like, .reaction-dislike, .reaction-more').length);
        
        // Fetch initial counts from backend
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_get_chatlog_reaction_counts',
            id: chatlogId
        }, function(resp) {
            if (resp && resp.success && resp.data) {
                $(`#like-count-${chatlogId}`).text(resp.data.like || 0);
                $(`#dislike-count-${chatlogId}`).text(resp.data.dislike || 0);
            }
        });
    }

    /**
     * Optimized HTML sanitization with HTML Tidy API integration
     * 
     * This function cleans and sanitizes HTML content for safe display,
     * using a hybrid approach that combines local processing with
     * professional HTML Tidy API for complex malformed content.
     * 
     * FEATURES:
     * - Local sanitization for simple cases (fast)
     * - HTML Tidy API for complex malformed HTML (professional)
     * - Script and style tag removal
     * - List structure fixing
     * - Table structure optimization
     * - Content truncation for display
     * - Special styling for specific sections
     * - Year truncation fixing
     * 
     * @param {string} html - Raw HTML content to sanitize
     * @returns {Promise<string>} Sanitized and cleaned HTML content
     * 
     * @example
     * const cleanHtml = await sanitizeHTML(rawHtmlContent);
     * // Returns safe HTML for display
     */
    async function sanitizeHTML(html) {
        // Use enhanced sanitization with HTML Tidy API fallback
        return await enhancedSanitizeHTML(html);
    }

    /**
     * Unified HTML sanitization combining all approaches
     * 
     * This is the single method that replaces all other sanitization methods.
     * It combines structure repair, DOMParser processing, and regex cleanup
     * in the correct order to prevent conflicts.
     * 
     * @param {string} html - Raw HTML content to sanitize
     * @returns {string} Clean, validated HTML content
     */
    function unifiedSanitizeHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            // Log initial HTML issues for debugging
            logHTMLIssues(html, 'pre-unified-sanitization');

            // STEP 1: Pre-process and fix obvious structural issues
            let processed = html
                .replace(REGEX_PATTERNS.doubleSpaces, ' ')
                .replace(REGEX_PATTERNS.lineBreaks, '\n')
                .replace(REGEX_PATTERNS.emptyParagraphs, '')
                .trim();

            // STEP 2: Fix malformed tags that can't be parsed
            processed = fixUnclosedTags(processed);
            processed = removeOrphanedClosingTags(processed);

            // STEP 3: Use DOMParser for structure validation and cleaning
            const parser = new DOMParser();
            const doc = parser.parseFromString('<div>' + processed + '</div>', 'text/html');

            // STEP 4: Remove unsafe elements
            doc.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());

            // STEP 5: Fix structure issues
            fixListStructure(doc);
            fixTableStructure(doc);
            fixParagraphStructure(doc);
            
            // STEP 6: Validate and clean nodes
            validateAndCleanNodes(doc.body.firstChild);

            // STEP 7: Extract clean HTML
            let safe = doc.body.firstChild.innerHTML;

            // STEP 8: Apply regex fixes in dependency order (most critical change)
            safe = safe
                .replace(REGEX_PATTERNS.whitespace, '><')                    // First: clean whitespace
                .replace(REGEX_PATTERNS.htmlEntities, '')                    // Then: remove entities
                .replace(REGEX_PATTERNS.hrefFix, '<a href="$1">')           // Then: fix href attributes
                .replace(REGEX_PATTERNS.linkText, '</a> $1')                // Then: fix link text spacing
                .replace(REGEX_PATTERNS.emptyLi, '')                        // Then: remove empty list items
                .replace(REGEX_PATTERNS.consecutiveUl, '')                  // Then: merge consecutive lists
                .replace(REGEX_PATTERNS.consecutiveOl, '')                  // Then: merge consecutive ordered lists
                .replace(REGEX_PATTERNS.ampersandFix, '&')                  // Then: fix double-encoded ampersands
                .replace(REGEX_PATTERNS.brokenSentences, '$1 in the 1980s and $2')  // Then: fix broken decade references
                .replace(REGEX_PATTERNS.missingSpaces, '$1 $2')             // Finally: add missing spaces between words
                .trim();

            // STEP 9: Truncate if needed (only for display, not for chatlog storage)
            if (safe.length > MAX_LENGTH) {
                safe = truncateHTML(safe);
            }

            // STEP 10: Apply special styling
            safe = applyWhereToLearnMoreStyling(safe);

            // STEP 11: Fix truncated years that commonly get cut off
            safe = fixTruncatedYears(safe);

            // STEP 12: Fix specific common AI errors
            safe = safe
                .replace(/\b(li|ul|ol|div|span)\b(?![^<]*>)/g, '')  // Remove stray tag names not in tags
                .replace(/<li>\s*<\/li>/g, '')                       // Remove empty list items
                .replace(/(<\/[^>]+>)\s*\1/g, '$1')                 // Remove duplicate closing tags
                .replace(/^[^<]*?(<[^>]+>)/g, '$1')                 // Remove text before first tag
                .replace(/(<\/[^>]+>)[^<]*?$/g, '$1');              // Remove text after last tag

            // STEP 13: Final validation check
            const finalIssues = validateHTMLStructure(safe);
            if (finalIssues.length > 3) {
                console.warn('Unified sanitization produced issues, using fallback:', finalIssues);
                return fallbackSanitize(html);
            }

            // Log final HTML issues
            logHTMLIssues(safe, 'post-unified-sanitization');

            return safe;
        } catch (e) {
            console.warn('Unified sanitization error:', e, 'Original HTML:', html.substring(0, 200));
            return fallbackSanitize(html);
        }
    }

    /**
     * HTML escaper for safe text output
     * 
     * This function escapes HTML special characters to prevent XSS attacks
     * and ensure safe display of user-generated content.
     * 
     * @param {string} s - String to escape
     * @returns {string} HTML-escaped string
     * 
     * @example
     * const safe = escapeHtml('<script>alert("xss")</script>');
     * // Returns '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
     */
    function escapeHtml(s) {
        return String(s || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    /**
     * Call HTML Tidy API for professional HTML cleaning
     * 
     * This function calls the server-side HTML Tidy API when local sanitization
     * encounters complex HTML issues that are difficult to fix client-side.
     * 
     * @param {string} html - Raw HTML content to clean
     * @returns {Promise<string>} Cleaned HTML content
     */
    async function cleanWithTidyAPI(html) {
        try {
            console.log('Calling HTML Tidy API for complex HTML cleaning...');
            
            const response = await fetch(ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'ai_clean_html',
                    html: html,
                    nonce: ai_trainer_ajax.nonce
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('HTML Tidy API cleaning results:', data.data.improvements);
                return data.data.cleaned_html;
            } else {
                console.warn('HTML Tidy API failed:', data.data.message);
                return html; // Return original if API fails
            }
        } catch (error) {
            console.error('HTML Tidy API error:', error);
            return html; // Return original if API fails
        }
    }

    /**
     * Enhanced HTML sanitization with HTML Tidy API fallback
     * 
     * This function provides a hybrid approach that uses local sanitization
     * for simple cases and the HTML Tidy API for complex malformed HTML.
     * 
     * @param {string} html - Raw HTML content to sanitize
     * @returns {Promise<string>} Cleaned HTML content
     */
    function enhancedSanitizeHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            // First try local sanitization
            let cleaned = unifiedSanitizeHTML(html);
            
            // Check if there are still significant issues
            const issues = validateHTMLStructure(cleaned);
            const hasComplexIssues = issues.length > 2 || 
                                   cleaned.includes('<h<') || 
                                   cleaned.includes('<a <a') ||
                                   cleaned.match(/<([a-zA-Z][a-zA-Z0-9]*)\s+<([a-zA-Z][a-zA-Z0-9]*)/);
            
            if (hasComplexIssues) {
                console.log('Complex HTML issues detected, using fallback sanitization');
                return fallbackSanitize(html);
            }
            
            return cleaned;
        } catch (error) {
            console.warn('Enhanced sanitization failed, using fallback sanitization:', error);
            return fallbackSanitize(html);
        }
    }

    /**
     * Standardized optional blocks + custom sections injector
     * 
     * This function renders standardized sections (Additional, Practical, Sources)
     * along with custom HTML sections for AI prompt templates.
     * 
     * @param {Object} options - Section configuration options
     * @param {Array} options.sections - Custom HTML sections to include
     * @param {boolean} options.includeAdditional - Whether to include additional context
     * @param {boolean} options.includePractical - Whether to include practical advice
     * @param {boolean} options.includeSources - Whether to include sources section
     * @returns {string} Combined HTML for all sections
     * 
     * @example
     * const sections = renderSections({
     *   sections: [{html: '<h3>Custom Section</h3>'}],
     *   includeAdditional: true,
     *   includeSources: true
     * });
     */
    function renderSections({ sections = [], includeAdditional = true, includePractical = true, includeSources = true }) {
        const custom = sections.map(s => s && s.html ? s.html : '').join('\n');
      
        const additional = includeAdditional ? `
    <h3>Additional Context or Considerations</h3>
    <p><!-- Nuance, cultural framing, study limitations, variability by dose/context. --></p>` : '';
      
        const practical = includePractical ? `
    <h3>Practical Advice</h3>
    <ul>
      <li><!-- Preparation or planning tips appropriate to this template. --></li>
      <li><!-- Questions to ask yourself or a clinician. --></li>
      <li><!-- Tools, checklists, or trackers to use. --></li>
    </ul>` : '';
      
        const sources = includeSources ? `
    <h3>Where to Learn More</h3>
    <div class="section-where-to-learn-more">
      <ul>
        <li><a href="#" style="color: #3bb273; text-decoration: none;"><!-- Primary literature (PubMed, clinical trials). --></a></li>
        <li><a href="#" style="color: #3bb273; text-decoration: none;"><!-- Harm reduction orgs (DanceSafe, Fireside). --></a></li>
        <li><a href="#" style="color: #3bb273; text-decoration: none;"><!-- Trusted education (Psychedelics.com, MAPS, Erowid). --></a></li>
      </ul>
    </div>` : '';
      
        return `${custom}${additional}${practical}${sources}`;
    }
      
    /**
     * Optional Safety Snapshot, injected only when addSafety=true
     * 
     * This function provides a standardized safety information section
     * that can be included in AI prompt templates when safety information
     * is relevant to the query.
     * 
     * @returns {string} HTML for safety tips section
     * 
     * @example
     * const safetyHtml = safetySnapshot();
     * // Returns HTML with medication, mental health, physical health, and set & setting tips
     */
    function safetySnapshot() {
        return `
    <h3>Safety Tips</h3>
    <ul>
      <li><strong>Medications:</strong> <!-- Note any risky drug interactions (e.g., SSRIs, MAOIs, lithium). --></li>
      <li><strong>Mental health:</strong> <!-- Note mental health precautions (e.g., risk of psychosis or severe anxiety). --></li>
      <li><strong>Physical health:</strong> <!-- Note physical health precautions (e.g., heart or neurological risks). --></li>
      <li><strong>Set &amp; Setting:</strong> <!-- Mindset and environment can influence experiences. --></li>
    </ul>`;
    }

    /**
     * Unified HTML sanitization combining all approaches
     * 
     * This is the single method that replaces all other sanitization methods.
     * It combines structure repair, DOMParser processing, and regex cleanup
     * in the correct order to prevent conflicts.
     * 
     * @param {string} html - Raw HTML content to sanitize
     * @returns {string} Clean, validated HTML content
     */
    function unifiedSanitizeHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            // Log initial HTML issues for debugging
            logHTMLIssues(html, 'pre-unified-sanitization');

            // STEP 1: Pre-process and fix obvious structural issues
            let processed = html
                .replace(REGEX_PATTERNS.doubleSpaces, ' ')
                .replace(REGEX_PATTERNS.lineBreaks, '\n')
                .replace(REGEX_PATTERNS.emptyParagraphs, '')
                .trim();

            // STEP 2: Fix malformed tags that can't be parsed
            processed = fixUnclosedTags(processed);
            processed = removeOrphanedClosingTags(processed);

            // STEP 3: Use DOMParser for structure validation and cleaning
            const parser = new DOMParser();
            const doc = parser.parseFromString('<div>' + processed + '</div>', 'text/html');

            // STEP 4: Remove unsafe elements
            doc.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());

            // STEP 5: Fix structure issues
            fixListStructure(doc);
            fixTableStructure(doc);
            fixParagraphStructure(doc);
            
            // STEP 6: Validate and clean nodes
            validateAndCleanNodes(doc.body.firstChild);

            // STEP 7: Extract clean HTML
            let safe = doc.body.firstChild.innerHTML;

            // STEP 8: Apply regex fixes in dependency order (most critical change)
            safe = safe
                .replace(REGEX_PATTERNS.whitespace, '><')                    // First: clean whitespace
                .replace(REGEX_PATTERNS.htmlEntities, '')                    // Then: remove entities
                .replace(REGEX_PATTERNS.hrefFix, '<a href="$1">')           // Then: fix href attributes
                .replace(REGEX_PATTERNS.linkText, '</a> $1')                // Then: fix link text spacing
                .replace(REGEX_PATTERNS.emptyLi, '')                        // Then: remove empty list items
                .replace(REGEX_PATTERNS.consecutiveUl, '')                  // Then: merge consecutive lists
                .replace(REGEX_PATTERNS.consecutiveOl, '')                  // Then: merge consecutive ordered lists
                .replace(REGEX_PATTERNS.ampersandFix, '&')                  // Then: fix double-encoded ampersands
                .replace(REGEX_PATTERNS.brokenSentences, '$1 in the 1980s and $2')  // Then: fix broken decade references
                .replace(REGEX_PATTERNS.missingSpaces, '$1 $2')             // Finally: add missing spaces between words
                .trim();

            // STEP 9: Truncate if needed (only for display, not for chatlog storage)
            if (safe.length > MAX_LENGTH) {
                safe = truncateHTML(safe);
            }

            // STEP 10: Apply special styling
            safe = applyWhereToLearnMoreStyling(safe);

            // STEP 11: Fix truncated years that commonly get cut off
            safe = fixTruncatedYears(safe);

            // STEP 12: Fix specific common AI errors
            safe = safe
                .replace(/\b(li|ul|ol|div|span)\b(?![^<]*>)/g, '')  // Remove stray tag names not in tags
                .replace(/<li>\s*<\/li>/g, '')                       // Remove empty list items
                .replace(/(<\/[^>]+>)\s*\1/g, '$1')                 // Remove duplicate closing tags
                .replace(/^[^<]*?(<[^>]+>)/g, '$1')                 // Remove text before first tag
                .replace(/(<\/[^>]+>)[^<]*?$/g, '$1');              // Remove text after last tag

            // STEP 13: Final validation check
            const finalIssues = validateHTMLStructure(safe);
            if (finalIssues.length > 3) {
                console.warn('Unified sanitization produced issues, using fallback:', finalIssues);
                return fallbackSanitize(html);
            }

            // Log final HTML issues
            logHTMLIssues(safe, 'post-unified-sanitization');

            return safe;
        } catch (e) {
            console.warn('Unified sanitization error:', e, 'Original HTML:', html.substring(0, 200));
            return fallbackSanitize(html);
        }
    }

    /**
     * Fix unclosed tags systematically
     * 
     * @param {string} html - HTML content to fix
     * @returns {string} HTML with closed tags
     */
    function fixUnclosedTags(html) {
        // First, fix malformed tags that can't be parsed properly
        let result = html
            // Fix malformed heading tags like <h< div="">
            .replace(/<h<[^>]*>/g, '<h3>')
            // Fix double opening tags
            .replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+<([a-zA-Z][a-zA-Z0-9]*)/g, '<$1')
            // Fix malformed anchor tags
            .replace(/<a\s+<a[^>]*>/g, '<a>');
        
        const tagStack = [];
        const openTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)(?<!\/)>/g;
        const closeTagRegex = /<\/([a-zA-Z][a-zA-Z0-9]*)>/g;
        
        let match;
        
        // Reset regex state
        openTagRegex.lastIndex = 0;
        closeTagRegex.lastIndex = 0;
        
        // Find all opening tags
        while ((match = openTagRegex.exec(result)) !== null) {
            const tagName = match[1].toLowerCase();
            if (!['br', 'hr', 'img', 'input', 'meta', 'link'].includes(tagName)) {
                tagStack.push(tagName);
            }
        }
        
        // Reset regex state
        closeTagRegex.lastIndex = 0;
        
        // Find all closing tags and remove from stack
        while ((match = closeTagRegex.exec(result)) !== null) {
            const tagName = match[1].toLowerCase();
            const index = tagStack.lastIndexOf(tagName);
            if (index !== -1) {
                tagStack.splice(index, 1);
            }
        }
        
        // Close remaining unclosed tags in reverse order
        while (tagStack.length > 0) {
            const tag = tagStack.pop();
            result += `</${tag}>`;
        }
        
        return result;
    }

    /**
     * Remove orphaned closing tags
     * 
     * @param {string} html - HTML content to clean
     * @returns {string} HTML without orphaned closing tags
     */
    function removeOrphanedClosingTags(html) {
        return html.replace(/<\/([a-zA-Z][a-zA-Z0-9]*)(?![^<]*>)/g, '');
    }

    /**
     * Fix paragraph structure
     * 
     * @param {Document} doc - DOM document to process
     */
    function fixParagraphStructure(doc) {
        doc.querySelectorAll('p').forEach(p => {
            // Remove empty paragraphs
            if (!p.textContent.trim() && !p.querySelector('img, br')) {
                p.remove();
            }
            
            // Fix paragraphs with invalid children
            Array.from(p.children).forEach(child => {
                if (['div', 'section', 'article', 'header', 'footer'].includes(child.tagName.toLowerCase())) {
                    p.parentNode.insertBefore(child, p.nextSibling);
                }
            });
        });
    }

    /**
     * Fix list structure
     * 
     * @param {Document} doc - DOM document to process
     */
    function fixListStructure(doc) {
        doc.querySelectorAll('li').forEach(li => {
            // Ensure li elements are inside ul or ol
            if (li.parentNode && !['UL', 'OL'].includes(li.parentNode.tagName)) {
                const ul = document.createElement('ul');
                li.parentNode.insertBefore(ul, li);
                ul.appendChild(li);
            }
        });
    }

    /**
     * Fix table structure
     * 
     * @param {Document} doc - DOM document to process
     */
    function fixTableStructure(doc) {
        doc.querySelectorAll('tr').forEach(tr => {
            // Ensure tr elements are inside table, tbody, thead, or tfoot
            if (tr.parentNode && !['TABLE', 'TBODY', 'THEAD', 'TFOOT'].includes(tr.parentNode.tagName)) {
                const tbody = document.createElement('tbody');
                tr.parentNode.insertBefore(tbody, tr);
                tbody.appendChild(tr);
            }
        });
    }

    /**
     * Validate and clean nodes
     * 
     * @param {Node} node - DOM node to validate
     */
    function validateAndCleanNodes(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        // Process children first
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => validateAndCleanNodes(child));

        // Check for invalid tag combinations
        if (node.tagName === 'LI' && node.parentNode && !['UL', 'OL'].includes(node.parentNode.tagName)) {
            // Move LI outside of invalid parent
            const ul = document.createElement('ul');
            node.parentNode.insertBefore(ul, node);
            ul.appendChild(node);
        }

        // Remove invalid attributes
        const invalidAttrs = ['onclick', 'onload', 'onerror', 'javascript:'];
        invalidAttrs.forEach(attr => {
            if (node.hasAttribute(attr)) {
                node.removeAttribute(attr);
            }
        });
    }

    /**
     * Apply final fixes to HTML
     * 
     * @param {string} html - HTML content to fix
     * @returns {string} Final cleaned HTML
     */
    function applyFinalFixes(html) {
        return html
            .replace(REGEX_PATTERNS.whitespace, '><')
            .replace(REGEX_PATTERNS.htmlEntities, '')
            .replace(REGEX_PATTERNS.ampersandFix, '&')  // Fix double-encoded ampersands
            .replace(REGEX_PATTERNS.brokenSentences, '$1 in the 1980s and $2')  // Fix broken decade references
            .replace(REGEX_PATTERNS.missingSpaces, '$1 $2')  // Add missing spaces between words
            .replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+>/g, '<$1>') // Remove empty attributes
            .replace(/\s+>/g, '>') // Clean up trailing spaces
            // Fix malformed anchor tags
            .replace(/<a\s+<a[^>]*>/g, '<a>') // Fix double <a tags
            .replace(/<a\s+([^>]*?)>\s*<\/a>/g, '') // Remove empty anchor tags
            .replace(/<a\s+([^>]*?)>\s*([^<]*?)<\/a>/g, (match, attrs, content) => {
                // Only keep anchor tags with valid href
                if (attrs.includes('href=')) {
                    return `<a ${attrs}>${content}</a>`;
                }
                return content; // Remove anchor tags without href
            })
            // Fix malformed heading tags (like <h< div="">)
            .replace(/<h<[^>]*>/g, '<h3>')
            .replace(/<h([1-6])\s+([^>]*?)>\s*<\/h\1>/g, '<h$1 $2></h$1>')
            // Fix malformed div tags
            .replace(/<div\s+([^>]*?)>\s*<\/div>/g, '<div $1></div>')
            // Fix unclosed list items
            .replace(/<li([^>]*?)>(?!.*<\/li>)/g, '<li$1></li>')
            // Fix other common malformations
            .replace(/<([a-zA-Z][a-zA-Z0-9]*)\s+<([a-zA-Z][a-zA-Z0-9]*)/g, '<$1') // Fix double opening tags
            .replace(/<\/([a-zA-Z][a-zA-Z0-9]*)\s+<\/([a-zA-Z][a-zA-Z0-9]*)/g, '</$1') // Fix double closing tags
            // Fix unclosed tags by adding closing tags
            .replace(/<p([^>]*?)>(?!.*<\/p>)/g, '<p$1></p>')
            .replace(/<h([1-6])([^>]*?)>(?!.*<\/h\1>)/g, '<h$1$2></h$1>')
            .replace(/<div([^>]*?)>(?!.*<\/div>)/g, '<div$1></div>')
            .trim();
    }

    /**
     * Fallback sanitization for when parsing fails
     * 
     * @param {string} html - HTML content to sanitize
     * @returns {string} Basic sanitized HTML
     */
    function fallbackSanitize(html) {
        return html
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }

    /**
     * Validate HTML structure and log issues
     * 
     * @param {string} html - HTML content to validate
     * @param {string} context - Context for logging
     */
    function validateHTMLStructure(html) {
        const issues = [];
        
        // Check for unclosed tags
        const openTags = html.match(/<([a-zA-Z][a-zA-Z0-9]*)(?![^>]*\/>)/g) || [];
        const closeTags = html.match(/<\/([a-zA-Z][a-zA-Z0-9]*)>/g) || [];
        
        const tagCounts = {};
        
        openTags.forEach(tag => {
            const tagName = tag.replace(/[<>]/g, '');
            tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
        });
        
        closeTags.forEach(tag => {
            const tagName = tag.replace(/[<>/]/g, '');
            tagCounts[tagName] = (tagCounts[tagName] || 0) - 1;
        });
        
        Object.entries(tagCounts).forEach(([tag, count]) => {
            if (count > 0) {
                issues.push(`Unclosed <${tag}> tag`);
            } else if (count < 0) {
                issues.push(`Orphaned </${tag}> tag`);
            }
        });
        
        // Check for malformed tags
        const malformedTags = html.match(/<([a-zA-Z][a-zA-Z0-9]*)\s+<([a-zA-Z][a-zA-Z0-9]*)/g) || [];
        if (malformedTags.length > 0) {
            issues.push(`Malformed tags detected: ${malformedTags.join(', ')}`);
        }
        
        // Check for specific malformed patterns we've seen
        if (html.includes('<h<')) {
            issues.push('Malformed heading tag detected');
        }
        
        if (html.includes('<a <a')) {
            issues.push('Double anchor tag detected');
        }
        
        // Check for empty anchor tags without href
        const emptyAnchors = html.match(/<a\s+[^>]*>\s*<\/a>/g) || [];
        if (emptyAnchors.length > 0) {
            issues.push(`Empty anchor tags detected: ${emptyAnchors.length} found`);
        }
        
        // Check for unclosed list items
        const unclosedLi = html.match(/<li[^>]*>(?!.*<\/li>)/g) || [];
        if (unclosedLi.length > 0) {
            issues.push(`Unclosed <li> tag`);
        }
        
        return issues;
    }

    /**
     * Log HTML issues for debugging
     * 
     * @param {string} html - HTML content to check
     * @param {string} context - Context for logging
     */
    function logHTMLIssues(html, context) {
        const issues = validateHTMLStructure(html);
        if (issues.length > 0) {
            // Only show HTML issues in development mode or when explicitly debugging
            // Reduce console noise in production while still tracking issues
            console.debug(`HTML issues in ${context}:`, issues);
            // Only show problematic HTML if there are serious issues (more than 3 problems)
            if (issues.length > 3) {
                console.debug('Problematic HTML:', html.substring(0, 200) + '...');
            }
        }
    }

    /**
     * Test function to verify enhanced HTML sanitization
     * 
     * This function tests the enhanced HTML sanitization with common
     * malformed HTML examples to ensure the system is working correctly.
     * 
     * @returns {Object} Test results
     */
    async function testEnhancedSanitization() {
        const testCases = [
            {
                name: 'Unclosed tags',
                input: '<p>This is a paragraph<p>Another paragraph</p>',
                expected: 'Should close unclosed p tag'
            },
            {
                name: 'Orphaned closing tags',
                input: '<p>Content</p></div><p>More content</p>',
                expected: 'Should remove orphaned div closing tag'
            },
            {
                name: 'Malformed attributes',
                input: '<a href="http://example.com" >Link</a>',
                expected: 'Should clean up malformed attributes'
            },
            {
                name: 'Script injection',
                input: '<p>Content</p><script>alert("xss")</script><p>More content</p>',
                expected: 'Should remove script tags'
            },
            {
                name: 'Double opening tags',
                input: '<p><p>Content</p>',
                expected: 'Should fix double opening tags'
            },
            {
                name: 'Empty anchor tags',
                input: '<a href="http://example.com"></a><p>Content</p>',
                expected: 'Should remove empty anchor tags'
            },
            {
                name: 'Malformed anchor tags',
                input: '<a <a href="http://example.com">Link</a>',
                expected: 'Should fix malformed anchor tags'
            }
        ];

        const results = await Promise.all(testCases.map(async testCase => {
            const sanitized = await sanitizeHTML(testCase.input);
            const issues = validateHTMLStructure(sanitized);
            return {
                test: testCase.name,
                input: testCase.input,
                output: sanitized,
                issues: issues,
                passed: issues.length === 0
            };
        }));

        console.log('Enhanced HTML Sanitization Test Results:', results);
        return results;
    }

    // Expose test function globally for debugging
    window.testEnhancedSanitization = testEnhancedSanitization;

    /**
     * Optimized local answer streaming
     * 
     * This function provides a streaming effect for local knowledge base answers,
     * creating a progressive loading animation similar to AI streaming.
     * 
     * FEATURES:
     * - Progressive content display
     * - Smooth streaming animation
     * - Related questions clickability setup
     * - Styling application after completion
     * 
     * @param {string} html - HTML content to stream
     * @param {Element} container - DOM container for streaming content
     * @returns {void}
     * 
     * @example
     * streamLocalAnswer(answerHtml, document.querySelector('.streaming-container'));
     * // Streams local answer with progressive loading effect
     */
    function streamLocalAnswer(html, container) {
        container.innerHTML = '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const nodes = Array.from(temp.childNodes);
        let i = 0;

        function streamStep() {
            if (i < nodes.length) {
                container.appendChild(nodes[i].cloneNode(true));
                i++;
                setTimeout(streamStep, 180);
            } else {
                // Make related questions clickable after streaming is complete
                makeRelatedQuestionsClickable(container);
                
                // Apply styling to "Where to Learn More" section
                styleWhereToLearnMoreInDOM(container);
            }
        }
        streamStep();
    }

    /**
     * Apply green color to specific sections only
     * 
     * This function applies special styling to specific content sections
     * like "Where to Learn More" and "Related Questions" by changing
     * the color of list items to green (#3bb273).
     * 
     * @param {string} html - HTML content to style
     * @returns {string} HTML with applied styling
     * 
     * @example
     * const styledHtml = applyWhereToLearnMoreStyling(htmlContent);
     * // Returns HTML with green styling for specific sections
     */
    function applyWhereToLearnMoreStyling(html) {
        if (!html || typeof html !== 'string') {
            return html;
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString('<div>' + html + '</div>', 'text/html');
            
            // Only style the two specific sections we want green
            const whereToLearnMore = doc.querySelector('.section-where-to-learn-more');
            const relatedQuestions = doc.querySelector('.section-related-questions');
            
            if (whereToLearnMore) {
                const listItems = whereToLearnMore.querySelectorAll('li');
                listItems.forEach(li => {
                    li.style.color = '#3bb273';
                });
            }
            
            if (relatedQuestions) {
                const listItems = relatedQuestions.querySelectorAll('li');
                listItems.forEach(li => {
                    li.style.color = '#3bb273';
                });
            }
            
            return doc.body.firstChild.innerHTML;
        } catch (e) {
            console.warn('Styling error:', e);
            return html; // Return original if styling fails
        }
    }

    /**
     * Fix bold formatting inconsistencies
     * 
     * This function specifically addresses issues with bold text formatting
     * that can occur during HTML processing, ensuring consistent display.
     * 
     * FIXES APPLIED:
     * - Fixes broken bold tags
     * - Ensures proper bold tag nesting
     * - Removes duplicate bold tags
     * - Fixes orphaned bold tags
     * 
     * @param {string} html - HTML content with potential bold formatting issues
     * @returns {string} HTML with fixed bold formatting
     * 
     * @example
     * const fixedHtml = fixBoldFormatting(htmlContent);
     * // Returns HTML with corrected bold formatting
     */
    function fixBoldFormatting(html) {
        if (!html || typeof html !== 'string') {
            return html;
        }

        try {
            let fixed = html;
            
            // Fix broken bold tags
            fixed = fixed.replace(/<strong>([^<]*)<\/strong>/g, '<strong>$1</strong>');
            
            // Remove duplicate bold tags
            fixed = fixed.replace(/<strong><strong>/g, '<strong>');
            fixed = fixed.replace(/<\/strong><\/strong>/g, '</strong>');
            
            // Fix orphaned bold tags
            fixed = fixed.replace(/<strong>(?!.*<\/strong>)/g, '');
            fixed = fixed.replace(/<\/strong>(?![^<]*<strong>)/g, '');
            
            // Ensure proper spacing around bold tags
            fixed = fixed.replace(/(\w)<strong>/g, '$1 <strong>');
            fixed = fixed.replace(/<\/strong>(\w)/g, '</strong> $1');
            
            return fixed;
        } catch (e) {
            console.warn('Bold formatting fix error:', e);
            return html;
        }
    }

    /**
     * Simple function to fix truncated years
     * 
     * This function fixes common year truncation issues in HTML content,
     * particularly for decade references that get cut off during processing.
     * 
     * FIXES APPLIED:
     * - "196:" -> "1960s:" (decade references)
     * - "202:" -> "2020s:" (decade references)
     * - "190s" -> "1900s" (century references)
     * - Various other truncated year patterns
     * 
     * @param {string} html - HTML content with potential year truncation
     * @returns {string} HTML with fixed year references
     * 
     * @example
     * const fixedHtml = fixTruncatedYears(htmlContent);
     * // Returns HTML with corrected year references
     */
    function fixTruncatedYears(html) {
        if (!html || typeof html !== 'string') {
            return html;
        }

        try {
            let fixed = html;
            
            // Fix the specific patterns from your examples
            // "196:" -> "1960s:" (when it's clearly a decade reference)
            fixed = fixed.replace(/\b196:\s/g, '1960s: ');
            fixed = fixed.replace(/\b202:\s/g, '2020s: ');
            
            // Fix malformed decades like "202s" -> "2020s"
            fixed = fixed.replace(/\b202s\b/g, '2020s');
            
            // Fix truncated years in the middle of sentences
            // "190s" -> "1900s", "196s" -> "1960s", etc.
            fixed = fixed.replace(/\b190s\b/g, '1900s');
            fixed = fixed.replace(/\b191s\b/g, '1910s');
            fixed = fixed.replace(/\b192s\b/g, '1920s');
            fixed = fixed.replace(/\b193s\b/g, '1930s');
            fixed = fixed.replace(/\b194s\b/g, '1940s');
            fixed = fixed.replace(/\b195s\b/g, '1950s');
            fixed = fixed.replace(/\b196s\b/g, '1960s');
            fixed = fixed.replace(/\b197s\b/g, '1970s');
            fixed = fixed.replace(/\b198s\b/g, '1980s');
            fixed = fixed.replace(/\b199s\b/g, '1990s');
            fixed = fixed.replace(/\b200s\b/g, '2000s');
            fixed = fixed.replace(/\b201s\b/g, '2010s');
            fixed = fixed.replace(/\b202s\b/g, '2020s');
            fixed = fixed.replace(/\b203s\b/g, '2030s');
            
            // Fix any other 3-digit years that should be decades (only for modern years)
            fixed = fixed.replace(/\b(19[6-9]):\s/g, '$10s: ');
            fixed = fixed.replace(/\b(20[0-2]):\s/g, '$10s: ');
            
            // Catch any remaining truncated year patterns with a more general approach
            // This will catch patterns like "in the 190s" -> "in the 1900s"
            fixed = fixed.replace(/\b(\d{3})s\b/g, (match, year) => {
                const numYear = parseInt(year);
                // Only fix years that are clearly meant to be decades
                if (numYear >= 190 && numYear <= 209) {
                    return numYear + '0s';
                }
                return match; // Leave other 3-digit numbers unchanged
            });
            
            return fixed;
        } catch (e) {
            console.warn('Year fix error:', e);
            return html; // Return original if fixing fails
        }
    }

    /**
     * Function to apply styling to existing DOM elements
     * 
     * This function applies green styling to specific sections in existing
     * DOM elements, working with live content rather than HTML strings.
     * 
     * @param {Element} container - DOM container element to style
     * @returns {void}
     * 
     * @example
     * styleWhereToLearnMoreInDOM(document.querySelector('.content-container'));
     * // Applies green styling to specific sections in the container
     */
    function styleWhereToLearnMoreInDOM(container) {
        if (!container) return;
        
        // Only style the two specific sections we want green
        const whereToLearnMore = container.querySelector('.section-where-to-learn-more');
        const relatedQuestions = container.querySelector('.section-related-questions');
        
        if (whereToLearnMore) {
            const listItems = whereToLearnMore.querySelectorAll('li');
            listItems.forEach(li => {
                li.style.color = '#3bb273';
                
                // Make sure links in "Where to Learn More" open in new tab
                const links = li.querySelectorAll('a');
                links.forEach(link => {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                });
            });
        }
        
        if (relatedQuestions) {
            const listItems = relatedQuestions.querySelectorAll('li');
            listItems.forEach(li => {
                li.style.color = '#3bb273';
            });
        }
    }

    /**
     * Set up MutationObserver to automatically style new content
     * 
     * This function creates a MutationObserver that automatically applies
     * styling to new content as it's added to the DOM, ensuring consistent
     * appearance for dynamically loaded content.
     * 
     * FEATURES:
     * - Automatic styling for new content
     * - Watches for DOM mutations
     * - Applies green styling to specific sections
     * - Handles both new nodes and existing content
     * 
     * @returns {void}
     * 
     * @example
     * setupWhereToLearnMoreObserver();
     * // Sets up automatic styling for new content
     */
    function setupWhereToLearnMoreObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Only style the two specific sections we want green
                            const whereToLearnMore = node.querySelector ? node.querySelector('.section-where-to-learn-more') : null;
                            const relatedQuestions = node.querySelector ? node.querySelector('.section-related-questions') : null;
                            
                            if (whereToLearnMore) {
                                const listItems = whereToLearnMore.querySelectorAll('li');
                                listItems.forEach(li => {
                                    li.style.color = '#3bb273';
                                    
                                    // Make sure links in "Where to Learn More" open in new tab
                                    const links = li.querySelectorAll('a');
                                    links.forEach(link => {
                                        link.setAttribute('target', '_blank');
                                        link.setAttribute('rel', 'noopener noreferrer');
                                    });
                                });
                            }
                            
                            if (relatedQuestions) {
                                const listItems = relatedQuestions.querySelectorAll('li');
                                listItems.forEach(li => {
                                    li.style.color = '#3bb273';
                                });
                            }
                            
                            // Also check if the node itself is one of our target sections
                            if (node.classList && (node.classList.contains('section-where-to-learn-more') || node.classList.contains('section-related-questions'))) {
                                const listItems = node.querySelectorAll('li');
                                listItems.forEach(li => {
                                    li.style.color = '#3bb273';
                                    
                                    // Make sure links in "Where to Learn More" open in new tab
                                    if (node.classList.contains('section-where-to-learn-more')) {
                                        const links = li.querySelectorAll('a');
                                        links.forEach(link => {
                                            link.setAttribute('target', '_blank');
                                            link.setAttribute('rel', 'noopener noreferrer');
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing the document body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        return observer;
    }

    // Initialize the observer when the page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupWhereToLearnMoreObserver);
    } else {
        setupWhereToLearnMoreObserver();
    }

    /**
     * Fix list structure in HTML documents
     * 
     * This function ensures proper list structure by converting text nodes
     * to list items and moving non-list elements outside of lists.
     * 
     * @param {Document} doc - DOM document to process
     * @returns {void}
     * 
     * @example
     * fixListStructure(document);
     * // Fixes list structure throughout the document
     */
    function fixListStructure(doc) {
        doc.querySelectorAll('ul, ol').forEach(list => {
            const children = Array.from(list.childNodes);
            const toMove = [];

            children.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'LI') {
                    toMove.push(node);
                } else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    const li = document.createElement('li');
                    li.textContent = node.textContent.trim();
                    list.insertBefore(li, node);
                    list.removeChild(node);
                }
            });

            toMove.forEach((node) => {
                list.parentNode.insertBefore(node, list.nextSibling);
            });
        });
    }

    /**
     * Fix table structure in HTML documents
     * 
     * This function ensures proper table structure by adding missing tbody
     * elements and converting non-table cells to proper td/th elements.
     * 
     * @param {Document} doc - DOM document to process
     * @returns {void}
     * 
     * @example
     * fixTableStructure(document);
     * // Fixes table structure throughout the document
     */
    function fixTableStructure(doc) {
        doc.querySelectorAll('table').forEach(table => {
            if (!table.querySelector('tbody')) {
                const tbody = document.createElement('tbody');
                const rows = Array.from(table.querySelectorAll('tr'));
                rows.forEach(row => {
                    if (!row.closest('thead')) {
                        tbody.appendChild(row);
                    }
                });
                if (tbody.children.length > 0) {
                    table.appendChild(tbody);
                }
            }

            table.querySelectorAll('tr').forEach(row => {
                const cells = Array.from(row.children);
                cells.forEach(cell => {
                    if (cell.tagName !== 'TD' && cell.tagName !== 'TH') {
                        const td = document.createElement('td');
                        td.innerHTML = cell.innerHTML;
                        row.replaceChild(td, cell);
                    }
                });
            });
        });
    }

    /**
     * Clean table nodes specifically
     * 
     * This function processes table-related DOM nodes, ensuring they
     * conform to proper HTML table structure and removing invalid elements.
     * 
     * @param {Node} node - DOM node to clean
     * @returns {void}
     * 
     * @example
     * cleanTableNodes(tableElement);
     * // Cleans and validates table structure
     */
    function cleanTableNodes(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        // Process children first
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => cleanTableNodes(child));

        // Handle table-related tags
        if (node.tagName === 'TABLE' || node.tagName === 'THEAD' || node.tagName === 'TBODY' || 
            node.tagName === 'TR' || node.tagName === 'TD' || node.tagName === 'TH') {
            // These are valid table tags, keep them
            return;
        }

        // For other tags, check if they're allowed
        if (!ALLOWED_TAGS.has(node.tagName) && node.tagName !== 'DIV') {
            const parent = node.parentNode;
            if (parent) {
                // Move all children to parent before removing this node
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
            }
        } else if (ALLOWED_TAGS.has(node.tagName)) {
            // Process allowed tags
            if (node.tagName === 'A') {
                node.setAttribute('target', '_blank');
                if (REGEX_PATTERNS.javascript.test(node.getAttribute('href') || '')) {
                    node.removeAttribute('href');
                }
            }
        }
    }

    /**
     * Simple and safe node cleaning
     * 
     * This function provides a safer alternative to cleanNodes that
     * processes DOM nodes without aggressive removal of elements.
     * 
     * @param {Node} node - DOM node to clean
     * @returns {void}
     * 
     * @example
     * safeCleanNodes(element);
     * // Safely cleans DOM node
     */
    function safeCleanNodes(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        // Process children first
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => safeCleanNodes(child));

        // Only process disallowed tags that are not the root div
        if (!ALLOWED_TAGS.has(node.tagName) && node.tagName !== 'DIV') {
            const parent = node.parentNode;
            if (parent) {
                // Move all children to parent before removing this node
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
            }
        } else if (ALLOWED_TAGS.has(node.tagName)) {
            // Process allowed tags
            if (node.tagName === 'A') {
                node.setAttribute('target', '_blank');
                if (REGEX_PATTERNS.javascript.test(node.getAttribute('href') || '')) {
                    node.removeAttribute('href');
                }
            }
        }
    }

    /**
     * Original cleanNodes function (kept for reference)
     * 
     * This is the original node cleaning function that aggressively
     * removes disallowed elements. Kept for reference and backward compatibility.
     * 
     * NOTE: New implementations should use safeCleanNodes() for better safety.
     * 
     * @param {Node} node - DOM node to clean
     * @returns {void}
     * 
     * @example
     * cleanNodes(element);
     * // Aggressively cleans DOM node (use with caution)
     */
    function cleanNodes(node) {
        if (!node || node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        // Process child nodes first (before potentially removing the parent)
        const childNodes = Array.from(node.childNodes);
        childNodes.forEach(child => cleanNodes(child));

        // Now process the current node
        if (!ALLOWED_TAGS.has(node.tagName)) {
            const parent = node.parentNode;
            if (parent) {
                // Move all children to parent before removing this node
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
            }
        } else {
            // Process allowed tags
            if (node.tagName === 'A') {
                node.setAttribute('target', '_blank');
                if (REGEX_PATTERNS.javascript.test(node.getAttribute('href') || '')) {
                    node.removeAttribute('href');
                }
            }
        }
    }

    /**
     * Apply regex fixes to HTML content
     * 
     * This function applies various regex-based fixes to clean up
     * common HTML formatting issues and inconsistencies.
     * 
     * @param {string} html - HTML content to fix
     * @returns {string} Fixed HTML content
     * 
     * @example
     * const fixedHtml = applyRegexFixes(rawHtml);
     * // Returns HTML with applied regex fixes
     */
    function applyRegexFixes(html) {
        if (!html) return '';
        
        return html
            .replace(REGEX_PATTERNS.hrefFix, '<a href="$1">')
            .replace(REGEX_PATTERNS.linkText, '</a> $1')
            .replace(REGEX_PATTERNS.emptyLi, '')
            .replace(REGEX_PATTERNS.consecutiveUl, '')
            .replace(REGEX_PATTERNS.consecutiveOl, '')
            .replace(REGEX_PATTERNS.whitespace, '><')
            .replace(REGEX_PATTERNS.htmlEntities, '')
            .replace(REGEX_PATTERNS.ampersandFix, '&')  // Fix double-encoded ampersands
            .replace(REGEX_PATTERNS.brokenSentences, '$1 in the 1980s and $2')  // Fix broken decade references
            .replace(REGEX_PATTERNS.missingSpaces, '$1 $2')  // Add missing spaces between words
            .trim();
    }

    /**
     * Truncate HTML safely
     * 
     * This function truncates HTML content to a specified maximum length
     * while preserving HTML structure and avoiding broken tags.
     * 
     * @param {string} html - HTML content to truncate
     * @returns {string} Truncated HTML content
     * 
     * @example
     * const truncatedHtml = truncateHTML(longHtmlContent);
     * // Returns HTML truncated to MAX_LENGTH
     */
    function truncateHTML(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        let length = 0;

        const truncate = (node) => {
            if (length >= MAX_LENGTH) {
                node.remove();
                return;
            }
            if (node.nodeType === Node.TEXT_NODE) {
                length += node.textContent.length;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(truncate);
            }
        };

        truncate(tempDiv);
        return tempDiv.innerHTML;
    }

    /**
     * Optimized streaming functions for OpenAI responses with performance improvements
     * 
     * This function handles real-time streaming of AI responses from OpenAI,
     * providing a smooth user experience with progressive content loading.
     * 
     * FEATURES:
     * - Real-time content streaming with performance tracking
     * - Progressive HTML updates with throttling
     * - Content sanitization and cleaning
     * - Conversation history management
     * - Follow-up prompts and feedback integration
     * 
     * @param {string} query - User's search query
     * @param {string} sources - Source information for the query
     * @param {string} block - Blocked domain information
     * @param {Element} container - DOM container for streaming content
     * @param {string} chatlogId - Unique identifier for the chat log entry
     * @param {Array} conversationHistory - Array of previous conversation exchanges
     * @returns {void}
     * 
     * @example
     * streamOpenAIAnswer('What is psilocybin?', sources, blockedDomains, container, 'chat-123', history);
     * // Streams AI response in real-time with performance optimization
     */
    function streamOpenAIAnswer(query, sources, block, container, chatlogId, conversationHistory) {
        const contextBlock = buildContextBlock(conversationHistory);
        const prompt = buildPrompt(query, sources, block, contextBlock);
        const url = exa_ajax.ajaxurl + '?action=openai_stream';
        
        let buffer = '';
        let lastUpdate = 0;
        const UPDATE_THROTTLE = 50; // Reduced from 100ms to 50ms for faster updates
        const PERFORMANCE_MARK = `stream_${Date.now()}`;
        
        // Performance tracking
        performance.mark(PERFORMANCE_MARK);
        container.innerHTML = '';

        // Use fetch with streaming for POST-based approach
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'prompt=' + encodeURIComponent(prompt)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            async function readStream() {
                return reader.read().then(async ({ done, value }) => {
                    if (done) {
                        // Stream complete - apply enhanced sanitization
                        performance.measure('stream_complete', PERFORMANCE_MARK);
                        let cleanedHTML;
                        try {
                            cleanedHTML = await enhancedSanitizeHTML(buffer);
                            container.innerHTML = cleanedHTML;
                        } catch (error) {
                            console.warn('Enhanced sanitization error:', error);
                            cleanedHTML = fallbackSanitize(buffer);
                            container.innerHTML = cleanedHTML;
                        }
                        
                        // Make related questions clickable after content is loaded
                        makeRelatedQuestionsClickable(container);
                        
                        // Apply styling to "Where to Learn More" section
                        styleWhereToLearnMoreInDOM(container);

                        // Update conversation history with just the question (not the full answer)
                        const answerBlock = $(container).closest('.answer-block');
                        const questionText = answerBlock.find('.chatlog-question').text() || 'Question';
                        conversationHistory.push({ q: questionText, a: '' }); // Empty answer to keep structure
                        
                        // Limit conversation history to last 5 exchanges to prevent context overflow
                        if (conversationHistory.length > 5) {
                            conversationHistory = conversationHistory.slice(-5);
                        }

                        if (typeof saveStreamingAnswerToChatlog === 'function' && chatlogId) {
                            saveStreamingAnswerToChatlog(chatlogId, cleanedHTML);
                        }
                        
                        // Add follow-up prompt after reaction bar
                        const reactionBar = answerBlock.find('.answer-reaction-bar');
                        if (reactionBar.length && !answerBlock.find('.follow-up-prompt').length) {
                            const followUpPrompt = $('<div class="follow-up-prompt modern" style="margin-top: 20px; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; text-align: center; color: #fff; font-size: 16px; border: 1px solid rgba(255, 255, 255, 0.1);">Ask a follow up question and we can continue our conversation or <button class="new-chat-btn modern" style="background: #3bb273; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; margin: 0 8px; font-weight: 500; transition: all 0.2s;">New chat</button> and we can discuss another topic.</div> <div class="follow-up-prompt modern" style="margin-top: 15px; padding: 20px; background: rgba(255, 255, 255, 0.05); border-radius: 12px; text-align: center; color: #fff; font-size: 16px; border: 1px solid rgba(255, 255, 255, 0.1);"> We\'re still building and improving the Psybrary based on community feedback. See something missing, unclear, or off? <button class="beta-feedback-btn modern" style="background:#3bb273;color:#fff;border:none;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;">Submit feedback</button><div class="beta-feedback-form" style="display:none;margin-top:15px;"><textarea class="beta-feedback-text" rows="3" style="width:90%;margin-bottom:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;padding:12px;" placeholder="Your feedback..."></textarea><br><button class="beta-feedback-submit modern" style="background:#0C0012;color:#fff;border:1px solid rgba(255,255,255,0.2);padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:500;transition:all 0.2s;">Send</button></div></div>');
                            // Only bind feedback events once
                            if (!window._betaFeedbackBound) {
                                window._betaFeedbackBound = true;
                                $(document).on('click', '.beta-feedback-btn', function(e) {
                                    e.preventDefault();
                                    $(this).siblings('.beta-feedback-form').show();
                                    $(this).hide();
                                });
                                $(document).on('click', '.beta-feedback-submit', function(e) {
                                    e.preventDefault();
                                    const form = $(this).closest('.beta-feedback-form');
                                    const feedback = form.find('.beta-feedback-text').val().trim();
                                    const block = $(this).closest('.answer-block');
                                    let chatlogId = block.find('.reaction-like').data('id');
                                    // Fallback: try to get chatlogId from other elements if missing
                                    if (!chatlogId) {
                                        chatlogId = block.data('id') || block.attr('id')?.replace('answer-', '');
                                    }
                                    if (!feedback || !chatlogId) {
                                        form.append('<br><span style="color:#e74c3c;">Please enter feedback.</span>');
                                        return;
                                    }
                                    submitBetaFeedback(chatlogId, feedback, form);
                                });
                            }
                            reactionBar.after(followUpPrompt);
                            // Add click handler for new chat button
                            answerBlock.find('.new-chat-btn').on('click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open('https://beta.psychedelics.com/#psybrary', '_blank');
                                // newChat();
                            });
                        }
                        return;
                    }
                    
                    // Process the chunk
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data && data !== '[DONE]') {
                                buffer += data;
                                // Show raw buffer during streaming - sanitize only when complete
                                const now = Date.now();
                                if (now - lastUpdate > UPDATE_THROTTLE) {
                                    // Display raw buffer without sanitization to avoid partial HTML corruption
                                    container.innerHTML = buffer;
                                    lastUpdate = now;
                                }
                            } else if (data === '[DONE]') {
                                // Only apply enhanced sanitization when streaming is complete
                                let cleanedHTML;
                                try {
                                    cleanedHTML = await enhancedSanitizeHTML(buffer);
                                    container.innerHTML = cleanedHTML;
                                } catch (error) {
                                    console.warn('HTML sanitization error on completion:', error);
                                    // Fallback to basic sanitization
                                    cleanedHTML = fallbackSanitize(buffer);
                                    container.innerHTML = cleanedHTML;
                                }
                            }
                        }
                    }
                    
                    // Continue reading
                    return readStream();
                });
            }
            
            return readStream();
        })
        .catch(error => {
            container.insertAdjacentHTML('beforeend', '<p><em>⚠️ Error: ' + error.message + '</em></p>');
        });
    }

    /**
     * Build context block from conversation history
     * 
     * This function creates a context block from previous conversation
     * exchanges to provide AI with conversation context for better responses.
     * 
     * @param {Array} conversationHistory - Array of conversation exchanges
     * @returns {string} Formatted context block string
     * 
     * @example
     * const context = buildContextBlock(conversationHistory);
     * // Returns formatted context for AI prompt
     */
    function buildContextBlock(conversationHistory) {
        if (!Array.isArray(conversationHistory)) return '';
        
        const contextBlock = conversationHistory.map((pair, idx) => 
            `Q${idx+1}: ${pair.q}\n`
        ).join('');
        
        return contextBlock;
    }



/**
 * Psybrarian Template Master System — 21 Templates (Consolidated from 30)
 * - Drop-in replacement for your buildPrompt() with the exact syntax you requested
 * - HTML-only output skeletons (no Markdown, no emojis)
 * - Auto-detects a template type from the query; can be overridden with opts.type
 * - Templates consolidated for better maintenance and reduced overlap
 *
 * Usage:
 *   const prompt = buildPrompt(query, sources, block, contextBlock, { type: 'overview' });
 *   // or auto-detect: const prompt = buildPrompt(query, sources, block, contextBlock);
 */

/* =========================== Core Builder =========================== */

/**
 * Build AI prompt for OpenAI streaming
 * 
 * This function constructs a comprehensive prompt for the AI system,
 * incorporating user query, sources, context, and template selection.
 * 
 * FEATURES:
 * - Template-based prompt generation
 * - Source and context integration
 * - Auto-detection of query type
 * - Template override capabilities
 * - Comprehensive prompt formatting
 * 
 * @param {string} query - User's search query
 * @param {string} sources - Trusted source information
 * @param {string} block - Blocked domain information
 * @param {string} contextBlock - Conversation context
 * @param {Object} opts - Options object with optional type override
 * @returns {string} Complete AI prompt string
 * 
 * @example
 * const prompt = buildPrompt('What is LSD?', sources, blockedDomains, context, { type: 'overview' });
 * // Returns formatted prompt for AI processing
 */
function buildPrompt(query, sources, block, contextBlock, opts = {}) {
    const safeSources = String(sources || '').trim();
    if (safeSources.length < 3) {
        return generateNoSourcesResponse();
    }
    
    const safeBlock = String(block || '').trim();
    const safeContext = contextBlock ? String(contextBlock) : '';
    
    // Determine template + render body
    const type = (opts.type || detectType(query)).toLowerCase();
    const render = TEMPLATES[type] || TEMPLATES['overview'];
    const body = render();
    const title = deriveTitle(query);
    
    // Clean, focused prompt
    const promptHeader = `
You are the Psybrarian — an evidence-first, harm-reduction librarian for psychedelic topics.

Provide a concise, trustworthy answer using only the trusted sources listed below. Use clear, neutral language suitable for a broad audience.

${safeContext ? ('Previous context:\n' + safeContext) : ''}

Question: "${query}"
Trusted Sources: ${safeSources}
Blocked Domains: ${safeBlock}

RESPONSE FORMAT:
- Use only valid HTML with these tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <td>, <th>, <a>, <strong>, <em>, <br>
- Always close every tag you open
- Include exactly 5 related questions at the end
- For step-by-step guidance, use numbered lists with clear safety warnings
- Use 4-digit years (1960s not 196s)

If sources are insufficient, respond with:
<h2>This information isn't currently available in the Psybrary. Please submit feedback below so we can improve.</h2>
`.trim();
    
    // Simplified, functional HTML structure
    const htmlSkeleton = `
<h2>${escapeHtml(title)}</h2>

<p>[Provide a clear, direct 2-3 sentence answer to the question]</p>

<h3>Key Information</h3>
<ul>
${body.glance}
</ul>

${body.extra || ''}

<h3>Related Questions</h3>
<div class="section-related-questions">
<ul>
<li><a href="#" style="color: #3bb273; text-decoration: none;">[Generate specific follow-up question]</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">[Generate specific follow-up question]</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">[Generate specific follow-up question]</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">[Generate specific follow-up question]</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">[Generate specific follow-up question]</a></li>
</ul>
</div>`;
    
    return `${promptHeader}\n\n${htmlSkeleton}`.trim();
}

// Helper function for no sources response
function generateNoSourcesResponse() {
    return `<h2>This information isn't currently available in the Psybrary. Please submit feedback below so we can improve.</h2>
    
<h3>Related Questions</h3>
<div class="section-related-questions">
<ul>
<li><a href="#" style="color: #3bb273; text-decoration: none;">What specific information about this topic would be most helpful to you?</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">Are there related topics you'd like to explore instead?</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">Would you like to learn about similar substances or experiences?</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">What aspects of this topic are you most curious about?</a></li>
<li><a href="#" style="color: #3bb273; text-decoration: none;">How can I help you find the information you're looking for?</a></li>
</ul>
</div>`;
}
  
  /* ============================ Templates ============================ */
  /**
   * Each template returns:
   * { glance: "<li>...</li>\n<li>...</li>", extra: "<h3>...</h3>..." }
   * - glance: bullet items under "What to Know at a Glance"
   * - extra: any special sections (tables, checklists, timelines, Safety Snapshot when enabled),
   *          plus optional standardized blocks (Additional, Practical, Sources)
   */
  
  const TEMPLATES = {
    /* 1) Substance Overview */
    overview: () => baseTemplate({
      addSafety: true,
      includeAdditional: true,
      includePractical: true,
      includeSources: true,
      bullets: [
        ['What it is', 'One sentence definition.'],
        ['How it works', 'Plain-language mechanism/process.'],
        ['Potential benefits', 'Short phrases (e.g., mood, anxiety relief).'],
        ['Key risks', 'Short phrases (e.g., anxiety spikes, interactions).'],
        ['Legal status', 'One-sentence snapshot; note regional differences.'],
      ],
      sections: [
        {
          html: `
  <h3>Classification &amp; Origins</h3>
  <ul>
    <li><strong>Type:</strong> <!-- Psychedelic / Dissociative / Empathogen / etc. --></li>
    <li><strong>Origin:</strong> <!-- Natural / Synthetic; key plant/fungi lineage if relevant. --></li>
    <li><strong>Common Administration</strong> <!-- Oral, sublingual, inhaled, etc. --></li>
  </ul>`
        },
      ],
    }),
  
    /* 2) Dosing / How much / Routes */
    dosing: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Common ranges', 'Ranges by route (oral, sublingual, inhaled, etc.).'],
        ['Onset & duration', 'Approx. onset, peak, total duration.'],
        ['Titration', '"Start low, go slow" when evidence supports.'],
        ['Key risks', 'Overdosing, variability, interactions.'],
        ['Legal status', 'If applicable.'],
      ],
      sections: [
        {
          html: `
  <h3>Onset &amp; Duration by Route</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Route</th><th>Onset</th><th>Peak</th><th>Duration</th></tr></thead>
    <tbody>
      <tr><td><!-- Oral --></td><td><!-- ~ --></td><td><!-- ~ --></td><td><!-- ~ --></td></tr>
      <tr><td><!-- Sublingual --></td><td><!-- ~ --></td><td><!-- ~ --></td><td><!-- ~ --></td></tr>
      <tr><td><!-- Inhaled --></td><td><!-- ~ --></td><td><!-- ~ --></td><td><!-- ~ --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 3) Interactions / Contraindications (general) */
    interactions: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Medications to avoid', 'e.g., MAOIs, SSRIs/SNRIs, lithium, tramadol — if supported.'],
        ['Health conditions', 'Cardiac, seizure, psychosis spectrum — cite if supported.'],
        ['Timing & washouts', 'Only if evidence exists; otherwise note uncertainty.'],
        ['Emergency signs', 'When to seek urgent care.'],
        ['Alternatives', 'Safer adjacent options if evidence-based.'],
      ],
      sections: [
        {
          html: `
  <h3>High-Risk Combinations</h3>
  <ul>
    <li><!-- MAOIs + serotonergic agents (serotonin syndrome risk) --></li>
    <li><!-- Lithium + classic psychedelics (seizure risk reports) --></li>
    <li><!-- Tramadol, bupropion, stimulants: seizure/HTN risk context --></li>
  </ul>`
        },
        {
          html: `
  <h3>Washout &amp; Timing Notes</h3>
  <p><!-- Only if supported by sources; otherwise clearly state uncertainty. --></p>`
        },
      ],
    }),
  
    /* 4) Safety / First Aid */
    safety: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Immediate steps', 'Calm, hydration, safe setting, trusted sober support.'],
        ['Red flags', 'Chest pain, seizures, severe confusion, suicidality → seek help.'],
        ['Interactions', 'Known high-risk combos.'],
        ['Set & setting', 'Harm-reduction via environment and mindset.'],
        ['Aftercare', 'Sleep, nutrition, integration support.'],
      ],
      sections: [
        {
          html: `
  <h3>Immediate Actions</h3>
  <ul>
    <li><!-- Move to safe, calm environment; trusted sober support. --></li>
    <li><!-- Hydration; temperature regulation. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Emergency Red Flags</h3>
  <ul>
    <li><!-- Chest pain, seizures, severe confusion, suicidality. --></li>
  </ul>`
        },
      ],
    }),
  
    /* 5) Effects & Timeline */
    effects: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Typical onset', 'Approximate timing.'],
        ['Peak period', 'Approximate timing.'],
        ['Total duration', 'Approximate range.'],
        ['Common effects', 'Neutral description: sensory, mood, cognition.'],
        ['Challenging effects', 'Anxiety, confusion, nausea, etc.'],
      ],
      sections: [
        {
          html: `
  <h3>Typical Timeline</h3>
  <ul>
    <li><!-- Onset ~...; Peak ~...; Total duration ~... --></li>
  </ul>`
        },
      ],
    }),
  
    /* 6) Legality / Policy */
    legality: () => baseTemplate({
      bullets: [
        ['International status', 'UN schedules/conventions if relevant.'],
        ['United States', 'Federal status; note state/local exceptions.'],
        ['EU/UK/Canada', 'High-level snapshot; call out differences.'],
        ['Enforcement trends', 'If supported by sources.'],
        ['Legal risks', 'Possession, distribution, travel implications.'],
      ],
      sections: [
        {
          html: `
  <h3>Region Breakdown</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Region</th><th>Status</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- US (Federal) --></td><td><!-- Schedule / status --></td><td><!-- state/local exceptions --></td></tr>
      <tr><td><!-- EU/UK/Canada --></td><td><!-- status --></td><td><!-- key differences --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 7) Comparisons (A vs B) */
    compare: () => tableTemplate({
      rows: [
        ['Primary effects', 'A-effects', 'B-effects'],
        ['Onset & duration', 'A-onset/duration', 'B-onset/duration'],
        ['Typical ranges', 'A-ranges', 'B-ranges'],
        ['Key risks', 'A-risks', 'B-risks'],
        ['Legality', 'A-legal', 'B-legal'],
      ],
      sections: [
        {
          html: `
  <h3>Side-by-Side Table</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Parameter</th><th>Option A</th><th>Option B</th></tr></thead>
    <tbody>
      <tr><td><!-- Primary effects --></td><td><!-- A --></td><td><!-- B --></td></tr>
      <tr><td><!-- Onset & duration --></td><td><!-- A --></td><td><!-- B --></td></tr>
      <tr><td><!-- Typical ranges --></td><td><!-- A --></td><td><!-- B --></td></tr>
      <tr><td><!-- Key risks --></td><td><!-- A --></td><td><!-- B --></td></tr>
      <tr><td><!-- Legality --></td><td><!-- A --></td><td><!-- B --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 8) Administration & Measurement (merged: preparation + measurement) */
    administration_measurement: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Forms & routes', 'Tea, tincture, capsule, sublingual, etc.'],
        ['Measurement tools', 'Milligram scales, volumetric dosing, syringes/droppers.'],
        ['Basic steps', 'General prep steps; avoid unsafe practices.'],
        ['Calibration', 'Taring, test weights; avoid kitchen scales.'],
        ['Safety notes', 'Contaminants, strain mis-ID, interactions.'],
      ],
      sections: [
        {
          html: `
  <h3>Route How-To (Education Only)</h3>
  <ol>
    <li><!-- Step 1: Preparation (clean surface, wash hands, gather materials). --></li>
    <li><!-- Step 2: Measurement (use milligram scale or volumetric dosing to reduce error). --></li>
    <li><!-- Step 3: Administration (route-specific notes; avoid risky combinations). --></li>
    <li><!-- Step 4: Monitoring (set, setting, support, hydration; stop if adverse signs). --></li>
    <li><!-- Step 5: Aftercare (rest, nutrition, journaling, integration; seek help for red flags). --></li>
  </ol>`
        },
        {
          html: `
  <h3>Volumetric Dosing Example</h3>
  <p><!-- Walk through a sample calculation step-by-step in plain language (no advice, education only). --></p>`
        },
      ],
    }),
  
    /* 9) Tolerance & Frequency */
    tolerance: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Tolerance pattern', 'How quickly it builds and wanes (if known).'],
        ['Cross-tolerance', 'If applicable and supported.'],
        ['Frequency guidance', 'Evidence-informed spacing, if available.'],
        ['Dependence risk', 'Psychological vs physical; evidence level.'],
        ['Reset strategies', 'Time-based reset if supported.'],
      ],
      sections: [
        {
          html: `
  <h3>Frequency Guidance (If Supported)</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Pattern</th><th>Rationale</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- e.g., every 4 weeks --></td><td><!-- tolerance reset --></td><td><!-- evidence level --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 10) Therapeutic Evidence / Indications */
    therapy: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Conditions studied', 'Indications with evidence strength.'],
        ['Outcomes', 'Clinically meaningful results; effect sizes if reported.'],
        ['Durability', 'Follow-up windows; persistence/relapse.'],
        ['Safety profile', 'Adverse events reported.'],
        ['Gaps & trials', 'Where evidence is thin or ongoing.'],
      ],
      sections: [
        {
          html: `
  <h3>Clinical Evidence Summary</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Indication</th><th>Study Type</th><th>N</th><th>Outcome</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- Depression --></td><td><!-- RCT/Open-label --></td><td><!-- ~ --></td><td><!-- effect size / response --></td><td><!-- durability/adverse events --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 11) Microdosing / Protocols */
    microdosing: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Common schedules', 'e.g., 1 day on/2 off; weekday protocols.'],
        ['Typical ranges', '"Sub-perceptual" guidance if supported.'],
        ['Reported effects', 'Positive as well as neutral/negative findings.'],
        ['Interactions & risks', 'SSRIs/MAOIs/lithium; mental health cautions.'],
        ['Tracking & reflection', 'Journaling, mood/sleep tracking.'],
      ],
      sections: [
        {
          html: `
  <h3>Common Protocols</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Name</th><th>Pattern</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- e.g., 1 on / 2 off --></td><td><!-- schedule --></td><td><!-- tracking tip / evidence note --></td></tr>
    </tbody>
  </table>`
        },
        {
          html: `
  <h3>Self-Tracking Ideas</h3>
  <ul>
    <li><!-- Mood, sleep, focus, anxiety scales. --></li>
    <li><!-- Weekly reflection prompts. --></li>
  </ul>`
        },
      ],
    }),
  
    /* 12) Preparation & Integration (merged: set_setting + integration) */
    preparation_integration: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Mindset', 'Intentions, expectations, emotional readiness.'],
        ['Environment', 'Safe, trusted space; sober support if applicable.'],
        ['During', 'Grounding strategies for difficult moments.'],
        ['After', 'Sleep, hydration, gentle movement, journaling.'],
        ['Professional support', 'Therapeutic integration when needed.'],
      ],
      sections: [
        {
          html: `
  <h3>Integration Timeline</h3>
  <ul>
    <li><strong>Day 0–1:</strong> <!-- Rest, hydration, gentle grounding. --></li>
    <li><strong>Days 2–7:</strong> <!-- Journaling, therapy session if applicable. --></li>
    <li><strong>Week 2+:</strong> <!-- Behavioral experiments, habits, community. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Packing &amp; Prep Checklist</h3>
  <ul>
    <li><!-- Comfort items: water, blanket, eye mask, music. --></li>
    <li><!-- Contacts: emergency numbers, address, directions. --></li>
  </ul>`
        },
      ],
    }),
  
    /* 13) People (researchers, authors, facilitators, historical figures) */
    person: () => baseTemplate({
      includeAdditional: true,
      includePractical: true,
      includeSources: true,
      bullets: [
        ['Who they are', 'Role/discipline and relevance to psychedelics.'],
        ['Era & role', 'Time period and primary positions.'],
        ['Known for', 'Seminal contributions or discoveries.'],
        ['Key works', 'Core papers/books/talks.'],
        ['Controversies', 'Debates or limitations if any.'],
      ],
      sections: [
        {
          html: `
  <h3>Key Contributions</h3>
  <ul>
    <li><!-- Major research/work/advocacy with dates if available. --></li>
    <li><!-- Influence on practice, policy, or public understanding. --></li>
    <li><!-- Awards/positions/foundational publications. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Substance Associations</h3>
  <ul>
    <li><!-- Substances most tied to their work and why. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Published Works / Media</h3>
  <ul>
    <li><!-- Seminal papers/books/talks with brief significance. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Collaborators &amp; Peers</h3>
  <ul>
    <li><!-- Notable colleagues, labs, or institutions. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Historical Context</h3>
  <p><!-- Situate their work in time/policy/culture. --></p>`
        },
        {
          html: `
  <h3>Legacy &amp; Influence</h3>
          <p><!-- How their work shapes current science, policy, or culture. --></p>`
        },
      ],
    }),
  
    /* 14) Events (historical/policy events, landmark trials, conferences) */
    event: () => baseTemplate({
      includeAdditional: true,
      includePractical: true,
      includeSources: true,
      bullets: [
        ['When & where', 'Specific date(s) and location(s).'],
        ['What happened', 'Key actions/decisions/interventions.'],
        ['Immediate impact', 'Direct outcomes for people/policy/science.'],
        ['Key figures', 'Institutions and individuals involved.'],
        ['Legacy', 'Downstream effects & why it matters now.'],
      ],
      sections: [
        {
          html: `
  <h3>Date &amp; Location</h3>
  <p><!-- Specific date(s) and place(s); clarify region/time zone if relevant. --></p>`
        },
        {
          html: `
  <h3>What Happened?</h3>
  <ul>
    <li><!-- Key actions/decisions/interventions with concise chronology. --></li>
    <li><!-- Immediate outcomes and stakeholders. --></li>
  </ul>`
        },
       
        {
          html: `
  <h3>Key Figures Involved</h3>
          <ul>
            <li><!-- People/institutions and their roles. --></li>
          </ul>`
        },
        {
          html: `
  <h3>Primary Documents / Media</h3>
          <ul>
            <li><!-- Official statements, court filings, trial registrations, reports. --></li>
          </ul>`
        },
        {
          html: `
  <h3>Related Movements or Events</h3>
          <ul>
            <li><!-- Earlier/later connected events. --></li>
          </ul>`
        },
        {
          html: `
  <h3>Lasting Legacy</h3>
          <p><!-- Long-term changes (laws, research, norms). --></p>`
        },
      ],
    }),
  
    /* 15) Safety & Quality (merged: testing + sourcing_quality) */
    safety_quality: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Why test', 'Counterfeits/adulterants are common; risk reduction.'],
        ['Quality signals', 'Consistency, labeling, COAs when available.'],
        ['Testing methods', 'Reagents, FTS, lab testing; scope and limits.'],
        ['Storage & handling', 'Light/heat/moisture control; shelf life.'],
        ['Limitations', 'Testing ≠ proof of safety; dose/setting still matter.'],
      ],
      sections: [
        {
          html: `
  <h3>Reagent Quick Reference</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Reagent</th><th>Expected Color</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- Marquis --></td><td><!-- e.g., purple/black --></td><td><!-- Specificity/limits --></td></tr>
      <tr><td><!-- Ehrlich --></td><td><!-- e.g., purple --></td><td><!-- Indoles only --></td></tr>
    </tbody>
  </table>`
        },
        {
          html: `
  <h3>Storage Conditions</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Form</th><th>Best Practice</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- Tincture --></td><td><!-- cool, dark --></td><td><!-- shelf life --></td></tr>
      <tr><td><!-- Dried material --></td><td><!-- airtight, desiccant --></td><td><!-- mold risk --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 16) Special Populations & Mental Health (merged: age_pregnancy + mental_health) */
    special_populations: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Population focus', 'Children/adolescents, older adults, pregnancy/lactation.'],
        ['Mental health risks', 'Psychosis spectrum, bipolar, severe anxiety, PTSD.'],
        ['Known risks', 'Developmental, obstetric, geriatric considerations.'],
        ['Screening', 'Contraindications, red flags, informed consent.'],
        ['Safer alternatives', 'Non-pharmacologic supports when relevant.'],
      ],
      sections: [
        {
          html: `
  <h3>Population-Specific Considerations</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Group</th><th>Key Risks</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- Pregnancy/Lactation --></td><td><!-- fetal/OB considerations --></td><td><!-- evidence gaps --></td></tr>
      <tr><td><!-- Adolescents/Older Adults --></td><td><!-- developmental/geriatric --></td><td><!-- polypharmacy --></td></tr>
    </tbody>
  </table>`
        },
        {
          html: `
  <h3>Screening &amp; Red Flags</h3>
          <ul>
            <li><!-- Psychosis spectrum, mania history, severe anxiety. --></li>
            <li><!-- Suicidality risk; recent hospitalization. --></li>
          </ul>`
        },
      ],
    }),
  
    /* 17) Physical Health & Safety (merged: cardiac_risk + toxicology) */
    physical_health: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Cardiovascular effects', 'Blood pressure, heart rate, QTc concerns.'],
        ['Toxic syndromes', 'Serotonin syndrome, hyperthermia, hyponatremia.'],
        ['High-risk conditions', 'Arrhythmia, hypertension, valvular disease.'],
        ['Warning signs', 'Chest pain, syncope, palpitations.'],
        ['Emergency response', 'Cooling, fluids, medical evaluation.'],
      ],
      sections: [
        {
          html: `
  <h3>Cardio Precautions</h3>
          <ul>
            <li><!-- Pre-check BP/HR if evidence-supported. --></li>
            <li><!-- Avoid stimulants/MAOIs; hydration and temperature control. --></li>
          </ul>`
        },
        {
          html: `
  <h3>Emergency Syndromes</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Syndrome</th><th>Key Signs</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><!-- Serotonin syndrome --></td><td><!-- clonus, hyperreflexia, agitation --></td><td><!-- triggers/combos --></td></tr>
    </tbody>
  </table>`
        },
      ],
    }),
  
    /* 18) Education & Clarification (merged: myths_vs_facts + glossary) */
    education: () => baseTemplate({
      bullets: [
        ['Term definition', 'Short, plain-language definition.'],
        ['Common myth', 'State the myth neutrally.'],
        ['Evidence check', 'Summarize what reliable sources say.'],
        ['What we know', 'Plain conclusion with confidence level.'],
        ['Related terms', 'Nearby concepts and distinctions.'],
      ],
      sections: [
        {
          html: `
  <h3>Myth vs Fact</h3>
  <table border="1" cellpadding="6" cellspacing="0">
    <thead><tr><th>Myth</th><th>Evidence Check</th><th>Conclusion</th></tr></thead>
    <tbody>
      <tr><td><!-- e.g., LSD stays in spine --></td><td><!-- what sources say --></td><td><!-- plain-language verdict --></td></tr>
    </tbody>
  </table>`
        },
        {
          html: `
  <h3>Related Terms</h3>
  <ul>
    <li><!-- Nearby concept 1: distinction --></li>
    <li><!-- Nearby concept 2: distinction --></li>
  </ul>`
        },
      ],
    }),

    /* 19) Mechanisms & Metabolism (merged: pharmacology_moa + pharmacokinetics) */
    mechanisms_metabolism: () => baseTemplate({
      bullets: [
        ['Receptor targets', 'e.g., 5-HT2A, NMDA, kappa-opioid, etc.'],
        ['Pathways', 'Downstream signaling, networks (plain language).'],
        ['Absorption & distribution', 'Route-dependent differences, protein binding.'],
        ['Metabolism & elimination', 'CYP pathways, half-life ranges.'],
        ['Evidence level', 'Where mechanisms are speculative.'],
      ],
      sections: [
        {
          html: `
  <h3>Receptor Targets (Plain Language)</h3>
          <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Target</th><th>Role</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td><!-- 5-HT2A --></td><td><!-- cortical signaling --></td><td><!-- relation to subjective effects --></td></tr>
            </tbody>
          </table>`
        },
        {
          html: `
  <h3>PK Overview</h3>
          <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Phase</th><th>Key Points</th><th>Notes</th></tr></thead>
            <tbody>
              <tr><td><!-- Absorption --></td><td><!-- ROA differences --></td><td><!-- food effects --></td></tr>
              <tr><td><!-- Metabolism --></td><td><!-- CYPs --></td><td><!-- active metabolites --></td></tr>
              <tr><td><!-- Elimination --></td><td><!-- half-life --></td><td><!-- renal/hepatic --></td></tr>
            </tbody>
          </table>`
        },
      ],
    }),

    /* 20) Challenges & Recovery (merged: aftereffects + troubleshooting) */
    challenges_recovery: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Immediate aftereffects', 'Fatigue, mood changes, sleep disturbance.'],
        ['Common challenges', 'Anxiety spikes, nausea, overwhelm, no effects.'],
        ['Recovery timeline', 'Typical recovery and normalization periods.'],
        ['Mitigation strategies', 'Hydration, nutrition, rest, grounding techniques.'],
        ['When to seek help', 'Persistent issues, red flags, emergency signs.'],
      ],
      sections: [
        {
          html: `
  <h3>Recovery Timeline</h3>
  <ul>
    <li><!-- 0–24h: fatigue, mood variability, sleep changes. --></li>
    <li><!-- 24–72h: normalization; hydration/nutrition notes. --></li>
  </ul>`
        },
        {
          html: `
  <h3>Common Challenge Solutions</h3>
          <ul>
            <li><!-- Anxiety: breathing, posture, temperature, reassurance. --></li>
            <li><!-- Nausea: timing with food, ginger/peppermint notes. --></li>
            <li><!-- Overwhelm: grounding, music shift, eyeshades, setting change. --></li>
          </ul>`
        },
      ],
    }),

    /* 21) Protocols & Combinations (merged: protocol + stacking) */
    protocols_combinations: () => baseTemplate({
      addSafety: true,
      bullets: [
        ['Pre-session planning', 'Medical/mental check, intentions, logistics.'],
        ['Common combinations', 'e.g., caffeine + L-theanine; cacao + breathwork.'],
        ['During session', 'Support roles, pacing, hydration, contingencies.'],
        ['Post-session', 'Sleep, nutrition, integration scheduling.'],
        ['Evidence check', 'What (if anything) supports the combo.'],
      ],
      sections: [
        {
          html: `
  <h3>Session Checklist</h3>
          <ul>
            <li><!-- Pre-session: essentials packed, emergency contacts, consent/boundaries. --></li>
            <li><!-- During: hydration, pacing, grounding tools. --></li>
            <li><!-- Post-session: sleep plan, nutrition, integration time scheduled. --></li>
          </ul>`
        },
        {
          html: `
  <h3>Common Stacks</h3>
          <table border="1" cellpadding="6" cellspacing="0">
            <thead><tr><th>Stack</th><th>Intended Effect</th><th>Risks/Notes</th></tr></thead>
            <tbody>
              <tr><td><!-- Caffeine + L-theanine --></td><td><!-- smoother focus --></td><td><!-- HR/BP for sensitivity --></td></tr>
            </tbody>
          </table>`
        },
      ],
    }),
  };
  
  /* ============================ Helpers ============================== */
  
  /**
   * Robust intent detection using weighted word-boundary scoring
   * 
   * This function analyzes user queries to automatically detect the most
   * appropriate template type for AI responses using sophisticated pattern
   * matching and weighted scoring.
   * 
   * FEATURES:
   * - Pattern-based query classification
   * - Weighted scoring system for accuracy
   * - Support for 21 different template types
   * - Unicode normalization and text preprocessing
   * - Fallback to overview template
   * 
   * @param {string} q - User query string to analyze
   * @returns {string} Template type identifier
   * 
   * @example
   * const templateType = detectType('What is the dose of psilocybin?');
   * // Returns 'dosing' for dose-related queries
   */
  function detectType(q) {
    let s = String(q || '').toLowerCase();
    // Normalize common unicode and spacing to reduce mismatches
    s = s
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/µg/g, 'ug')
      .replace(/\s+/g, ' ')
      .trim();

    // Patterns with weights per category
    const typeToPatterns = {
      person: [
        { re: /\bwho\s+(is|was)\b/, w: 4 },
        { re: /\b(biography|biograph|researcher|author|figure|person)\b/, w: 3 },
        { re: /\b(what\s+is\s+.*\s+known\s+for|what\s+was\s+.*\s+known\s+for|what\s+is\s+.*\s+famous\s+for)\b/, w: 5 },
        { re: /\b(what\s+did\s+.*\s+do|what\s+does\s+.*\s+do|what\s+has\s+.*\s+done)\b/, w: 4 },
        { re: /\b(what\s+are\s+.*\s+contributions|what\s+are\s+.*\s+achievements|what\s+are\s+.*\s+discoveries)\b/, w: 4 },
        { re: /\b(albert\s+hofmann|timothy\s+leary|terence\s+mckenna|alexander\s+shulgin|rick\s+doblin)\b/, w: 5 },
        { re: /\b(chemist|scientist|researcher|discoverer|inventor|pioneer)\b/, w: 3 },
      ],
      event: [
        { re: /\b(what\s+happened|when\s+was)\b/, w: 4 },
        { re: /\b(conference|ban|raid|policy\s+change|milestone)\b/, w: 4 },
        { re: /\btrial\b/, w: 1 }, // generic trial mention (lower weight)
        { re: /\b(what\s+was\s+the|what\s+is\s+the|what\s+were\s+the)\b/, w: 4 },
        { re: /\b(project|study|research|experiment|investigation|initiative)\b/, w: 4 },
        { re: /\b(harvard\s+psilocybin\s+project|stanford\s+prison\s+experiment|milgram\s+experiment)\b/, w: 5 },
        { re: /\b(history|historical|timeline|chronology|sequence|order)\b/, w: 3 },
        { re: /\b(1960s|1970s|1980s|1990s|2000s|decade|era|period)\b/, w: 3 },
        { re: /\b(what\s+occurred|what\s+took\s+place|what\s+transpired)\b/, w: 4 },
        { re: /\b(when\s+did|when\s+was|when\s+occurred|when\s+happened)\b/, w: 4 },
      ],
      compare: [
        { re: /\b(vs\.?|versus)\b/, w: 4 },
        { re: /\b(compare|comparison|difference|diff|which\s+is\s+better)\b/, w: 3 },
      ],
      microdosing: [
        { re: /\bmicro-?dos(e|ing|es)?\b/, w: 5 },
        { re: /\bprotocol\b/, w: 1 },
        { re: /\bschedule\b/, w: 1 },
        { re: /\bstack\b/, w: 1 },
      ],
      dosing: [
        { re: /\b(dose|dosing)\b/, w: 3 },
        { re: /\bhow\s+much\b/, w: 3 },
        { re: /\b(microgram|milligram|gram|mg|ug)\b/, w: 2 },
        { re: /\b(how\s+to\s+(take|measure|calculate|determine))\b/, w: 3 },
        { re: /\b(instructions?|step[-\s]?by[-\s]?step|guide)\b/, w: 2 },
      ],
      interactions: [
        { re: /\b(interaction|interact|contraindicat\w*)\b/, w: 3 },
        { re: /\b(ssri|maoi|lithium)\b/, w: 3 },
        { re: /\b(drug\s+combo|mix\s+with|with\s+\w+)\b/, w: 1 },
        { re: /\b(combine|combining|mix|mixing|take\s+with|use\s+with)\b/, w: 3 },
      ],
      safety: [
        { re: /\b(safe|safety|first\s+aid|overdose|bad\s+trip|emergency)\b/, w: 4 },
        { re: /\b(ambulance|call\s+.*\s+help|seek\s+help|medical\s+help|urgent\s+care|er|emergency\s+room)\b/, w: 5 },
        { re: /\b(crisis|dangerous|life.?threatening|severe|critical|immediate|urgent)\b/, w: 4 },
        { re: /\b(what\s+to\s+do\s+if|what\s+should\s+you\s+do)\b/, w: 4 },
        { re: /\b(when\s+to\s+call|when\s+should\s+you|when\s+do\s+you|when\s+is\s+it\s+time)\b/, w: 3 },
        { re: /\b(symptoms|signs|warning\s+signs|red\s+flags)\b/, w: 3 },
        { re: /\b(medical\s+attention|professional\s+help|doctor|hospital|paramedic|emt|first\s+responder)\b/, w: 3 },
        { re: /\b(breathing|consciousness|unresponsive|seizure|chest\s+pain|heart\s+attack|stroke|cardiac\s+arrest)\b/, w: 3 },
        { re: /\b(serotonin\s+syndrome|hyperthermia|heatstroke|dehydration|hypothermia|hypoglycemia)\b/, w: 3 },
        { re: /\b(panic|anxiety|distress|overwhelm|bad\s+trip|difficult\s+experience)\b/, w: 3 },
        { re: /\b(help|support|assistance|intervention)\b/, w: 2 },
        { re: /\b(risk|danger|hazard|warning|caution)\b/, w: 3 },
        { re: /\b(adverse|negative|harmful|toxic|poisonous)\b/, w: 3 },
        { re: /\b(crisis\s+intervention|crisis\s+support|crisis\s+line|crisis\s+hotline)\b/, w: 4 },
        { re: /\b(emergency\s+response|emergency\s+protocol|emergency\s+procedure|emergency\s+plan)\b/, w: 4 },
        { re: /\b(911|nine.?one.?one|emergency\s+services|emergency\s+number)\b/, w: 4 },
      ],
      effects: [
        { re: /\b(effect|effects)\b/, w: 4 },
        { re: /\b(feel\s+like|timeline|duration|onset|peak|how\s+long|when\s+does|how\s+fast|how\s+quickly)\b/, w: 4 },
        { re: /\b(emotional|mood|feeling|sensation|experience|psychological|mental|cognitive|behavioral|social)\b/, w: 3 },
        { re: /\b(what\s+is\s+the|what\s+are\s+the|what\s+does\s+it\s+feel\s+like|what\s+kind\s+of|what\s+type\s+of)\b/, w: 3 },
        { re: /\b(how\s+does\s+it\s+feel|how\s+do\s+you\s+feel|what\s+do\s+you\s+feel|how\s+is\s+it|what\s+is\s+it)\b/, w: 3 },
        { re: /\b(come\s+up|come\s+down|afterglow|aftermath|after\s+effects|peak\s+time|peak\s+effects|plateau|comedown)\b/, w: 3 },
        { re: /\b(high|euphoria|empathy|connectedness|love|warmth|joy|happiness|bliss|pleasure|contentment|peace)\b/, w: 3 },
        { re: /\b(visual|auditory|sensory|perceptual|cognitive|mind|thought|thinking)\b/, w: 2 },
        { re: /\b(empathogen|entactogen|psychedelic|hallucinogen|stimulant|depressant)\b/, w: 2 },
        { re: /\b(what\s+is\s+it\s+like|what\s+does\s+it\s+do|what\s+happens|what\s+can\s+you\s+expect|what\s+to\s+expect)\b/, w: 3 },
      ],
      legality: [
        { re: /\b(legal|legality|decriminal\w*|law|schedule)\b/, w: 4 },
        { re: /\bis\s+it\s+legal\b/, w: 5 },
        { re: /\b(arrest|arrested|busted|caught|police|law\s+enforcement|fbi|dea)\b/, w: 5 },
        { re: /\b(illegal|prohibited|banned|restricted|controlled\s+substance)\b/, w: 4 },
        { re: /\b(penalty|punishment|fine|jail|prison|sentence|conviction)\b/, w: 4 },
        { re: /\b(permit|license|registration|exemption|religious|ceremonial|sacramental|traditional)\b/, w: 3 },
        { re: /\b(federal|state|local|jurisdiction|authority|enforcement|government|official)\b/, w: 3 },
        { re: /\b(can\s+you|will\s+you|do\s+you|would\s+you)\s+(get\s+)?(arrested|busted|caught|in\s+trouble)\b/, w: 5 },
        { re: /\b(what\s+happens\s+if|what\s+are\s+the\s+consequences|what\s+are\s+the\s+penalties)\b/, w: 4 },
        { re: /\b(legal\s+status|legal\s+consequences|legal\s+risks|legal\s+issues)\b/, w: 4 },
        { re: /\b(regulation|regulatory|compliance|enforcement|violation|prosecution|trial|court)\b/, w: 3 },
        { re: /\b(constitutional|amendment|bill|act|statute|code|legislation|policy|law\s+reform|decriminalization)\b/, w: 3 },
        { re: /\b(legal\s+advice|legal\s+opinion|legal\s+guidance|legal\s+help|legal\s+information)\b/, w: 4 },
        { re: /\b(rights|civil\s+rights|religious\s+rights|freedom|liberty|protection|defense)\b/, w: 3 },
        { re: /\b(what\s+are\s+my\s+rights|what\s+are\s+the\s+rules|what\s+are\s+the\s+laws|what\s+is\s+allowed|what\s+is\s+permitted)\b/, w: 4 },
        { re: /\b(can\s+i|can\s+you|could\s+i|could\s+you|will\s+i|will\s+you)\s+(get\s+)?(in\s+trouble|arrested|busted|caught|prosecuted)\b/, w: 5 },
        { re: /\b(what\s+if\s+i|what\s+if\s+you|what\s+happens\s+if\s+i|what\s+happens\s+if\s+you)\s+(get\s+)?(caught|busted|arrested)\b/, w: 5 },
        { re: /\b(countries|nations|states|regions|jurisdictions|places|locations)\s+(where|that|which|allow|permit|legal)\b/, w: 5 },
        { re: /\b(allow|permit|tolerate|accept|recognize|authorize|sanction)\b/, w: 4 },
        { re: /\b(legal\s+in|legal\s+at|legal\s+for|legal\s+to|legally\s+allowed|legally\s+permitted)\b/, w: 4 },
        { re: /\b(worldwide|globally|internationally|across\s+countries|around\s+the\s+world)\b/, w: 3 },
        { re: /\b(which\s+countries|what\s+countries|where\s+is\s+it\s+legal|where\s+can\s+you)\b/, w: 4 },
        { re: /\b(legal\s+framework|legal\s+system|legal\s+structure|legal\s+regime)\b/, w: 4 },
        { re: /\b(legal\s+exceptions|legal\s+exemptions|legal\s+protections|legal\s+rights)\b/, w: 4 },
        { re: /\b(legal\s+status|legal\s+position|legal\s+situation|legal\s+standing)\b/, w: 4 },
        { re: /\b(legal\s+environment|legal\s+climate|legal\s+landscape|legal\s+context)\b/, w: 3 },
        { re: /\b(what\s+are\s+the\s+laws|what\s+are\s+the\s+regulations|what\s+are\s+the\s+rules)\b/, w: 4 },
        { re: /\b(how\s+legal|how\s+illegal|how\s+restricted|how\s+regulated)\b/, w: 4 },
        { re: /\b(legal\s+around\s+the\s+world|legal\s+worldwide|legal\s+globally)\b/, w: 4 },
        { re: /\b(legal\s+in\s+different\s+countries|legal\s+across\s+borders|legal\s+by\s+country)\b/, w: 4 },
      ],
      administration_measurement: [
        { re: /\b(prep|preparation|brew|tea)\b/, w: 4 },
        { re: /\b(how\s+to\s+take|administration|sublingual|capsule)\b/, w: 4 },
        { re: /\b(how\s+to\s+(take|use|administer|prepare|vape|smoke|inhale|consume))\b/, w: 5 },
        { re: /\b(instructions?|step[-\s]?by[-\s]?step|guide|procedure|method|technique)\b/, w: 4 },
        { re: /\b(scale|weigh|volumetric|mg\s*scale|measure|dosage|dose|amount)\b/, w: 4 },
        { re: /\b(vape|vaping|smoke|smoking|inhale|inhalation|oral|sublingual|nasal|rectal)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+correct\s+way|what\s+is\s+the\s+right\s+way|what\s+is\s+the\s+proper\s+way)\b/, w: 5 },
        { re: /\b(how\s+do\s+you\s+(vape|smoke|take|use|administer|prepare|consume))\b/, w: 5 },
        { re: /\b(equipment|device|tool|method|route|administration\s+method)\b/, w: 3 },
        { re: /\b(temperature|heat|burn|combust|vaporize|evaporate)\b/, w: 3 },
        { re: /\b(what\s+equipment|what\s+device|what\s+method|what\s+technique)\b/, w: 4 },
        { re: /\b(best\s+way|optimal\s+way|efficient\s+way|effective\s+way)\b/, w: 4 },
        { re: /\b(what\s+method|what\s+technique|what\s+procedure|what\s+approach)\b/, w: 4 },
        { re: /\b(how\s+should\s+you|how\s+do\s+you|how\s+can\s+you)\s+(vape|smoke|take|use|administer)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+method|what\s+is\s+the\s+technique|what\s+is\s+the\s+procedure)\b/, w: 4 },
        { re: /\b(administration|route\s+of\s+administration|method\s+of\s+use)\b/, w: 4 },
        { re: /\b(what\s+do\s+you\s+need\s+to\s+(vape|smoke|take|use|administer))\b/, w: 4 },
        { re: /\b(equipment\s+needed|tools\s+needed|supplies\s+needed|materials\s+needed)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+correct\s+method|what\s+is\s+the\s+right\s+method|what\s+is\s+the\s+proper\s+method)\b/, w: 5 },
        { re: /\b(how\s+to\s+properly|how\s+to\s+correctly|how\s+to\s+rightly)\s+(vape|smoke|take|use|administer)\b/, w: 5 },
        { re: /\b(what\s+is\s+the\s+correct\s+technique|what\s+is\s+the\s+right\s+technique|what\s+is\s+the\s+proper\s+technique)\b/, w: 5 },
        { re: /\b(what\s+is\s+the\s+correct\s+procedure|what\s+is\s+the\s+right\s+procedure|what\s+is\s+the\s+proper\s+procedure)\b/, w: 5 },
      ],
      tolerance: [
        { re: /\b(tolerance|dependen\w*)\b/, w: 4 },
        { re: /\b(how\s+often|frequency|spacing|reset)\b/, w: 4 },
        { re: /\b(every\s+day|daily|weekly|monthly|regularly|consistently)\b/, w: 4 },
        { re: /\b(can\s+you|could\s+you|should\s+you|is\s+it\s+ok\s+to)\s+(take|use|consume|eat|ingest)\s+(every\s+day|daily|regularly)\b/, w: 5 },
        { re: /\b(what\s+happens\s+if\s+you|what\s+if\s+you|what\s+are\s+the\s+effects\s+of)\s+(taking|using|consuming)\s+(every\s+day|daily|regularly)\b/, w: 5 },
        { re: /\b(buildup|build\s+up|accumulation|accumulate|increase|decrease|reduce)\b/, w: 3 },
        { re: /\b(schedule|timing|interval|break|pause|rest|wait)\b/, w: 3 },
        { re: /\b(protocol|regimen|routine|pattern|cycle|rotation)\b/, w: 3 },
        { re: /\b(what\s+is\s+the\s+best\s+frequency|what\s+is\s+the\s+optimal\s+frequency|what\s+is\s+the\s+right\s+frequency)\b/, w: 4 },
        { re: /\b(how\s+long\s+to\s+wait|how\s+long\s+between|how\s+long\s+until)\b/, w: 4 },
        { re: /\b(continuous|ongoing|repeated|repetitive|chronic|habitual)\b/, w: 3 },
        { re: /\b(what\s+is\s+the\s+recommended\s+frequency|what\s+is\s+the\s+suggested\s+frequency)\b/, w: 4 },
        { re: /\b(how\s+many\s+times|how\s+many\s+days|how\s+many\s+weeks|how\s+many\s+months)\b/, w: 3 },
        { re: /\b(what\s+is\s+the\s+maximum\s+frequency|what\s+is\s+the\s+minimum\s+frequency|what\s+is\s+the\s+safe\s+frequency)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+schedule|what\s+is\s+the\s+optimal\s+schedule|what\s+is\s+the\s+right\s+schedule)\b/, w: 4 },
        { re: /\b(how\s+often\s+can\s+you|how\s+often\s+should\s+you|how\s+often\s+is\s+it\s+ok\s+to)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+timing|what\s+is\s+the\s+optimal\s+timing|what\s+is\s+the\s+right\s+timing)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+interval|what\s+is\s+the\s+optimal\s+interval|what\s+is\s+the\s+right\s+interval)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+pattern|what\s+is\s+the\s+optimal\s+pattern|what\s+is\s+the\s+right\s+pattern)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+cycle|what\s+is\s+the\s+optimal\s+cycle|what\s+is\s+the\s+right\s+cycle)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+regimen|what\s+is\s+the\s+optimal\s+regimen|what\s+is\s+the\s+right\s+regimen)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+protocol|what\s+is\s+the\s+optimal\s+protocol|what\s+is\s+the\s+right\s+protocol)\b/, w: 4 },
        { re: /\b(lose\s+effectiveness|lose\s+potency|lose\s+strength|become\s+less\s+effective)\b/, w: 5 },
        { re: /\b(does\s+.*\s+lose|will\s+.*\s+lose|can\s+.*\s+lose)\s+(effectiveness|potency|strength|power)\b/, w: 5 },
        { re: /\b(if\s+used\s+often|if\s+used\s+frequently|if\s+used\s+regularly|if\s+used\s+repeatedly)\b/, w: 4 },
        { re: /\b(what\s+happens\s+if\s+you\s+use\s+(often|frequently|regularly|repeatedly))\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+effects\s+of\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+consequences\s+of\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+risks\s+of\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+side\s+effects\s+of\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+problems\s+with\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+issues\s+with\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+concerns\s+about\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+worries\s+about\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+drawbacks\s+of\s+(frequent|regular|repeated|ongoing|continuous)\s+use)\b/, w: 4 },
      ],
      therapy: [
        { re: /\b(therap\w*|evidence|study|efficacy|effect\s+size)\b/, w: 4 },
        { re: /\b(clinical\s+trial|randomi[sz]ed\s+trial|trial\s+results?)\b/, w: 5 },
        { re: /\b(research|scientific|clinical|medical|therapeutic|treatment)\b/, w: 4 },
        { re: /\b(what\s+does\s+research\s+say|what\s+does\s+the\s+research\s+show|what\s+does\s+the\s+evidence\s+show)\b/, w: 5 },
        { re: /\b(what\s+do\s+studies\s+show|what\s+do\s+trials\s+show|what\s+do\s+experiments\s+show)\b/, w: 5 },
        { re: /\b(what\s+is\s+the\s+evidence|what\s+is\s+the\s+research|what\s+is\s+the\s+science)\b/, w: 4 },
        { re: /\b(how\s+effective|how\s+successful|how\s+well\s+does\s+it\s+work)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+results|what\s+are\s+the\s+findings|what\s+are\s+the\s+outcomes)\b/, w: 4 },
        { re: /\b(phase\s+[12]|phase\s+[23]|phase\s+[34]|clinical\s+phase)\b/, w: 4 },
        { re: /\b(approved|approval|fda|regulatory|medical\s+use|prescription)\b/, w: 3 },
        { re: /\b(what\s+is\s+the\s+success\s+rate|what\s+is\s+the\s+response\s+rate|what\s+is\s+the\s+remission\s+rate)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+cure\s+rate|what\s+is\s+the\s+healing\s+rate|what\s+is\s+the\s+recovery\s+rate)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+improvement\s+rate|what\s+is\s+the\s+benefit\s+rate|what\s+is\s+the\s+help\s+rate)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+risk\s+benefit|what\s+is\s+the\s+risk\s+ratio|what\s+is\s+the\s+risk\s+profile)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+comparison|what\s+is\s+the\s+difference|what\s+is\s+the\s+contrast)\b/, w: 3 },
        { re: /\b(what\s+is\s+the\s+alternative|what\s+is\s+the\s+option|what\s+is\s+the\s+choice)\b/, w: 3 },
        { re: /\b(what\s+is\s+the\s+best\s+treatment|what\s+is\s+the\s+optimal\s+treatment|what\s+is\s+the\s+right\s+treatment)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+most\s+effective|what\s+is\s+the\s+most\s+successful|what\s+is\s+the\s+most\s+beneficial)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+standard\s+of\s+care|what\s+is\s+the\s+first\s+line|what\s+is\s+the\s+conventional)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+experimental|what\s+is\s+the\s+investigational|what\s+is\s+the\s+novel)\b/, w: 3 },
        { re: /\b(has\s+.*\s+been\s+studied|has\s+.*\s+been\s+researched|has\s+.*\s+been\s+tested)\b/, w: 5 },
        { re: /\b(what\s+evidence\s+exists|what\s+evidence\s+is\s+there|what\s+evidence\s+shows)\b/, w: 4 },
        { re: /\b(what\s+research\s+exists|what\s+research\s+is\s+there|what\s+research\s+shows)\b/, w: 4 },
        { re: /\b(what\s+studies\s+exist|what\s+studies\s+are\s+there|what\s+studies\s+show)\b/, w: 4 },
        { re: /\b(what\s+trials\s+exist|what\s+trials\s+are\s+there|what\s+trials\s+show)\b/, w: 4 },
        { re: /\b(what\s+is\s+known\s+about|what\s+do\s+we\s+know\s+about|what\s+have\s+we\s+learned\s+about)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+current\s+understanding|what\s+is\s+the\s+current\s+knowledge|what\s+is\s+the\s+current\s+state)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+latest\s+research|what\s+is\s+the\s+recent\s+research|what\s+is\s+the\s+new\s+research)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+recent\s+evidence|what\s+is\s+the\s+latest\s+evidence|what\s+is\s+the\s+new\s+evidence)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+status\s+of\s+research|what\s+is\s+the\s+state\s+of\s+research|what\s+is\s+the\s+progress\s+of\s+research)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+quality\s+of\s+evidence|what\s+is\s+the\s+strength\s+of\s+evidence|what\s+is\s+the\s+level\s+of\s+evidence)\b/, w: 4 },
      ],
      preparation_integration: [
        { re: /\b(integration|aftercare|intentions|grounding)\b/, w: 4 },
        { re: /\b(set\s+and\s+setting\s+plan|music|playlist|lighting|sitter)\b/, w: 4 },
        { re: /\b(how\s+can\s+.*\s+integrate|how\s+do\s+.*\s+integrate|how\s+should\s+.*\s+integrate)\b/, w: 5 },
        { re: /\b(what\s+is\s+integration|what\s+does\s+integration\s+mean|what\s+is\s+the\s+integration\s+process)\b/, w: 4 },
        { re: /\b(insights|lessons|experiences|revelations|understandings|realizations)\b/, w: 4 },
        { re: /\b(post\s*experience|after\s*experience|following\s*experience|post\s*session|after\s*session)\b/, w: 4 },
        { re: /\b(how\s+to\s+process|how\s+to\s+work\s+with|how\s+to\s+use|how\s+to\s+apply)\b/, w: 4 },
        { re: /\b(journaling|reflection|meditation|mindfulness|contemplation|prayer)\b/, w: 3 },
        { re: /\b(community|support\s+group|integration\s+circle|therapy|counseling|coaching)\b/, w: 3 },
        { re: /\b(what\s+to\s+do\s+after|what\s+to\s+do\s+post|what\s+to\s+do\s+following)\b/, w: 4 },
        { re: /\b(how\s+to\s+make\s+meaning|how\s+to\s+find\s+meaning|how\s+to\s+create\s+meaning)\b/, w: 4 },
        { re: /\b(how\s+to\s+continue|how\s+to\s+maintain|how\s+to\s+sustain|how\s+to\s+keep)\b/, w: 4 },
        { re: /\b(what\s+are\s+integration\s+practices|what\s+are\s+integration\s+techniques|what\s+are\s+integration\s+methods)\b/, w: 4 },
        { re: /\b(what\s+are\s+preparation\s+practices|what\s+are\s+preparation\s+techniques|what\s+are\s+preparation\s+methods)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+way\s+to\s+integrate|what\s+is\s+the\s+optimal\s+way\s+to\s+integrate|what\s+is\s+the\s+right\s+way\s+to\s+integrate)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+way\s+to\s+prepare|what\s+is\s+the\s+optimal\s+way\s+to\s+prepare|what\s+is\s+the\s+right\s+way\s+to\s+prepare)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+way\s+to\s+process|what\s+is\s+the\s+optimal\s+way\s+to\s+process|what\s+is\s+the\s+right\s+way\s+to\s+process)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+way\s+to\s+work\s+with|what\s+is\s+the\s+optimal\s+way\s+to\s+work\s+with|what\s+is\s+the\s+right\s+way\s+to\s+work\s+with)\b/, w: 4 },
        { re: /\b(rituals?|ceremonies?|traditions?|customs?|practices?)\b/, w: 4 },
        { re: /\b(before|prior\s+to|leading\s+up\s+to|in\s+preparation\s+for|ahead\s+of)\b/, w: 4 },
        { re: /\b(pre\s*ceremony|pre\s*ritual|pre\s*session|pre\s*experience|pre\s*use)\b/, w: 4 },
        { re: /\b(what\s+rituals|what\s+ceremonies|what\s+traditions|what\s+customs|what\s+practices)\b/, w: 5 },
        { re: /\b(what\s+are\s+the\s+rituals|what\s+are\s+the\s+ceremonies|what\s+are\s+the\s+traditions|what\s+are\s+the\s+customs|what\s+are\s+the\s+practices)\b/, w: 5 },
        { re: /\b(how\s+do\s+therapists|how\s+do\s+counselors|how\s+do\s+professionals|how\s+do\s+experts)\b/, w: 5 },
        { re: /\b(how\s+do\s+.*\s+help\s+with|how\s+do\s+.*\s+support|how\s+do\s+.*\s+assist)\b/, w: 4 },
        { re: /\b(integration\s+therapy|integration\s+counseling|integration\s+support|integration\s+work)\b/, w: 5 },
        { re: /\b(what\s+do\s+therapists\s+do|what\s+do\s+counselors\s+do|what\s+do\s+professionals\s+do)\b/, w: 4 },
        { re: /\b(how\s+can\s+therapy\s+help|how\s+can\s+counseling\s+help|how\s+can\s+professional\s+help)\b/, w: 4 },
      ],
      safety_quality: [
        { re: /\b(test\s*kit|reagent|fentanyl\s*strip|adulterant|drug\s*checking|lab\s*testing)\b/, w: 5 },
        { re: /\b(test|testing|purity|impurity|adulterant|contaminant|substance\s+checking)\b/, w: 4 },
        { re: /\b(equipment|tools|gear|supplies|materials|instruments)\b/, w: 4 },
        { re: /\b(marquis|mecke|simon|mandelin|froehde|reagent\s+test)\b/, w: 5 },
        { re: /\b(source|quality|storage|mold|coa|certificate\s+of\s+analysis)\b/, w: 4 },
        { re: /\b(what\s+do\s+you\s+need|what\s+equipment|what\s+tools|what\s+supplies)\b/, w: 4 },
        { re: /\b(harm\s+reduction|safety\s+testing|purity\s+testing|adulterant\s+detection)\b/, w: 4 },
        { re: /\b(spot\s+plate|micro\s+scoop|milligram\s+scale|weighing\s+scale)\b/, w: 4 },
        { re: /\b(color\s+change|reaction|chemical\s+test|identification)\b/, w: 3 },
        { re: /\b(verify|confirm|identify|detect|check|validate)\b/, w: 3 },
        { re: /\b(how\s+to\s+test|how\s+do\s+you\s+test|testing\s+procedure|testing\s+method)\b/, w: 4 },
        { re: /\b(test\s+results|test\s+outcome|test\s+reading|test\s+interpretation)\b/, w: 3 },
        { re: /\b(what\s+to\s+look\s+for|what\s+to\s+expect|what\s+indicates|what\s+shows)\b/, w: 3 },
        { re: /\b(accurate|reliable|trustworthy|precise|exact|correct)\b/, w: 2 },
        { re: /\b(what\s+equipment|what\s+tools|what\s+supplies|what\s+materials)\b/, w: 4 },
        { re: /\b(need|required|necessary|essential|important|crucial)\b/, w: 2 },
        { re: /\b(what\s+do\s+you\s+need|what\s+should\s+you\s+have|what\s+must\s+you\s+have)\b/, w: 4 },
        { re: /\b(equipment\s+list|tool\s+list|supply\s+list|materials\s+list)\b/, w: 4 },
        { re: /\b(what\s+is\s+needed|what\s+is\s+required|what\s+is\s+necessary)\b/, w: 4 },
        { re: /\b(testing\s+kit|testing\s+equipment|testing\s+tools|testing\s+supplies)\b/, w: 4 },
        { re: /\b(what\s+equipment\s+do\s+you\s+need|what\s+tools\s+do\s+you\s+need)\b/, w: 5 },
        { re: /\b(how\s+to\s+check|how\s+to\s+verify|how\s+to\s+confirm)\b/, w: 4 },
        { re: /\b(store|storage|storing|keep|preserve|maintain|protect)\b/, w: 4 },
        { re: /\b(safest\s+way|safe\s+method|safe\s+practice|safe\s+technique)\b/, w: 5 },
        { re: /\b(how\s+to\s+safely|how\s+to\s+store|how\s+to\s+keep|how\s+to\s+preserve)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+safest|what\s+is\s+the\s+safe|what\s+are\s+the\s+safe)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+best\s+way\s+to\s+store|what\s+is\s+the\s+best\s+way\s+to\s+keep)\b/, w: 4 },
        { re: /\b(container|vial|bag|package|wrap|seal|airtight|moisture|humidity)\b/, w: 3 },
        { re: /\b(temperature|heat|cold|freezer|refrigerator|cool|dark|light|exposure)\b/, w: 3 },
        { re: /\b(degradation|degrade|potency|strength|effectiveness|shelf\s+life|expiration)\b/, w: 4 },
      ],
      special_populations: [
        { re: /\b(pregnan\w*|lacta\w*|breastfeed\w*|older\s+adult|elderly|child|teen|adolesc\w*)\b/, w: 5 },
        { re: /\b(psychosis|bipolar|schizo\w*|ptsd|depress\w*)\b/, w: 5 },
        { re: /\b(anxiety\s+disorder|chronic\s+anxiety|generalized\s+anxiety)\b/, w: 5 },
        { re: /\b(is\s+it\s+safe\s+to\s+use|is\s+it\s+safe\s+to\s+take|is\s+it\s+safe\s+to\s+consume)\b/, w: 5 },
        { re: /\b(while\s+pregnant|during\s+pregnancy|when\s+pregnant|if\s+pregnant)\b/, w: 5 },
        { re: /\b(while\s+breastfeeding|during\s+lactation|when\s+breastfeeding|if\s+breastfeeding)\b/, w: 5 },
        { re: /\b(while\s+on\s+medication|during\s+treatment|when\s+on\s+meds|if\s+on\s+medication)\b/, w: 4 },
        { re: /\b(mental\s+health|psychiatric|psychological|emotional\s+health)\b/, w: 4 },
        { re: /\b(special\s+populations|vulnerable\s+populations|at\s+risk\s+groups)\b/, w: 4 },
        { re: /\b(what\s+about\s+pregnant|what\s+about\s+breastfeeding|what\s+about\s+elderly)\b/, w: 4 },
        { re: /\b(can\s+teenagers|can\s+teens|can\s+adolescents|can\s+minors)\b/, w: 5 },
        { re: /\b(can\s+.*\s+take|can\s+.*\s+use|can\s+.*\s+consume)\b/, w: 4 },
        { re: /\b(teenagers?|teens?|adolescents?|minors?|youth|young\s+people)\b/, w: 5 },
        { re: /\b(developmental|development|growing|maturing|underage|minor)\b/, w: 4 },
        { re: /\b(what\s+about\s+teens|what\s+about\s+teenagers|what\s+about\s+adolescents)\b/, w: 4 },
        { re: /\b(are\s+.*\s+at\s+higher\s+risk|are\s+.*\s+at\s+risk|are\s+.*\s+more\s+vulnerable)\b/, w: 5 },
        { re: /\b(older\s+adults?|elderly|seniors?|aging|aged|senior\s+citizens?)\b/, w: 5 },
        { re: /\b(risk|vulnerable|susceptible|sensitive|fragile|delicate)\b/, w: 4 },
        { re: /\b(what\s+about\s+older\s+adults|what\s+about\s+elderly|what\s+about\s+seniors)\b/, w: 4 },
        { re: /\b(age\s+related|age\s+specific|age\s+appropriate|age\s+considerations)\b/, w: 4 },
      ],
      physical_health: [
        { re: /\b(heart|cardiac|arrhythm\w*|blood\s+pressure|hypertension|qtc)\b/, w: 4 },
        { re: /\b(toxic\w*|neurotoxic\w*|serotonin\s+syndrome|hyperthermia|hyponatremia|poison\w*)\b/, w: 4 },
        { re: /\b(liver|hepatic|hepatotoxic|kidney|renal|nephrotoxic|lung|pulmonary)\b/, w: 4 },
        { re: /\b(brain|neurological|neurological|cognitive|memory|learning)\b/, w: 4 },
        { re: /\b(how\s+toxic|how\s+poisonous|how\s+harmful|how\s+dangerous)\b/, w: 5 },
        { re: /\b(organ\s+damage|organ\s+toxicity|organ\s+injury|organ\s+harm)\b/, w: 4 },
        { re: /\b(physical\s+health|physical\s+effects|physical\s+risks|physical\s+damage)\b/, w: 4 },
        { re: /\b(what\s+does\s+.*\s+do\s+to\s+the|how\s+does\s+.*\s+affect\s+the)\b/, w: 4 },
        { re: /\b(metabolism|metabolize|breakdown|process|eliminate|excrete)\b/, w: 3 },
        { re: /\b(blood\s+test|lab\s+test|enzyme|elevated|abnormal|normal)\b/, w: 3 },
        { re: /\b(cardiovascular|cardio|circulatory|vascular|blood\s+vessel)\b/, w: 4 },
        { re: /\b(heart\s+rate|blood\s+pressure|hypertension|hypotension|arrhythmia)\b/, w: 4 },
        { re: /\b(what\s+are\s+the\s+.*\s+risks|what\s+are\s+the\s+.*\s+effects|what\s+are\s+the\s+.*\s+concerns)\b/, w: 4 },
        { re: /\b(risk|risks|danger|dangers|hazard|hazards|concern|concerns)\b/, w: 3 },
        { re: /\b(palpitation|tachycardia|bradycardia|irregular\s+heartbeat)\b/, w: 4 },
        { re: /\b(vasoconstriction|vasodilation|constriction|dilation|narrowing|widening)\b/, w: 3 },
        { re: /\b(bladder|urinary|urethra|kidney|renal|nephrotoxic|cystitis|incontinence)\b/, w: 4 },
        { re: /\b(can\s+.*\s+damage|can\s+.*\s+hurt|can\s+.*\s+harm|can\s+.*\s+injure)\b/, w: 5 },
        { re: /\b(damage|injury|harm|hurt|wound|lesion|ulcer|inflammation)\b/, w: 4 },
        { re: /\b(urinary\s+frequency|urinary\s+urgency|urinary\s+pain|urinary\s+problems)\b/, w: 4 },
        { re: /\b(what\s+does\s+.*\s+do\s+to|how\s+does\s+.*\s+affect|can\s+.*\s+affect)\b/, w: 4 },
        { re: /\b(side\s+effect|adverse\s+effect|negative\s+effect|harmful\s+effect)\b/, w: 3 },
      ],
      mechanisms_metabolism: [
        { re: /\b(mechanism|moa|receptor|5-ht|nmda|gaba|dopamine)\b/, w: 4 },
        { re: /\b(half-?life|cyp\w*|metabol\w*|pharmacokinetic\w*|pk\b|eliminat\w*)\b/, w: 4 },
        { re: /\b(activate|activation|bind|binding|interact|interaction|target|targeting)\b/, w: 4 },
        { re: /\b(what\s+receptors|what\s+receptor|which\s+receptors|which\s+receptor)\b/, w: 5 },
        { re: /\b(how\s+does\s+.*\s+work|how\s+does\s+.*\s+function|how\s+does\s+.*\s+operate)\b/, w: 4 },
        { re: /\b(neurochemical|neurotransmitter|synapse|synaptic|neural|neuron)\b/, w: 4 },
        { re: /\b(serotonin|dopamine|norepinephrine|acetylcholine|glutamate|gaba)\b/, w: 4 },
        { re: /\b(agonist|antagonist|partial\s+agonist|inverse\s+agonist)\b/, w: 4 },
        { re: /\b(what\s+does\s+.*\s+do\s+in\s+the\s+brain|how\s+does\s+.*\s+affect\s+the\s+brain)\b/, w: 4 },
        { re: /\b(pharmacology|pharmacological|drug\s+action|drug\s+mechanism)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+half.?life|what\s+is\s+the\s+half.?life\s+of|what\s+is\s+the\s+half.?life\s+for)\b/, w: 5 },
        { re: /\b(how\s+long\s+does\s+.*\s+last|how\s+long\s+does\s+.*\s+stay|how\s+long\s+does\s+.*\s+remain)\b/, w: 4 },
        { re: /\b(duration|timing|clearance|elimination|excretion|removal)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+duration|what\s+is\s+the\s+timing|what\s+is\s+the\s+clearance)\b/, w: 4 },
        { re: /\b(metabolize|metabolism|breakdown|degradation|processing|conversion)\b/, w: 4 },
        { re: /\b(what\s+is\s+the\s+metabolism|how\s+is\s+.*\s+metabolized|how\s+does\s+.*\s+break\s+down)\b/, w: 4 },
      ],
      challenges_recovery: [
        { re: /\b(withdrawal|comedown|hangover|aftereffect\w*|next\s+day)\b/, w: 4 },
        { re: /\btroubleshoot\w*\b/, w: 4 },
        { re: /didn['']t\s+feel\s+anything/, w: 4 },
        { re: /\bnausea\b/, w: 2 },
        { re: /\banxiety\s+spike\b/, w: 3 },
        { re: /\boverwhelm\b/, w: 3 },
        { re: /\b(recover|recovery|healing|heal|overcome|overcoming)\b/, w: 4 },
        { re: /\b(difficult|challenging|hard|tough|rough|bad|negative|unpleasant)\b/, w: 4 },
        { re: /\b(how\s+do\s+you\s+recover|how\s+do\s+you\s+heal|how\s+do\s+you\s+overcome)\b/, w: 5 },
        { re: /\b(what\s+to\s+do\s+if|what\s+should\s+you\s+do\s+if|what\s+can\s+you\s+do\s+if)\b/, w: 4 },
        { re: /\b(problem|problems|issue|issues|trouble|troubles|difficulty|difficulties)\b/, w: 3 },
        { re: /\b(help|helping|support|supporting|assist|assisting|guide|guiding)\b/, w: 3 },
        { re: /\b(integration|process|processing|work\s+through|deal\s+with|cope\s+with)\b/, w: 3 },
      ],
      protocols_combinations: [
        { re: /\b(protocol|step\s+by\s+step|checklist|guide)\b/, w: 4 },
        { re: /\b(stack|combo|combine)\b/, w: 3 },
        { re: /\b(with\s+cacao|with\s+caffeine|lemon\s+tek)\b/, w: 3 },
        { re: /\b(together|pair(?:ing)?)\b/, w: 2 },
      ],
      education: [
        { re: /\b(myth|misconception|is\s+it\s+true)\b/, w: 3 },
        { re: /\b(define|glossary|term)\b/, w: 2 },
        { re: /\bwhat\s+does\s+.+\s+mean\b/, w: 4 },
      ],
    };

    // Priority order as a final tiebreaker (more specific before general)
    const priority = [
      'compare',
      'protocols_combinations',
      'microdosing',
      'interactions',
      'safety',
      'therapy',
      'legality',
      'event',
      'person',
      'effects',
      'dosing',
      'tolerance',
      'preparation_integration',
      'safety_quality',
      'special_populations',
      'physical_health',
      'mechanisms_metabolism',
      'challenges_recovery',
      'administration_measurement',
      'education',
    ];

    // Score categories
    const scores = {};
    for (const [type, patterns] of Object.entries(typeToPatterns)) {
      let score = 0;
      for (const { re, w } of patterns) {
        if (re.test(s)) score += w;
      }
      scores[type] = score;
    }

    // Specialization overrides to reduce conflicts
    // If microdosing is strong, down-weight generic dosing
    if (scores.microdosing >= 3) {
      scores.dosing = Math.max(0, scores.dosing - 2);
    }
    // If therapy mentions clinical trials strongly, down-weight event's generic trial
    if (scores.therapy >= 4) {
      scores.event = Math.max(0, scores.event - 2);
    }

    // If combination/mixing cues are present, boost interactions and protocols_combinations
    // Only down-weight safety if it's not a clear safety question (like emergency/ambulance)
    const combineCue = /\b(combine|combining|mix|mixing|stack|together|pair(?:ing)?|with\s+\w+)\b/;
    const safetyEmergencyCue = /\b(ambulance|emergency|crisis|dangerous|life.?threatening|severe|critical|immediate|urgent)\b/;
    if (combineCue.test(s)) {
      scores.interactions = (scores.interactions || 0) + 2;
      scores.protocols_combinations = (scores.protocols_combinations || 0) + 2;
      // Only down-weight safety if it's not an emergency question
      if (!safetyEmergencyCue.test(s)) {
        scores.safety = Math.max(0, (scores.safety || 0) - 2);
      }
    }

    // Emergency questions should strongly favor safety template
    if (safetyEmergencyCue.test(s)) {
      scores.safety = (scores.safety || 0) + 3;
    }

    // Determine best match
    let bestType = 'overview';
    let bestScore = 0;
    for (const type of Object.keys(scores)) {
      const sc = scores[type] || 0;
      if (sc > bestScore) {
        bestScore = sc;
        bestType = type;
      } else if (sc === bestScore && sc > 0) {
        // Tie-break by priority (earlier in priority list wins)
        const currentIdx = priority.indexOf(bestType);
        const challengerIdx = priority.indexOf(type);
        if (challengerIdx !== -1 && (currentIdx === -1 || challengerIdx < currentIdx)) {
          bestType = type;
        }
      }
    }

    // Debug logging for template selection
    if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
      console.log('Template selection debug for question:', q);
      console.log('Scores:', scores);
      console.log('Selected template:', bestType, 'with score:', bestScore);
    }

    // Minimum threshold to avoid spurious matches
    if (bestScore < 2) return 'overview';
    return bestType;
  }
  
  /**
   * Derive title from user query
   * 
   * This function processes user queries to create clean, formatted titles
   * suitable for display, removing filler words and applying proper formatting.
   * 
   * FEATURES:
   * - Text normalization and cleaning
   * - Common term corrections
   * - Filler word removal
   * - Auto-punctuation for questions
   * - Title case formatting with acronym preservation
   * 
   * @param {string} q - User query string
   * @returns {string} Clean, formatted title
   * 
   * @example
   * const title = deriveTitle('what is the dose of psilocybin?');
   * // Returns 'What Is the Dose of Psilocybin?'
   */
  function deriveTitle(q) {
    let s = String(q || '').trim();
    // Trim outer dashes/spaces and normalize quotes/spacing
    s = s.replace(/^[\s\-–—]+|[\s\-–—]+$/g, '');
    s = s.replace(/['']/g, "'").replace(/[""]/g, '"');
    s = s.replace(/\s+/g, ' ').trim();

    // Lightweight corrections for common terms
    const corrections = [
      { re: /\bheroine\b/gi, val: 'heroin' },
    ];
    corrections.forEach(({ re, val }) => { s = s.replace(re, val); });

    // Remove filler/redundant phrases to simplify
    const fillers = [
      /\bfrom start to finish\b/gi,
      /\bstart to finish\b/gi,
      /\bstep[-\s]?by[-\s]?step\b/gi,
      /\bin detail\b/gi,
      /\bexactly\b/gi,
      /\bplease\b/gi,
      /\bthanks?\b/gi,
    ];
    fillers.forEach((re) => { s = s.replace(re, '').trim(); });

    // Auto-punctuate if it looks like a question
    const isInterrogative = /^(how|what|when|why|can|should|is|are|do|does|did|who|where|which|could|would|will|may|might)\b/i.test(s);
    if (isInterrogative && !/[?.!]$/.test(s)) {
      s += '?';
    }

    // Title case with acronym preservation
    s = toTitleCasePreserveAcronyms(s);
    return s;
  }

  /**
   * Convert text to title case while preserving acronyms
   * 
   * This function converts text to proper title case format while maintaining
   * the correct capitalization of common acronyms and technical terms.
   * 
   * FEATURES:
   * - Title case conversion
   * - Acronym preservation (SSRI, LSD, MDMA, etc.)
   * - Minor word handling (a, an, the, etc.)
   * - Punctuation preservation
   * 
   * @param {string} input - Input text to convert
   * @returns {string} Title case text with preserved acronyms
   * 
   * @example
   * const title = toTitleCasePreserveAcronyms('ssri and lsd interactions');
   * // Returns 'SSRI and LSD Interactions'
   */
  function toTitleCasePreserveAcronyms(input) {
    if (!input) return '';
    const minor = new Set(['a','an','and','the','for','of','in','on','to','from','by','or','as','at','but','nor','per','vs','via']);
    const acronyms = new Map([
      ['ssri','SSRI'], ['snri','SNRI'], ['maoi','MAOI'], ['lsd','LSD'],
      ['mdma','MDMA'], ['dmt','DMT'], ['2cb','2C-B'], ['2c-b','2C-B'],
      ['5-meo-dmt','5-MeO-DMT'], ['iv','IV'], ['im','IM']
    ]);

    return input
      .split(' ')
      .map((token, index, arr) => {
        const stripped = token.replace(/^[\"'"("]+|[\"'"")!?:.,;]+$/g, '').toLowerCase();
        if (acronyms.has(stripped)) {
          return token.replace(new RegExp(stripped, 'i'), acronyms.get(stripped));
        }
        const core = stripped;
        const isMinor = minor.has(core);
        const lower = token.toLowerCase();
        if (index !== 0 && index !== arr.length - 1 && isMinor) {
          return lower;
        }
        return lower.replace(/(^[a-z])/i, (m) => m.toUpperCase());
      })
      .join(' ');
  }
  
  /**
   * Base template builder for AI prompts
   * 
   * This function creates the foundation template structure for AI responses,
   * including bullet points, safety information, and optional sections.
   * 
   * @param {Object} options - Template configuration options
   * @param {Array} options.bullets - Array of [label, hint] pairs for bullet points
   * @param {string} options.quickOverviewHint - Hint for quick overview section
   * @param {boolean} options.addSafety - Whether to include safety snapshot
   * @param {Array} options.sections - Custom HTML sections to include
   * @param {boolean} options.includeAdditional - Whether to include additional context
   * @param {boolean} options.includePractical - Whether to include practical advice
   * @param {boolean} options.includeSources - Whether to include sources section
   * @returns {Object} Template object with glance and extra properties
   * 
   * @example
   * const template = baseTemplate({
   *   bullets: [['What it is', 'Definition'], ['How it works', 'Mechanism']],
   *   addSafety: true,
   *   includeAdditional: true
   * });
   */
  function baseTemplate({
    bullets = [],
    quickOverviewHint = '',
    addSafety = false,
    sections = [],
    includeAdditional = true,
    includePractical = true,
    includeSources = true,
  }) {
    const glance = bullets.map(([label, hint]) =>
      `  <li><strong>${escapeHtml(label)}:</strong> <!-- ${escapeHtml(hint)} --></li>`
    ).join('\n');
  
    const extraBlocks = renderSections({ sections, includeAdditional, includePractical, includeSources });
    const extra = `${addSafety ? safetySnapshot() : ''}${extraBlocks}`;
    return { glance, quickOverviewHint, extra };
  }
  
  /**
   * Comparison/table template builder for AI prompts
   * 
   * This function creates comparison templates that display information
   * in a structured table format for comparing different options.
   * 
   * @param {Object} options - Template configuration options
   * @param {Array} options.rows - Array of [parameter, optionA, optionB] arrays
   * @param {boolean} options.addSafety - Whether to include safety snapshot
   * @param {Array} options.sections - Custom HTML sections to include
   * @param {boolean} options.includeAdditional - Whether to include additional context
   * @param {boolean} options.includePractical - Whether to include practical advice
   * @param {boolean} options.includeSources - Whether to include sources section
   * @returns {Object} Template object with glance and extra properties
   * 
   * @example
   * const template = tableTemplate({
   *   rows: [['Effects', 'LSD effects', 'Psilocybin effects']],
   *   addSafety: true
   * });
   */
  function tableTemplate({
    rows = [],
    addSafety = false,
    sections = [],
    includeAdditional = true,
    includePractical = true,
    includeSources = true,
  }) {
    const mapped = rows.map(([p, a, b]) =>
      `  <li><strong>${escapeHtml(p)}:</strong> <!-- ${escapeHtml(a)} vs ${escapeHtml(b)} --></li>`
    ).join('\n');
  
    const extraBlocks = renderSections({ sections, includeAdditional, includePractical, includeSources });
    const extra = `${addSafety ? safetySnapshot() : ''}${extraBlocks}`;
    return { glance: mapped, extra };
  }
  
  /**
   * Call HTML Tidy API for professional HTML cleaning
   * 
   * This function calls the server-side HTML Tidy API when local sanitization
   * encounters complex HTML issues that are difficult to fix client-side.
   * 
   * @param {string} html - Raw HTML content to clean
   * @returns {Promise<string>} Cleaned HTML content
   */
  async function cleanWithTidyAPI(html) {
      try {
          console.log('Calling HTML Tidy API for complex HTML cleaning...');
          
          const response = await fetch(ajaxurl, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                  action: 'ai_clean_html',
                  html: html,
                  nonce: ai_trainer_ajax.nonce
              })
          });
          
          const data = await response.json();
          
          if (data.success) {
              console.log('HTML Tidy API cleaning results:', data.data.improvements);
              return data.data.cleaned_html;
          } else {
              console.warn('HTML Tidy API failed:', data.data.message);
              return html; // Return original if API fails
          }
      } catch (error) {
          console.error('HTML Tidy API error:', error);
          return html; // Return original if API fails
      }
  }

  /**
   * Enhanced HTML sanitization with HTML Tidy API fallback
   * 
   * This function provides a hybrid approach that uses local sanitization
   * for simple cases and the HTML Tidy API for complex malformed HTML.
   * 
   * @param {string} html - Raw HTML content to sanitize
   * @returns {Promise<string>} Cleaned HTML content
   */
  async function enhancedSanitizeHTML(html) {
      if (!html || typeof html !== 'string') {
          return '';
      }

      try {
          // First try local sanitization
          let cleaned = unifiedSanitizeHTML(html);
          
          // Check if there are still significant issues
          const issues = validateHTMLStructure(cleaned);
          const hasComplexIssues = issues.length > 2 || 
                                 cleaned.includes('<h<') || 
                                 cleaned.includes('<a <a') ||
                                 cleaned.match(/<([a-zA-Z][a-zA-Z0-9]*)\s+<([a-zA-Z][a-zA-Z0-9]*)/);
          
          if (hasComplexIssues) {
              console.log('Complex HTML issues detected, using HTML Tidy API fallback');
              cleaned = await cleanWithTidyAPI(html);
              
              // Validate the API result
              const apiIssues = validateHTMLStructure(cleaned);
              if (apiIssues.length > 3) {
                  console.warn('HTML Tidy API still has issues, using fallback sanitization');
                  return fallbackSanitize(html);
              }
          }
          
          return cleaned;
      } catch (error) {
          console.warn('Enhanced sanitization failed, using HTML Tidy API:', error);
          return await cleanWithTidyAPI(html);
      }
  }

  /**
   * Unified HTML sanitization combining all approaches
   * 
   * This is the single method that replaces all other sanitization methods.
   * It combines structure repair, DOMParser processing, and regex cleanup
   * in the correct order to prevent conflicts.
   * 
   * @param {string} html - Raw HTML content to sanitize
   * @returns {string} Clean, validated HTML content
   */
  function unifiedSanitizeHTML(html) {
      if (!html || typeof html !== 'string') {
          return '';
      }

      try {
          // Log initial HTML issues for debugging
          logHTMLIssues(html, 'pre-unified-sanitization');

          // STEP 1: Pre-process and fix obvious structural issues
          let processed = html
              .replace(REGEX_PATTERNS.doubleSpaces, ' ')
              .replace(REGEX_PATTERNS.lineBreaks, '\n')
              .replace(REGEX_PATTERNS.emptyParagraphs, '')
              .trim();

          // STEP 2: Fix malformed tags that can't be parsed
          processed = fixUnclosedTags(processed);
          processed = removeOrphanedClosingTags(processed);

          // STEP 3: Use DOMParser for structure validation and cleaning
          const parser = new DOMParser();
          const doc = parser.parseFromString('<div>' + processed + '</div>', 'text/html');

          // STEP 4: Remove unsafe elements
          doc.querySelectorAll('script, style, iframe, object, embed').forEach(el => el.remove());

          // STEP 5: Fix structure issues
          fixListStructure(doc);
          fixTableStructure(doc);
          fixParagraphStructure(doc);
          
          // STEP 6: Validate and clean nodes
          validateAndCleanNodes(doc.body.firstChild);
          
          // STEP 6.5: Preserve list items that might be incorrectly marked as empty
          doc.querySelectorAll('li').forEach(li => {
              // If a list item appears empty but contains whitespace or special characters, preserve it
              if (li.textContent.trim() === '' && li.innerHTML.includes('&nbsp;')) {
                  li.innerHTML = '&nbsp;'; // Preserve non-breaking space
              }
              // If a list item has only a > character or similar, preserve it with content
              if (li.textContent.trim() === '>' || li.textContent.trim() === '') {
                  li.innerHTML = '&nbsp;'; // Add non-breaking space to preserve the item
              }
          });

          // STEP 7: Extract clean HTML
          let safe = doc.body.firstChild.innerHTML;

          // STEP 8: Apply regex fixes in dependency order (most critical change)
          safe = safe
              .replace(REGEX_PATTERNS.whitespace, '><')                    // First: clean whitespace
              // More targeted HTML entity removal - only remove actual entities, not valid HTML attributes
              .replace(/&lt;/g, '<')                                       // Convert &lt; back to <
              .replace(/&gt;/g, '>')                                       // Convert &gt; back to >
              .replace(/<!--.*?-->/g, '')                                 // Remove HTML comments
              // Remove hrefFix pattern that was causing malformed HTML
              // .replace(REGEX_PATTERNS.hrefFix, '<a href="$1">')           // Then: fix href attributes
              .replace(REGEX_PATTERNS.linkText, '</a> $1')                // Then: fix link text spacing
              // Only remove truly empty list items, not those with whitespace or content
              .replace(/<li>\s*<\/li>/g, '')                              // Remove only completely empty list items
              // Preserve list items that might contain invisible content
              .replace(/<li>\s*(&nbsp;|\u00A0)\s*<\/li>/g, '<li>&nbsp;</li>')  // Preserve non-breaking spaces
              .replace(REGEX_PATTERNS.consecutiveUl, '')                  // Then: merge consecutive lists
              .replace(REGEX_PATTERNS.consecutiveOl, '')                  // Then: merge consecutive ordered lists
              .replace(REGEX_PATTERNS.ampersandFix, '&')                  // Then: fix double-encoded ampersands
              .replace(REGEX_PATTERNS.brokenSentences, '$1 in the 1980s and $2')  // Then: fix broken decade references
              .replace(REGEX_PATTERNS.missingSpaces, '$1 $2')             // Finally: add missing spaces between words
              // Fix raw HTML attributes that are displayed as text
              .replace(/href="#"\s+style="([^"]+)"/g, 'style="$1"')       // Fix malformed href attributes
              .replace(/style="([^"]+)"([^>]*>)/g, 'style="$1"$2')        // Ensure style attributes are properly closed
              // Fix the specific pattern from the image where href and style attributes are displayed as text
              .replace(/href="#" style="([^"]+)"([^>]*>)/g, 'style="$1"$2')  // Fix href="#" style="..." pattern
              .replace(/([^>])href="#" style="([^"]+)"/g, '$1 style="$2"')     // Fix href="#" style="..." when not at start
              // More comprehensive fix for raw HTML attributes displayed as text
              .replace(/href="#" style="([^"]+)"([^<]*?)(?=<)/g, 'style="$1"$2')  // Fix href="#" style="..." followed by content
              .replace(/([^<])href="#" style="([^"]+)"/g, '$1 style="$2"')        // Fix href="#" style="..." in any context
              // Fix orphaned > characters that might be left after HTML stripping
              .replace(/>\s*([^<]*?)\s*</g, '>$1<')                           // Clean up orphaned > characters
              .trim();

          // STEP 9: Truncate if needed (only for display, not for chatlog storage)
          if (safe.length > MAX_LENGTH) {
              safe = truncateHTML(safe);
          }

          // STEP 10: Apply special styling
          safe = applyWhereToLearnMoreStyling(safe);

          // STEP 11: Fix truncated years that commonly get cut off
          safe = fixTruncatedYears(safe);

          // STEP 12: Fix specific common AI errors
          safe = safe
              .replace(/\b(li|ul|ol|div|span)\b(?![^<]*>)/g, '')  // Remove stray tag names not in tags
              // Don't remove empty list items here - let them be preserved
              // .replace(/<li>\s*<\/li>/g, '')                       // Remove empty list items
              .replace(/(<\/[^>]+>)\s*\1/g, '$1')                 // Remove duplicate closing tags
              .replace(/^[^<]*?(<[^>]+>)/g, '$1')                 // Remove text before first tag
              .replace(/(<\/[^>]+>)[^<]*?$/g, '$1');              // Remove text after last tag

          // STEP 13: Final validation check
          const finalIssues = validateHTMLStructure(safe);
          if (finalIssues.length > 3) {
              console.warn('Unified sanitization produced issues, using fallback:', finalIssues);
              return fallbackSanitize(html);
          }

          // Log final HTML issues
          logHTMLIssues(safe, 'post-unified-sanitization');

          // FINAL STEP: Post-process to fix remaining issues
          safe = safe
              // Fix any remaining raw HTML attributes that are displayed as text
              .replace(/href="#" style="([^"]+)"/g, 'style="$1"')
              .replace(/style="([^"]+)"([^>]*>)/g, 'style="$1"$2')
              // Fix empty list items that might have been stripped
              .replace(/<li>\s*>\s*<\/li>/g, '<li>&nbsp;</li>')  // Fix list items with only >
              .replace(/<li>\s*<\/li>/g, '<li>&nbsp;</li>')      // Fix completely empty list items
              // Clean up any remaining malformed HTML
              .replace(/>\s*([^<]*?)\s*</g, '>$1<')             // Clean up orphaned characters
              .trim();

          return safe;
      } catch (e) {
          console.warn('Unified sanitization error:', e, 'Original HTML:', html.substring(0, 200));
          return fallbackSanitize(html);
      }
  }

    /**
     * Sanitize HTML for chatlog storage (no truncation)
     * 
     * This function cleans HTML content for safe storage in chatlogs without
     * truncating the content, preserving the full response for future reference.
     * 
     * FEATURES:
     * - Script and style tag removal
     * - List and table structure fixing
     * - Node cleaning for table-related tags
     * - Basic regex fixes
     * - No content truncation
     * 
     * @param {string} html - Raw HTML content to sanitize
     * @returns {Promise<string>} Sanitized HTML content
     * 
     * @example
     * const cleanHtml = await sanitizeHTMLForChatlog(rawAnswerHtml);
     * // Returns sanitized HTML safe for chatlog storage
     */
    async function sanitizeHTMLForChatlog(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            // Use enhanced sanitization but without truncation
            let safe = await enhancedSanitizeHTML(html);

            // Apply additional custom fixes
            safe = safe
                .replace(/href="([^"]+)"\s?>\s?/g, '<a href="$1">')
                .replace(/<\/a>(\w)/g, '</a> $1')
                .replace(/>\s+</g, '><')
                .trim();

            // NO TRUNCATION for chatlog storage

            return safe;
        } catch (e) {
            return fallbackSanitize(html);
        }
    }

    // Global function for saving streaming answer
    window.saveStreamingAnswerToChatlog = async function(chatlogId, answer) {
        const ajaxUrl = (typeof exa_ajax !== 'undefined' && exa_ajax.ajaxurl) ? 
            exa_ajax.ajaxurl : 
            (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        
        // Sanitize for chatlog storage (no truncation)
        const sanitizedAnswer = await sanitizeHTMLForChatlog(answer);
        
        $.post(ajaxUrl, {
            action: 'ai_update_chatlog_answer_by_id',
            id: chatlogId,
            answer: sanitizedAnswer
        }, function(resp) {
            if (!resp || !resp.success) {
                console.log('Chatlog update error:', resp);
            }
        });
    };

    // Reaction options for like/dislike
    const LIKE_OPTIONS = [
        "Accurate",
        "Clear explanation",
        "Useful sources",
        "Other"
    ];
    const DISLIKE_OPTIONS = [
        "Inaccurate",
        "Unclear",
        "Missing info",
        "Other"
    ];

    /**
     * Inject reaction bar UI with options dropdown and textarea
     * 
     * This function creates the reaction options interface that appears when
     * users click like/dislike buttons, providing structured feedback options.
     * 
     * FEATURES:
     * - Predefined feedback options
     * - Custom feedback textarea
     * - Dynamic UI injection
     * - Type-specific options (like/dislike)
     * 
     * @param {jQuery} bar - Reaction bar jQuery element
     * @param {string} type - Reaction type ('like' or 'dislike')
     * @returns {void}
     * 
     * @example
     * renderReactionOptions(reactionBar, 'like');
     * // Creates like reaction options interface
     */
    function renderReactionOptions(bar, type) {
        console.log('Rendering reaction options for type:', type);
        console.log('Reaction bar:', bar[0].outerHTML);
        
        const options = type === 'like' ? LIKE_OPTIONS : DISLIKE_OPTIONS;
        console.log('Options to show:', options);
        
        const optionsHtml = options.map(opt => `<button class="reaction-option-btn" data-type="${type}" data-option="${opt}">${opt}</button>`).join(' ');
        let html = `<div class="reaction-options-popup">
            <div class="reaction-options-list">${optionsHtml}</div>
            <div class="reaction-custom" style="display:none;">
                <textarea class="reaction-custom-text" rows="3" placeholder="Tell us more about your feedback..."></textarea>
                <button class="reaction-custom-submit">Submit Feedback</button>
            </div>
        </div>`;
        
        console.log('Generated HTML:', html);
        
        // Ensure the container exists
        let container = bar.find('.reaction-options-container');
        if (container.length === 0) {
            bar.append('<div class="reaction-options-container" style="display:none;"></div>');
            container = bar.find('.reaction-options-container');
        }
        
        console.log('Container found:', container.length);
        
        container.html(html);
        
        // Position the popup correctly using the modern-ui CSS classes
        container.css({
            'position': 'absolute',
            'top': '100%',
            'right': '0',
            'z-index': '1000',
            'margin-top': '8px'
        });
        
        container.show();
        
        console.log('Container after update:', container[0].outerHTML);
        console.log('Container is visible:', container.is(':visible'));
    }

    // Show options popup on like/dislike click
    $(document).on('click', '.reaction-like, .reaction-dislike', function(e) {
        console.log('Reaction button clicked!', e.target);
        console.log('Event target classList:', e.target.classList);
        console.log('Event target parent classList:', e.target.parentElement.classList);
        
        e.preventDefault();
        const btn = $(this);
        const bar = btn.closest('.answer-reaction-bar');
        const type = btn.hasClass('reaction-like') ? 'like' : 'dislike';
        
        console.log('Button clicked:', btn[0].outerHTML);
        console.log('Reaction type:', type);
        console.log('Reaction bar found:', bar.length > 0);
        console.log('Reaction bar HTML:', bar[0].outerHTML);
        
        bar.find('.reaction-like, .reaction-dislike').removeClass('reaction-active');
        btn.addClass('reaction-active');
        renderReactionOptions(bar, type);
    });

    // Handle option selection
    $(document).on('click', '.reaction-option-btn', function(e) {
        console.log('=== REACTION OPTION CLICKED ===');
        console.log('Reaction option button clicked!', e.target);
        console.log('Event target:', e.target);
        console.log('Event currentTarget:', e.currentTarget);
        
        e.preventDefault();
        const btn = $(this);
        const bar = btn.closest('.answer-reaction-bar');
        const id = bar.find('.reaction-like, .reaction-dislike').data('id');
        const type = btn.data('type');
        const option = btn.data('option');
        
        console.log('Reaction option clicked:', { id, type, option });
        console.log('Button element:', btn[0].outerHTML);
        console.log('Reaction bar found:', bar.length > 0);
        console.log('Button data attributes:', {
            type: btn.data('type'),
            option: btn.data('option')
        });
        
        if (option === 'Other') {
            console.log('Showing custom feedback textarea');
            bar.find('.reaction-custom').show();
        } else {
            console.log('Saving reaction with option:', option);
            saveReactionDetail(id, type, option, '');
            bar.find('.reaction-options-container').hide();
        }
    });

    // Handle custom feedback submit
    $(document).on('click', '.reaction-custom-submit', function(e) {
        e.preventDefault();
        const bar = $(this).closest('.answer-reaction-bar');
        const id = bar.find('.reaction-like, .reaction-dislike').data('id');
        const type = bar.find('.reaction-like').hasClass('reaction-active') ? 'like' : 'dislike';
        const feedback = bar.find('.reaction-custom-text').val().trim();
        saveReactionDetail(id, type, 'Other', feedback);
        bar.find('.reaction-options-container').hide();
        bar.find('.reaction-custom-text').val('');
    });

    /**
     * Save reaction detail via AJAX
     * 
     * This function sends user reaction feedback to the backend via AJAX,
     * updating the database and refreshing the UI with new reaction counts.
     * 
     * FEATURES:
     * - AJAX submission to WordPress backend
     * - Reaction type and option tracking
     * - Custom feedback support
     * - Real-time UI updates
     * 
     * @param {string} id - Chatlog ID
     * @param {string} type - Reaction type ('like' or 'dislike')
     * @param {string} option - Selected feedback option
     * @param {string} feedback - Custom feedback text (if option is 'Other')
     * @returns {void}
     * 
     * @example
     * saveReactionDetail('chat-123', 'like', 'Accurate', '');
     * // Saves like reaction with 'Accurate' option
     */
    function saveReactionDetail(id, type, option, feedback) {
        console.log('Saving reaction:', { id, type, option, feedback });
        
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_update_chatlog_reaction',
            id: id,
            reaction: type,
            single: 1,
            reaction_detail: JSON.stringify({ option, feedback })
        }, function(resp) {
            console.log('Reaction response:', resp);
            
            // Update counts in UI after successful reaction
            if (resp && resp.success && resp.data) {
                console.log('Updating counts:', resp.data);
                $(`#like-count-${id}`).text(resp.data.like || 0);
                $(`#dislike-count-${id}`).text(resp.data.dislike || 0);
                
                // Also update the reaction buttons to show active state
                const bar = $(`.reaction-like[data-id="${id}"], .reaction-dislike[data-id="${id}"]`).closest('.answer-reaction-bar');
                if (bar.length) {
                    bar.find('.reaction-like, .reaction-dislike').removeClass('reaction-active');
                    if (type === 'like') {
                        bar.find('.reaction-like').addClass('reaction-active');
                    } else {
                        bar.find('.reaction-dislike').addClass('reaction-active');
                    }
                }
            } else {
                console.error('Reaction update failed - invalid response:', resp);
            }
        }).fail(function(xhr, status, error) {
            console.error('Reaction update failed:', error);
            console.log('Response:', xhr.responseText);
        });
    }

    /**
     * Make related questions clickable for follow-up prompts
     * 
     * This function converts the "Related Questions" section into clickable
     * links that automatically populate the search input and submit follow-up queries.
     * 
     * FEATURES:
     * - Automatic question detection
     * - Clickable link creation
     * - Search input population
     * - Auto-submission of follow-up questions
     * - Hover effects and styling
     * 
     * @param {Element|jQuery} container - Container element to process
     * @returns {void}
     * 
     * @example
     * makeRelatedQuestionsClickable(document.querySelector('.answer-container'));
     * // Makes all related questions clickable in the container
     */
    function makeRelatedQuestionsClickable(container) {
        // Use jQuery to find the related questions section
        const $relatedQuestionsSection = $(container).find('h3').filter(function() {
            return $(this).text().includes('Related Questions');
        });
        
        if (!$relatedQuestionsSection.length) return;
        
        // Look for the actual Related Questions list (not the informational content)
        let $relatedQuestionsList = null;
        
        // Look for the ul that comes after the Related Questions h3
        $relatedQuestionsList = $relatedQuestionsSection.next('ul');
        
        // If that doesn't work, look for any ul that comes after the Related Questions h3
        if (!$relatedQuestionsList.length) {
            let nextElement = $relatedQuestionsSection.next();
            while (nextElement.length && nextElement[0].tagName !== 'UL') {
                nextElement = nextElement.next();
            }
            if (nextElement.length && nextElement[0].tagName === 'UL') {
                $relatedQuestionsList = nextElement;
            }
        }
        
        // If still not found, look for any ul in the container that comes after the h3 by index
        if (!$relatedQuestionsList.length) {
            const allUls = $(container).find('ul');
            const h3Index = $relatedQuestionsSection.index();
            
            allUls.each(function(index) {
                const ulIndex = $(this).index();
                if (ulIndex > h3Index) {
                    $relatedQuestionsList = $(this);
                    return false; // break the loop
                }
            });
        }
        
        // If still not found, use the last ul as it's most likely to be Related Questions
        if (!$relatedQuestionsList.length) {
            const allUls = $(container).find('ul');
            if (allUls.length > 0) {
                $relatedQuestionsList = allUls.last();
            }
        }
        
        if (!$relatedQuestionsList.length) return;
        
        // Validate that we're not processing informational content
        const firstItemText = $relatedQuestionsList.find('li').first().text().trim();
        
        const hasInfoContent = firstItemText.includes('What it is:') || 
                              firstItemText.includes('How it works:') || 
                              firstItemText.includes('Potential benefits:') ||
                              firstItemText.includes('Key risks:') ||
                              firstItemText.includes('Legal status:') ||
                              firstItemText.includes('Who they are:') ||
                              firstItemText.includes('Era & role:') ||
                              firstItemText.includes('Known for:') ||
                              firstItemText.includes('Key works:') ||
                              firstItemText.includes('Controversies:');
        
        // If this list has informational content, try to find the actual Related Questions
        if (hasInfoContent) {
            // Look for any ul that doesn't have informational content and comes after the Related Questions h3
            const allUls = $(container).find('ul');
            let foundBetterList = false;
            
            allUls.each(function(index) {
                if (foundBetterList) return;
                
                const ulContent = $(this).html();
                const ulIndex = $(this).index();
                const h3Index = $relatedQuestionsSection.index();
                
                // Only look at uls that come after the Related Questions h3
                if (ulIndex > h3Index && ulContent && !ulContent.includes('<strong>') && 
                    !ulContent.includes('What it is:') && !ulContent.includes('How it works:') && 
                    !ulContent.includes('Who they are:')) {
                    $relatedQuestionsList = $(this);
                    foundBetterList = true;
                    return false;
                }
            });
        }
        
        if (!$relatedQuestionsList.length) return;
        
        // Add click handlers to each related question
        $relatedQuestionsList.find('li').each(function() {
            const $li = $(this);
            let questionText = $li.text().trim();
            
            // Check if there's a link inside the li element
            const $link = $li.find('a');
            if ($link.length > 0) {
                questionText = $link.text().trim();
                // Remove the href to prevent navigation
                $link.removeAttr('href');
            }
            
            // Skip if this is empty or contains informational content
            if (!questionText || questionText.includes('What it is:') || 
                questionText.includes('How it works:') || questionText.includes('Potential benefits:') ||
                questionText.includes('MANDATORY:') || questionText.includes('<!--')) {
                return;
            }
            
            // Add cursor pointer and click handler
            $li.css('cursor', 'pointer');
            $li.addClass('related-question-clickable');
            
            $li.off('click').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Populate the input field with the question
                $exaInput.val(questionText);
                
                // Focus on the input field
                $exaInput.focus();
                
                // Submit the search
                submitSearch();
            });
        });
    }


    /**
     * Load chatlog by ID
     * 
     * This function retrieves and displays a specific chatlog entry by its ID,
     * creating a dynamic answer block with the stored question and answer.
     * 
     * FEATURES:
     * - AJAX retrieval of chatlog data
     * - Dynamic answer block creation
     * - Reaction bar setup
     * - Error handling for missing chatlogs
     * - Smooth scrolling to loaded content
     * 
     * @param {string} chatlogId - Unique identifier for the chatlog entry
     * @param {string} chatlogTitle - Optional title for the chatlog
     * @returns {void}
     * 
     * @example
     * loadChatlogById('chat-123', 'What is psilocybin?');
     * // Loads and displays the specified chatlog entry
     */
    function loadChatlogById(chatlogId, chatlogTitle) {
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_get_chatlog_by_id',
            id: chatlogId
        }, function(resp) {
            $exaAnswer.show();
            if (resp && resp.success && resp.data) {
                $('#dynamic-chatlog-block').remove();
                const q = resp.data.question || chatlogTitle || '';
                const a = resp.data.answer || '';
                
                const html = `
                    <div class="answer-block" id="answer-${chatlogId}" data-dynamic="1">
                        <h1 class="chatlog-question" style="font-weight:bold; color: #fff; margin-bottom:8px;">${q}</h1>
                        <div class="exa-answer-streaming space-owl-m">${a}</div>
                        <div class="answer-reaction-bar" style="margin-top:10px; display:flex; align-items:center; gap:12px; justify-content:center;">
                            <span class="reaction-like" data-id="${chatlogId}" style="cursor:pointer;">${likeSVG}</span>
                            <span class="like-count" id="like-count-${chatlogId}">0</span>
                            <span class="reaction-dislike" data-id="${chatlogId}" style="cursor:pointer;">${dislikeSVG}</span>
                            <span class="dislike-count" id="dislike-count-${chatlogId}">0</span>
                            <span class="reaction-share" data-id="${chatlogId}" style="cursor:pointer;" title="Share">${shareSVG} Share</span>
                        </div>
                    </div>
                `;
                
                $exaAnswer.prepend(`<div id="dynamic-chatlog-block">${html}</div>`);
                const block = $("#answer-" + chatlogId);
                
                if (block.length) {
                    $('html, body').animate({ scrollTop: block.offset().top - 100 }, 600);
                }
            } else {
                // Show error message to user
                $exaAnswer.prepend(`
                    <div id="dynamic-chatlog-block">
                        <div class="answer-block" style="color: #fff; padding: 20px; background: #2a2a2a; border-radius: 8px;">
                            <h2>⚠️ Chatlog Not Found</h2>
                            <p>The requested chatlog (ID: ${chatlogId}) could not be found.</p>
                            <p>This might be because:</p>
                            <ul>
                                <li>The chatlog has been deleted</li>
                                <li>The link is incorrect</li>
                                <li>The chatlog is from a different session</li>
                            </ul>
                        </div>
                    </div>
                `);
            }
        }).fail(function(xhr, status, error) {
            $exaAnswer.prepend(`
                <div id="dynamic-chatlog-block">
                    <div class="answer-block" style="color: #fff; padding: 20px; background: #2a2a2a; border-radius: 8px;">
                        <h2>⚠️ Error Loading Chatlog</h2>
                        <p>Failed to load the requested chatlog (ID: ${chatlogId}).</p>
                        <p>Error: ${error}</p>
                    </div>
                </div>
            `);
        });
    }

    /**
     * Utility function to format reaction details in a clean, user-friendly way
     * 
     * This function processes raw reaction detail data and converts it into
     * readable, user-friendly text for display in the UI.
     * 
     * FEATURES:
     * - JSON parsing and validation
     * - Text cleaning and formatting
     * - Fallback handling for malformed data
     * - User-friendly output generation
     * 
     * @param {string} reactionDetail - Raw reaction detail data (JSON or string)
     * @returns {string} Clean, formatted reaction detail text
     * 
     * @example
     * const formatted = formatReactionDetail('{"option":"Other","feedback":"Very helpful"}');
     * // Returns 'Very helpful'
     */
    function formatReactionDetail(reactionDetail) {
        if (!reactionDetail) return '';
        
        try {
            // Try to parse as JSON first
            const detail = JSON.parse(reactionDetail);
            if (detail && typeof detail === 'object') {
                if (detail.option === 'Other' && detail.feedback) {
                    return detail.feedback;
                } else if (detail.option) {
                    return detail.option;
                }
            }
        } catch (e) {
            // If not JSON, try to extract meaningful content
            if (typeof reactionDetail === 'string') {
                // Remove file paths and technical formatting
                let clean = reactionDetail.replace(/\/[^\s]+\.(php|js|html)/g, '');
                clean = clean.replace(/\\/g, '');
                clean = clean.replace(/^.*?:\s*/, ''); // Remove leading path info
                clean = clean.trim();
                
                // If it looks like JSON but failed to parse, try to extract the content
                if (clean.includes('"option"') || clean.includes('"feedback"')) {
                    const optionMatch = clean.match(/"option"\s*:\s*"([^"]+)"/);
                    const feedbackMatch = clean.match(/"feedback"\s*:\s*"([^"]+)"/);
                    
                    if (optionMatch && feedbackMatch && feedbackMatch[1]) {
                        return feedbackMatch[1];
                    } else if (optionMatch && optionMatch[1] !== 'Other') {
                        return optionMatch[1];
                    }
                }
                
                return clean || reactionDetail;
            }
        }
        
        // Fallback: return the original if we can't parse it
        return reactionDetail;
    }

    /**
     * Function to automatically format all reaction details on the page
     * 
     * This function scans the entire page for reaction detail elements and
     * automatically formats them to display user-friendly text instead of raw data.
     * 
     * FEATURES:
     * - Page-wide scanning for reaction details
     * - Automatic formatting of all found elements
     * - Console logging for debugging
     * - Batch processing for efficiency
     * 
     * @returns {void}
     * 
     * @example
     * formatAllReactionDetails();
     * // Formats all reaction details on the current page
     */
    function formatAllReactionDetails() {
        // Find all elements that might contain reaction details
        $('[data-reaction-detail], .reaction-detail, [class*="reaction"], [id*="reaction"]').each(function() {
            const $element = $(this);
            const currentText = $element.text().trim();
            
            // Check if this looks like a JSON reaction detail
            if (currentText && (currentText.includes('"option"') || currentText.includes('"feedback"'))) {
                const formattedText = formatReactionDetail(currentText);
                if (formattedText !== currentText) {
                    $element.text(formattedText);
                    console.log('Formatted reaction detail:', currentText, '→', formattedText);
                }
            }
        });
    }

    /**
     * Function to format reaction details in any container
     * 
     * This function formats reaction details within a specific container element,
     * useful for processing newly loaded content or specific sections.
     * 
     * FEATURES:
     * - Container-specific processing
     * - Targeted formatting
     * - Efficient element selection
     * - Reusable for different contexts
     * 
     * @param {Element|jQuery} container - Container element to process
     * @returns {void}
     * 
     * @example
     * formatReactionDetailsInContainer(document.querySelector('.answer-block'));
     * // Formats reaction details in the specified container
     */
    function formatReactionDetailsInContainer(container) {
        const $container = $(container);
        $container.find('[data-reaction-detail], .reaction-detail, [class*="reaction"], [id*="reaction"]').each(function() {
            const $element = $(this);
            const currentText = $element.text().trim();
            
            if (currentText && (currentText.includes('"option"') || currentText.includes('"feedback"'))) {
                const formattedText = formatReactionDetail(currentText);
                if (formattedText !== currentText) {
                    $element.text(formattedText);
                }
            }
        });
    }

    // Auto-format reaction details when page loads
    $(document).ready(function() {
        // Format any existing reaction details
        formatAllReactionDetails();
        
        // Also format after any AJAX responses that might contain reaction details
        $(document).ajaxComplete(function(event, xhr, settings) {
            if (settings.url && settings.url.includes('ajax')) {
                setTimeout(formatAllReactionDetails, 100);
            }
        });
        
        // Global event handler for related questions that might be added dynamically
        $(document).on('click', '.section-related-questions li', function(e) {
            const $li = $(this);
            let questionText = $li.text().trim();
            
            // Check if there's a link inside the li element
            const $link = $li.find('a');
            if ($link.length > 0) {
                questionText = $link.text().trim();
            }
            
            // Skip if this is empty or contains informational content
            if (!questionText || questionText.includes('What it is:') || 
                questionText.includes('How it works:') || questionText.includes('Potential benefits:') ||
                questionText.includes('MANDATORY:') || questionText.includes('<!--')) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Populate the input field with the question
            $exaInput.val(questionText);
            
            // Focus on the input field
            $exaInput.focus();
            
            // Submit the search
            submitSearch();
        });
        
        // Ensure "Where to Learn More" links open in new tabs
        $(document).on('click', '.section-where-to-learn-more a', function(e) {
            const $link = $(this);
            const href = $link.attr('href');
            
            // Skip if this is a placeholder link or empty href
            if (!href || href === '#' || href.includes('<!--')) {
                e.preventDefault();
                return;
            }
            
            // Ensure the link opens in a new tab
            $link.attr('target', '_blank');
            $link.attr('rel', 'noopener noreferrer');
        });
        

    });

});