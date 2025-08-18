<?php

if (isset($_GET['delete_file'])) ai_trainer_delete((int)$_GET['delete_file']);
if (isset($_GET['delete_text'])) ai_trainer_delete((int)$_GET['delete_text']);
if (isset($_GET['delete_qna'])) ai_trainer_delete((int)$_GET['delete_qna']);

?>

<div class="ai-trainer-wrapper">
    <h1>AI Trainer Dashboard</h1>
    <div class="ai-trainer-container">
        <aside class="ai-sidebar">
            <ul>
                <li data-tab="qna" class="<?php echo (!isset($_GET['tab']) || $_GET['tab'] === 'qna') ? 'active' : ''; ?>">Q&A</li>
                <li data-tab="files" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'files') ? 'active' : ''; ?>">Files</li>
                <li data-tab="text" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'text') ? 'active' : ''; ?>">Text</li>
                <li data-tab="website" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'website') ? 'active' : ''; ?>">Website</li>
                <li data-tab="block-website" class="<?php echo (isset($_GET['tab']) && $_GET['tab'] === 'block-website') ? 'active' : ''; ?>">Block Website</li>
            </ul>
        </aside>
        <section class="ai-content">
            <div id="tab-qna" class="ai-tab <?php echo (!isset($_GET['tab']) || $_GET['tab'] === 'qna') ? 'active' : ''; ?>"><?php include __DIR__ . '/tabs/qna.php'; ?></div>
            <div id="tab-files" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'files') ? 'active' : ''; ?>"><?php include __DIR__ . '/tabs/files.php'; ?></div>
            <div id="tab-text" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'text') ? 'active' : ''; ?>"><?php include __DIR__ . '/tabs/text.php'; ?></div>
            <div id="tab-website" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'website') ? 'active' : ''; ?>"><?php include __DIR__ . '/tabs/website.php'; ?></div>
            <div id="tab-block-website" class="ai-tab <?php echo (isset($_GET['tab']) && $_GET['tab'] === 'block-website') ? 'active' : ''; ?>"><?php include __DIR__ . '/tabs/block-website.php'; ?></div>
        </section>
    </div>
</div>
