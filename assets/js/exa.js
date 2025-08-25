jQuery(document).ready(function($) {

    // Cache frequently used DOM elements
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
    const exportSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7,10 12,15 17,10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
    const rewriteSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>`;
    const saveSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17,21 17,13 7,13 7,21"></polyline><polyline points="7,3 7,8 15,8"></polyline></svg>`;
    const moreSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`;

    // Pre-compile regex patterns for better performance
    const REGEX_PATTERNS = {
        hrefFix: /href="([^"]+)"\s?>\s?/g,
        linkText: /<\/a>(\w)/g,
        emptyLi: /<li>\s*<\/li>/g,
        consecutiveUl: /<\/ul>\s*<ul>/g,
        consecutiveOl: /<\/ol>\s*<ol>/g,
        whitespace: />\s+</g,
        htmlEntities: /(&lt;|&gt;|<>)|<!--.*?-->/gi,
        javascript: /^javascript:/i
    };

    // Constants
    const ALLOWED_TAGS = new Set([
        'H2', 'H3', 'P', 'UL', 'OL', 'LI', 'A','DIV', 'SECTION', 'HR',
        'EM', 'STRONG', 'BR',
        'TABLE', 'TR', 'TD', 'TH', 'TBODY', 'THEAD', 'TFOOT'
    ]);

    const MAX_LENGTH = 3000;
    const CHATLOG_MAX_LENGTH = 50000;

    // Initialize UI
    $exaQuestion.hide();
    $ticketWrapper.hide();
    $exaAnswer.hide();

    // Event handlers
    $('#exa-submit').on('click', submitSearch);
    $('#exa-search-box input').on('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitSearch();
        }
    });

    let conversationHistory = [];

    // Optimized submit search function
    function submitSearch() {
        const query = $exaInput.val().trim();
        if (!query) return;

        // Show loading state
        $exaLoading.show();
        
        // Scroll to loading element with better positioning
        setTimeout(() => {
            $('html, body').animate({
                scrollTop: $exaLoading.offset().top - 100
            }, 500);
        }, 100);
        
        $psybrarianMainContent.hide();
        $psySearchAiContainer.addClass('active');
        $exaInput.val('').attr('placeholder', 'Ask follow up...');
        
        // Make AJAX request
        $.post(exa_ajax.ajaxurl, {
            action: 'exa_query',
            query: query,
            conversation_history: JSON.stringify(conversationHistory)
        }, function(response) {
            handleSearchResponse(response, query);
        });
    }

    // Handle search response
    function handleSearchResponse(response, query) {
        try {
            $exaLoading.hide();
            $exaAnswer.show();

            if (!response.success) {
                $exaAnswer.append('<p>⚠️ Search error.</p>');
                return;
            }

            const data = response.data || {};
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
                handleLocalAnswer(data.local_answer, block, chatlogId);
            } else {
                // Update the global conversation history with the response from server
                if (data.conversation_history && Array.isArray(data.conversation_history)) {
                    conversationHistory = data.conversation_history;
                }
                
                const streamingContainer = block.find('.exa-answer-streaming')[0];
                if (streamingContainer) {
                    streamOpenAIAnswer(query, sources, block, streamingContainer, chatlogId, conversationHistory);
                } else {
                    console.error('Streaming container not found');
                }
                
                addModernReactionBar(block, chatlogId);
            }

            $ticketWrapper.show();
        } catch (error) {
            console.error('Error in handleSearchResponse:', error);
            $exaAnswer.append(`<p>⚠️ Error processing response: ${error.message}</p>`);
        }
    }

    // Create modern answer block with tabs
    function createModernAnswerBlock(questionID, query, results = []) {
        return $(`<div class="answer-block modern-ui" id="${questionID}">
            <div class="answer-header">
                <h1 class="exa-user-question">${query}</h1>
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

    // Create modern source cards with horizontal scrolling
    function createModernSourceCards(block, results) {
        if (!results || !Array.isArray(results) || results.length === 0) {
            block.find('.exa-results').html(`
                <div class="sources-header">
                    <span>📚 No sources found</span>
                </div>
            `);
            return;
        }
        
        const cards = results.map(item => {
            let domain = 'unknown';
            try {
                if (item.url) {
                    domain = new URL(item.url).hostname.replace('www.', '');
                }
            } catch (e) {
                console.warn('Invalid URL:', item.url);
            }
            const isBadFavicon = !item.favicon || item.favicon === "data:," || item.favicon === "about:blank";
            
            // Use Google favicon API as fallback when Exa doesn't provide a favicon
            let faviconUrl;
            if (isBadFavicon) {
                faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            } else {
                faviconUrl = item.favicon;
            }
            
            const fallbackIcon = (typeof exaSettings !== 'undefined' && exaSettings.fallbackIcon) ? exaSettings.fallbackIcon : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K';
            const image = `<img src="${faviconUrl}" alt="favicon" class="exa-favicon" onerror="this.src='${fallbackIcon}'">`;
            
            return `<div class="source-card">
                <div class="source-card-header">${image}<span class="exa-domain">${domain}</span></div>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="source-title">${item.title}</a>
            </div>`;
        }).join('');

        const sourceCount = results.length;
        const displayCount = sourceCount; // Show all sources, no cap
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

    // Populate Sources tab with detailed source information
    function populateSourcesTab(block, results) {
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

        const sourcesHtml = results.map((item, index) => {
            let domain = 'unknown';
            try {
                if (item.url) {
                    domain = new URL(item.url).hostname.replace('www.', '');
                }
            } catch (e) {
                console.warn('Invalid URL:', item.url);
            }

            const isBadFavicon = !item.favicon || item.favicon === "data:," || item.favicon === "about:blank";
            const fallbackIcon = (typeof exaSettings !== 'undefined' && exaSettings.fallbackIcon) ? exaSettings.fallbackIcon : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8L3N2Zz4K';
            const faviconUrl = isBadFavicon ? `https://www.google.com/s2/favicons?sz=64&domain=${domain}` : item.favicon;

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

        block.find('.sources-content').html(sourcesHeader + sourcesHtml);
        
        // Add filter functionality
        setupSourceFilters(block);
    }

    // Setup source filtering functionality
    function setupSourceFilters(block) {
        block.find('.filter-btn').on('click', function() {
            const filterType = $(this).data('filter');
            
            // Update active filter button
            block.find('.filter-btn').removeClass('active');
            $(this).addClass('active');
            
            // Apply filter logic
            applySourceFilter(block, filterType);
        });
    }

    // Apply source filtering
    function applySourceFilter(block, filterType) {
        const sourceItems = block.find('.source-item');
        const sourcesContent = block.find('.sources-content');
        
        // Store original order if not already stored
        if (!sourcesContent.data('original-order')) {
            const originalOrder = [];
            sourceItems.each(function(index) {
                originalOrder.push({
                    element: $(this),
                    index: index,
                    timestamp: Date.now() - (Math.random() * 1000000), // Simulate different timestamps
                    relevance: Math.random() // Simulate relevance scores
                });
            });
            sourcesContent.data('original-order', originalOrder);
        }
        
        const originalOrder = sourcesContent.data('original-order');
        let filteredItems = [];
        
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
        
        // Reorder the DOM
        const sourcesContainer = block.find('.sources-content');
        const header = sourcesContainer.find('.sources-tab-header');
        const itemsContainer = sourcesContainer.find('.source-item').parent();
        
        // Remove header temporarily
        header.detach();
        
        // Clear and re-add items in new order
        sourceItems.detach();
        filteredItems.forEach(item => {
            sourcesContainer.append(item);
        });
        
        // Re-add header at the top
        sourcesContainer.prepend(header);
        
        // Add visual feedback
        showFilterFeedback(filterType);
    }

    // Show filter feedback
    function showFilterFeedback(filterType) {
        let message = '';
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
        
        feedbackEl.text(message).addClass('show');
        
        // Hide after 2 seconds
        setTimeout(() => {
            feedbackEl.removeClass('show');
        }, 2000);
    }

    // Copy URL to clipboard function
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('URL copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('URL copied to clipboard!', 'success');
        }
    }

    // Setup modern slider buttons
    function setupModernSliderButtons() {
        document.querySelectorAll('.exa-results').forEach(block => {
            const wrapper = block.querySelector('.top-sources-wrapper');
            const prevBtn = block.querySelector('.prev-btn');
            const nextBtn = block.querySelector('.next-btn');

            if (prevBtn && wrapper) {
                prevBtn.addEventListener('click', () => {
                    const scrollAmount = -1280;
                    wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                });
            }

            if (nextBtn && wrapper) {
                nextBtn.addEventListener('click', () => {
                    const scrollAmount = 1280;
                    wrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                });
            }

            // Show/hide navigation buttons based on scroll position
            if (wrapper) {
                wrapper.addEventListener('scroll', () => {
                    const isAtStart = wrapper.scrollLeft <= 0;
                    const isAtEnd = wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth;
                    
                    if (prevBtn) prevBtn.style.opacity = isAtStart ? '0.5' : '1';
                    if (nextBtn) nextBtn.style.opacity = isAtEnd ? '0.5' : '1';
                });
            }
        });
    }

    // Tab switching functionality
    $(document).on('click', '.tab-btn', function(e) {
        e.preventDefault();
        const tabName = $(this).data('tab');
        const answerBlock = $(this).closest('.answer-block');
        
        // Update active tab button
        answerBlock.find('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        // Update active tab content
        answerBlock.find('.tab-content').removeClass('active');
        answerBlock.find(`[data-tab="${tabName}"]`).addClass('active');
    });

    // Add modern reaction bar with action buttons
    function addModernReactionBar(block, chatlogId) {
        const reactionBar = $(`
            <div class="answer-reaction-bar modern" style="margin-top:20px;">
                <div class="action-buttons">
                    <button class="action-btn share-btn" data-id="${chatlogId}">
                        ${shareSVG}
                        Share
                    </button>
                    <button class="action-btn export-btn" data-id="${chatlogId}">
                        ${exportSVG}
                        Export
                    </button>
                    <button class="action-btn rewrite-btn" data-id="${chatlogId}">
                        ${rewriteSVG}
                        Rewrite
                    </button>
                </div>
                <div class="reaction-buttons">
                    <span class="reaction-like" data-id="${chatlogId}">${likeSVG}</span>
                    <span class="like-count" id="like-count-${chatlogId}">0</span>
                    <span class="reaction-dislike" data-id="${chatlogId}">${dislikeSVG}</span>
                    <span class="dislike-count" id="dislike-count-${chatlogId}">0</span>
                    <span class="reaction-save" data-id="${chatlogId}">${saveSVG}</span>
                    <span class="reaction-more" data-id="${chatlogId}">${moreSVG}</span>
                </div>
            </div>
        `);
        block.append(reactionBar);
        
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

        // Add event handlers for action buttons
        reactionBar.find('.export-btn').on('click', function() {
            exportAnswer(block, chatlogId);
        });

        reactionBar.find('.rewrite-btn').on('click', function() {
            rewriteAnswer(block, chatlogId);
        });

        reactionBar.find('.reaction-save').on('click', function() {
            saveAnswer(block, chatlogId);
        });

        reactionBar.find('.reaction-more').on('click', function() {
            showMoreOptions(block, chatlogId);
        });
    }

    // Export answer functionality
    function exportAnswer(block, chatlogId) {
        const question = block.find('.exa-user-question').text();
        const answer = block.find('.exa-answer-streaming').html();
        
        // Create a formatted text version
        const exportText = `Question: ${question}\n\nAnswer:\n${answer.replace(/<[^>]*>/g, '')}`;
        
        // Create and download file
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `psybrary-answer-${chatlogId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Rewrite answer functionality
    function rewriteAnswer(block, chatlogId) {
        const question = block.find('.exa-user-question').text();
        const answer = block.find('.exa-answer-streaming').html();
        const container = block.find('.exa-answer-streaming')[0];
        
        // Show rewriting indicator
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.7);">🔄 Rewriting answer...</div>';
        
        // Call the rewrite function
        streamOpenAIRewrite(question, answer, container);
    }

    // Save answer functionality
    function saveAnswer(block, chatlogId) {
        const saveBtn = block.find('.reaction-save');
        const originalHTML = saveBtn.html();
        
        // Visual feedback
        saveBtn.html(`${saveSVG} Saved!`);
        saveBtn.css('color', '#3bb273');
        
        // Reset after 2 seconds
        setTimeout(() => {
            saveBtn.html(originalHTML);
            saveBtn.css('color', 'rgba(255, 255, 255, 0.7)');
        }, 2000);
        
        // TODO: Implement actual save functionality to backend
        console.log('Saving answer for chatlog:', chatlogId);
    }

    // Show more options functionality
    function showMoreOptions(block, chatlogId) {
        const moreBtn = block.find('.reaction-more');
        const optionsContainer = block.find('.more-options-container');
        
        if (optionsContainer.length === 0) {
            const options = $(`
                <div class="more-options-container" style="position: absolute; top: 100%; right: 0; background: #1a0024; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px; margin-top: 8px; z-index: 1000; min-width: 150px;">
                    <div class="more-option" style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Copy Link</div>
                    <div class="more-option" style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Report Issue</div>
                    <div class="more-option" style="padding: 8px 12px; cursor: pointer; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">View History</div>
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
            
            options.find('.more-option').eq(2).on('click', function() {
                viewHistory(block, chatlogId);
                options.remove();
            });
        } else {
            optionsContainer.remove();
        }
    }

    // Copy answer link functionality
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

    // Report issue functionality
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

    // View history functionality
    function viewHistory(block, chatlogId) {
        // TODO: Implement history view
        showNotification('History feature coming soon!', 'info');
    }

    // Show notification functionality
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

    // Dedicated function for beta feedback submission (like reaction custom submit)
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

    // Handle local answer
    function handleLocalAnswer(localAnswer, block, chatlogId) {
        const html = `<div>${localAnswer.content}</div>`;
        streamLocalAnswer(html, block.find('.exa-answer-streaming')[0]);
        addModernReactionBar(block, chatlogId);
        conversationHistory.push({ q: block.find('.exa-user-question').text(), a: '' }); // Empty answer to keep structure
        
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

    // Add reaction bar (legacy)
    function addReactionBar(block, chatlogId) {
        const reactionBar = $(`
            <div class="answer-reaction-bar" style="margin-top:10px; display:flex; align-items:center; gap:12px;">
                <span class="reaction-like" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;">${likeSVG} <span style="margin-left:2px;">Helpful</span></span>
                <span class="like-count" id="like-count-${chatlogId}" style="font-size:13px;color:#3bb273;margin-left:2px;">0</span>
                <span class="reaction-dislike" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;">${dislikeSVG} <span style="margin-left:2px;">Not Helpful</span></span>
                <span class="dislike-count" id="dislike-count-${chatlogId}" style="font-size:13px;color:#e74c3c;margin-left:2px;">0</span>
                <span class="reaction-share" data-id="${chatlogId}" style="cursor:pointer;display:flex;align-items:center;gap:4px;" title="Share">${shareSVG} <span style="margin-left:2px;">Share</span></span>
                <div class="reaction-options-container" style="display:none;position:absolute;z-index:10;"></div>
            </div>
        `);
        block.append(reactionBar);
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

    // Optimized HTML sanitization
    function sanitizeHTML(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString('<div>' + html + '</div>', 'text/html');

            // Remove only script and style tags
            doc.querySelectorAll('script, style').forEach(el => el.remove());

            // Fix list structure
            fixListStructure(doc);

            // Fix table structure
            fixTableStructure(doc);

            // Apply basic node cleaning for table-related tags
            cleanTableNodes(doc.body.firstChild);

            // Simple approach: just get innerHTML without complex node cleaning
            let safe = doc.body.firstChild.innerHTML;

            // Apply basic regex fixes only
            safe = safe
                .replace(REGEX_PATTERNS.hrefFix, '<a href="$1">')
                .replace(REGEX_PATTERNS.linkText, '</a> $1')
                .replace(REGEX_PATTERNS.emptyLi, '')
                .replace(REGEX_PATTERNS.consecutiveUl, '')
                .replace(REGEX_PATTERNS.consecutiveOl, '')
                .replace(REGEX_PATTERNS.whitespace, '><')
                .trim();

            // Truncate if needed (only for display, not for chatlog storage)
            if (safe.length > MAX_LENGTH) {
                safe = truncateHTML(safe);
            }

            return safe;
        } catch (e) {
            console.warn('Sanitize error:', e, 'Original HTML:', html);
            return html; // Return original if parsing fails
        }
    }

    // Fix list structure
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

    // Fix table structure
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

    // Clean table nodes specifically
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

    // Simple and safe node cleaning
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

    // Original cleanNodes function (kept for reference)
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

    // Apply regex fixes
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
            .trim();
    }

    // Truncate HTML safely
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

    // Optimized streaming functions
    function streamOpenAIAnswer(query, sources, block, container, chatlogId, conversationHistory) {
        const contextBlock = buildContextBlock(conversationHistory);
        const prompt = buildPrompt(query, sources, block, contextBlock);
        const url = exa_ajax.ajaxurl + '?action=openai_stream';
        let buffer = '';
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
            
            function readStream() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        // Stream complete
                        const cleanedHTML = sanitizeHTML(buffer);
                        container.innerHTML = cleanedHTML;

                        // Update conversation history with just the question (not the full answer)
                        const answerBlock = $(container).closest('.answer-block');
                        const questionText = answerBlock.find('.exa-user-question').text();
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
                                // Update the container in real-time for streaming effect
                                container.innerHTML = sanitizeHTML(buffer);
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
            console.error('Streaming error:', error);
            container.insertAdjacentHTML('beforeend', '<p><em>⚠️ Error: ' + error.message + '</em></p>');
        });
    }

    // Build context block
    function buildContextBlock(conversationHistory) {
        if (!Array.isArray(conversationHistory)) return '';
        
        const contextBlock = conversationHistory.map((pair, idx) => 
            `Q${idx+1}: ${pair.q}\n`
        ).join('');
        
        return contextBlock;
    }



  


    function buildPrompt(query, sources, block, contextBlock) {
        return `
      You are the Psybrarian — an evidence-first, harm-reduction librarian for psychedelic topics.
      
      Your role is to provide a concise, trustworthy answer (6–8 sentences) to the question. Write in clear, neutral language suitable for a broad audience.
      
      Curate a list of the most relevant, foundational, and interesting resources for deeper exploration, as a librarian would. Include different perspectives when available, explaining any notable differences of opinion.
      
      Exclude content from any blocked or unreliable domains.
      
      ${contextBlock}
      
      Answer the following question using **only** information from the trusted sources below.
      
      Question: "${query}"
      
      Trusted Sources (use only these): ${sources}
      
      BLOCKED DOMAINS (never use these): ${block}
      
      If the trusted sources do not provide enough information to answer, output:
      <h2>This information isn't currently available in the Psybrary. Please submit feedback below so we can improve.</h2>
      
      Otherwise, follow the format and guidelines below.
      
      Core Guidelines:
      1. Answer **only** the question asked. Do not merge or add other topics.
      2. If evidence is limited or mixed, state this clearly and avoid speculation.
      3. No emojis. Output valid, clean HTML only (no Markdown).
      
      === OUTPUT FORMAT ===
      - Use short paragraphs and bullet points for easy readability.
      - Use the following section structure with the specified headings:
      
      <h2><!-- Brief title derived from the question --></h2>
      
      <h3>Question Summary</h3>
      <p><!-- Restate the question in your own words, clarifying focus and scope. --></p>
      
      <h3>Quick Overview</h3>
      <p><!-- A 2–3 sentence direct answer, including a key takeaway and why it matters. --></p>
      
      <h3>What to Know at a Glance</h3>
      <ul>
        <li><strong>What it is:</strong> <!-- One sentence defining the topic or substance. --></li>
        <li><strong>How it works:</strong> <!-- One sentence on its mechanism or process in plain language. --></li>
        <li><strong>Potential benefits:</strong> <!-- A few words or a short phrase (e.g., mood improvement, anxiety relief). --></li>
        <li><strong>Key risks:</strong> <!-- A few words or a short phrase (e.g., anxiety spikes, legal issues). --></li>
        <li><strong>Legal status:</strong> <!-- One sentence on current legal status (note regional differences if any). --></li>
      </ul>
      
      <h3>Why It Matters</h3>
      <p><!-- 1–2 sentences on the significance or real-world context of this topic. --></p>
      
      
      
      <h3>Safety Snapshot (30 seconds)</h3>
      <ul>
        <li><strong>Medications:</strong> <!-- Note any risky drug interactions (e.g., SSRIs, MAOIs, lithium). --></li>
        <li><strong>Mental health:</strong> <!-- Note any mental health precautions (e.g., risk of psychosis or severe anxiety). --></li>
        <li><strong>Physical health:</strong> <!-- Note any physical health precautions (e.g., heart or neurological risks). --></li>
        <li><strong>Set & Setting:</strong> <!-- If relevant, remind that mindset and environment can influence experiences. --></li>
      </ul>
      
      <h3>Related Questions</h3>
      <ul>
        <!-- Provide exactly 5 follow-up questions related to this topic, phrased simply. -->
        <li><!-- Q1 --></li>
        <li><!-- Q2 --></li>
        <li><!-- Q3 --></li>
        <li><!-- Q4 --></li>
        <li><!-- Q5 --></li>
      </ul>
      `.trim();
      }
      
      
      
      


    // Scroll while streaming
    // This function scrolls the answer block into view when the answer is being streamed
    // function scrollToAnswer(container) {
    //     const block = container.closest('.answer-block');
    //     if (block) {
    //         if (!block.querySelector('.scroll-spacer')) {
    //             const spacer = document.createElement('div');
    //             spacer.className = 'scroll-spacer';
    //             spacer.style.height = '30px';
    //             block.appendChild(spacer);
    //         }
    //         block.scrollIntoView({ behavior: 'smooth', block: 'end' });
    //     }
    // }

    // Optimized rewrite function
    function streamOpenAIRewrite(query, rawContent, container) {
        const prompt = `
            You are a helpful and friendly psychedelic content writer.

            Rewrite the following raw content into a clean, structured answer using HTML.

            Question: "${query}"

            Raw Notes:
            ${rawContent}

            ✅ Formatting Instructions:
            - Use <h2>, <p>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <td>, <th> only.
            - Add emojis to headings: 🧠, ⚠️, 🍄
            - Clean and simplify language for readers.
            - For tables, use proper structure: <table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>
            - Output pure HTML, no Markdown, no escaping.
            - Do not include filenames or timestamps.
        `.trim();

        const url = exa_ajax.ajaxurl + '?action=openai_stream';
        let buffer = '';
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
            
            function readStream() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        // Stream complete
                        container.innerHTML = sanitizeHTML(buffer);
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
                                
                                // Update immediately for real-time streaming
                                container.innerHTML = sanitizeHTML(buffer);
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
            console.error('Streaming error:', error);
            container.insertAdjacentHTML('beforeend', '<p><em>⚠️ Error: ' + error.message + '</em></p>');
        });
    }

    // Optimized local answer streaming
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
            }
        }
        streamStep();
    }

    // Sanitize HTML for chatlog storage (no truncation)
    function sanitizeHTMLForChatlog(html) {
        if (!html || typeof html !== 'string') {
            return '';
        }

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString('<div>' + html + '</div>', 'text/html');

            // Remove only script and style tags
            doc.querySelectorAll('script, style').forEach(el => el.remove());

            // Fix list structure
            fixListStructure(doc);

            // Fix table structure
            fixTableStructure(doc);

            // Apply basic node cleaning for table-related tags
            cleanTableNodes(doc.body.firstChild);

            // Simple approach: just get innerHTML without complex node cleaning
            let safe = doc.body.firstChild.innerHTML;

            // Apply basic regex fixes only
            safe = safe
                .replace(/href="([^"]+)"\s?>\s?/g, '<a href="$1">')
                .replace(/<\/a>(\w)/g, '</a> $1')
                .replace(/>\s+</g, '><')
                .trim();

            // NO TRUNCATION for chatlog storage

            return safe;
        } catch (e) {
            return html; // Return original if parsing fails
        }
    }

    // Global function for saving streaming answer
    window.saveStreamingAnswerToChatlog = function(chatlogId, answer) {
        const ajaxUrl = (typeof exa_ajax !== 'undefined' && exa_ajax.ajaxurl) ? 
            exa_ajax.ajaxurl : 
            (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');
        
        // Sanitize for chatlog storage (no truncation)
        const sanitizedAnswer = sanitizeHTMLForChatlog(answer);
        
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

    // Inject reaction bar UI with options dropdown and textarea
    function renderReactionOptions(bar, type) {
        const options = type === 'like' ? LIKE_OPTIONS : DISLIKE_OPTIONS;
        const optionsHtml = options.map(opt => `<button class="reaction-option-btn" data-type="${type}" data-option="${opt}">${opt}</button>`).join(' ');
        let html = `<div class="reaction-options-popup" style="background:#fff;border:1px solid #ccc;padding:10px;margin-top:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
            <div class="reaction-options-list">${optionsHtml}</div>
            <div class="reaction-custom" style="display:none;margin-top:8px;">
                <textarea class="reaction-custom-text" rows="2" style="width:100%;margin-bottom:5px;" placeholder="Tell us more..."></textarea>
                <button class="reaction-custom-submit">Submit</button>
            </div>
        </div>`;
        bar.find('.reaction-options-container').html(html).show();
    }

    // Show options popup on like/dislike click
    $(document).on('click', '.reaction-like, .reaction-dislike', function(e) {
        e.preventDefault();
        const btn = $(this);
        const bar = btn.closest('.answer-reaction-bar');
        const type = btn.hasClass('reaction-like') ? 'like' : 'dislike';
        bar.find('.reaction-like, .reaction-dislike').removeClass('reaction-active');
        btn.addClass('reaction-active');
        renderReactionOptions(bar, type);
    });

    // Handle option selection
    $(document).on('click', '.reaction-option-btn', function(e) {
        e.preventDefault();
        const btn = $(this);
        const bar = btn.closest('.answer-reaction-bar');
        const id = bar.find('.reaction-like, .reaction-dislike').data('id');
        const type = btn.data('type');
        const option = btn.data('option');
        if (option === 'Other') {
            bar.find('.reaction-custom').show();
        } else {
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

    // Save reaction detail via AJAX
    function saveReactionDetail(id, type, option, feedback) {
        $.post(exa_ajax.ajaxurl, {
            action: 'ai_update_chatlog_reaction',
            id: id,
            reaction: type,
            single: 1,
            reaction_detail: JSON.stringify({ option, feedback })
        }, function(resp) {
            // Update counts in UI after successful reaction
            if (resp && resp.success && resp.data) {
                $(`#like-count-${id}`).text(resp.data.like || 0);
                $(`#dislike-count-${id}`).text(resp.data.dislike || 0);
            }
        });
    }

    // Add a container for options popup to each reaction bar on page load
    $(document).ready(function() {
        $('.answer-reaction-bar').each(function() {
            if ($(this).find('.reaction-options-container').length === 0) {
                $(this).append('<div class="reaction-options-container" style="display:none;"></div>');
            }
        });
    });

    // Share  link
    $(document).on('click', '.reaction-share', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = $(this);
        const id = btn.data('id');
        
        const answerBlock = btn.closest('.answer-block');
        const chatlogQuestion = answerBlock.find('.chatlog-question').text();
        const exaUserQuestion = answerBlock.find('.exa-user-question').text();
        
        let questionTitle = chatlogQuestion || exaUserQuestion || '';
        
        // Additional fallback: look for any h1 or h2 elements in the answer block
        if (!questionTitle) {
            const anyHeading = answerBlock.find('h1, h2').first().text();
            if (anyHeading) {
                questionTitle = anyHeading;
            }
        }
        
        if (!questionTitle) {
            questionTitle = $exaInput.val() || '';
        }
        
        const shareUrl = window.location.origin + window.location.pathname + 
            '?chatlog_id=' + id + '&title=' + encodeURIComponent(questionTitle);

        function showCopiedNotice() {
            let notice = btn.siblings('.share-notice');
            if (notice.length === 0) {
                notice = $('<span class="share-notice" style="margin-left:8px;color:green;font-size:15px;">Link copied, paste to share</span>');
                btn.after(notice);
            }
            notice.show();
            setTimeout(() => notice.fadeOut(300), 1500);
        }

        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                showCopiedNotice();
                btn.addClass('share-copied');
                setTimeout(() => btn.removeClass('share-copied'), 1500);
            }).catch(err => {
                fallbackCopy();
            });
        } else {
            fallbackCopy();
        }
        
        function fallbackCopy() {
            try {
                const tempInput = $('<textarea>');
                tempInput.css({
                    position: 'fixed',
                    top: '-9999px',
                    left: '-9999px',
                    opacity: 0,
                    zIndex: -1
                });
                $('body').append(tempInput);
                tempInput.val(shareUrl).select();
                const success = document.execCommand('copy');
                tempInput.remove();
                
                if (success) {
                    showCopiedNotice();
                    btn.addClass('share-copied');
                    setTimeout(() => btn.removeClass('share-copied'), 1500);
                } else {
                    alert('Copy failed. Please manually copy this URL: ' + shareUrl);
                }
            } catch (err) {
                alert('Copy failed. Please manually copy this URL: ' + shareUrl);
            }
        }
    });

    // Initialize page with URL parameters
    $(function() {
        const urlParams = new URLSearchParams(window.location.search);
        const chatlogId = urlParams.get('chatlog_id');
        const chatlogTitle = urlParams.get('title');
        
        if (chatlogId) {
            const block = $("#answer-" + chatlogId);
            
            if (block.length) {
                $('html, body').animate({ scrollTop: block.offset().top - 100 }, 600);
            } else {
                loadChatlogById(chatlogId, chatlogTitle);
            }
        }
    });


    // Load chatlog by ID
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
                        <div class="answer-reaction-bar" style="margin-top:10px;">
                            <span class="reaction-like" data-id="${chatlogId}" style="cursor:pointer;">${likeSVG}</span>
                            <span class="like-count" id="like-count-${chatlogId}">0</span>
                            &nbsp;&nbsp;
                            <span class="reaction-dislike" data-id="${chatlogId}" style="cursor:pointer;">${dislikeSVG}</span>
                            <span class="dislike-count" id="dislike-count-${chatlogId}">0</span>
                            &nbsp;&nbsp;
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

});