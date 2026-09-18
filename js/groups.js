// js/groups.js
import { db, state, getChurchTerms } from './state.js';
import { loadMembers } from './members.js';

export async function loadGroups() {
  const { data } = await db.from('groups').select('*').eq('church_id', state.activeChurch).order('id');
  state.cachedGroups = data || [];
  renderGroupsCards();
  populateGroupLocationDropdown('');
}

function renderGroupsCards() {
  const container = document.getElementById('groupCardsGrid');
  if (!container) return;
  const terms = getChurchTerms(state.activeChurch);
  if (!state.cachedGroups.length) {
    container.innerHTML = `<div class="col-span-full py-16 text-center text-stone-400 text-xs">目前尚無建立任何${terms.group}</div>`;
    return;
  }
  container.innerHTML = state.cachedGroups.map(g => {
    const gNameClean = (g.name || '').trim();
    const members = state.cachedMembers.filter(m => {
      const mGrpClean = (m.group_name || '').trim();
      return mGrpClean === gNameClean || mGrpClean.replace('小家', '') === gNameClean.replace('小家', '');
    });

    return `
      <div class="lux-card p-6 space-y-4 flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-black text-stone-800 text-lg tracking-tight">${g.name}</h3>
              <p class="text-xs text-orange-800 font-extrabold mt-1">${terms.leader}：${g.leader || '未設定'}</p>
            </div>
            <span class="text-xs px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80">${members.length} 人</span>
          </div>
          <div class="space-y-1 text-xs text-stone-500 pt-1">
            <p><i class="fa-regular fa-clock w-4 text-orange-600"></i> ${g.meeting_time || '時間彈性'}</p>
            <p><i class="fa-solid fa-location-dot w-4 text-orange-600"></i> ${g.location || '地點自訂'}</p>
          </div>
        </div>
        <div class="pt-3.5 border-t border-stone-200/80 flex items-center justify-between gap-2">
          <button onclick="openGroupMembersManageModal(${g.id})" class="flex-1 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-xs font-bold text-orange-800 transition flex items-center justify-center gap-1.5 shadow-sm">
            <i class="fa-solid fa-users-gear text-orange-600 text-xs"></i>
            <span>成員名單 (${members.length})</span>
          </button>
          <button onclick="editGroup(${g.id})" class="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-900 flex items-center justify-center"><i class="fa-solid fa-pen text-xs"></i></button>
          <button onclick="deleteGroup(${g.id}, '${g.name}')" class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center"><i class="fa-solid fa-trash text-xs"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

function populateGroupLocationDropdown(currentLoc) {
  const select = document.getElementById('grpLocationSelect');
  if (!select) return;
  let html = '';
  if (state.cachedRooms.length) {
    html += `<optgroup label="🏢 教會現有空間">` + 
      state.cachedRooms.map(r => `<option value="${r.name}" ${r.name === currentLoc ? 'selected' : ''}>${r.name} (${r.floor || '1F'})</option>`).join('') + 
      `</optgroup>`;
  }
  html += `<optgroup label="外部與其他">
    <option value="組員家庭" ${currentLoc === '組員家庭' ? 'selected' : ''}>組員家庭</option>
    <option value="線上聚會" ${currentLoc === '線上聚會' ? 'selected' : ''}>線上聚會</option>
    <option value="外部咖啡廳" ${currentLoc === '外部咖啡廳' ? 'selected' : ''}>外部咖啡廳</option>
    <option value="彈性地點" ${currentLoc === '彈性地點' ? 'selected' : ''}>彈性地點</option>
  </optgroup>`;
  select.innerHTML = html;
}

window.openGroupEditModal = function() {
  const terms = getChurchTerms(state.activeChurch);
  document.getElementById('editGroupId').value = '';
  document.getElementById('grpName').value = '';
  populateLeaderDropdown('');
  populateGroupLocationDropdown('');
  document.getElementById('groupModalTitle').querySelector('span').innerText = `新增${terms.group}架構`;
  document.getElementById('groupEditModal').classList.remove('hidden');
}

function populateLeaderDropdown(currentLeader) {
  const select = document.getElementById('grpLeaderSelect');
  if (!select) return;
  select.innerHTML = '<option value="">-- 請選取負責同工 --</option>' + 
    state.cachedMembers.map(m => `<option value="${m.name}" ${m.name === currentLeader ? 'selected' : ''}>${m.name} (${m.phone || '無電話'})</option>`).join('');
}

window.editGroup = function(id) {
  const g = state.cachedGroups.find(x => x.id === id);
  if (!g) return;
  const terms = getChurchTerms(state.activeChurch);
  document.getElementById('editGroupId').value = g.id;
  document.getElementById('grpName').value = g.name;
  populateLeaderDropdown(g.leader || '');
  populateGroupLocationDropdown(g.location || '');
  document.getElementById('groupModalTitle').querySelector('span').innerText = `編輯${terms.group}：${g.name}`;
  document.getElementById('groupEditModal').classList.remove('hidden');
}

window.closeGroupEditModal = function() {
  document.getElementById('groupEditModal').classList.add('hidden');
}

window.saveGroupData = async function() {
  const id = document.getElementById('editGroupId').value;
  const name = document.getElementById('grpName').value.trim();
  const leader = document.getElementById('grpLeaderSelect').value;
  if (!name || !leader) return alert('名稱與負責同工為必填！');

  const weekday = document.getElementById('grpWeekdaySelect').value;
  const st = document.getElementById('grpStartTime').value;
  const et = document.getElementById('grpEndTime').value;

  const payload = {
    church_id: state.activeChurch,
    name,
    leader,
    meeting_time: `${weekday} ${st}-${et}`,
    location: document.getElementById('grpLocationSelect').value
  };

  if (id) await db.from('groups').update(payload).eq('id', id);
  else await db.from('groups').insert([payload]);

  closeGroupEditModal();
  await loadMembers();
  await loadGroups();
}

window.deleteGroup = async function(id, name) {
  const terms = getChurchTerms(state.activeChurch);
  if (!confirm(`確定刪除【${name}】${terms.group}？組員將變更為「未編組」！`)) return;
  await db.from('members').update({ group_name: '未編組' }).eq('church_id', state.activeChurch).eq('group_name', name);
  await db.from('groups').delete().eq('id', id);
  await loadMembers();
  await loadGroups();
}

window.openGroupMembersManageModal = function(groupId) {
  state.activeManagingGroup = state.cachedGroups.find(x => x.id === groupId);
  if (!state.activeManagingGroup) return;
  document.getElementById('manageModalGroupTitle').innerText = `${state.activeManagingGroup.name}`;
  renderGroupMembersManagerList();
  populateUnassignedMembersDropdown();
  document.getElementById('groupMembersManageModal').classList.remove('hidden');
}

window.closeGroupMembersManageModal = function() {
  state.activeManagingGroup = null;
  document.getElementById('groupMembersManageModal').classList.add('hidden');
}

function renderGroupMembersManagerList() {
  const container = document.getElementById('groupMemberListContainer');
  const terms = getChurchTerms(state.activeChurch);
  const gNameClean = (state.activeManagingGroup.name || '').trim();
  const members = state.cachedMembers.filter(m => {
    const mGrpClean = (m.group_name || '').trim();
    return mGrpClean === gNameClean || mGrpClean.replace('小家', '') === gNameClean.replace('小家', '');
  });

  if (!members.length) {
    container.innerHTML = `<div class="py-12 text-center text-stone-400 text-xs">此${terms.group}暫無組員</div>`;
    return;
  }
  container.innerHTML = members.map(m => {
    const isLeader = state.activeManagingGroup.leader && state.activeManagingGroup.leader.includes(m.name);
    return `
      <div class="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl ${isLeader ? 'bg-amber-500 text-white' : 'bg-orange-100 text-orange-900'} flex items-center justify-center font-black">
            ${m.name.slice(0, 1)}
          </div>
          <div>
            <span class="font-black text-stone-800">${m.name}</span>
            ${isLeader ? `<span class="ml-1 text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold">${terms.leader}</span>` : ''}
            <p class="text-[11px] text-stone-500 font-mono mt-0.5">${m.phone || '無電話'}</p>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          ${!isLeader ? `<button onclick="setAsGroupLeader('${m.name}')" class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">設為${terms.leader}</button>` : ''}
          <button onclick="removeMemberFromGroup(${m.id})" class="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold">移出</button>
        </div>
      </div>
    `;
  }).join('');
}

function populateUnassignedMembersDropdown() {
  const select = document.getElementById('unassignedOrOtherMemberSelect');
  if (!select) return;
  const gNameClean = (state.activeManagingGroup.name || '').trim();
  const otherMembers = state.cachedMembers.filter(m => (m.group_name || '').trim() !== gNameClean);
  select.innerHTML = otherMembers.length ? otherMembers.map(m => `<option value="${m.id}">${m.name} (${m.group_name || '未編組'})</option>`).join('') : '<option value="">無其他可調入會友</option>';
}

window.setAsGroupLeader = async function(memberName) {
  if (!state.activeManagingGroup) return;
  await db.from('groups').update({ leader: memberName }).eq('id', state.activeManagingGroup.id);
  state.activeManagingGroup.leader = memberName;
  await loadGroups();
  renderGroupMembersManagerList();
}

window.removeMemberFromGroup = async function(memberId) {
  const m = state.cachedMembers.find(x => x.id === memberId);
  if (!m || !state.activeManagingGroup) return;
  await db.from('members').update({ group_name: '未編組' }).eq('id', memberId);
  m.group_name = '未編組';
  renderGroupMembersManagerList();
  populateUnassignedMembersDropdown();
  renderGroupsCards();
}

window.assignSelectedMemberToCurrentGroup = async function() {
  const memberId = document.getElementById('unassignedOrOtherMemberSelect').value;
  if (!memberId || !state.activeManagingGroup) return;
  const m = state.cachedMembers.find(x => x.id === parseInt(memberId));
  if (!m) return;
  await db.from('members').update({ group_name: state.activeManagingGroup.name }).eq('id', m.id);
  m.group_name = state.activeManagingGroup.name;
  renderGroupMembersManagerList();
  populateUnassignedMembersDropdown();
  renderGroupsCards();
}
