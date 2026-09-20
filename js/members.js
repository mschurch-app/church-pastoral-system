// js/members.js
import { db, state, MINISTRY_OPTIONS, selectedMinistries, getChurchTerms } from './state.js';

export async function loadMembers() {
  const { data } = await db.from('members').select('*').eq('church_id', state.activeChurch).order('id');
  state.cachedMembers = data || [];
  filterMembers();
  populateGroupFilterDropdown();
}

export function setMemberViewMode(mode) {
  state.memberViewMode = mode;
  const btnCards = document.getElementById('btnViewCards');
  const btnTable = document.getElementById('btnViewTable');
  if (mode === 'cards') {
    if (btnCards) btnCards.className = "px-3 py-1.5 rounded-xl font-bold btn-warm";
    if (btnTable) btnTable.className = "px-3 py-1.5 rounded-xl font-bold text-stone-600";
  } else {
    if (btnCards) btnCards.className = "px-3 py-1.5 rounded-xl font-bold text-stone-600";
    if (btnTable) btnTable.className = "px-3 py-1.5 rounded-xl font-bold btn-warm";
  }
  filterMembers();
}

// 掛載至全域 window，確保 HTML onclick="setMemberViewMode(...)" 正常呼叫
window.setMemberViewMode = setMemberViewMode;

export function filterMembers() {
  const searchInput = document.getElementById('memberSearch');
  const groupSelect = document.getElementById('memberFilterGroupSelect');
  const sortSelect = document.getElementById('memberSortSelect');
  
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const filterGrp = groupSelect ? groupSelect.value : 'ALL';
  const sortBy = sortSelect ? sortSelect.value : 'name';

  let filtered = state.cachedMembers.filter(m => {
    const matchesQ = (m.name && m.name.toLowerCase().includes(q)) || 
                     (m.phone && m.phone.includes(q)) ||
                     (m.memo && m.memo.toLowerCase().includes(q));
    const matchesGrp = filterGrp === 'ALL' || m.group_name === filterGrp;
    return matchesQ && matchesGrp;
  });

  const faithOrder = {
    '新朋友（初次聚會）': 1,
    '慕道友（偶爾出現）': 2,
    '受洗初信': 3,
    '委身家人（穩定聚會）': 4,
    '門徒': 5,
    '領袖': 6
  };

  filtered.sort((a, b) => {
    if (sortBy === 'faith') {
      return (faithOrder[a.faith_status] || 99) - (faithOrder[b.faith_status] || 99);
    } else if (sortBy === 'group') {
      return (a.group_name || '未編組').localeCompare(b.group_name || '未編組', 'zh-TW');
    } else {
      return (a.name || '').localeCompare(b.name || '', 'zh-TW');
    }
  });

  renderMembersView(filtered);
}

// 掛載至全域 window
window.filterMembers = filterMembers;

