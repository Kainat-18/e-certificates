const notice = document.createElement('p');
notice.setAttribute('role', 'status');
notice.setAttribute('aria-live', 'polite');
const content = document.querySelector('.qrc-code-reader-content');
content.prepend(notice);
const icon = document.querySelector('.state-icon');
if (icon) icon.hidden = true;
const id = new URLSearchParams(window.location.search).get('id');
if (!id) {
  notice.textContent = 'Open your unique record link to view document details.';
  const link = document.createElement('a');
  link.href = 'index.html';
  link.textContent = 'Submit document details';
  link.style.color = '#192b62';
  notice.append(document.createElement('br'), link);
} else {
  notice.textContent = 'Loading document details…';
  fetch('/api/record?id=' + encodeURIComponent(id), {cache: 'no-store'})
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load this record.');
      return data.record;
    })
    .then((record) => {
      for (const field of ['deliverableId', 'publishedOn', 'qrStatus', 'name', 'empId', 'issuedOn', 'validUntil', 'type', 'model', 'company', 'location', 'trainer']) {
        document.getElementById(field).textContent = record[field] ?? '-';
      }
      notice.textContent = 'Submitted record. These details have not been reviewed by the issuer.';
    })
    .catch((error) => { notice.textContent = error.message || 'Unable to load document details.'; });
}
