<?php

/**
 * Utility Functions - AI Trainer Plugin
 * 
 * This file contains helper functions for common operations across the plugin,
 * including database operations, text processing, and data management.
 * 
 * KEY FUNCTIONALITY:
 * - Database CRUD operations for knowledge base entries
 * - Text chunking for better search granularity
 * - Embedding generation and storage
 * - Data validation and sanitization
 * 
 * DATABASE OPERATIONS:
 * - ai_trainer_save_to_db(): Insert new knowledge entries
 * - ai_trainer_delete(): Remove entries by ID
 * - ai_trainer_update(): Modify existing entries
 * - ai_trainer_save_chunks_to_db(): Store text chunks with embeddings
 * 
 * TEXT PROCESSING:
 * - ai_trainer_chunk_text(): Split long text into searchable chunks
 * - Automatic embedding generation for chunks
 * - Metadata handling for enhanced search
 * 
 * @package AI_Trainer
 * @since 1.0
 */

if (!defined('ABSPATH')) exit;

/**
 * Save a new knowledge base entry to the database
 * 
 * This function inserts a new entry into the main knowledge base table.
 * Each entry represents a piece of information that can be searched
 * and retrieved by the AI system.
 * 
 * TABLE STRUCTURE (ai_knowledge):
 * - id: Auto-incrementing primary key
 * - title: Human-readable title for the entry
 * - source_type: Type of content ('qna', 'file', 'text', 'website')
 * - content: The actual text content or data
 * - embedding: AI-generated embedding vector (JSON-encoded)
 * - metadata: Additional information in JSON format
 * - created_at: Timestamp of creation
 * 
 * @param string $title Human-readable title for the entry
 * @param string $type Content type (qna, file, text, website)
 * @param string $content The main content or text
 * @param string $embedding JSON-encoded embedding vector
 * @param array $meta Additional metadata (optional)
 * @return int|false The ID of the inserted row, or false on error
 * 
 * @example
 * $success = ai_trainer_save_to_db(
 *     "Psilocybin Microdosing Guide",
 *     "text",
 *     "Microdosing involves taking small amounts...",
 *     $embedding_json,
 *     ['source' => 'research_paper', 'author' => 'Dr. Smith']
 * );
 */
function ai_trainer_save_to_db($title, $type, $content, $embedding, $meta = []) {
    global $wpdb;
    
    // Validate required parameters
    if (empty($title) || empty($type) || empty($content) || empty($embedding)) {
        error_log('AI Trainer: Missing required parameters for database save');
        return false;
    }
    
    // Insert the new knowledge entry
    $result = $wpdb->insert(
        $wpdb->prefix . 'ai_knowledge',
        [
            'title'       => sanitize_text_field($title),
            'source_type' => sanitize_text_field($type),
            'content'     => wp_kses_post($content),
            'embedding'   => $embedding,  // Already JSON-encoded
            'metadata'    => json_encode($meta),
        ]
    );
    
    if ($result === false) {
        error_log('AI Trainer: Database insert failed: ' . $wpdb->last_error);
        return false;
    }
    
    return $wpdb->insert_id;
}

/**
 * Delete a knowledge base entry by ID
 * 
 * Removes an entry from the knowledge base. This operation is irreversible,
 * so ensure proper confirmation is in place in the user interface.
 * 
 * SECURITY CONSIDERATIONS:
 * - Always validate user permissions before calling this function
 * - Consider soft deletion for audit trails
 * - Clean up related chunks when deleting parent entries
 * 
 * @param int $id The ID of the entry to delete
 * @return int|false Number of rows affected, or false on error
 * 
 * @example
 * if (current_user_can('manage_options')) {
 *     $deleted = ai_trainer_delete(123);
 *     if ($deleted) {
 *         // Entry successfully removed
 *     }
 * }
 */
function ai_trainer_delete($id) {
    global $wpdb;
    
    // Validate input
    $id = intval($id);
    if ($id <= 0) {
        return false;
    }
    
    // Delete the main entry
    $result = $wpdb->delete(
        $wpdb->prefix . 'ai_knowledge',
        ['id' => $id],
        ['%d']  // Format specifier for integer
    );
    
    // Also delete related chunks
    if ($result !== false) {
        $wpdb->delete(
            $wpdb->prefix . 'ai_knowledge_chunks',
            ['parent_id' => $id],
            ['%d']
        );
    }
    
    return $result;
}

/**
 * Update an existing knowledge base entry
 * 
 * Modifies an existing entry in the knowledge base. This function is useful
 * for correcting information, updating content, or refreshing embeddings.
 * 
 * UPDATE STRATEGY:
 * - Only updates provided fields (partial updates supported)
 * - Automatically updates the metadata timestamp
 * - Maintains data integrity with proper sanitization
 * 
 * @param int $id The ID of the entry to update
 * @param string $title New title (optional)
 * @param string $content New content (optional)
 * @param string $embedding New embedding (optional)
 * @param array $meta New metadata (optional)
 * @return int|false Number of rows affected, or false on error
 * 
 * @example
 * $updated = ai_trainer_update(
 *     123,
 *     "Updated Title",
 *     "Updated content...",
 *     $new_embedding,
 *     ['last_updated' => current_time('mysql')]
 * );
 */
