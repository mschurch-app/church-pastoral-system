// js/members.js
import { db, cachedMembers, cachedGroups, activeChurch, getChurchTerms } from './app.js';

export async function loadMembers() {
  const { data } = await db.from('members').select('*').eq('church_id', activeChurch).order('id');
  // ... (其餘會友名冊邏輯)
}
