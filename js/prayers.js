// js/prayers.js
import { db, state, SUPABASE_URL, SUPABASE_KEY } from './state.js';

// 當前子分頁：'private' (教牧私密) 或 'public' (公開代禱牆)
let currentSubTab = 'private';
// 當前狀態篩選：'ALL', 'pending', 'praying', 'answered'
let currentStatusFilter = 'ALL';
// 快取代禱清單
let cachedPrayersList = [];

/**
 * 載入代禱資料（從 prayers 資料表讀取當前堂會的事項）
 */
export async function loadPrayers() {
  const container = document.getElementById('prayerCardsList');
  if (!container) return;

  try {
    const { data, error } = await db
      .from('prayers')
      .select('*')
      .eq('church_id', state.activeChurch)
      .order('created_at', { ascending: false });

    if (error) throw error;
    cachedPrayersList = data || [];

    // 更新計數器
    updateTabCounts();

    // 渲染卡片
    renderPrayersList();
  } catch (err) {
    console.error('載入代禱事項失敗:', err);
    container.innerHTML = `<div class="py-12 text-center text-rose-500 text-xs font-bold">載入失敗：${err.message}</div>`;
  }
}

/**
 * 更新頂部分頁數量統計
 */
function updateTabCounts() {
  const privateCount = cachedPrayersList.filter(p => p.is_private === true).length;
  const publicCount = cachedPrayersList.filter(p => p.is_private !== true).length;

  const privEl = document.getElementById('countPrivatePrayers');
  const pubEl = document.getElementById('countPublicPrayers');
  if (privEl) privEl.innerText = privateCount;
  if (pubEl) pubEl.innerText = publicCount;
}

/**
 * 切換「教牧私密匣」與「公開代禱牆」分頁
 */
export function switchPrayerSubTab(tab) {
  currentSubTab = tab;
  const btnPrivate = document.getElementById('btn-prayer-private');
  const btnPublic = document.getElementById('btn-prayer-public');

  if (tab === 'private') {
    if (btnPrivate) btnPrivate.className = 'px-4 py-2 rounded-xl font-extrabold btn-warm flex items-center gap-2';
    if (btnPublic) btnPublic.className = 'px-4 py-2 rounded-xl font-extrabold text-stone-600 hover:text-stone-900 flex items-center gap-2';
  } else {
    if (btnPrivate) btnPrivate.className = 'px-4 py-2 rounded-xl font-extrabold text-stone-600 hover:text-stone-900 flex items-center gap-2';
    if (btnPublic) btnPublic.className = 'px-4 py-2 rounded-xl font-extrabold btn-warm flex items-center gap-2';
  }

  renderPrayersList();
}

/**
 * 依狀態篩選（待關懷、守望中、蒙應允）
 */
export function filterPrayersByStatus() {
  const select = document.getElementById('prayerStatusFilter');
  currentStatusFilter = select ? select.value : 'ALL';
  renderPrayersList();
}

/**
 * 渲染卡片列表
 */