function renderMembersView(list) {
  const container = document.getElementById('memberCardsStream');
  if (!container) return;
  if (!list.length) {
    container.className = "w-full";
    container.innerHTML = `<div class="py-16 text-center text-stone-400 text-xs">查無名冊資料</div>`;
    return;
  }

  const terms = getChurchTerms(state.activeChurch);

  if (state.memberViewMode === 'table') {
    container.className = "w-full overflow-hidden";
    container.innerHTML = `
      <div class="lux-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-stone-100/80 border-b border-stone-200 text-stone-600 font-black">
                <th class="p-3.5 whitespace-nowrap">姓名 / 性別</th>
                <th class="p-3.5 whitespace-nowrap">電話號碼</th>
                <th class="p-3.5 whitespace-nowrap">所屬${terms.group}</th>
                <th class="p-3.5 whitespace-nowrap">信仰成熟度</th>
                <th class="p-3.5 whitespace-nowrap">居住區域</th>
                <th class="p-3.5 whitespace-nowrap">服事恩賜</th>
                <th class="p-3.5 whitespace-nowrap text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-200/60">
              ${list.map(m => {
                const hasLine = m.line_id && m.line_id.startsWith('U');
                const isNewcomer = m.faith_status === '新朋友（初次聚會）';
                return `
                  <tr class="hover:bg-orange-50/30 transition">
                    <td class="p-3.5 font-black text-stone-800 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span>${m.name}</span>
                        <span class="text-[10px] text-stone-400 font-normal">(${m.gender || '弟兄'})</span>
                        ${hasLine ? '<i class="fa-brands fa-line text-emerald-500 text-xs" title="已綁定LINE"></i>' : ''}
                      </div>
                    </td>
                    <td class="p-3.5 font-mono text-stone-600 whitespace-nowrap">${m.phone || '－'}</td>
                    <td class="p-3.5 font-bold text-stone-700 whitespace-nowrap">${m.group_name || '未編組'}</td>
                    <td class="p-3.5 whitespace-nowrap">
                      <span class="px-2.5 py-0.5 rounded-lg ${isNewcomer ? 'bg-orange-500 text-white font-black animate-pulse' : 'bg-amber-50 text-amber-900 border border-amber-200/60 font-semibold'}">
                        ${isNewcomer ? '🌱 新朋友（初次聚會）' : (m.faith_status || '委身家人')}
                      </span>
                    </td>
                    <td class="p-3.5 text-stone-600 whitespace-nowrap">${m.district || '－'}</td>
                    <td class="p-3.5 text-stone-500 truncate max-w-[160px]">${m.ministry || '－'}</td>
                    <td class="p-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button onclick="editMember('${m.id}')" class="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 font-bold hover:bg-orange-100"><i class="fa-solid fa-pen mr-1"></i>編輯</button>
                      <button onclick="deleteMember('${m.id}')" class="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100"><i class="fa-solid fa-trash mr-1"></i>刪除</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
    container.innerHTML = list.map(m => {
      const hasLine = m.line_id && m.line_id.startsWith('U');
      const isNewcomer = m.faith_status === '新朋友（初次聚會）';
      const ministries = m.ministry ? m.ministry.split(',').map(s => s.trim()).filter(Boolean) : [];
      const cardClass = isNewcomer ? 'lux-card-newcomer p-5 space-y-3.5 flex flex-col justify-between' : 'lux-card p-5 space-y-3.5 flex flex-col justify-between';

      return `
        <div class="${cardClass}">
          <div class="space-y-3">
            <div class="flex justify-between items-start">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-2xl ${m.gender === '姊妹' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-800'} flex items-center justify-center font-extrabold text-sm shadow-sm overflow-hidden">
                  ${m.photo_url ? `<img src="${m.photo_url}" class="w-full h-full object-cover">` : m.name.slice(0, 1)}
                </div>
                <div>
                  <div class="flex items-center gap-1.5">
                    <span class="font-black text-stone-800 text-base">${m.name}</span>
                    <span class="text-[11px] text-stone-400">(${m.gender})</span>
                    ${hasLine ? '<i class="fa-brands fa-line text-emerald-500 text-xs" title="已綁定 LINE"></i>' : ''}
                  </div>
                  <p class="text-xs text-stone-500 font-mono mt-0.5">${m.phone || '未登記電話'}</p>
                </div>
              </div>
              <span class="text-[11px] font-bold px-3 py-1 rounded-xl bg-stone-100 text-stone-700 border border-stone-200/80">
                ${m.group_name || '未編組'}
              </span>
            </div>

            <div class="flex flex-wrap gap-1.5 items-center pt-1">
              <span class="text-[10px] px-2 py-0.5 rounded-lg ${isNewcomer ? 'bg-orange-500 text-white font-black animate-pulse' : 'bg-amber-50 text-amber-900 border border-amber-200/60 font-semibold'}">
                ${isNewcomer ? '🌱 新朋友（迎賓中）' : (m.faith_status || '委身家人')}
              </span>
              ${m.district ? `<span class="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 font-medium">${m.district}</span>` : ''}
              ${m.age_group ? `<span class="text-[10px] px-2 py-0.5 rounded-lg bg-orange-50 text-orange-800 font-bold">${m.age_group}</span>` : ''}
              ${m.birthday ? `<span class="text-[10px] px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold"><i class="fa-solid fa-cake-candles mr-1"></i>${m.birthday}</span>` : ''}
              ${ministries.map(item => `<span class="text-[10px] px-2 py-0.5 rounded-lg bg-orange-100 text-orange-900 font-bold">${item}</span>`).join('')}
            </div>

            ${isNewcomer && m.memo ? `
              <div class="p-3 rounded-2xl bg-orange-50/90 border border-orange-200 text-xs text-stone-800 space-y-1.5 shadow-sm">
                <div class="flex items-center gap-1.5 font-black text-orange-950 text-[11px]">
                  <i class="fa-solid fa-seedling text-orange-600"></i>
                  <span>新朋友初次填寫摘要</span>
                </div>
                <p class="leading-relaxed font-medium text-[11px]">${m.memo}</p>
              </div>
            ` : (m.memo ? `
              <div class="p-2.5 rounded-xl bg-stone-100/70 border border-stone-200/60 text-[11px] text-stone-600 flex items-start gap-2">
                <i class="fa-regular fa-note-sticky text-amber-600 mt-0.5 flex-shrink-0"></i>
                <span class="line-clamp-2 leading-relaxed">${m.memo}</span>
              </div>
            ` : '')}
          </div>

          <div class="pt-3 border-t border-stone-200/80 flex items-center justify-end">
            <div class="flex gap-2">
              <button onclick="editMember('${m.id}')" class="text-xs px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold transition">
                <i class="fa-solid fa-pen mr-1"></i>編輯
              </button>
              <button onclick="deleteMember('${m.id}')" class="text-xs px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function populateGroupFilterDropdown() {
  const select = document.getElementById('memberFilterGroupSelect');
  if (!select) return;
  const terms = getChurchTerms(state.activeChurch);
  const officialGroups = state.cachedGroups.map(g => g.name).filter(Boolean);
  select.innerHTML = `<option value="ALL">全部${terms.group}</option><option value="未編組">未編組</option>` + officialGroups.map(g => `<option value="${g}">${g}</option>`).join('');
}

export function populateDistrictDropdown(selectedVal) {
  const select = document.getElementById('editDistrict');
  if (!select) return;
  const shineDistricts = ['西屯區', '南屯區', '北屯區', '西區', '北區', '大雅區', '沙鹿區', '東區', '南區', '其他'];
  const mplusDistricts = ['大雅區', '西屯區', '北屯區', '南屯區', '西區', '北區', '東區', '南區', '沙鹿區', '其他'];
  const list = (state.activeChurch === 'SHiNE') ? shineDistricts : mplusDistricts;
  let html = `<option value="">未填寫 / 未選擇</option>`;
  html += list.map(d => `<option value="${d}" ${d === selectedVal ? 'selected' : ''}>${d}</option>`).join('');
  select.innerHTML = html;
}

export function renderMinistryChips() {
  const container = document.getElementById('ministryChipsContainer');
  if (!container) return;
  const mPlusOnlyOptions = ["總務愛筵", "司會報告", "主日禱告", "聖餐事奉"];
  const availableOptions = MINISTRY_OPTIONS.filter(opt => {
    if (state.activeChurch === 'SHiNE' && mPlusOnlyOptions.includes(opt)) return false;
    return true;
  });
  container.innerHTML = availableOptions.map(opt => {
    const isSel = selectedMinistries.has(opt);
    return `<div onclick="toggleMinistryChip('${opt}')" class="chip-item px-3 py-1.5 rounded-xl text-xs font-bold border ${isSel ? 'active' : 'bg-stone-50 border-stone-200 text-stone-600'}">${opt}</div>`;
  }).join('');
}

window.toggleMinistryChip = function(name) {
  if (selectedMinistries.has(name)) selectedMinistries.delete(name);
  else selectedMinistries.add(name);
  renderMinistryChips();
};

window.openMemberModal = function() {
  document.getElementById('editMemberId').value = '';
  document.getElementById('editName').value = '';
  document.getElementById('editPhone').value = '';
  document.getElementById('editBirthday').value = '';
  document.getElementById('editBaptism').value = '';
  document.getElementById('editMemo').value = '';
  populateMemberModalGroupDropdown('未編組');
  populateDistrictDropdown('');
  selectedMinistries.clear();
  renderMinistryChips();
  document.getElementById('memberModalTitle').querySelector('span').innerText = '新增會友資料';
  document.getElementById('memberEditModal').classList.remove('hidden');
};

function populateMemberModalGroupDropdown(currentGroup) {
  const select = document.getElementById('editGroupSelect');
  if (!select) return;
  const groups = ['未編組', ...state.cachedGroups.map(g => g.name)];
  select.innerHTML = groups.map(g => `<option value="${g}" ${g === currentGroup ? 'selected' : ''}>${g}</option>`).join('');
}

window.editMember = function(id) {
  const m = state.cachedMembers.find(x => String(x.id) === String(id));
  if (!m) return;
  document.getElementById('editMemberId').value = m.id;
  document.getElementById('editName').value = m.name;
  document.getElementById('editGender').value = m.gender || '弟兄';
  document.getElementById('editPhone').value = m.phone || '';
  document.getElementById('editBirthday').value = m.birthday || '';
  document.getElementById('editBaptism').value = m.baptism_date || '';
  document.getElementById('editFaithStatus').value = m.faith_status || '新朋友（初次聚會）';
  populateDistrictDropdown(m.district || '');
  document.getElementById('editMemo').value = m.memo || '';
  populateMemberModalGroupDropdown(m.group_name || '未編組');
  selectedMinistries.clear();
  if (m.ministry) m.ministry.split(',').map(s => s.trim()).forEach(i => i && selectedMinistries.add(i));
  renderMinistryChips();
  document.getElementById('memberModalTitle').querySelector('span').innerText = `編輯會友：${m.name}`;
  document.getElementById('memberEditModal').classList.remove('hidden');
};

window.closeMemberModal = function() {
  document.getElementById('memberEditModal').classList.add('hidden');
};

window.saveMemberFromModal = async function() {
  const id = document.getElementById('editMemberId').value;
  const name = document.getElementById('editName').value.trim();
  if (!name) return alert('會友姓名為必填！');
  const districtVal = document.getElementById('editDistrict').value;

  const payload = {
    church_id: state.activeChurch,
    name,
    gender: document.getElementById('editGender').value,
    phone: document.getElementById('editPhone').value.trim(),
    birthday: document.getElementById('editBirthday').value.trim(),
    baptism_date: document.getElementById('editBaptism').value.trim(),
    group_name: document.getElementById('editGroupSelect').value,
    faith_status: document.getElementById('editFaithStatus').value,
    district: districtVal ? districtVal : null,
    ministry: Array.from(selectedMinistries).join(', '),
    memo: document.getElementById('editMemo').value.trim()
  };

  if (id) await db.from('members').update(payload).eq('id', id);
  else await db.from('members').insert([payload]);

  closeMemberModal();
  await loadMembers();
};

window.deleteMember = async function(id) {
  if (!confirm('確定刪除此會友？')) return;
  await db.from('members').delete().eq('id', id);
  await loadMembers();
};
