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
    const CHATLOG_MAX_LENGTH = 50000; // Much higher limit for chatlog storage

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

        // Debug: Log conversation history being sent
        console.log('Sending conversation history:', conversationHistory);
        
        // Make AJAX request
        $.post(exa_ajax.ajaxurl, {
            action: 'exa_query',
            query: query,
            conversation_history: JSON.stringify(conversationHistory)
        }, function(response) {
            handleSearchResponse(response, query);
        });
    }

    // Add this function to handle new chat functionality
    function newChat() {
        // Clear the conversation history properly
        if (typeof conversationHistory !== 'undefined') {
            conversationHistory = [];
        }
        
        // Also clear any global conversation history
        if (typeof window.conversationHistory !== 'undefined') {
            window.conversationHistory = [];
        }
        
        // Clear any stored conversation data in localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('ai_conversation_history');
            localStorage.removeItem('ai_search_results');
        }
        
        // Reset the UI elements
        $psybrarianMainContent.show();
        $psySearchAiContainer.removeClass('active');
        $exaInput.val('').attr('placeholder', 'Ask anything about psychedelics');
        
        $exaLoading.hide();
        $exaAnswer.hide().empty(); // Hide and clear the content
        $ticketWrapper.hide();
        
        // Scroll to top of the page
        $('html, body').animate({ scrollTop: 0 }, 500);
        
        // Log for debugging
        console.log('New chat started - conversation history cleared');
        console.log('conversationHistory after clear:', conversationHistory);
    }

    // Handle search response
    function handleSearchResponse(response, query) {
        $exaLoading.hide();
        $exaAnswer.show();

        if (!response.success) {
            $exaAnswer.append('<p>⚠️ Search error.</p>');
            return;
        }

        const data = response.data;
        const sources = data.sources;
        const blockedDomains = data.block_domains;
        const results = (data.search && data.search.results) ? data.search.results : [];
        const chatlogId = data.chatlog_id || null;
        const conversationHistoryResp = data.conversation_history || conversationHistory;
        
        // Debug: Log conversation history received
        console.log('Received conversation history:', conversationHistoryResp);

        const questionID = 'answer-' + Date.now();
        const block = createAnswerBlock(questionID, query);
        $exaAnswer.append(block);

        if (results.length) {
            createSourceCards(block, results);
        }

        setupSliderButtons();

        if (data.local_answer) {
            handleLocalAnswer(data.local_answer, block, chatlogId);
        } else {
            // Update the global conversation history with the response from server
            if (data.conversation_history && Array.isArray(data.conversation_history)) {
                conversationHistory = data.conversation_history;
            }
            streamOpenAIAnswer(query, sources, blockedDomains, block.find('.exa-answer-streaming')[0], chatlogId, conversationHistory);
            addReactionBar(block, chatlogId);
        }

        $ticketWrapper.show();
    }

    // Create answer block
    function createAnswerBlock(questionID, query) {
        return $(`<div class="answer-block" id="${questionID}">
            <h1 class="exa-user-question">${query}</h1>
            <div class="exa-results"></div>
            <div class="exa-answer-streaming space-owl-m"></div>
        </div>`);
    }

    // Create source cards
    function createSourceCards(block, results) {
        const cards = results.map(item => {
            const domain = new URL(item.url).hostname.replace('www.', '');
            const isBadFavicon = !item.favicon || item.favicon === "data:," || item.favicon === "about:blank";
            
            // Use Google favicon API as fallback when Exa doesn't provide a favicon
            let faviconUrl;
            if (isBadFavicon) {
                faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
            } else {
                faviconUrl = item.favicon;
            }
            
            const image = `<img src="${faviconUrl}" alt="favicon" class="exa-favicon" onerror="this.src='${exaSettings.fallbackIcon}'">`;
            
            return `<div class="source-card">
                <div class="source-card-header">${image}<span class="exa-domain">${domain}</span></div>
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="source-title">${item.title}</a>
            </div>`;
        }).join('');

        block.find('.exa-results').html(`
            <button class="slider-btn prev-btn">&#10094;</button>
            <div class="top-sources-wrapper">${cards}</div>
            <button class="slider-btn next-btn">&#10095;</button>
        `);
    }

    // Setup slider buttons
    function setupSliderButtons() {
        document.querySelectorAll('.exa-results').forEach(block => {
            const wrapper = block.querySelector('.top-sources-wrapper');
            const prevBtn = block.querySelector('.prev-btn');
            const nextBtn = block.querySelector('.next-btn');

            if (prevBtn && wrapper) {
                prevBtn.addEventListener('click', () => {
                    wrapper.scrollBy({ left: -300, behavior: 'smooth' });
                });
            }

            if (nextBtn && wrapper) {
                nextBtn.addEventListener('click', () => {
                    wrapper.scrollBy({ left: 300, behavior: 'smooth' });
                });
            }
        });
    }

    // Dedicated function for beta feedback submission (like reaction custom submit)
    function submitBetaFeedback(chatlogId, feedback, form) {
        // Remove previous error messages
        form.find('span').remove();
        // Debug log
        console.log('Submitting beta feedback:', { chatlogId, feedback });
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
        addReactionBar(block, chatlogId);
        conversationHistory.push({ q: block.find('.exa-user-question').text(), a: '' }); // Empty answer to keep structure
        
        // Limit conversation history to last 5 exchanges to prevent context overflow
        if (conversationHistory.length > 5) {
            conversationHistory = conversationHistory.slice(-5);
        }
        
        // Add follow-up prompt after reaction bar
        setTimeout(() => {
            const reactionBar = block.find('.answer-reaction-bar');
            if (reactionBar.length && !block.find('.follow-up-prompt').length) {
                const followUpPrompt = $('<div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;">Ask a follow up question and we can continue our conversation or <button class="new-chat-btn" style="background: #3bb273; color: white; border: none; padding: 7px 12px; border-radius: 4px; cursor: pointer; margin: 0 5px;">New chat</button> and we can discuss another topic.</div> <div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;"> We’re still building and improving the Psybrary based on community feedback. See something missing, unclear, or off? <button class="beta-feedback-btn" style="background:#3bb273;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Submit feedback</button><div class="beta-feedback-form" style="display:none;margin-top:10px;"><textarea class="beta-feedback-text" rows="3" style="width:90%;margin-bottom:8px;" placeholder="Your feedback..."></textarea><br><button class="beta-feedback-submit" style="background:#0C0012;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Send</button></div></div>');
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
                block.find('.new-chat-btn').on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open('https://beta.psychedelics.com/#psybrary', '_blank');
                });
            }
        }, 100); // Small delay to ensure reaction bar is added
    }

    // Add reaction bar
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
                .replace(/href="([^"]+)"\s?>\s?/g, '<a href="$1">')
                .replace(/<\/a>(\w)/g, '</a> $1')
                .replace(/>\s+</g, '><')
                .trim();

            // Truncate if needed (only for display, not for chatlog storage)
            if (safe.length > MAX_LENGTH) {
                safe = truncateHTML(safe);
            }

            // Debug: Check for table content
            if (html.includes('<table') && !safe.includes('<table')) {
                console.warn('Table content was removed during sanitization', {
                    original: html.substring(0, 500),
                    sanitized: safe.substring(0, 500)
                });
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
        const url = exa_ajax.ajaxurl + '?action=openai_stream&prompt=' + encodeURIComponent(prompt);
        
        const eventSource = new EventSource(url);
        let buffer = '';
        container.innerHTML = '';

        eventSource.onmessage = function(event) {
            const chunk = event.data;
            if (chunk && chunk !== '[DONE]') {
                buffer += chunk;
                container.innerHTML = buffer;
                // scrollToAnswer(container);
            }
        };

        eventSource.addEventListener('done', function() {
            eventSource.close();
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
                const followUpPrompt = $('<div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;">Ask a follow up question and we can continue our conversation or <button class="new-chat-btn" style="background: #3bb273; color: white; border: none; padding: 7px 12px; border-radius: 4px; cursor: pointer; margin: 0 5px;">New chat</button> and we can discuss another topic.</div> <div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;"> We’re still building and improving the Psybrary based on community feedback. See something missing, unclear, or off? <button class="beta-feedback-btn" style="background:#3bb273;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Submit feedback</button><div class="beta-feedback-form" style="display:none;margin-top:10px;"><textarea class="beta-feedback-text" rows="3" style="width:90%;margin-bottom:8px;" placeholder="Your feedback..."></textarea><br><button class="beta-feedback-submit" style="background:#0C0012;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Send</button></div></div>');
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
        });

        eventSource.onerror = function() {
            eventSource.close();
            container.insertAdjacentHTML('beforeend', '<p><em>⚠️ Connection closed.</em></p>');
        };
    }

    // Build context block
    function buildContextBlock(conversationHistory) {
        if (!Array.isArray(conversationHistory)) return '';
        
        const contextBlock = conversationHistory.map((pair, idx) => 
            `Q${idx+1}: ${pair.q}\n`
        ).join('');
        
        return contextBlock;
    }

    // Build prompt
    // function buildPrompt(query, sources, block, contextBlock) {
    //     return `
    //         You are a psychedelic expert and content writer.
            
    //         ${contextBlock}
            
    //         Answer the following question clearly, accurately, and safely using ONLY the information from the trusted sources below.
            
    //         Question: "${query}"
            
    //         Trusted Sources (use ONLY these):
    //         ${sources}

    //         🚫 BLOCKED DOMAINS (DO NOT mention or reference these websites):
    //         ${block}
            
    //         ⚠️ Content Rules:
    //         - Your answer MUST be based strictly on the provided trusted sources. Do NOT invent facts or use knowledge not included in the sources.
    //         - NEVER combine or re-answer previous questions unless the current one directly depends on them.
    //         - Ensure all responses are helpful, direct, and use clear language.
    //         - If the sources are limited, respond conservatively and avoid speculation.
    //         - NEVER mention, reference, or link to any of the blocked domains listed above.
    //         - Do not include any information from blocked domains in your response.
            
    //         📐 Formatting Rules:
    //         - Output ONLY valid HTML using the following tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <a href="...">, <table>, <thead>, <tbody>, <tr>, <td>, <th>.
    //         - Use <h2> once at the top for the main title with an emoji (e.g., <h2>🧠 How to Use LSD</h2>).
    //         - Use <h3> for sub-sections with relevant emojis (e.g., <h3>⚠️ Risks and Warnings</h3>).
    //         - NEVER place <p>, <h2>, or <h3> inside a <ul> or <ol>. Always close lists before adding headings or paragraphs.
    //         - For tables, use proper structure: <table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>
    //         - NEVER break HTML tags across chunks. Send full tags like <h3>...</h3> or <p>...</p> in one complete piece.
    //         - Do NOT use Markdown (**bold**, > quotes), escape brackets (&lt;, &gt;), or code blocks.
            
    //         ✅ End every response with this section:
    //         <h3>📚 Sources</h3>
    //         <ul>
    //         <li><a href="https://example1.com" target="_blank">Source Name 1</a></li>
    //         <li><a href="https://example2.com" target="_blank">Source Name 2</a></li>
    //         </ul>
            
    //         Only return valid, clean HTML. Do not explain anything outside the answer.
    //     `.trim();
    // }

    // function buildPrompt(query, sources, block, contextBlock) {
    //     return `
    //         You are a psychedelic expert and content writer.
    
    //         ${contextBlock}
    
    //         Answer the following question clearly, accurately, and safely using ONLY the information from the trusted sources below.
    
    //         Question: "${query}"
    
    //         🧾 Question Summary  
    //         ${query}
    
    //         🔍 Core Insight  
    //         Provide a concise, 1–2 sentence key takeaway that gives the most essential information someone should know about the topic before reading the rest of the answer.
    
    //         Trusted Sources (use ONLY these):
    //         ${sources}
    
    //         🚫 BLOCKED DOMAINS (DO NOT mention or reference these websites):
    //         ${block}
    
    //         ⚠️ Core Guardrails:
    //         1. **Source Integrity** – Your answer MUST be based strictly on the provided trusted sources. Do NOT invent facts or use knowledge not included in the sources.
    //         2. **No Question Merging** – NEVER combine or re-answer previous questions unless the current one directly depends on them.
    //         3. **Blocked Sources** – NEVER mention, reference, or link to any of the blocked domains.
    //         4. **Conservative If Limited Data** – If the sources are limited, respond conservatively and avoid speculation.
    
    //         🛡 Guardrail 1: Contraindications for All Drug/Psychoactive Use
    //         - If the question involves any drug or psychoactive substance, always include a clearly labeled <h3>🚫 Contraindications</h3> section.
    //         - Wrap the entire Contraindications block in <section class="contra-card">…</section>.
    //         - Insert <hr class="contra-sep"> between each category group.
    //         - Organize by these categories (emoji + heading for each):
    //             🧠 Mental Health & Neurological Risks  
    //             💊 Drug Interactions  
    //             ❤️ Medical Conditions  
    //             🤰 Reproductive & Hormonal Considerations  
    //             🧬 Genetic / Family History  
    //             🏠 Environmental & Social Factors  
    //             🌈 Marginalized Populations  
    //             🧘 Spiritual & Existential Risks  
    //         - For each category, summarize in **two lines**:  
    //             Risk: Plain-language description of the concern.  
    //             Action: Clear recommended next step.
    
    //         🛡 Guardrail 2: Sexual-Nature Questions
    //         - If the question involves sexual activity, intimacy, or consent:
    //             - Affirm that **all sexual activity requires explicit, informed, and enthusiastic consent**.
    //             - State clearly that sexual contact without consent is sexual assault or abuse, and is unethical and illegal in most jurisdictions.
    //             - Discourage unsafe, coercive, or non-consensual behavior in all contexts, including when substances are involved.
    //             - Highlight safety, respect, and mutual agreement, especially in altered states.
    //             - Encourage readers to seek help from trusted individuals, hotlines, or authorities if they have experienced or are at risk of sexual harm.
    //             - Include this example block:  
    //               <h3>⚠️ Critical Warning on Sex, Safety & Intoxicated Decision-Making</h3>  
    //               <p>Psychedelics can lower inhibitions and blur boundaries. Under no circumstance is it safe, ethical, or legal to initiate sexual contact with someone under the influence without their clear, sober, and ongoing consent. If you are unsure—don’t do it.</p>
    
    //         🛡 Guardrail 3: Non-Consensual Dosing
    //         - If the question involves giving someone psychedelics without their knowledge or consent, include:  
    //           <h3>⚠️ Non-Consensual Psychedelic Use Is Never Okay</h3>  
    //           <p>Being given a psychedelic substance without your knowledge or consent is a serious violation of autonomy and safety. It is unethical, unsafe, potentially illegal, and can be traumatic or medically dangerous.</p>  
    //           <ul>
    //             <li>🛑 Never a harmless prank, “healing shortcut,” or romantic gesture — it can be assault or abuse, with serious legal consequences.</li>
    //             <li>💥 Altered states increase vulnerability; drug interactions can be dangerous; psychological harm may be long-term.</li>
    //             <li>💡 If this happened to you: prioritize safety, seek trusted support, and consider medical/legal help.</li>
    //           </ul>
    //           <p>✅ Bottom Line: No one should ever be given psychedelics without their full, informed, and enthusiastic consent.</p>
    
    //         📐 Formatting Rules:
    //         - Output ONLY valid HTML using: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <a>, <table>, <thead>, <tbody>, <tr>, <td>, <th>.
    //         - Use <h2> once at the top for the main title with an emoji.
    //         - Use <h3> for sub-sections with relevant emojis.
    //         - NEVER place <p>, <h2>, or <h3> inside a <ul> or <ol>.
    //         - For tables, use correct structure.
    //         - NEVER break HTML tags across chunks.
    //         - Do NOT use Markdown or escape brackets.
    
    //         ✅ End every response with:
    //         <h3>📚 Sources</h3>
    //         <ul>
    //         <li><a href="https://example1.com" target="_blank">Source Name 1</a></li>
    //         <li><a href="https://example2.com" target="_blank">Source Name 2</a></li>
    //         </ul>
    
    //         Only return valid, clean HTML. Do not explain anything outside the answer.
    //     `.trim();
    // }

    function buildPrompt(query, sources, block, contextBlock) {
        return `
        You are a psychedelic expert and content writer.

        ${contextBlock}

        Answer the following question clearly, accurately, and safely using ONLY the information from the trusted sources below.

        Question: "${query}"

        🧾 Question Summary
        ${query}

        🔍 Core Insight
        Provide a concise, 1–2 sentence takeaway with the most essential info before the rest of the answer.

        Trusted Sources (use ONLY these):
        ${sources}

        🚫 BLOCKED DOMAINS (NEVER mention or reference):
        ${block}

        Safety Selection Rules (apply BEFORE writing):
        - Decide which specific contraindication subsections (if any) are relevant to THIS question.
        - If the question is a broad “What is <substance>?” overview, include ALL subsections.
        - If the question targets a specific risk (e.g., pregnancy, SSRIs, heart disease, spiritual integration), include ONLY that matching subsection (and at most one closely-related subsection if absolutely necessary).
        - If nothing is clearly relevant, include NO contraindication subsection.
        - DO NOT include any subsection that you did not explicitly select.

        Output Contract (MANDATORY):
        1) First, Check the question and decide which contraindication subsections apply.
        - Use the keys from the Safety Section Library below.
        Allowed keys: mental-neuro | interactions | medical | repro | genetic | env-social | marginalized | spiritual | ALL
        2) Then write the answer HTML.
        3) In your HTML, paste ONLY the subsection blocks from the Safety Section Library that match the keys you listed. If you wrote NONE, paste nothing. If you wrote ALL, paste all subsections.

        Few-shot Guidance (follow exactly):
        Q: "Can I take psychedelics while I'm pregnant?"
        (Include only Reproductive & Hormonal.)

        Q: "Is psilocybin safe with SSRIs?"
        (Include only Drug Interactions.)

        Q: "How do I integrate an ego-dissolution experience?"
        (Include only Spiritual & Existential.)

        Q: "What is LSD?"
        SAFETY_SECTIONS: ALL
        (Include all subsections.)

        Q: "How long is a ketamine session?"
        (Prefer NONE unless directly relevant.)

        ⚠️ Core Guardrails:
        1. Source Integrity – Use only the provided sources.
        2. No Question Merging – Answer only this query.
        3. Blocked Sources – Never cite blocked domains.
        4. Conservative If Limited Data – Avoid speculation.

        <!-- ===== Safety Section Library (NO EMOJIS). COPY-PASTE ONLY WHAT YOU SELECTED. ===== -->

        <section data-safety="mental-neuro">
        <h4>Mental Health & Neurological</h4>
        <ul>
        <li><strong>Psychosis/Schizophrenia</strong><br>May trigger episodes.<br>Action: Avoid unless under professional care.</li>
        <li><strong>Bipolar Disorder</strong><br>Can cause mania.<br>Action: Only with professional support.</li>
        <li><strong>Borderline Personality Disorder</strong><br>Risk of emotional dysregulation.<br>Action: Trauma-informed care recommended.</li>
        <li><strong>Dissociative Disorders</strong><br>May destabilize perception.<br>Action: Avoid unless clinically supported.</li>
        <li><strong>Severe Anxiety/OCD</strong><br>May intensify symptoms.<br>Action: Ensure grounding/support.</li>
        <li><strong>Traumatic Brain Injury</strong><br>Unpredictable effects.<br>Action: Consult a physician.</li>
        </ul>
        </section>

        <section data-safety="interactions">
        <h4>Drug Interactions</h4>
        <ul>
        <li><strong>SSRIs</strong><br>Possible blunted effects / serotonin risk.<br>Action: Consult a clinician.</li>
        <li><strong>MAOIs</strong><br>Dangerous interactions with some meds/foods.<br>Action: Avoid unsafe combinations.</li>
        <li><strong>Stimulants</strong><br>Raises heart rate/blood pressure.<br>Action: Avoid mixing with psychedelics.</li>
        <li><strong>Lithium</strong><br>Seizure/serotonin risk.<br>Action: Do not combine.</li>
        </ul>
        </section>

        <section data-safety="medical">
        <h4>Medical</h4>
        <ul>
        <li><strong>Heart Conditions</strong><br>Increased cardiac strain.<br>Action: Cardiology clearance.</li>
        <li><strong>Diabetes</strong><br>Possible glycemic disruption.<br>Action: Monitor closely.</li>
        <li><strong>Liver/Kidney Disease</strong><br>Metabolism/excretion issues.<br>Action: Adjust/avoid as advised.</li>
        <li><strong>Glaucoma</strong><br>May raise intraocular pressure.<br>Action: Consult ophthalmology.</li>
        </ul>
        </section>

        <section data-safety="repro">
        <h4>Reproductive & Hormonal</h4>
        <ul>
        <li><strong>Pregnancy/Nursing</strong><br>Insufficient safety data.<br>Action: Avoid.</li>
        <li><strong>Menstruation</strong><br>May affect state and comfort.<br>Action: Plan accordingly.</li>
        </ul>
        </section>

        <section data-safety="genetic">
        <h4>Genetic / Family History</h4>
        <ul>
        <li><strong>Family Mental Illness</strong><br>Higher adverse risk.<br>Action: Proceed only with professional support.</li>
        </ul>
        </section>

        <section data-safety="env-social">
        <h4>Environmental & Social</h4>
        <ul>
        <li><strong>Lack of Integration Support</strong><br>Risk of unresolved distress.<br>Action: Arrange support.</li>
        <li><strong>Unsafe Home</strong><br>May worsen outcomes.<br>Action: Ensure safety.</li>
        </ul>
        </section>

        <section data-safety="marginalized">
        <h3>Contraindications</h3>
        <h4>Contextual Considerations</h4>
        <ul>
        <li><strong>Gender-Diverse Individuals</strong><br>Risk in non-affirming spaces.<br>Action: Choose inclusive facilitators.</li>
        <li><strong>Racial/Ethnic Minorities</strong><br>Risk of cultural insensitivity.<br>Action: Seek competent providers.</li>
        </ul>
        </section>

        <section data-safety="spiritual">
        <h4>Spiritual & Existential</h4>
        <ul>
        <li><strong>Religious Trauma</strong><br>Some settings can retraumatize.<br>Action: Choose safe spaces.</li>
        <li><strong>Fear of Ego Loss</strong><br>May overwhelm.<br>Action: Prepare with skilled support.</li>
        </ul>
        </section>

        <!-- ===== End Library ===== -->

        Sex/Intoxication Warning (include only if query is about sex/intimacy during altered states):
        <h3>Critical Warning on Sex, Safety & Intoxicated Decision-Making</h3>
        <p>Psychedelics can lower inhibitions and blur boundaries. Never initiate sexual contact with someone under the influence without clear, sober, ongoing consent.</p>

        Non-Consensual Dosing Warning (include only if query mentions dosing without consent/spiking):
        <h3>Non-Consensual Psychedelic Use Is Never Okay</h3>
        <p>Being dosed without consent is unethical, unsafe, potentially illegal, and can be traumatic.</p>
        <ul>
        <li>Can be assault/abuse with serious legal consequences.</li>
        <li>Risks include vulnerability, dangerous drug interactions, long-term harm.</li>
        <li>If it happened: seek safety, support, and medical/legal help.</li>
        </ul>

        📐 Formatting Rules:
        - Only valid HTML (<h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>, <a>, <table>, <thead>, <tbody>, <tr>, <td>, <th>, <section>).
        - One <h2> main title at top.
        - <h3> for subsections.
        - Never put <p> or headings inside lists.
        - Tables must be correct.
        - No Markdown or escaped brackets.

        ✅ End with:
        <h3>Sources</h3>
        <ul>
        <li><a href="https://example1.com" target="_blank">Source Name 1</a></li>
        <li><a href="https://example2.com" target="_blank">Source Name 2</a></li>
        </ul>

        Only return valid, clean HTML.
        `.trim();
    }
    function scrollToAnswer(container) {
        const block = container.closest('.answer-block');
        if (block) {
            if (!block.querySelector('.scroll-spacer')) {
                const spacer = document.createElement('div');
                spacer.className = 'scroll-spacer';
                spacer.style.height = '30px';
                block.appendChild(spacer);
            }
            block.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

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

        const url = exa_ajax.ajaxurl + '?action=openai_stream&prompt=' + encodeURIComponent(prompt);
        const eventSource = new EventSource(url);

        let buffer = '';
        let renderTimeout = null;
        container.innerHTML = '';

        eventSource.onmessage = function(event) {
            const chunk = event.data;
            buffer += chunk;

            if (renderTimeout) clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                container.innerHTML = sanitizeHTML(buffer);
            }, 50);
        };

        eventSource.onerror = function() {
            container.insertAdjacentHTML('beforeend', '<p><em>⚠️ Connection closed.[rewriting]</em></p>');
            eventSource.close();
        };

        eventSource.addEventListener('done', function() {
            eventSource.close();
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

    // Optimized share handler with better event delegation
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