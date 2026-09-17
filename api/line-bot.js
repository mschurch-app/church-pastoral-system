// api/line-bot.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || "https://vpysepgvweabioklppda.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "sb_publishable_6Uhqw7j8vLSuI9nOqsFVzA_YYRXfrjL";
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('LINE Bot Webhook is Running!');
  }

  // 1. 從 URL Query 抓取堂會識別 (SHiNE 或 M+)
  const churchId = req.query.church || 'SHiNE';

  // 2. 從資料庫讀取該堂會的 LINE Access Token
  const { data: church } = await db
    .from('churches')
    .select('*')
    .eq('id', churchId)
    .single();

  if (!church || !church.line_channel_access_token) {
    return res.status(400).send('Church or LINE Token not configured');
  }

  const token = church.line_channel_access_token;
  const events = req.body.events || [];

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim();
      const replyToken = event.replyToken;
      const userId = event.source.userId;

      // 名詞依堂會文化動態設定
      const groupTerm = churchId === 'SHiNE' ? '小家' : '小組';
      const leaderTerm = churchId === 'SHiNE' ? '小家長' : '小組長';

      // 功能一：快速點名引導
      if (text.includes('點名') || text.includes('出席')) {
        // 查找該同工管轄的小組/小家
        const { data: leaderMember } = await db
          .from('members')
          .select('name, group_name')
          .eq('church_id', churchId)
          .eq('line_id', userId)
          .maybeSingle();

        const groupName = leaderMember ? leaderMember.group_name : '';
        const rollcallUrl = `https://mschurch-app.github.io/church-pastoral-system/attendance.html?church=${churchId}&group=${encodeURIComponent(groupName)}&uid=${userId}`;

        await replyLine(token, replyToken, [
          {
            type: 'template',
            altText: `${groupTerm}出席點名`,
            template: {
              type: 'buttons',
              title: `📋 ${church.name} · ${groupTerm}點名`,
              text: `平安！請點擊下方按鈕，10秒快速完成本週出席回報：`,
              actions: [
                {
                  type: 'uri',
                  label: `👉 立即進行${groupTerm}點名`,
                  uri: rollcallUrl
                }
              ]
            }
          }
        ]);
      } 
      // 功能二：快速關懷代禱登記 (格式：代禱 名字 事項內容)
      else if (text.startsWith('代禱') || text.startsWith('關懷')) {
        const parts = text.split(/\s+/);
        const targetName = parts[1] || '肢體';
        const content = parts.slice(2).join(' ') || parts.slice(1).join(' ');

        await db.from('prayer_requests').insert([{
          church_id: churchId,
          member_name: targetName,
          content: content,
          urgency_level: '一般',
          created_at: new Date().toISOString()
        }]);

        await replyLine(token, replyToken, [
          {
            type: 'text',
            text: `🙏 已為您記錄代禱事項：\n【對象】：${targetName}\n【事項】：${content}\n\n教牧團隊將同心守望禱告！`
          }
        ]);
      }
      // 功能三：會友 LINE 帳號綁定 (輸入：綁定 姓名 手機)
      else if (text.startsWith('綁定')) {
        const parts = text.split(/\s+/);
        const name = parts[1];
        const phone = parts[2];

        if (!name) {
          await replyLine(token, replyToken, [{ type: 'text', text: '請輸入：綁定 姓名 手機末四碼（例如：綁定 吳俊璋 0506）' }]);
          continue;
        }

        const { data: member } = await db
          .from('members')
          .select('id, name')
          .eq('church_id', churchId)
          .eq('name', name)
          .maybeSingle();

        if (member) {
          await db.from('members').update({ line_id: userId }).eq('id', member.id);
          await replyLine(token, replyToken, [{ type: 'text', text: `✅ 綁定成功！平安，${member.name}！您已順利連動${church.name}智慧系統。` }]);
        } else {
          await replyLine(token, replyToken, [{ type: 'text', text: `查無名冊中的【${name}】，請確認姓名是否正確，或聯繫行政幹事協助。` }]);
        }
      }
    }
  }

  return res.status(200).send('OK');
}

// LINE 回應輔助函式
async function replyLine(token, replyToken, messages) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: messages
    })
  });
}
