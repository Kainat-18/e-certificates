<?php
session_start();
if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
require __DIR__ . '/lib/supabase.php';

$fields = ['deliverableId' => 'Deliverable ID', 'publishedOn' => 'Published on', 'name' => 'Name', 'empId' => 'ID', 'issuedOn' => 'Issued on', 'validUntil' => 'Valid until', 'type' => 'Type', 'model' => 'Model', 'company' => 'Company', 'location' => 'Training location', 'trainer' => 'Trainer'];
$defaults = ['model' => 'N/A', 'company' => 'Private', 'location' => 'Jubail', 'trainer' => 'Ahmad Nazeer'];
$editToken = '';

if (!empty($_GET['edit']) && is_string($_GET['edit']) && preg_match('/\A[a-f0-9]{64}\z/', $_GET['edit'])) {
    $candidate = $_GET['edit'];
    try {
        $rows = supabase_request('GET', '/rest/v1/document_records?token=eq.' . urlencode($candidate) . '&select=details');
        if ($rows) {
            $editToken = $candidate;
            $defaults = array_merge($defaults, $rows[0]['details']);
        }
    } catch (Throwable $error) {
        error_log('Edit fetch error: ' . $error->getMessage());
    }
}

if ($editToken === '') {
    try {
        $number = supabase_request('POST', '/rest/v1/rpc/next_deliverable_number', new stdClass());
        if (is_numeric($number)) $defaults['deliverableId'] = sprintf('151-%s-%d-EN', date('Y'), (int) $number);
    } catch (Throwable $error) {
        error_log('Deliverable ID counter error: ' . $error->getMessage());
    }
}

$records = [];
try {
    $records = supabase_request('GET', '/rest/v1/document_records?select=token,details,enabled,created_at&order=created_at.desc');
} catch (Throwable $error) {
    error_log('Record list error: ' . $error->getMessage());
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Submit document details</title>
  <link rel="stylesheet" href="css/form.css">
</head>
<body>
<main>
  <h1>Submit document details</h1>
  <p>Complete the form to save your details and receive a unique record link. Submission does not confirm approval by the document issuer.</p>
  <?php if (isset($_GET['updated'])): ?><p id="updatedNotice">Record updated successfully.</p><?php endif; ?>
  <?php if ($editToken !== ''): ?><p>Editing existing record. <a href="form.php">Cancel and create a new record instead</a>.</p><?php endif; ?>
  <form id="documentForm" action="api.php" method="post">
    <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
    <input type="hidden" name="editToken" id="editToken" value="<?= htmlspecialchars($editToken, ENT_QUOTES, 'UTF-8') ?>">
    <div class="trap" aria-hidden="true"><label>Leave empty<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <div class="fields">
    <?php foreach ($fields as $key => $label): ?>
      <label for="<?= $key ?>"><?= $label ?><input id="<?= $key ?>" name="<?= $key ?>" type="<?= in_array($key, ['publishedOn', 'issuedOn', 'validUntil'], true) ? 'date' : 'text' ?>" maxlength="200" value="<?= htmlspecialchars($defaults[$key] ?? '', ENT_QUOTES, 'UTF-8') ?>" required></label>
    <?php endforeach; ?>
    </div>
    <button type="submit"><?= $editToken !== '' ? 'Update details' : 'Save details and generate link' ?></button>
  </form>
  <p id="message" role="status" aria-live="polite"></p>
  <section id="result" hidden>
    <h2>Your record link</h2>
    <a id="recordLink" href=""></a>
    <button id="copyLink" type="button">Copy link</button>
    <p>Keep this link. Anyone with the link can view the submitted details.</p>
  </section>

  <h2>Submitted records</h2>
  <?php if (!$records): ?>
    <p>No records yet.</p>
  <?php else: ?>
  <table class="records">
    <thead><tr><th>Deliverable ID</th><th>Name</th><th>Company</th><th>Issued on</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>
    <?php foreach ($records as $row): $d = $row['details']; ?>
      <tr>
        <td><?= htmlspecialchars($d['deliverableId'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($d['name'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($d['company'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= htmlspecialchars($d['issuedOn'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
        <td><?= $row['enabled'] ? 'On' : 'Off' ?></td>
        <td class="actions">
          <a href="form.php?edit=<?= urlencode($row['token']) ?>">Edit</a>
          <form method="post" action="admin-action.php" onsubmit="return confirm('Delete this record permanently?')">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="action" value="delete">
            <input type="hidden" name="token" value="<?= htmlspecialchars($row['token'], ENT_QUOTES, 'UTF-8') ?>">
            <button type="submit">Delete</button>
          </form>
          <form method="post" action="admin-action.php">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($_SESSION['csrf'], ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="action" value="toggle">
            <input type="hidden" name="token" value="<?= htmlspecialchars($row['token'], ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="target" value="<?= $row['enabled'] ? 'false' : 'true' ?>">
            <button type="submit"><?= $row['enabled'] ? 'Turn Off' : 'Turn On' ?></button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</main>
<script src="js/form.js?v=<?= @filemtime(__DIR__ . '/js/form.js') ?: time() ?>"></script>
</body>
</html>
