// js/prayers.js
import { db, state, SUPABASE_URL, SUPABASE_KEY } from './state.js';

export async function loadPrayers() {
  const { data } = await db.from('prayer_requests').select('*').eq('church_id', state.activeChurch).order('created_at', { ascending: false });
  const c = document.getElementById('prayerCardsList');
  if (!c) return;
  if (!data || !data.length) {
    c.innerHTML = '<div class="py-12 text-center text-stone-400 text-xs">目前無代禱事項</div>';
    return;
  }
  c.innerHTML = data.map(p => `
    <div class="lux-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
      <div>
        <span class="font-black text-base text-stone-800">${p.member_name}</span>
        <p class="text-stone-600 mt-1">「${p.content}」</p>
        ${p.pastor_reply ? `<p class="text-orange-800 mt-1.5 font-bold">已回覆：${p.pastor_reply}</p>` : ''}
      </div>
      <div class="flex gap-2">
        <button onclick="openPrayerReplyModal(${p.id}, '${p.member_name}', '${encodeURIComponent(p.content)}', '${p.line_id || ''}')" class="px-3.5 py-1.5 rounded-xl btn-warm font-bold">回覆祝禱</button>
        <button onclick="deletePrayer(${p.id})" class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
  `).join('');
}

window.openPrayerReplyModal = function(id, name, lineId, contentEncoded) {
  document.getElementById('replyPrayerId').value = id;
  document.getElementById('replyMemberName').value = name;
  document.getElementById('replyLineUserId').value = lineId || '';
  document.getElementById('replyTargetTitle').innerText = `為【${name}】撰寫守望祝禱`;
  document.getElementById('replyOriginalContent').innerText = decodeURIComponent(contentEncoded);
  document.getElementById('replyPrayerText').value = '';
  document.getElementById('prayerReplyModal').classList.remove('hidden');
}

window.closePrayerReplyModal = function() {
  document.getElementById('prayerReplyModal').classList.add('hidden');
}

window.sendPastorPrayerReply = async function() {
  const id = document.getElementById('replyPrayerId').value;
  const name = document.getElementById('replyMemberName').value;
  const lineUserId = document.getElementById('replyLineUserId').value;
  const prayerText = document.getElementById('replyPrayerText').value.trim();
  if (!prayerText) return alert('請填寫祝禱文！');

  const btn = document.getElementById('btnSendReply');
  btn.disabled = true;
  btn.innerText = "傳送中...";

  const workerName = state.currentUser ? state.currentUser.name : '教牧同工';

  await db.from('prayer_requests').update({ pastor_reply: prayerText, status: '已回覆' }).eq('id', id);

  if (lineUserId) {
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/line-bot?action=push_interceded&church=${encodeURIComponent(state.activeChurch)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ userId: lineUserId, memberName: name, workerName, prayerText })
      });
    } catch(err) {
      console.warn("LINE push error:", err);
    }
  }

  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-paper-plane text-xs"></i> <span>送出守望回響</span>`;
  alert('✨ 守望祝禱已成功送達會友 LINE！');
  closePrayerReplyModal();
  loadPrayers();
}

window.deletePrayer = async function(id) {
  if (!confirm('確定刪除此代禱紀錄？')) return;
  await db.from('prayer_requests').delete().eq('id', id);
  loadPrayers();
}
