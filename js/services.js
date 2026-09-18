// js/services.js
import { db, state } from './state.js';

export async function loadServices() {
  const { data } = await db.from('service_schedules').select('*').eq('church_id', state.activeChurch).order('service_date', { ascending: true });
  state.cachedServices = data || [];
  renderServicesCards();
}

function renderServicesCards() {
  const c = document.getElementById('serviceCardsContainer');
  if (!c) return;
  if (!state.cachedServices.length) {
    c.innerHTML = '<div class="col-span-2 text-center text-stone-400 py-16 text-xs">目前無排定之服事資料，請點擊上方按鈕新增！</div>';
    return;
  }

  const isMPlus = (state.activeChurch === 'M+');

  c.innerHTML = state.cachedServices.map(s => {
    let detailsHtml = '';
    let u1 = s.usher1 || '';
    let u2 = s.usher2 || '';
    if (!u1 && !u2 && s.ushers) {
      const parts = s.ushers.split(/[、,+/]/).map(x => x.trim()).filter(Boolean);
      u1 = parts[0] || '－';
      u2 = parts[1] || '－';
    }

    if (isMPlus) {
      detailsHtml = `
        <div class="space-y-3 pt-2 text-xs">
          <div class="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200/50 space-y-2">
            <div class="flex items-center gap-1.5 text-orange-950 font-black text-[11px]"><i class="fa-solid fa-cross text-orange-600"></i><span>崇拜聖壇主禮組</span></div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎙️ 司會（主持/報告）</span><span class="font-black text-stone-800 text-xs">${s.presider || '－'}</span></div>
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🙏 主日公禱</span><span class="font-black text-stone-800 text-xs">${s.prayer || '－'}</span></div>
              <div class="ministry-badge-card col-span-2 sm:col-span-1"><span class="text-[10px] text-stone-400 font-bold">🎶 敬拜讚美</span><span class="font-black text-stone-800 text-xs">${s.worship_leader || '敬拜團'}</span></div>
            </div>
          </div>
          <div class="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/70 space-y-2">
            <div class="flex items-center gap-1.5 text-stone-800 font-black text-[11px]"><i class="fa-solid fa-sliders text-orange-600"></i><span>影音技術與主日接待</span></div>
            <div class="grid grid-cols-2 gap-2">
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎛️ 音控控台</span><span class="font-black text-stone-800 text-xs">${s.tech_sound || '－'}</span></div>
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">💻 投影字幕 / 導播</span><span class="font-black text-stone-800 text-xs">${s.tech_video || '－'}</span></div>
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🚪 主日招待 (一)</span><span class="font-black text-stone-800 text-xs">${u1 || '－'}</span></div>
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🚪 主日招待 (二)</span><span class="font-black text-stone-800 text-xs">${u2 || '－'}</span></div>
            </div>
          </div>
          <div class="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/50 space-y-2">
            <div class="flex items-center gap-1.5 text-amber-950 font-black text-[11px]"><i class="fa-solid fa-child-reaching text-amber-600"></i><span>下一代兒主牧養</span></div>
            <div class="grid grid-cols-2 gap-2">
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">📖 兒主主責老師</span><span class="font-black text-stone-800 text-xs">${s.sunday_school || '－'}</span></div>
              <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🤝 兒主助教同工</span><span class="font-black text-stone-800 text-xs">${s.sunday_school_ta || '－'}</span></div>
            </div>
          </div>
        </div>
      `;
    } else {
      detailsHtml = `
        <div class="grid grid-cols-2 gap-2.5 text-xs pt-3.5 text-stone-600">
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎤 敬拜主領</span><span class="font-black text-stone-800">${s.worship_leader || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">👥 敬拜歌者</span><span class="font-black text-stone-800">${s.singers || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎹 司琴鍵盤</span><span class="font-black text-stone-800">${s.keyboard || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎸 木／電吉他</span><span class="font-black text-stone-800">${s.guitar || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎸 貝斯手</span><span class="font-black text-stone-800">${s.bass || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🥁 爵士鼓手</span><span class="font-black text-stone-800">${s.drums || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎛️ 音控控台</span><span class="font-black text-stone-800">${s.tech_sound || '－'}</span></div>
          <div class="ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🎥 直播導播</span><span class="font-black text-stone-800">${s.tech_video || '－'}</span></div>
          <div class="col-span-2 ministry-badge-card"><span class="text-[10px] text-stone-400 font-bold">🚪 主日招待</span><span class="font-black text-stone-800">${s.ushers || '－'}</span></div>
        </div>
      `;
    }

    return `
      <div class="lux-card p-6 space-y-4 flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start border-b border-stone-200/80 pb-3.5">
            <div>
              <span class="font-black text-base sm:text-lg text-stone-800 flex items-center gap-2">
                <i class="fa-regular fa-calendar text-orange-600"></i>
                <span>${s.service_date}</span>
              </span>
              ${s.event ? `<span class="text-xs text-orange-800 font-extrabold mt-1 block">✨ ${s.event}</span>` : ''}
            </div>
            <span class="text-xs px-3 py-1.5 rounded-2xl bg-orange-100 text-orange-900 font-black border border-orange-200/80 shadow-sm">
              講道：${s.speaker || '未定'}
            </span>
          </div>
          ${detailsHtml}
        </div>
        <div class="pt-3.5 border-t border-stone-200/80 flex items-center justify-between">
          <span class="text-xs text-stone-400 font-medium">主日崇拜服事表</span>
          <div class="flex gap-2">
            <button onclick="editServiceSchedule(${s.id})" class="text-xs px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold transition flex items-center gap-1 shadow-sm">
              <i class="fa-solid fa-pen text-[10px]"></i> 調整服事
            </button>
            <button onclick="deleteServiceSchedule(${s.id}, '${s.service_date}')" class="text-xs px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function populateMinistryMemberDropdown(selectId, targetKeyword, currentValue) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const cleanVal = (currentValue || '').trim();
  const isMatch = (mName) => {
    if (!cleanVal || cleanVal === '－') return false;
    return mName === cleanVal || mName.endsWith(cleanVal) || cleanVal.endsWith(mName);
  };

  const recommended = state.cachedMembers.filter(m => m.ministry && m.ministry.includes(targetKeyword));
  const others = state.cachedMembers.filter(m => !m.ministry || !m.ministry.includes(targetKeyword));
  
  let html = `<option value="－">－ (無)</option>`;
  if (recommended.length) {
    html += `<optgroup label="🌟 推薦具恩賜同工">` + 
      recommended.map(m => `<option value="${m.name}" ${isMatch(m.name) ? 'selected' : ''}>${m.name} (${m.group_name})</option>`).join('') + 
      `</optgroup>`;
  }
  html += `<optgroup label="全部名冊名單">` + 
    others.map(m => `<option value="${m.name}" ${isMatch(m.name) ? 'selected' : ''}>${m.name}</option>`).join('') + 
    `</optgroup>`;
  select.innerHTML = html;
}

window.openNewServiceModal = function() {
  const isMPlus = (state.activeChurch === 'M+');
  document.getElementById('editServiceId').value = '';
  document.getElementById('svcDate').value = '';
  document.getElementById('svcEvent').value = '';
  document.getElementById('svcSpeaker').value = '吳俊璋牧師';
  document.getElementById('shineFieldsWrapper').classList.toggle('hidden', isMPlus);
  document.getElementById('mplusFieldsWrapper').classList.toggle('hidden', !isMPlus);

  if (isMPlus) {
    populateMinistryMemberDropdown('svcPresider', '司會', '');
    populateMinistryMemberDropdown('svcPrayer', '禱告', '');
  } else {
    document.getElementById('svcSingers').value = '';
    populateMinistryMemberDropdown('svcLeader', '主領', '');
    populateMinistryMemberDropdown('svcKeyboard', '司琴', '');
  }
  populateMinistryMemberDropdown('svcSound', '音控', '');
  populateMinistryMemberDropdown('svcVideo', '導播', '');
  populateMinistryMemberDropdown('svcUsher1', '招待', '');
  populateMinistryMemberDropdown('svcUsher2', '招待', '');

  document.getElementById('serviceModalTitle').querySelector('span').innerText = '新增主日服事週次';
  document.getElementById('serviceEditModal').classList.remove('hidden');
}

window.editServiceSchedule = function(id) {
  const s = state.cachedServices.find(x => x.id === id);
  if (!s) return;
  const isMPlus = (state.activeChurch === 'M+');
  document.getElementById('editServiceId').value = s.id;
  document.getElementById('svcDate').value = s.service_date || '';
  document.getElementById('svcEvent').value = s.event || '';
  document.getElementById('svcSpeaker').value = s.speaker || '';
  document.getElementById('shineFieldsWrapper').classList.toggle('hidden', isMPlus);
  document.getElementById('mplusFieldsWrapper').classList.toggle('hidden', !isMPlus);

  if (isMPlus) {
    populateMinistryMemberDropdown('svcPresider', '司會', s.presider || '');
    populateMinistryMemberDropdown('svcPrayer', '禱告', s.prayer || '');
  } else {
    document.getElementById('svcSingers').value = s.singers || '';
    populateMinistryMemberDropdown('svcLeader', '主領', s.worship_leader || '');
  }
  populateMinistryMemberDropdown('svcSound', '音控', s.tech_sound || '');
  populateMinistryMemberDropdown('svcVideo', '導播', s.tech_video || '');
  document.getElementById('serviceEditModal').classList.remove('hidden');
}

window.closeServiceModal = function() {
  document.getElementById('serviceEditModal').classList.add('hidden');
}

window.saveServiceData = async function() {
  const id = document.getElementById('editServiceId').value;
  const date = document.getElementById('svcDate').value.trim();
  if (!date) return alert('日期為必填！');
  const isMPlus = (state.activeChurch === 'M+');
  const u1 = document.getElementById('svcUsher1').value;
  const u2 = document.getElementById('svcUsher2').value;

  const payload = {
    church_id: state.activeChurch,
    service_date: date,
    event: document.getElementById('svcEvent').value.trim() || null,
    speaker: document.getElementById('svcSpeaker').value.trim() || null,
    tech_sound: document.getElementById('svcSound').value,
    tech_video: document.getElementById('svcVideo').value,
    usher1: u1 !== '－' ? u1 : null,
    usher2: u2 !== '－' ? u2 : null
  };

  if (isMPlus) {
    payload.presider = document.getElementById('svcPresider').value;
    payload.prayer = document.getElementById('svcPrayer').value;
    payload.worship_leader = '敬拜團';
  } else {
    payload.worship_leader = document.getElementById('svcLeader').value;
  }

  if (id) await db.from('service_schedules').update(payload).eq('id', id);
  else await db.from('service_schedules').insert([payload]);

  closeServiceModal();
  await loadServices();
}

window.deleteServiceSchedule = async function(id, dateStr) {
  if (!confirm(`確定刪除【${dateStr}】的服事安排？`)) return;
  await db.from('service_schedules').delete().eq('id', id);
  await loadServices();
}