function ai_trainer_update($id, $title, $content, $embedding, $meta = []) {
    global $wpdb;
    
    // Validate input
    $id = intval($id);
    if ($id <= 0) {
        return false;
    }
    
    // Build update data array (only include provided values)
    $update_data = [];
    
    if (!empty($title)) {
        $update_data['title'] = sanitize_text_field($title);
    }
    
    if (!empty($content)) {
        $update_data['content'] = wp_kses_post($content);
    }
    
    if (!empty($embedding)) {
        $update_data['embedding'] = $embedding;
    }
    
    if (!empty($meta)) {
        $update_data['metadata'] = json_encode($meta);
    }
    
    // Only update if we have data to update
    if (empty($update_data)) {
        return false;
    }
    
    // Perform the update
    $result = $wpdb->update(
        $wpdb->prefix . 'ai_knowledge',
        $update_data,
        ['id' => $id],
        null,  // Format specifiers (auto-detected)
        ['%d'] // Where clause format
    );
    
    if ($result === false) {
        error_log('AI Trainer: Database update failed: ' . $wpdb->last_error);
        return false;
    }
    
    return $result;
}

/**
 * Split long text into smaller, searchable chunks
 * 
 * This function breaks down long text into smaller pieces that are more
 * suitable for semantic search. Chunking improves search accuracy by:
 * - Creating more focused, specific embeddings
 * - Enabling precise content retrieval
 * - Reducing noise from unrelated content in long texts
 * 
 * CHUNKING STRATEGY:
 * - Splits on sentence boundaries (., !, ?)
 * - Maintains semantic coherence within chunks
 * - Respects maximum chunk size (default: 500 characters)
 * - Preserves sentence integrity
 * 
 * @param string $text The text to split into chunks
 * @param int $max_length Maximum characters per chunk (default: 500)
 * @return array Array of text chunks
 * 
 * @example
 * $long_text = "This is a very long document...";
 * $chunks = ai_trainer_chunk_text($long_text, 300);
 * // Result: ["This is a very long document.", "Second chunk...", ...]
 * 
 * @todo Consider adding paragraph-based chunking as an option
 * @todo Add support for different chunking strategies
 */
function ai_trainer_chunk_text($text, $max_length = 500) {
    $chunks = [];
    $current = '';
    
    // Split text into sentences using regex
    // (?<=[.!?])\s+ matches whitespace that follows sentence endings
    $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
    
    foreach ($sentences as $sentence) {
        // Check if adding this sentence would exceed the limit
        if (mb_strlen($current . ' ' . $sentence) > $max_length && $current !== '') {
            // Current chunk is full, save it and start a new one
            $chunks[] = trim($current);
            $current = '';
        }
        
        // Add sentence to current chunk
        $current .= ' ' . $sentence;
    }
    
    // Don't forget the last chunk
    if (trim($current) !== '') {
        $chunks[] = trim($current);
    }
    
    return $chunks;
}

/**
 * Save text chunks to the database with individual embeddings
 * 
 * This function processes long text by chunking it and creating separate
 * database entries for each chunk. Each chunk gets its own embedding,
 * enabling more precise semantic search.
 * 
 * CHUNK TABLE STRUCTURE (ai_knowledge_chunks):
 * - id: Auto-incrementing primary key
 * - parent_id: Reference to main knowledge entry
 * - source_type: Type of source content
 * - chunk_index: Order of chunk in original text
 * - content: The chunk text content
 * - embedding: Chunk-specific embedding vector
 * - metadata: Additional chunk information
 * - created_at: Timestamp of creation
 * 
 * WORKFLOW:
 * 1. Split text into chunks using ai_trainer_chunk_text()
 * 2. Generate embedding for each chunk
 * 3. Store each chunk as separate database entry
 * 4. Link chunks to parent entry via parent_id
 * 
 * @param int $parent_id ID of the main knowledge entry
 * @param string $source_type Type of source content
 * @param string $text The text to chunk and store
 * @param array $meta Additional metadata for chunks
 * @return int Number of chunks successfully created
 * 
 * @example
 * $chunks_created = ai_trainer_save_chunks_to_db(
 *     123,                    // Parent entry ID
 *     'research_paper',       // Source type
 *     $long_research_text,    // Text to chunk
 *     ['author' => 'Dr. Smith'] // Metadata
 * );
 * 
 * @todo Add transaction support for atomic chunk creation
 * @todo Consider batch processing for large numbers of chunks
 */
function ai_trainer_save_chunks_to_db($parent_id, $source_type, $text, $meta = []) {
    global $wpdb;
    
    // Ensure required functions are available
    if (!function_exists('ai_trainer_chunk_text')) {
        require_once __FILE__;
    }
    if (!function_exists('ai_trainer_generate_embedding')) {
        require_once dirname(__FILE__) . '/openai.php';
    }
    
    // Split text into manageable chunks
    $chunks = ai_trainer_chunk_text($text);
    $chunk_table = $wpdb->prefix . 'ai_knowledge_chunks';
    $chunks_created = 0;
    
    // Process each chunk
    foreach ($chunks as $i => $chunk) {
        // Generate embedding for this specific chunk
        $embedding = ai_trainer_generate_embedding($chunk);
        
        if ($embedding) {
            // Insert chunk into database
            $result = $wpdb->insert($chunk_table, [
                'parent_id' => $parent_id,
                'source_type' => $source_type,
                'chunk_index' => $i,
                'content' => $chunk,
                'embedding' => $embedding,
                'metadata' => json_encode($meta),
                'created_at' => current_time('mysql')
            ]);
            
            if ($result !== false) {
                $chunks_created++;
            } else {
                error_log("AI Trainer: Failed to insert chunk $i for parent $parent_id");
            }
        } else {
            error_log("AI Trainer: Failed to generate embedding for chunk $i");
        }
    }
    
    return $chunks_created;
}
