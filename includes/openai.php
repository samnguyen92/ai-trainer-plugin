<?php

/**
 * OpenAI Integration - AI Trainer Plugin
 * 
 * This file handles all interactions with OpenAI's API, specifically for generating
 * text embeddings that enable semantic search functionality in the knowledge base.
 * 
 * EMBEDDING SYSTEM OVERVIEW:
 * - Text embeddings are numerical representations of text that capture semantic meaning
 * - Similar texts have similar embeddings, enabling semantic search
 * - We use OpenAI's text-embedding-ada-002 model for high-quality embeddings
 * - Embeddings are normalized to unit vectors for consistent similarity calculations
 * 
 * KEY FUNCTIONS:
 * - ai_trainer_generate_embedding(): Creates embeddings from text via OpenAI API
 * - ai_trainer_normalize_embedding(): Normalizes vectors to unit length
 * 
 * USAGE:
 * - Called when adding new knowledge base entries (Q&A, files, text)
 * - Used for semantic search to find relevant content
 * - Stored in database as JSON-encoded arrays
 * 
 * @package AI_Trainer
 * @since 1.0
 */

if (!defined('ABSPATH')) exit;

/**
 * Normalize an embedding vector to unit length
 * 
 * This function converts a raw embedding vector into a unit vector (length = 1).
 * Normalization is crucial for consistent similarity calculations because:
 * - Raw embeddings can have varying magnitudes
 * - Cosine similarity calculations require normalized vectors
 * - Unit vectors ensure fair comparison between different texts
 * 
 * MATHEMATICAL PROCESS:
 * 1. Calculate the magnitude (L2 norm) of the vector
 * 2. Divide each component by the magnitude
 * 3. Add small epsilon (1e-8) to prevent division by zero
 * 
 * @param array $embedding Raw embedding vector from OpenAI API
 * @return array Normalized unit vector
 * 
 * @example
 * $raw_embedding = [0.5, 0.3, 0.4];
 * $normalized = ai_trainer_normalize_embedding($raw_embedding);
 * // Result: [0.707, 0.424, 0.566] (approximately unit length)
 */
function ai_trainer_normalize_embedding($embedding) {
    // Calculate the L2 norm (magnitude) of the vector
    $norm = 0.0;
    foreach ($embedding as $v) {
        $norm += $v * $v;  // Sum of squares
    }
    $norm = sqrt($norm) + 1e-8;  // Square root + small epsilon to prevent division by zero
    
    // Normalize each component to create a unit vector
    foreach ($embedding as &$v) {
        $v = $v / $norm;
    }
    
    return $embedding;
}

/**
 * Generate text embedding using OpenAI's API
 * 
 * This function sends text to OpenAI's embedding API and returns a normalized
 * embedding vector. The embedding captures the semantic meaning of the text,
 * enabling similarity-based search across the knowledge base.
 * 
 * API DETAILS:
 * - Model: text-embedding-ada-002 (OpenAI's latest embedding model)
 * - Input limit: 2000 characters (truncated if longer)
 * - Output: 1536-dimensional vector
 * - Rate limits: Check OpenAI's current pricing and limits
 * 
 * ERROR HANDLING:
 * - Returns empty string on API errors
 * - Logs errors to WordPress error log
 * - Gracefully handles network timeouts
 * 
 * @param string $text The text to generate an embedding for
 * @return string|false JSON-encoded embedding array, or false on error
 * 
 * @example
 * $text = "What are the benefits of microdosing psilocybin?";
 * $embedding = ai_trainer_generate_embedding($text);
 * if ($embedding) {
 *     // Store in database for later search
 *     ai_trainer_save_to_db("Microdosing Benefits", "qna", $text, $embedding);
 * }
 * 
 * @todo Consider adding retry logic for transient API failures
 * @todo Add caching for repeated embeddings to reduce API calls
 */
function ai_trainer_generate_embedding($text) {
    // Get API key from WordPress constants (set in main plugin file)
    $api_key = OPENAI_API_KEY;
    
    // Validate API key
    if (empty($api_key)) {
        error_log('AI Trainer: OpenAI API key not configured');
        return false;
    }
    
    // Prepare the API request to OpenAI
    $response = wp_remote_post('https://api.openai.com/v1/embeddings', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body' => json_encode([
            'input' => substr($text, 0, 2000),  // Truncate to API limit
            'model' => 'text-embedding-ada-002', // Latest embedding model
        ]),
        'timeout' => 30,  // 30 second timeout for API calls
    ]);
    
    // Handle WordPress HTTP errors (network issues, timeouts, etc.)
    if (is_wp_error($response)) {
        error_log('AI Trainer: OpenAI API request failed: ' . $response->get_error_message());
        return false;
    }
    
    // Parse the API response
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    // Extract the embedding from the response
    $embedding = $body['data'][0]['embedding'] ?? [];
    
    // Validate that we received a proper embedding
    if (empty($embedding) || !is_array($embedding)) {
        error_log('AI Trainer: Invalid embedding response from OpenAI API');
        return false;
    }
    
    // Normalize the embedding to unit length for consistent similarity calculations
    $embedding = ai_trainer_normalize_embedding($embedding);
    
    // Return as JSON string for database storage
    return json_encode($embedding);
}

/**
 * Calculate cosine similarity between two embedding vectors
 * 
 * This function calculates the cosine similarity between two normalized embedding
 * vectors. Cosine similarity ranges from -1 to 1, where:
 * - 1.0 = identical meaning (perfect match)
 * - 0.0 = unrelated meaning (no similarity)
 * - -1.0 = opposite meaning (negative correlation)
 * 
 * FORMULA: cos(θ) = (A · B) / (||A|| × ||B||)
 * Since vectors are normalized, ||A|| = ||B|| = 1, so cos(θ) = A · B
 * 
 * @param array $embedding1 First normalized embedding vector
 * @param array $embedding2 Second normalized embedding vector
 * @return float Cosine similarity score between -1 and 1
 * 
 * @example
 * $similarity = ai_trainer_cosine_similarity($embedding1, $embedding2);
 * if ($similarity > 0.8) {
 *     // High similarity - likely relevant content
 * }
 */
function ai_trainer_cosine_similarity($embedding1, $embedding2) {
    // Ensure both embeddings are arrays
    if (is_string($embedding1)) {
        $embedding1 = json_decode($embedding1, true);
    }
    if (is_string($embedding2)) {
        $embedding2 = json_decode($embedding2, true);
    }
    
    // Validate inputs
    if (!is_array($embedding1) || !is_array($embedding2)) {
        return 0.0;
    }
    
    // Calculate dot product
    $dot_product = 0.0;
    $min_length = min(count($embedding1), count($embedding2));
    
    for ($i = 0; $i < $min_length; $i++) {
        $dot_product += $embedding1[$i] * $embedding2[$i];
    }
    
    // Return cosine similarity (dot product of normalized vectors)
    return $dot_product;
}
