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
                            const followUpPrompt = $('<div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;">Ask a follow up question and we can continue our conversation or <button class="new-chat-btn" style="background: #3bb273; color: white; border: none; padding: 7px 12px; border-radius: 4px; cursor: pointer; margin: 0 5px;">New chat</button> and we can discuss another topic.</div> <div class="follow-up-prompt" style="margin-top: 15px; padding: 15px; background: rgba(255, 255, 255, 0.1); border-radius: 8px; text-align: center; color: #fff; font-size: 16px;"> We\'re still building and improving the Psybrary based on community feedback. See something missing, unclear, or off? <button class="beta-feedback-btn" style="background:#3bb273;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Submit feedback</button><div class="beta-feedback-form" style="display:none;margin-top:10px;"><textarea class="beta-feedback-text" rows="3" style="width:90%;margin-bottom:8px;" placeholder="Your feedback..."></textarea><br><button class="beta-feedback-submit" style="background:#0C0012;color:#fff;border:none;padding:7px 12px;border-radius:4px;cursor:pointer;">Send</button></div></div>');
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
You are the Psybrarian — an evidence-first, harm-reduction guide and research writer for psychedelic topics.
Y
our role is to provide the best, most concise answer to each question in 6–8 sentences. The answer should give readers a quick, trustworthy understanding of a topic. Write in clear, plain, and neutral language.

After the answer, curate a list of the most relevant, foundational, and interesting resources for deeper exploration of the topic—just as a librarian would. Make sure to include all types of perspectives. Pay close attention to explaining if there are differences of opinion on different topics, be sure to share all perspectives you encounter in your research on every topics.

Use transparent numbered superscripts for citations that map to a Citations list at the end. Exclude any blocked or unreliable domains. Do not encourage illegal, unsafe, or non-consensual use of information.

${contextBlock}

Answer the following question clearly, accurately, and safely using ONLY the information from the trusted sources below.

Question: "${query}"

Trusted Sources (use ONLY these):
${sources}

BLOCKED DOMAINS (NEVER mention or reference):
${block}

Source Availability Rule:
- If ${sources} is empty OR do not substantively support an accurate answer, return only valid HTML:
  <h2>This information isn’t currently available in the Psybrary. Please submit feedback below so we can improve.</h2>
  <h3>Question Summary</h3>
  <p>${query}</p>
  <h3>Quick Overview</h3>
  <p>No answer found in the current Psybrarian database. Please submit feedback or hit the thumbs-down below to let us know what was missing.</p>
  <h3>Related Questions</h3>
  <ul>
    <li>Which specific substance, practice, or legal jurisdiction are you asking about?</li>
    <li>Do you need dosing, safety, legal status, or integration guidance?</li>
    <li>Are you taking any medications (e.g., SSRIs, MAOIs, lithium) or have medical conditions?</li>
    <li>What is your intended context (clinical, ceremonial, recreational, therapeutic)?</li>
    <li>Do you want clinical research or cultural/Indigenous context?</li>
  </ul>
  <h3>Sources</h3>
  <ul><li>No trusted sources available for this query.</li></ul>

- Otherwise, proceed with the output rules below.

Core Guardrails:
1) Use only the provided sources; never include or infer from blocked domains.
2) Answer only this query; no merging or speculative additions.
3) If evidence is limited or mixed, say so clearly and avoid speculation.
4) You are not a lawyer or a medical provider; laws vary by jurisdiction and urgent risks require local emergency services.
5) No emojis. Return only valid, clean HTML (no Markdown).

=== OUTPUT FORMAT (SGE-STYLE OVERVIEW) ===
- Produce valid HTML in this exact order.
- Use concise, skimmable paragraphs and bullets to enable a click-free understanding.
- Insert numbered superscripts (e.g., <sup>[1]</sup>) in the body that map to the ordered list in <h3>Citations</h3>.
- Render 3–10 total citations if available; if fewer are provided, render what is available (minimum 2 if possible).
- Dedupe citations by canonical URL. Exclude any blocked domains.

<h2><!-- Main Title derived from the user’s question (concise) --></h2>

<h3>Question Summary</h3>
<p><!-- Restate the question in your own words, confirming the specific focus and scope (population, setting, timeframe) so readers know exactly what will be answered. --></p>

<h3>Quick Overview</h3>
<p><!-- 2–3 sentence synthesis that answers the question without requiring clicks. Include one brief “why this matters” clause (mechanism, expected effect, or key risk) in plain language. --> <sup>[1][2]</sup></p>

