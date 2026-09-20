// js/bibleTree.js
import { db, state, getChurchTerms } from './state.js';

// 計算目前年度日曆天 (全教會統一進度 Day 1 ~ 365)
export function getCurrentCalendarDay() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.min(365, Math.max(1, Math.floor(diff / oneDay)));
}

// 1. 載入當日經文進度
export async function loadTodayCurriculum(dayNumber) {
  try {
    const { data, error } = await db
      .from('bible_curriculum')
      .select('*')
      .eq('day_number', dayNumber)
      .single();

    if (error || !data) {
      console.warn('使用預設經文進度');
      return {
        day_number: dayNumber,
        ot_passages: '創世記 1-3 章',
        nt_passages: '馬太福音 1 章',
        psalms_proverbs: '詩篇 1 篇',
        key_verse_ref: '詩篇 1:3',
        key_verse_content: '他要像一棵樹栽在溪水旁，按時候結果子，葉子也不枯乾。凡他所做的盡都順利。',
        pastor_brief_note: '在溪水旁扎根，日日有活水！'
      };
    }
    return data;
  } catch (err) {
    console.error('載入課表失敗:', err);
    return null;
  }
}

// 2. 載入會友個人生命樹狀態
export async function loadUserTreeProgress(churchId, lineUserId, memberName, groupName) {
  try {
    let { data, error } = await db
      .from('bible_tree_progress')
      .select('*')
      .eq('church_id', churchId)
      .eq('line_user_id', lineUserId)
      .single();

    // 初次使用，自動為他種下第一顆種子
    if (!data) {
      const newSeed = {
        church_id: churchId,
        line_user_id: lineUserId,
        member_name: memberName || '家人',
        group_name: groupName || '未編組',
        total_water_days: 0,
        current_tree_stage: 1,
        last_watered_day: 0,
        grace_water_count: 0
      };
      const insertRes = await db.from('bible_tree_progress').insert([newSeed]).select().single();
      data = insertRes.data;
    }
    return data;
  } catch (err) {
    console.error('載入生命樹進度失敗:', err);
    return null;
  }
}

// 3. 執行今日澆水
export async function submitDailyWater(treeData, dayNumber, note) {
  try {
    const newTotalDays = (treeData.total_water_days || 0) + 1;
    
    // 計算生命樹成長階段 (1~5)
    let newStage = 1;
    if (newTotalDays > 270) newStage = 5;
    else if (newTotalDays > 180) newStage = 4;
    else if (newTotalDays > 90) newStage = 3;
    else if (newTotalDays > 30) newStage = 2;

    // 更新個人樹木表
    await db.from('bible_tree_progress')
      .update({
        total_water_days: newTotalDays,
        current_tree_stage: newStage,
        last_watered_day: dayNumber,
        last_watered_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', treeData.id);

    // 寫入澆水日誌
    await db.from('bible_water_logs').insert([{
      church_id: treeData.church_id,
      line_user_id: treeData.line_user_id,
      reading_day: dayNumber,
      action_type: 'WATER',
      journal_note: note || null
    }]);

    return { success: true, newTotalDays, newStage };
  } catch (err) {
    console.error('澆水失敗:', err);
    return { success: false, error: err };
  }
}

// 4. 小組/小家「即時樹林」數據載入
export async function loadGroupForest(churchId, groupName) {
  try {
    const { data } = await db
      .from('bible_tree_progress')
      .select('*')
      .eq('church_id', churchId)
      .eq('group_name', groupName);

    return data || [];
  } catch (err) {
    console.error('載入小組樹林失敗:', err);
    return [];
  }
}

// 5. 為同組/小家肢體代禱澆水送活水
export async function helpWaterMember(churchId, fromUserId, targetTreeId) {
  try {
    // 對方恩典水井活水 +1
    const { data: targetTree } = await db
      .from('bible_tree_progress')
      .select('*')
      .eq('id', targetTreeId)
      .single();

    if (!targetTree) return false;

    await db.from('bible_tree_progress')
      .update({
        grace_water_count: (targetTree.grace_water_count || 0) + 1
      })
      .eq('id', targetTreeId);

    // 寫入守望代禱日誌
    await db.from('bible_water_logs').insert([{
      church_id: churchId,
      line_user_id: fromUserId,
      target_user_id: targetTree.line_user_id,
      reading_day: getCurrentCalendarDay(),
      action_type: 'HELP_PRAY'
    }]);

    return true;
  } catch (err) {
    console.error('代禱送水失敗:', err);
    return false;
  }
}
