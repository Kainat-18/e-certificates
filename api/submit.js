import crypto from 'node:crypto';
import { supabaseRequest } from '../lib/supabase.js';

const FIELDS = ['deliverableId', 'publishedOn', 'name', 'empId', 'issuedOn', 'validUntil', 'type', 'model', 'company', 'location', 'trainer'];

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const body = req.body || {};
  if (body.website) return res.status(400).json({ error: 'Invalid submission.' });

  const details = {};
  for (const field of FIELDS) {
    const value = body[field];
    if (typeof value !== 'string' || value.trim() === '' || value.length > 500) {
      return res.status(422).json({ error: 'Please complete every field (maximum 500 bytes each).' });
    }
    details[field] = value.trim();
  }
  for (const field of ['publishedOn', 'issuedOn', 'validUntil']) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details[field])) {
      return res.status(422).json({ error: 'Please enter valid dates.' });
    }
  }
  if (details.validUntil < details.issuedOn) {
    return res.status(422).json({ error: 'Valid until must be on or after the issue date.' });
  }
  // A public submission is not an issuer-approved document.
  details.qrStatus = 'Submitted — not reviewed by issuer';

  const editToken = typeof body.editToken === 'string' ? body.editToken : '';
  const isEdit = /^[a-f0-9]{64}$/.test(editToken);

  try {
    if (isEdit) {
      const rows = await supabaseRequest('PATCH', `/rest/v1/document_records?token=eq.${encodeURIComponent(editToken)}`, { details }, { Prefer: 'return=representation' });
      if (!rows.length) return res.status(404).json({ error: 'Record not found.' });
      return res.status(200).json({ id: editToken, updated: true });
    }
    const token = crypto.randomBytes(32).toString('hex');
    await supabaseRequest('POST', '/rest/v1/document_records', { token, details }, { Prefer: 'return=minimal' });
    return res.status(201).json({ id: token });
  } catch (error) {
    console.error('Document database error:', error);
    return res.status(500).json({ error: 'Unable to access the database. Please contact the website administrator.' });
  }
}
