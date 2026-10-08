import { supabaseRequest } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const body = req.body || {};
  const token = body.token;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: 'Invalid record.' });
  }
  try {
    if (body.action === 'delete') {
      await supabaseRequest('DELETE', `/rest/v1/document_records?token=eq.${encodeURIComponent(token)}`);
    } else if (body.action === 'toggle') {
      await supabaseRequest('PATCH', `/rest/v1/document_records?token=eq.${encodeURIComponent(token)}`, { enabled: body.target === true || body.target === 'true' });
    } else {
      return res.status(400).json({ error: 'Unknown action.' });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Admin action error:', error);
    return res.status(500).json({ error: 'Action failed. Please try again.' });
  }
}
