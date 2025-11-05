<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$apologyId = $_GET['id'] ?? null;

if (!$apologyId) {
    http_response_code(400);
    echo json_encode(['error' => 'Apology ID required']);
    exit;
}

// Load environment variables from .env file
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Environment variables for Supabase
$supabaseUrl = $_ENV['SUPABASE_URL'] ?? null;
$supabaseKey = $_ENV['SUPABASE_ANON_KEY'] ?? null;

if (!$supabaseUrl || !$supabaseKey) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration error']);
    exit;
}

try {
    // Fetch apology
    $apologyResponse = makeSupabaseRequest(
        $supabaseUrl,
        $supabaseKey,
        "apologies?id=eq.$apologyId&select=*,users!sender_id(username,avatar_url)"
    );
    
    if (empty($apologyResponse)) {
        http_response_code(404);
        echo json_encode(['error' => 'Apology not found']);
        exit;
    }
    
    $apology = $apologyResponse[0];
    
    // Check if apology is accessible
    if ($apology['mode'] === 'deliver' && $apology['status'] !== 'approved') {
        http_response_code(403);
        echo json_encode(['error' => 'Apology not available']);
        exit;
    }
    
    // Fetch reactions
    $reactions = makeSupabaseRequest(
        $supabaseUrl,
        $supabaseKey,
        "reactions?apology_id=eq.$apologyId&select=type"
    );
    
    $forgiveCount = 0;
    $nottoforgiveCount = 0;
    
    foreach ($reactions as $reaction) {
        if ($reaction['type'] === 'forgive') {
            $forgiveCount++;
        } elseif ($reaction['type'] === 'nottoforgive') {
            $nottoforgiveCount++;
        }
    }
    
    // Fetch comments
    $comments = makeSupabaseRequest(
        $supabaseUrl,
        $supabaseKey,
        "apology_comments?apology_id=eq.$apologyId&select=id"
    );
    
    $commentCount = count($comments);
    
    // Return response
    echo json_encode([
        'apology' => [
            'id' => $apology['id'],
            'text' => $apology['text'],
            'tag' => $apology['tag'],
            'created_at' => $apology['created_at'],
            'users' => $apology['users'],
            'forgiveCount' => $forgiveCount,
            'nottoforgiveCount' => $nottoforgiveCount,
            'commentCount' => $commentCount
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function makeSupabaseRequest($url, $key, $endpoint) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, "$url/rest/v1/$endpoint");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "apikey: $key",
        "Authorization: Bearer $key",
        "Content-Type: application/json"
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("Supabase request failed");
    }
    
    return json_decode($response, true);
}
?>
