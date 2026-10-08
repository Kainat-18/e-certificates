const form = document.getElementById('documentForm');
const message = document.getElementById('message');
const editTokenInput = document.getElementById('editToken');
const submitButton = document.getElementById('submitButton');
const editNotice = document.getElementById('editNotice');
const updatedNotice = document.getElementById('updatedNotice');
const issuedOn = document.getElementById('issuedOn');
const validUntil = document.getElementById('validUntil');
const recordsTable = document.getElementById('recordsTable');
const recordsBody = document.getElementById('recordsBody');
const recordsEmpty = document.getElementById('recordsEmpty');

const FIELDS = ['deliverableId', 'publishedOn', 'name', 'empId', 'issuedOn', 'validUntil', 'type', 'model', 'company', 'location', 'trainer'];

issuedOn.addEventListener('change', () => {
  if (!issuedOn.value) return;
  const date = new Date(issuedOn.value + 'T00:00:00');
  date.setFullYear(date.getFullYear() + 1);
  validUntil.value = date.toISOString().slice(0, 10);
});

async function init() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('updated')) updatedNotice.hidden = false;

  const editToken = params.get('edit');
  if (editToken && /^[a-f0-9]{64}$/.test(editToken)) {
    try {
      const response = await fetch('/api/record?id=' + encodeURIComponent(editToken) + '&admin=1', {cache: 'no-store'});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load this record.');
      for (const field of FIELDS) {
        document.getElementById(field).value = data.record[field] ?? '';
      }
      editTokenInput.value = editToken;
      editNotice.hidden = false;
      submitButton.textContent = 'Update details';
    } catch (error) {
      message.textContent = error.message || 'Unable to load this record for editing.';
    }
  } else {
    try {
      const response = await fetch('/api/next-id', {cache: 'no-store'});
      const data = await response.json();
      if (data.deliverableId) document.getElementById('deliverableId').value = data.deliverableId;
    } catch {
      // Leave the field blank if the counter is unavailable; it can still be typed manually.
    }
  }

  loadRecords();
}

async function loadRecords() {
  try {
    const response = await fetch('/api/records', {cache: 'no-store'});
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load records.');
    renderRecords(data.records || []);
  } catch (error) {
    recordsEmpty.hidden = false;
    recordsEmpty.textContent = error.message || 'Unable to load records.';
  }
}

function renderRecords(records) {
  recordsBody.innerHTML = '';
  if (!records.length) {
    recordsEmpty.hidden = false;
    recordsTable.hidden = true;
    return;
  }
  recordsEmpty.hidden = true;
  recordsTable.hidden = false;
  for (const row of records) {
    const d = row.details || {};
    const tr = document.createElement('tr');

    const cells = [d.deliverableId, d.name, d.company, d.issuedOn, row.enabled ? 'On' : 'Off'];
    for (const value of cells) {
      const td = document.createElement('td');
      td.textContent = value ?? '';
      tr.append(td);
    }

    const actionsTd = document.createElement('td');
    actionsTd.className = 'actions';

    const editLink = document.createElement('a');
    editLink.href = 'form.html?edit=' + encodeURIComponent(row.token);
    editLink.textContent = 'Edit';
    actionsTd.append(editLink);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteRecord(row.token));
    actionsTd.append(deleteButton);

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.textContent = row.enabled ? 'Turn Off' : 'Turn On';
    toggleButton.addEventListener('click', () => toggleRecord(row.token, !row.enabled));
    actionsTd.append(toggleButton);

    tr.append(actionsTd);
    recordsBody.append(tr);
  }
}

async function deleteRecord(token) {
  if (!confirm('Delete this record permanently?')) return;
  try {
    const response = await fetch('/api/admin-action', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action: 'delete', token}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to delete this record.');
    loadRecords();
  } catch (error) {
    alert(error.message || 'Unable to delete this record.');
  }
}

async function toggleRecord(token, target) {
  try {
    const response = await fetch('/api/admin-action', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action: 'toggle', token, target}),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to update this record.');
    loadRecords();
  } catch (error) {
    alert(error.message || 'Unable to update this record.');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  message.textContent = 'Saving your details…';
  document.getElementById('result').hidden = true;
  try {
    const payload = {website: document.getElementById('website').value, editToken: editTokenInput.value};
    for (const field of FIELDS) payload[field] = document.getElementById(field).value;
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to save your details.');
    if (editTokenInput.value) {
      window.location.href = 'form.html?updated=1';
      return;
    }
    const url = new URL('index.html', window.location.href);
    url.searchParams.set('id', data.id);
    const link = document.getElementById('recordLink');
    link.href = url.href;
    link.textContent = url.href;
    document.getElementById('result').hidden = false;
    message.textContent = 'Details saved successfully. Your record link is ready.';
    form.reset();
    document.getElementById('model').value = 'N/A';
    document.getElementById('company').value = 'Private';
    document.getElementById('location').value = 'Jubail';
    document.getElementById('trainer').value = 'Ahmad Nazeer';
    const next = await fetch('/api/next-id', {cache: 'no-store'}).then((r) => r.json()).catch(() => ({}));
    if (next.deliverableId) document.getElementById('deliverableId').value = next.deliverableId;
    loadRecords();
  } catch (error) {
    message.textContent = error.message || 'Unable to save. Please try again.';
  } finally {
    submitButton.disabled = false;
  }
});

document.getElementById('copyLink').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(document.getElementById('recordLink').href);
    message.textContent = 'Link copied.';
  } catch {
    message.textContent = 'Please select and copy the record link above.';
  }
});

init();