function renderPrayersList() {
  const container = document.getElementById('prayerCardsList');
  if (!container) return;

  // 1. 篩選目前分頁 (私密 vs 公開)
  let list = cachedPrayersList.filter(p => {
    return currentSubTab === 'private' ? (p.is_private === true) : (p.is_private !== true);
  });

  // 2. 篩選狀態
  if (currentStatusFilter !== 'ALL') {
    list = list.filter(p => (p.status || 'pending') === currentStatusFilter);
  }

  if (!list.length) {
    container.innerHTML = `
      <div class="lux-card py-16 text-center text-stone-400 text-xs space-y-2">
        <i class="fa-solid fa-folder-open text-2xl text-stone-300"></i>
        <p>目前此分類下無代禱事項</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => {
    const author = p.author_name || p.member_name || '主內家人';
    const group = p.group_name ? `（${p.group_name}）` : '';
    const status = p.status || 'pending';
    const hasNotes = Boolean(p.pastoral_notes && p.pastoral_notes.trim());
    const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    const safeContent = (p.content || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

    // 狀態徽章標籤
    let statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">⏳ 待關懷</span>`;
    if (status === 'praying') {
      statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-950 border border-orange-200">🕊️ 守望中</span>`;
    } else if (status === 'answered') {
      statusBadge = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">✨ 蒙應允</span>`;
    }

    return `
      <div class="lux-card p-5 space-y-3 text-xs">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-black text-sm sm:text-base text-stone-800">${author}</span>
            <span class="text-stone-400 font-medium">${group}</span>
            ${p.is_private ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200"><i class="fa-solid fa-lock text-[9px]"></i> 教牧私密</span>` : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600">🌐 公開牆</span>`}
            ${statusBadge}
          </div>
          <span class="text-stone-400 text-[11px] font-mono">${createdAt}</span>
        </div>

        <div>
          ${p.title ? `<div class="font-black text-stone-800 text-xs mb-1">📌 ${p.title}</div>` : ''}
          <p class="text-stone-700 leading-relaxed whitespace-pre-wrap">${p.content || ''}</p>
        </div>

        ${hasNotes ? `
          <div class="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-950">
            <div class="flex items-center gap-1.5 font-black text-[11px] text-amber-900 mb-0.5">
              <i class="fa-solid fa-clipboard-user text-orange-600"></i> 教牧關懷備註：
            </div>
            <p class="leading-relaxed text-[11px] whitespace-pre-wrap">${p.pastoral_notes}</p>
          </div>
        ` : ''}

        ${p.pastor_reply ? `
          <div class="p-3 rounded-xl bg-orange-50/70 border border-orange-200/70 text-orange-950 text-[11px]">
            <span class="font-bold text-orange-900 block">💬 已送出的守望祝禱：</span>
            <p class="mt-0.5 leading-relaxed">${p.pastor_reply}</p>
          </div>
        ` : ''}

        <div class="pt-2 border-t border-stone-100 flex flex-wrap justify-between items-center gap-2">
          <div class="flex items-center gap-1.5">
            <button onclick="openPastoralNotesModal(${p.id}, '${author}', '${safeContent}', '${p.pastoral_notes ? p.pastoral_notes.replace(/'/g, "\\'") : ''}', '${status}', '${createdAt}')" class="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center gap-1 transition">
              <i class="fa-solid fa-clipboard-user text-xs text-orange-600"></i>
              <span>${hasNotes ? '修改關懷紀錄' : '新增關懷備註'}</span>
            </button>
            <button onclick="openPrayerReplyModal(${p.id}, '${author}', '${p.line_user_id || p.line_id || ''}', '${encodeURIComponent(p.content || '')}')" class="px-3.5 py-1.5 rounded-xl btn-warm font-bold flex items-center gap-1">
              <i class="fa-solid fa-paper-plane text-[10px]"></i>
              <span>回覆祝禱</span>
            </button>
          </div>

          <button onclick="deletePrayer(${p.id})" class="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition" title="刪除此代禱紀錄">
            <i class="fa-solid fa-trash text-xs"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 打開【教牧關懷追蹤紀錄】彈窗
 */
export function openPastoralNotesModal(id, author, content, notes, status, timeStr) {
  const modal = document.getElementById('pastoralNotesModal');
  if (!modal) return;

  document.getElementById('pastoralPrayerId').value = id;
  document.getElementById('pastoralAuthorInfo').innerText = `提請人：${author}`;
  document.getElementById('pastoralTimeInfo').innerText = timeStr || '';
  document.getElementById('pastoralPrayerBody').innerText = content;
  document.getElementById('pastoralNotesText').value = notes || '';
  document.getElementById('pastoralStatusSelect').value = status || 'pending';

  modal.classList.remove('hidden');
}

/**
 * 關閉【教牧關懷追蹤紀錄】彈窗
 */
export function closePastoralNotesModal() {
  const modal = document.getElementById('pastoralNotesModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * 儲存教牧備註與狀態
 */
export async function savePastoralNotesData() {
  const id = document.getElementById('pastoralPrayerId').value;
  const notes = document.getElementById('pastoralNotesText').value.trim();
  const status = document.getElementById('pastoralStatusSelect').value;

  try {
    const { error } = await db
      .from('prayers')
      .update({
        pastoral_notes: notes,
        status: status,
        is_answered: (status === 'answered')
      })
      .eq('id', id);

    if (error) throw error;

    alert('✨ 教牧關懷紀錄與狀態已更新！');
    closePastoralNotesModal();
    loadPrayers();
  } catch (err) {
    alert('儲存失敗：' + err.message);
  }
}

/**
 * 打開【回覆祝禱】彈窗
 */
window.openPrayerReplyModal = function(id, name, lineId, contentEncoded) {
  document.getElementById('replyPrayerId').value = id;
  document.getElementById('replyMemberName').value = name;
  document.getElementById('replyLineUserId').value = lineId || '';
  document.getElementById('replyTargetTitle').innerText = `為【${name}】撰寫守望祝禱`;
  document.getElementById('replyOriginalContent').innerText = decodeURIComponent(contentEncoded);
  document.getElementById('replyPrayerText').value = '';
  document.getElementById('prayerReplyModal').classList.remove('hidden');
};

/**
 * 關閉【回覆祝禱】彈窗
 */
window.closePrayerReplyModal = function() {
  document.getElementById('prayerReplyModal').classList.add('hidden');
};

/**
 * 送出祝禱推播並更新狀態
 */
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

  try {
    await db.from('prayers').update({ 
      pastor_reply: prayerText, 
      status: 'praying' 
    }).eq('id', id);

    if (lineUserId) {
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/line-bot?action=push_interceded&church=${encodeURIComponent(state.activeChurch)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
          body: JSON.stringify({ userId: lineUserId, memberName: name, workerName, prayerText })
        });
      } catch (err) {
        console.warn("LINE push error:", err);
      }
    }

    alert('✨ 守望祝禱已成功送達會友 LINE！');
    closePrayerReplyModal();
    loadPrayers();
  } catch (err) {
    alert('送出失敗：' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane text-xs"></i> <span>送出守望回響</span>`;
  }
};

/**
 * 刪除代禱事項
 */
window.deletePrayer = async function(id) {
  if (!confirm('確定刪除此代禱紀錄？')) return;
  const { error } = await db.from('prayers').delete().eq('id', id);
  if (error) {
    alert('刪除失敗：' + error.message);
    return;
  }
  loadPrayers();
};