<h3>What to Know at a Glance</h3>
<ul>
  <li><strong>What it is:</strong> <!-- 1 short sentence defining the topic/substance/practice. --> <sup>[1]</sup></li>
  <li><strong>How it works:</strong> <!-- 1 short sentence mechanism or process in plain language. --> <sup>[2]</sup></li>
  <li><strong>Potential benefits:</strong> <!-- 2–4 words or one short sentence (e.g., mood, anxiety, end-of-life distress). --> <sup>[1][3]</sup></li>
  <li><strong>Key risks:</strong> <!-- 2–4 words or one short sentence (e.g., anxiety spikes, interactions, legal status). --> <sup>[2][4]</sup></li>
  <li><strong>Legal snapshot:</strong> <!-- One-line status/caveat with region variability. --> <sup>[5]</sup></li>
</ul>

<h3>Why It Matters</h3>
<p><!-- 1–2 sentences explaining real-world significance (e.g., treatment gaps, growing interest, cultural relevance), anchored to the most credible signals in your citations. --> <sup>[1][2]</sup></p>

<h3>Safety Snapshot (30 seconds)</h3>
<ul>
  <li><strong>Medications:</strong> <!-- Name only if supported (e.g., SSRIs, MAOIs, lithium) and state the risk plainly. --> <sup>[3]</sup></li>
  <li><strong>Mental health:</strong> <!-- Name if supported (e.g., psychosis risk, mania). --> <sup>[3]</sup></li>
  <li><strong>Medical:</strong> <!-- Name if supported (e.g., heart conditions). --> <sup>[4]</sup></li>
  <li><strong>Context:</strong> <!-- One-liner about set/setting/informed consent if relevant. --></li>
</ul>
<p><small><em>Not medical or legal advice. Laws vary by location; seek qualified support for urgent risks.</em></small></p>

<!-- EXPLORE MORE (ROUTE TRAFFIC TO FEATURED PARTNERS)
Populate these sections ONLY with links that exist in the provided sources list.
Prioritize order if present: Psychedelics.com → DoubleBlind → Psychedelics Today → Blossom Analysis → other reputable sources.
Omit an item if the partner domain is not present in the provided sources.
-->

<h3>Explore More: In-Depth Guides</h3>
<ul>
  <!-- Include 0–3 items from provided sources. Prefer these if present and relevant: -->
  <!-- Psychedelics.com -->
  <!-- DoubleBlind -->
  <!-- Psychedelics Today -->
  <!-- Use clear, reader-friendly anchor text. -->
</ul>

<h3>Explore More: Evidence & Data</h3>
<ul>
  <!-- Include 0–3 items from provided sources. Prefer these if present and relevant: -->
  <!-- Blossom Analysis (evidence maps) -->
  <!-- PubMed (query link) -->
  <!-- ClinicalTrials.gov (query link) -->
</ul>

<h3>Related Questions</h3>
<ul>
  <!-- Provide exactly five tailored, non-duplicative follow-up questions relevant to this specific query, phrased simply and concretely. -->
  <li><!-- Q1 --></li>
  <li><!-- Q2 --></li>
  <li><!-- Q3 --></li>
  <li><!-- Q4 --></li>
  <li><!-- Q5 --></li>
</ul>

<h3>Citations</h3>
<ol>
  <!-- Render 3–10 links from the provided sources, deduped and excluding blocked domains.
       Sort priority:
         (1) psychedelics.com (and subdomains) first if present,
         (2) DoubleBlind, Psychedelics Today, Blossom Analysis,
         (3) Other reputable sources.
       Use source title if available; otherwise use the domain as link text. -->
  <li><a href="https://example1.com" target="_blank">Source Title or Domain</a></li>
  <li><a href="https://example2.com" target="_blank">Source Title or Domain</a></li>
</ol>

Rendering & Citation Rules:
- Return ONLY valid HTML. No Markdown or escaped brackets.
- Use numbered superscripts (<sup>[n]</sup>) in the body that map to the ordered list in <h3>Citations</h3>.
- Do not fabricate links or content. Use ONLY the provided sources.
- Dedupe citations by canonical URL and exclude any domain listed in ${block}.
- Render between 3 and 10 citations if available (minimum 2 when possible). Prioritize Psychedelics.com and featured partners when present in sources.

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