<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
require __DIR__ . '/lib/supabase.php';
function reply(int $status, array $body): void {
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    reply(405, ['error' => 'Method not allowed.']);
}
$fields = ['deliverableId', 'publishedOn', 'name', 'empId', 'issuedOn', 'validUntil', 'type', 'model', 'company', 'location', 'trainer'];
$details = [];
if ($method === 'POST') {
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) reply(413, ['error' => 'Submission too large.']);
    session_start();
    if (!is_string($_POST['csrf'] ?? null) || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'])) reply(403, ['error' => 'Please refresh the form and try again.']);
    if (!empty($_POST['website'])) reply(400, ['error' => 'Invalid submission.']);
    if (time() - (int) ($_SESSION['last_submission'] ?? 0) < 10) reply(429, ['error' => 'Please wait a few seconds before submitting again.']);
    foreach ($fields as $field) {
        $value = $_POST[$field] ?? null;
        if (!is_string($value) || trim($value) === '' || strlen($value) > 500) reply(422, ['error' => 'Please complete every field (maximum 500 bytes each).']);
        $details[$field] = trim($value);
    }
    foreach (['publishedOn', 'issuedOn', 'validUntil'] as $field) {
        $date = DateTimeImmutable::createFromFormat('!Y-m-d', $details[$field]);
        if (!$date || $date->format('Y-m-d') !== $details[$field]) reply(422, ['error' => 'Please enter valid dates.']);
    }
    if ($details['validUntil'] < $details['issuedOn']) reply(422, ['error' => 'Valid until must be on or after the issue date.']);
    // A public submission is not an issuer-approved document.
    $details['qrStatus'] = 'Submitted — not reviewed by issuer';
    $editToken = $_POST['editToken'] ?? '';
    $isEdit = is_string($editToken) && preg_match('/\A[a-f0-9]{64}\z/', $editToken);
    try {
        if ($isEdit) {
            $rows = supabase_request('PATCH', '/rest/v1/document_records?token=eq.' . urlencode($editToken), ['details' => $details], ['Prefer: return=representation']);
            if (!$rows) reply(404, ['error' => 'Record not found.']);
            $_SESSION['last_submission'] = time();
            reply(200, ['id' => $editToken, 'updated' => true]);
        }
        $token = bin2hex(random_bytes(32));
        supabase_request('POST', '/rest/v1/document_records', ['token' => $token, 'details' => $details], ['Prefer: return=minimal']);
        $_SESSION['last_submission'] = time();
        reply(201, ['id' => $token]);
    } catch (Throwable $error) {
        error_log('Document database error: ' . $error->getMessage());
        reply(500, ['error' => 'Unable to access the database. Please contact the website administrator.']);
    }
} else {
    $token = $_GET['id'] ?? '';
    if (!is_string($token) || !preg_match('/\A[a-f0-9]{64}\z/', $token)) reply(400, ['error' => 'Invalid verification link.']);
}
try {
    $rows = supabase_request('GET', '/rest/v1/document_records?token=eq.' . urlencode($token) . '&enabled=is.true&select=details');
    if (!$rows) reply(404, ['error' => 'No record found for this link.']);
    reply(200, ['record' => $rows[0]['details']]);
} catch (Throwable $error) {
    error_log('Document database error: ' . $error->getMessage());
    reply(500, ['error' => 'Unable to access the database. Please contact the website administrator.']);
}
