import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vpysepgvweabioklppda.supabase.co";
const SUPABASE_KEY = "sb_publishable_6Uhqw7j8vLSuI9nOqsFVzA_YYRXfrjL";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('LINE Bot Webhook is running!');
  }

  try {
    const churchKey = req.query.church?.toUpperCase().includes('M') ? 'M+' : 'SHiNE';
    
    // 取得堂會憑證
    const { data: church } = await supabase.from('churches').select('*').eq('id', churchKey).single();
    if (!church) return res.status(404).send('Church not found');

    const events = req.body.events || [];

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleText(church, event, req.headers.host);
      } else if (event.type === 'postback') {
        await handlePostback(church, event);
      }
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
}

async function handleText(church, event, host) {
  const text = event.message.text.trim();
  const userId = event.source.userId;
  const replyToken = event.replyToken;

  // 1. 會友身分綁定
  if (text.startsWith("綁定")) {
    const parts = text.split(/\s+/);
    const phone = parts[1]?.replace(/\D/g, "");
    const name = parts[2]?.trim();
    let query = supabase.from("members").update({ line_id: userId }).eq("church_id", church.id);
    if (phone) query = query.ilike("phone", `%${phone.slice(-9)}%`);
    if (name) query = query.eq("name", name);

    const { data } = await query.select();
    const msg = (data && data.length > 0)
      ? `🎉 認證成功！${data[0].name} 同工/會友平安！LINE 已成功綁定！`
      : "⚠️ 找不到符合的會友資料，請確認電話與姓名。";
    return replyLine(church.line_channel_access_token, replyToken, [{ type: "text", text: msg }]);
  }

  // 2. 關懷代禱：關懷代禱 姓名 事項
  if (text.startsWith("關懷代禱") || text.startsWith("代禱")) {
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      return replyLine(church.line_channel_access_token, replyToken, [{
        type: "text", text: "請輸入格式：關懷代禱 姓名 事件內容"
      }]);
    }
    const name = parts[1];
    const content = parts.slice(2).join(" ");
    const { data } = await supabase.from("prayer_requests").insert([{
      church_id: church.id, member_name: name, content: content, reporter_name: "LINE同工"
    }]).select().single();

    const card = {
      type: "flex", altText: "請點選代禱等級",
      contents: {
        type: "bubble",
        header: { type: "box", layout: "vertical", backgroundColor: "#312e81", contents: [{ type: "text", text: `⛪ 代禱登記：${name}`, color: "#ffffff", weight: "bold" }] },
        body: {
          type: "box", layout: "vertical", spacing: "sm",
          contents: [
            { type: "text", text: `事項：「${content}」`, size: "sm", wrap: true },
            { type: "button", style: "secondary", height: "sm", action: { type: "postback", label: "🟢 公開代禱 · 🌿 一般事項", data: `PRAY:${data.id}:公開:一般` } },
            { type: "button", style: "primary", color: "#e11d48", height: "sm", action: { type: "postback", label: "🚨 緊急代禱 · 通報牧長", data: `PRAY:${data.id}:公開:緊急` } }
          ]
        }
      }
    };
    return replyLine(church.line_channel_access_token, replyToken, [card]);
  }

  // 3. 呼叫組員名冊
  if (text === "我的組員") {
    const { data: leader } = await supabase.from("members").select("group_name").eq("line_id", userId).single();
    if (!leader || !leader.group_name) {
      return replyLine(church.line_channel_access_token, replyToken, [{ type: "text", text: "查無您帶領的小組，請先輸入「綁定 電話 姓名」！" }]);
    }
    const { data: members } = await supabase.from("members").select("name, phone").eq("church_id", church.id).eq("group_name", leader.group_name);
    const list = (members || []).map(m => `• ${m.name}：${m.phone || '無電話'}`).join("\n");
    return replyLine(church.line_channel_access_token, replyToken, [{ type: "text", text: `【${leader.group_name}】組員名單：\n\n${list}` }]);
  }

  // 4. 點名指令
  if (text === "點名") {
    const { data: leader } = await supabase.from("members").select("name, group_name").eq("line_id", userId).single();
    const grp = leader?.group_name || "暖男";
    const lName = leader?.name || "小組長";
    const proto = host.includes('localhost') ? 'http' : 'https';
    const rollcallUrl = `${proto}://${host}/attendance.html?church=${church.id}&group=${encodeURIComponent(grp)}&leader=${encodeURIComponent(lName)}`;

    return replyLine(church.line_channel_access_token, replyToken, [{
      type: "flex", altText: "快速點名",
      contents: {
        type: "bubble",
        header: { type: "box", layout: "vertical", backgroundColor: "#4f46e5", contents: [{ type: "text", text: `⚡ ${grp} 出席點名`, color: "#ffffff", weight: "bold" }] },
        footer: { type: "box", layout: "vertical", contents: [{ type: "button", style: "primary", color: "#4f46e5", action: { type: "uri", label: "開啟 10 秒快速點名", uri: rollcallUrl } }] }
      }
    }]);
  }
}

async function handlePostback(church, event) {
  const data = event.postback.data;
  if (data.startsWith("PRAY:")) {
    const [, id, privacy, urgency] = data.split(":");
    await supabase.from("prayer_requests").update({ privacy_level: privacy, urgency_level: urgency }).eq("id", id);
    await replyLine(church.line_channel_access_token, event.replyToken, [{ type: "text", text: `✅ 代禱等級已更新為【${privacy} / ${urgency}】！` }]);
  }
}

async function replyLine(token, replyToken, messages) {
  await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages })
  });
}
