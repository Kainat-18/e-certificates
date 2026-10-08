<?php
declare(strict_types=1);
session_start();
require __DIR__ . '/lib/supabase.php';
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed.');
}
if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'])) {
    http_response_code(403);
    exit('Invalid request. Please refresh and try again.');
}
$token = $_POST['token'] ?? '';
if (!is_string($token) || !preg_match('/\A[a-f0-9]{64}\z/', $token)) {
    http_response_code(400);
    exit('Invalid record.');
}
$action = $_POST['action'] ?? '';

try {
    if ($action === 'delete') {
        supabase_request('DELETE', '/rest/v1/document_records?token=eq.' . urlencode($token));
    } elseif ($action === 'toggle') {
        $target = ($_POST['target'] ?? '') === 'true';
        supabase_request('PATCH', '/rest/v1/document_records?token=eq.' . urlencode($token), ['enabled' => $target]);
    } else {
        http_response_code(400);
        exit('Unknown action.');
    }
} catch (Throwable $error) {
    error_log('Admin action error: ' . $error->getMessage());
    http_response_code(500);
    exit('Action failed. Please try again.');
}

header('Location: form.php');
exit;
