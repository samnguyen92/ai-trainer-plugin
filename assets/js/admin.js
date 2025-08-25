jQuery(function ($) {
    // Handle tab switching with URL parameters
    function switchTab(tabName) {
        $('.ai-sidebar li').removeClass('active');
        $('.ai-tab').removeClass('active');
        
        // Find and activate the correct tab
        $(`[data-tab="${tabName}"]`).addClass('active');
        $(`#tab-${tabName}`).addClass('active');
        
        // Update URL without page reload
        const url = new URL(window.location);
        url.searchParams.set('tab', tabName);
        window.history.pushState({}, '', url);
    }
    
    // Handle tab clicks
    $('.ai-sidebar li').click(function () {
        let tab = $(this).data('tab');
        switchTab(tab);
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab') || 'qna';
        switchTab(tab);
    });
    
    // Initialize tab based on URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    let initialTab = urlParams.get('tab') || 'qna';
    switchTab(initialTab);

    // --- Website Tab AJAX Logic ---
    function reloadWebsiteTable() {
        $.post(ai_trainer_ajax.ajaxurl, { action: 'ai_get_website_table', nonce: ai_trainer_ajax.nonce }, function (response) {
            if (response.html) $('#website-sources-table').html(response.html);
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                setTimeout(function() { $('#website-notices').fadeOut(); }, 3000);
            }
        }, 'json');
    }

    // Add Website
    $(document).on('submit', '#add-website-form', function (e) {
        e.preventDefault();
        var data = {
            action: 'ai_add_domain_with_tier',
            title: $(this).find('[name="website_title"]').val(),
            url: $(this).find('[name="website_url"]').val(),
            tier: $(this).find('[name="website_tier"]').val(),
            nonce: ai_trainer_ajax.nonce
        };
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.success) {
                $('#website-notices').html('<div class="notice notice-success"><p>' + response.data.message + '</p></div>').show();
            } else {
                $('#website-notices').html('<div class="notice notice-error"><p>' + response.data.message + '</p></div>').show();
            }
            setTimeout(function() { $('#website-notices').fadeOut(); }, 3000);
            reloadWebsiteTable();
            $('#add-website-form')[0].reset();
        }, 'json');
    });

    // Open Edit Website Modal
    $(document).on('click', '.edit-website-inline', function () {
        $('#edit-website-id').val($(this).data('id'));
        $('#edit-website-title').val($(this).data('title'));
        $('#edit-website-url').val($(this).data('url'));
        $('#edit-website-tier').val($(this).data('tier'));
        $('#website-edit-modal').show();
    });
    // Close Edit Modal
    $(document).on('click', '.close-website-modal', function () {
        $('#website-edit-modal').hide();
    });
    // Edit Website Submit
    $(document).on('submit', '#edit-website-form', function (e) {
        e.preventDefault();
        var data = {
            action: 'ai_edit_website',
            id: $('#edit-website-id').val(),
            title: $('#edit-website-title').val(),
            url: $('#edit-website-url').val(),
            tier: $('#edit-website-tier').val(),
            nonce: ai_trainer_ajax.nonce
        };
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                setTimeout(function() { $('#website-notices').fadeOut(); }, 3000);
            }
            reloadWebsiteTable();
            $('#website-edit-modal').hide();
        }, 'json');
    });
    

    
    // Delete Website
    $(document).on('click', '.delete-website', function (e) {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this website?')) return;
        var id = $(this).data('id');
        $.post(ai_trainer_ajax.ajaxurl, { action: 'ai_delete_website', id: id, nonce: ai_trainer_ajax.nonce }, function (response) {
            if (response.notice) {
                $('#website-notices').html(response.notice).show();
                setTimeout(function() { $('#website-notices').fadeOut(); }, 3000);
            }
            reloadWebsiteTable();
        }, 'json');
    });
    // Initial table load (if needed)
    // reloadWebsiteTable();

    // --- Block Website Tab AJAX Logic ---
    function reloadBlockWebsiteTable() {
        $.post(ai_trainer_ajax.ajaxurl, { action: 'ai_get_block_website_table', nonce: ai_trainer_ajax.nonce }, function (response) {
            if (response.html) $('#block-website-sources-table').html(response.html);
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { $('#block-website-notices').fadeOut(); }, 3000);
            }
        }, 'json');
    }

    // Add Block Website
    $(document).on('submit', '#add-block-website-form', function (e) {
        e.preventDefault();
        var data = {
            action: 'ai_add_block_website',
            title: $(this).find('[name="block_website_title"]').val(),
            url: $(this).find('[name="block_website_url"]').val(),
            nonce: ai_trainer_ajax.nonce
        };
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { $('#block-website-notices').fadeOut(); }, 3000);
            }
            reloadBlockWebsiteTable();
            $('#add-block-website-form')[0].reset();
        }, 'json');
    });

    // Open Edit Block Website Modal
    $(document).on('click', '.edit-block-website-inline', function () {
        $('#edit-block-website-id').val($(this).data('id'));
        $('#edit-block-website-title').val($(this).data('title'));
        $('#edit-block-website-url').val($(this).data('url'));
        $('#block-website-edit-modal').show();
    });
    // Close Edit Block Website Modal
    $(document).on('click', '.close-block-website-modal', function () {
        $('#block-website-edit-modal').hide();
    });
    // Edit Block Website Submit
    $(document).on('submit', '#edit-block-website-form', function (e) {
        e.preventDefault();
        var data = {
            action: 'ai_edit_block_website',
            id: $('#edit-block-website-id').val(),
            title: $('#edit-block-website-title').val(),
            url: $('#edit-block-website-url').val(),
            nonce: ai_trainer_ajax.nonce
        };
        $.post(ai_trainer_ajax.ajaxurl, data, function (response) {
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { $('#block-website-notices').fadeOut(); }, 3000);
            }
            reloadBlockWebsiteTable();
            $('#block-website-edit-modal').hide();
        }, 'json');
    });
    // Delete Block Website
    $(document).on('click', '.delete-block-website', function (e) {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this blocked website?')) return;
        var id = $(this).data('id');
        $.post(ai_trainer_ajax.ajaxurl, { action: 'ai_delete_block_website', id: id, nonce: ai_trainer_ajax.nonce }, function (response) {
            if (response.notice) {
                $('#block-website-notices').html(response.notice).show();
                setTimeout(function() { $('#block-website-notices').fadeOut(); }, 3000);
            }
            reloadBlockWebsiteTable();
        }, 'json');
    });
});


document.addEventListener('DOMContentLoaded', () => {


    // Delete Q&A row
    document.querySelectorAll('.delete-qna').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Are you sure?')) return;
            const id = btn.dataset.id;
            fetch(ajaxurl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `action=ai_delete_qna&id=${id}`
            }).then(() => location.reload());
        });
    });

});