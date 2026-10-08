import { supabaseRequest } from '../lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const number = await supabaseRequest('POST', '/rest/v1/rpc/next_deliverable_number', {});
    const year = new Date().getFullYear();
    return res.status(200).json({ deliverableId: `151-${year}-${number}-EN` });
  } catch (error) {
    console.error('Deliverable ID counter error:', error);
    return res.status(200).json({ deliverableId: '', debug: String(error && error.message || error) });
  }
}
