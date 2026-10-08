<?php
declare(strict_types=1);

function supabase_request(string $method, string $path, $body = null, array $extraHeaders = []) {
    $config = require __DIR__ . '/../supabase-config.php';
    $url = rtrim($config['url'], '/') . $path;
    $headers = array_merge([
        'apikey: ' . $config['key'],
        'Authorization: Bearer ' . $config['key'],
        'Content-Type: application/json',
    ], $extraHeaders);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
    ]);
    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
    $response = curl_exec($ch);
    if ($response === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException('Supabase request failed: ' . $error);
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $decoded = $response === '' ? null : json_decode($response, true);
    if ($status >= 400) {
        $message = is_array($decoded) && isset($decoded['message']) ? $decoded['message'] : ('HTTP ' . $status);
        throw new RuntimeException('Supabase error: ' . $message);
    }
    return $decoded;
}
