<?php


function ai_trainer_normalize_embedding($embedding) {
    $norm = 0.0;
    foreach ($embedding as $v) $norm += $v * $v;
    $norm = sqrt($norm) + 1e-8;
    foreach ($embedding as &$v) $v = $v / $norm;
    return $embedding;
}

function ai_trainer_generate_embedding($text) {
    $api_key = OPENAI_API_KEY;
    $response = wp_remote_post('https://api.openai.com/v1/embeddings', [
        'headers' => [
            'Authorization' => 'Bearer ' . $api_key,
            'Content-Type'  => 'application/json',
        ],
        'body' => json_encode([
            'input' => substr($text, 0, 2000),
            'model' => 'text-embedding-ada-002',
        ])
    ]);
    if (is_wp_error($response)) return '';
    $body = json_decode(wp_remote_retrieve_body($response), true);
    $embedding = $body['data'][0]['embedding'] ?? [];
    $embedding = ai_trainer_normalize_embedding($embedding);
    return json_encode($embedding);
}
