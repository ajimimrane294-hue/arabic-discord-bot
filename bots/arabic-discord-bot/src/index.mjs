import { Client, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

const client = new Client({ intents: 3276799, partials: [Partials.Channel, Partials.GuildMember, Partials.Message] });

let warns = {}; let config = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json')); } catch { warns = {}; }
try { config = JSON.parse(fs.readFileSync('./config.json')); } catch { config = {}; }
const saveWarns = () => fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

const raw = [];

const tobi5Builder = (name, desc) => {
  return new SlashCommandBuilder().setName(name).setDescription(desc)
.addUserOption(o=>o.setName('mention').setDescription('منشن العسكري').setRequired(false))
.addStringOption(o=>o.setName('name').setDescription('اسم العسكري الا ماكاينش منشن').setRequired(false))
.addStringOption(o=>o.setName('reason').setDescription('سبب التوبيخ').setRequired(true))
.addAttachmentOption(o=>o.setName('evidence').setDescription('دليل صورة').setRequired(false))
.addStringOption(o=>o.setName('proof').setDescription('دليل رابط').setRequired(false))
}

raw.push(tobi5Builder('توبيخ', 'تسجيل توبيخ عسكري'));
raw.push(tobi5Builder('warn', 'تسجيل توبيخ عسكري'));
raw.push(new SlashCommandBuilder().setName('توبيخاتي').setDescription('عرض توبيخاتك الخاصة'));
raw.push(new SlashCommandBuilder().setName('التوبيخات').setDescription('عرض سجل التوبيخات')
.addStringOption(o=>o.setName('name').setDescription('اسم العسكري').setRequired(false))
.addUserOption(o=>o.setName('mention').setDescription('او منشن العسكري').setRequired(false)));
raw.push(new SlashCommandBuilder().setName('ازالة_توبيخ').setDescription('ازالة توبيخ').addStringOption(o=>o.setName('name').setDescription('اسم العسكري').setRequired(true)).addIntegerOption(o=>o.setName('number').setDescription('رقم التوبيخ').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('مسح_التوبيخات').setDescription('مسح جميع التوبيخات').addStringOption(o=>o.setName('name').setDescription('اسم العسكري').setRequired(true)));

raw.push(new SlashCommandBuilder().setName('ban').setDescription('حظر عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('حظر').setDescription('حظر عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('kick').setDescription('طرد عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('طرد').setDescription('طرد عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('timeout').setDescription('اسكات عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)).addIntegerOption(o=>o.setName('duration').setDescription('المدة بالدقائق').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('اسكات').setDescription('اسكات عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)).addIntegerOption(o=>o.setName('duration').setDescription('المدة بالدقائق').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('untimeout').setDescription('الغاء الاسكات').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('فك_الاسكات').setDescription('الغاء الاسكات').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('clear').setDescription('مسح الرسائل').addIntegerOption(o=>o.setName('amount').setDescription('عدد الرسائل').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('مسح').setDescription('مسح الرسائل').addIntegerOption(o=>o.setName('amount').setDescription('عدد الرسائل').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('lock').setDescription('قفل القناة'));
raw.push(new SlashCommandBuilder().setName('قفل').setDescription('قفل القناة'));
raw.push(new SlashCommandBuilder().setName('unlock').setDescription('فتح القناة'));
raw.push(new SlashCommandBuilder().setName('فتح').setDescription('فتح القناة'));
raw.push(new SlashCommandBuilder().setName('set-welcome').setDescription('اعداد الترحيب').addChannelOption(o=>o.setName('channel').setDescription('قناة الترحيب').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('ترحيب').setDescription('اعداد الترحيب').addChannelOption(o=>o.setName('channel').setDescription('قناة الترحيب').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('help').setDescription('عرض جميع الاوامر'));
raw.push(new SlashCommandBuilder().setName('مساعدة').setDescription('عرض جميع الاوامر'));

const commands = raw.map(c=>c.toJSON());

client.on('ready', async () => {
  console.log(`✅ ${client.user.tag} جاهز`);
  const rest = new REST({version:'10'}).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {body: commands});
  // باش يبانو الكوموندات فالبلاصة
  for(const [id, guild] of client.guilds.cache){
    try{
      await rest.put(Routes.applicationGuildCommands(client.user.id, id), {body: commands});
      console.log(`✅ تم تحديث أوامر سيرفر ${guild.name}`);
    }catch{}
  }
});

function getArabicDate(){
  const now = new Date();
  return now.toLocaleString('ar-EG', { timeZone: 'Africa/Casablanca', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }).replace(',', ' |');
}

client.on('interactionCreate', async i => {
  if(!i.isChatInputCommand()) return;
  await i.deferReply().catch(()=>{});
  const gid = i.guild.id;
  if(!warns[gid]) warns[gid] = {};
  const nameCmd = i.commandName;

  try{
    if(['توبيخ','warn'].includes(nameCmd)){
      const mentionUser = i.options.getUser('mention');
      const soldierNameInput = i.options.getString('name');
      const reason = i.options.getString('reason');
      const att = i.options.getAttachment('evidence');
      const link = i.options.getString('proof');
      if(!mentionUser &&!soldierNameInput) return i.editReply('❌ خاصك تدير منشن ولا تكتب السمية');
      const displayName = mentionUser? mentionUser.username : soldierNameInput;
      const displayMention = mentionUser? `<@${mentionUser.id}>` : `**${soldierNameInput}**`;
      const key = mentionUser? mentionUser.id : displayName.toLowerCase();
      if(!warns[gid][key]) warns[gid][key] = [];
      warns[gid][key].push({ name: displayName, displayMention, reason, mod: i.user.id, evidence: att?.url || link || null, date: Date.now() });
      saveWarns();
      const total = warns[gid][key].length;
      const dateText = getArabicDate();
      let evidenceValue = '` لا يوجد دليل `';
      if(att?.url) evidenceValue = `[ اضغط للمشاهدة ](${att.url})`;
      else if(link) evidenceValue = `[ ${link} ](${link})`;
      const embed = new EmbedBuilder().setColor('#FF0000').setTitle('🚨 السجل التأديبي للجيش 🦅')
       .addFields(
          { name: '🪖 العسكري المخالف', value: `${displayMention}\n\`${displayName}\``, inline: false },
          { name: '✍️ المسؤول', value: `<@${i.user.id}>`, inline: false },
          { name: '📝 سبب التوبيخ', value: `${reason}`, inline: false },
          { name: '\u200B', value: '\u200B', inline: false },
          { name: '🎥 دليل التوبيخ', value: evidenceValue, inline: false },
          { name: '⏳ التاريخ والوقت', value: `${dateText}`, inline: false },
          { name: '📜 التوبيخات الحالية', value: `**[ ${total} / 3 ]**`, inline: false }
        ).setTimestamp();
      if(att?.url) embed.setImage(att.url);
      return i.editReply({ embeds: [embed] });
    }

    if(nameCmd === 'توبيخاتي'){
      const myId = i.user.id; const myName = i.user.username.toLowerCase();
      let list = warns[gid][myId] || [];
      if(list.length === 0){
        for(const k in warns[gid]) for(const w of warns[gid][k]) if(w.name?.toLowerCase() === myName) list.push(w);
      }
      if(!list.length) return i.editReply({ embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle('✅ سجلك نظيف').setDescription(`<@${myId}> ما عندك حتى توبيخ`)] });
      const desc = list.map((w, idx)=>{
        const ev = w.evidence? ` [الدليل](${w.evidence})` : ' لا يوجد دليل';
        return `**${idx+1}.** ${w.reason}\n> 🎥 الدليل: ${ev}\n> بواسطة: <@${w.mod}> - <t:${Math.floor(w.date/1000)}:R>`;
      }).join('\n\n');
      return i.editReply({ content: `<@${myId}>`, embeds: [new EmbedBuilder().setTitle(`📋 توبيخاتك`).setDescription(desc).setColor(0xFFA500).setFooter({text: `المجموع [ ${list.length} / 3 ]`})] });
    }

    if(['التوبيخات'].includes(nameCmd)){
      const mention = i.options.getUser('mention');
      const soldierName = i.options.getString('name');
      const key = mention? mention.id : soldierName?.toLowerCase();
      let list = warns[gid][key] || []; if(!list.length && soldierName) list = warns[gid][soldierName.toLowerCase()] || [];
      if(!list.length) return i.editReply(`✅ سجله نظيف`);
      const desc = list.map((w, idx)=>{
        const ev = w.evidence? `🎥 [اضغط للمشاهدة](${w.evidence})` : '` لا يوجد دليل `';
        return `**${idx+1}.** 📝 ${w.reason}\n> دليل التوبيخ امامك: ${ev}\n> بواسطة: <@${w.mod}>`;
      }).join('\n\n');
      return i.editReply({ embeds: [new EmbedBuilder().setTitle(`📋 سجل ${list[0].name} [${list.length}/3]`).setDescription(desc).setColor(0x2b2d31)] });
    }

    if(['ازالة_توبيخ'].includes(nameCmd)){ const soldierName = i.options.getString('name'); const n = i.options.getInteger('number')-1; let key = soldierName; if(warns[gid][soldierName.toLowerCase()]) key = soldierName.toLowerCase(); if(!warns[gid][key]?.[n]){ for(const k in warns[gid]) if(warns[gid][k][0]?.name.toLowerCase() === soldierName.toLowerCase()) key=k; } if(!warns[gid][key]?.[n]) return i.editReply('❌ لا يوجد توبيخ بهذا الرقم'); warns[gid][key].splice(n,1); saveWarns(); return i.editReply(`✅ تمت إزالة التوبيخ رقم ${n+1}`); }
    if(['مسح_التوبيخات'].includes(nameCmd)){ const soldierName = i.options.getString('name'); const key = soldierName.toLowerCase(); warns[gid][key]=[]; if(warns[gid][soldierName]) warns[gid][soldierName]=[]; saveWarns(); return i.editReply(`🗑️ تم مسح جميع توبيخات ${soldierName}`); }
    if(['ban','حظر'].includes(nameCmd)){ const u = i.options.getUser('user'); await i.guild.members.ban(u.id).catch(()=>{}); return i.editReply(`🔨 تم حظر ${u}`); }
    if(['kick','طرد'].includes(nameCmd)){ const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id); await m?.kick().catch(()=>{}); return i.editReply(`👢 تم طرد ${u}`); }
    if(['timeout','اسكات'].includes(nameCmd)){ const u = i.options.getUser('user'); const d = i.options.getInteger('duration'); const m = i.guild.members.cache.get(u.id); await m?.timeout(d*60*1000).catch(()=>{}); return i.editReply(`🔇 تم إسكات ${u} لمدة ${d} دقيقة`); }
    if(['untimeout','فك_الاسكات'].includes(nameCmd)){ const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id); await m?.timeout(null).catch(()=>{}); return i.editReply(`🔊 تم إلغاء الإسكات عن ${u}`); }
    if(['clear','مسح'].includes(nameCmd)){ const n = i.options.getInteger('amount'); await i.channel.bulkDelete(n, true).catch(()=>{}); return i.editReply(`🧹 تم مسح ${n}`); }
    if(['lock','قفل'].includes(nameCmd)){ await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:false}); return i.editReply('🔒 تم قفل القناة'); }
    if(['unlock','فتح'].includes(nameCmd)){ await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:true}); return i.editReply('🔓 تم فتح القناة'); }
    if(['set-welcome','ترحيب'].includes(nameCmd)){ const ch = i.options.getChannel('channel'); if(!config[gid]) config[gid]={}; config[gid].welcomeChannel=ch.id; saveConfig(); return i.editReply(`✅ تم تعيين قناة الترحيب في ${ch}`); }
    if(['help','مساعدة'].includes(nameCmd)){ return i.editReply('📜 /توبيخ mention:@شخص reason:السبب evidence:صورة - /توبيخاتي - /التوبيخات - /ازالة_توبيخ'); }
  }catch(e){ return i.editReply(`❌ خطأ: ${e.message}`); }
});

client.login(process.env.TOKEN);
