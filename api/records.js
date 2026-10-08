import { supabaseRequest } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const rows = await supabaseRequest('GET', '/rest/v1/document_records?select=token,details,enabled,created_at&order=created_at.desc');
    return res.status(200).json({ records: rows });
  } catch (error) {
    console.error('Record list error:', error);
    return res.status(500).json({ error: 'Unable to load records.' });
  }
}
