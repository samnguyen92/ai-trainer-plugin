<?php
function ai_trainer_save_to_db($title, $type, $content, $embedding, $meta = []) {
    global $wpdb;
    return $wpdb->insert($wpdb->prefix . 'ai_knowledge', [
        'title'       => $title,
        'source_type' => $type,
        'content'     => $content,
        'embedding'   => $embedding,
        'metadata'    => json_encode($meta),
    ]);
}

function ai_trainer_delete($id) {
    global $wpdb;
    return $wpdb->delete($wpdb->prefix . 'ai_knowledge', ['id' => $id]);
}

function ai_trainer_update($id, $title, $content, $embedding, $meta = []) {
    global $wpdb;
    return $wpdb->update($wpdb->prefix . 'ai_knowledge', [
        'title' => $title,
        'content' => $content,
        'embedding' => $embedding,
        'metadata' => json_encode($meta),
    ], ['id' => $id]);
}

function ai_trainer_chunk_text($text, $max_length = 500) {
    $chunks = [];
    $current = '';
    $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($sentences as $sentence) {
        if (mb_strlen($current . ' ' . $sentence) > $max_length && $current !== '') {
            $chunks[] = trim($current);
            $current = '';
        }
        $current .= ' ' . $sentence;
    }
    if (trim($current) !== '') {
        $chunks[] = trim($current);
    }
    return $chunks;
}

function ai_trainer_save_chunks_to_db($parent_id, $source_type, $text, $meta = []) {
    global $wpdb;
    if (!function_exists('ai_trainer_chunk_text')) require_once __FILE__;
    if (!function_exists('ai_trainer_generate_embedding')) require_once dirname(__FILE__) . '/openai.php';
    $chunks = ai_trainer_chunk_text($text);
    $chunk_table = $wpdb->prefix . 'ai_knowledge_chunks';
    foreach ($chunks as $i => $chunk) {
        $embedding = ai_trainer_generate_embedding($chunk);
        $wpdb->insert($chunk_table, [
            'parent_id' => $parent_id,
            'source_type' => $source_type,
            'chunk_index' => $i,
            'content' => $chunk,
            'embedding' => $embedding,
            'metadata' => json_encode($meta),
            'created_at' => current_time('mysql')
        ]);
    }
}
