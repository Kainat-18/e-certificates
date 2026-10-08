import { supabaseRequest } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const token = req.query.id;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: 'Invalid verification link.' });
  }
  const admin = req.query.admin === '1';
  try {
    const filter = admin ? '' : '&enabled=is.true';
    const rows = await supabaseRequest('GET', `/rest/v1/document_records?token=eq.${encodeURIComponent(token)}&select=details,enabled${filter}`);
    if (!rows.length) return res.status(404).json({ error: 'No record found for this link.' });
    return res.status(200).json({ record: rows[0].details, enabled: rows[0].enabled });
  } catch (error) {
    console.error('Document database error:', error);
    return res.status(500).json({ error: 'Unable to access the database. Please contact the website administrator.' });
  }
}
