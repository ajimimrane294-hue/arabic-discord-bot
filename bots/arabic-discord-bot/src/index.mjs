import { Client, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

const client = new Client({ intents: 3276799, partials: [Partials.Channel, Partials.GuildMember, Partials.Message] });

let warns = {}; let config = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json')); } catch { warns = {}; }
try { config = JSON.parse(fs.readFileSync('./config.json')); } catch { config = {}; }
const saveWarns = () => fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

const raw = [];

raw.push(new SlashCommandBuilder().setName('توبيخ').setDescription('تسجيل توبيخ عسكري')
.addStringOption(o=>o.setName('name').setDescription('اسم العسكري داخل اللعبة').setRequired(true))
.addStringOption(o=>o.setName('reason').setDescription('سبب التوبيخ').setRequired(true))
.addAttachmentOption(o=>o.setName('evidence').setDescription('دليل صورة اختياري').setRequired(false))
.addStringOption(o=>o.setName('proof').setDescription('دليل رابط اختياري').setRequired(false)));

raw.push(new SlashCommandBuilder().setName('warn').setDescription('تسجيل توبيخ عسكري')
.addStringOption(o=>o.setName('name').setDescription('اسم العسكري داخل اللعبة').setRequired(true))
.addStringOption(o=>o.setName('reason').setDescription('سبب التوبيخ').setRequired(true))
.addAttachmentOption(o=>o.setName('evidence').setDescription('دليل صورة اختياري').setRequired(false))
.addStringOption(o=>o.setName('proof').setDescription('دليل رابط اختياري').setRequired(false)));

raw.push(new SlashCommandBuilder().setName('ازالة_توبيخ').setDescription('ازالة توبيخ').addStringOption(o=>o.setName('name').setDescription('اسم العسكري').setRequired(true)).addIntegerOption(o=>o.setName('number').setDescription('رقم التوبيخ').setRequired(true)));
raw.push(new SlashCommandBuilder().setName('التوبيخات').setDescription('عرض سجل التوبيخات').addStringOption(o=>o.setName('name').setDescription('اسم العسكري').setRequired(true)));
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
      const soldierName = i.options.getString('name');
      const reason = i.options.getString('reason');
      const att = i.options.getAttachment('evidence');
      const link = i.options.getString('proof');
      const key = soldierName.toLowerCase();

      if(!warns[gid][key]) warns[gid][key] = [];
      warns[gid][key].push({ name: soldierName, reason, mod: i.user.id, evidence: att?.url || link || null, date: Date.now() });
      saveWarns();

      const total = warns[gid][key].length;
      const dateText = getArabicDate();

      let evidenceText = '` لا يوجد دليل `';
      if(att?.url) evidenceText = `[اضغط للمشاهدة](${att.url})`;
      else if(link) evidenceText = link;

      const text = `🚨 *[ السجل تأديبي للجيش ]* 🦅\n🪖 *تم تسجيل توبيخ بحق العسكري / العسكرية :* ${soldierName}\n✍️ *المسؤول الصادر عنه :* <@${i.user.id}>\n📝 *سبب التوبيخ :* \` ${reason} \`\n⏳ *التاريخ والوقت :* \` ${dateText} \`\n🎥 *دليل التوبيخ :* ${evidenceText}\n📜 *جميع توبيخات الحالية :* \` [ ${total} / 3 ] \``;

      const embed = new EmbedBuilder().setDescription(text).setColor(0xFF0000);
      if(att) embed.setImage(att.url);

      return i.editReply({ embeds: [embed] });
    }

    if(['التوبيخات'].includes(nameCmd)){
      const soldierName = i.options.getString('name');
      const key = soldierName.toLowerCase();
      const list = warns[gid][key]||[];
      if(!list.length) return i.editReply(`✅ العسكري **${soldierName}** سجله نظيف`);
      const desc = list.map((w,k)=>`**${k+1}.** ${w.reason} - <@${w.mod}>`).join('\n');
      return i.editReply({ embeds: [new EmbedBuilder().setTitle(`📋 سجل ${soldierName}`).setDescription(desc).setColor(0x2b2d31)] });
    }

    if(['ازالة_توبيخ'].includes(nameCmd)){
      const soldierName = i.options.getString('name'); const n = i.options.getInteger('number')-1;
      const key = soldierName.toLowerCase();
      if(!warns[gid][key]?.[n]) return i.editReply('❌ لا يوجد توبيخ بهذا الرقم');
      warns[gid][key].splice(n,1); saveWarns();
      return i.editReply(`✅ تمت إزالة التوبيخ رقم ${n+1} للعسكري ${soldierName}`);
    }

    if(['مسح_التوبيخات'].includes(nameCmd)){
      const soldierName = i.options.getString('name'); const key = soldierName.toLowerCase();
      warns[gid][key]=[]; saveWarns();
      return i.editReply(`🗑️ تم مسح جميع توبيخات ${soldierName}`);
    }

    if(['ban','حظر'].includes(nameCmd)){
      const u = i.options.getUser('user'); await i.guild.members.ban(u.id).catch(()=>{});
      return i.editReply(`🔨 تم حظر ${u}`);
    }
    if(['kick','طرد'].includes(nameCmd)){
      const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id); await m?.kick().catch(()=>{});
      return i.editReply(`👢 تم طرد ${u}`);
    }
    if(['timeout','اسكات'].includes(nameCmd)){
      const u = i.options.getUser('user'); const d = i.options.getInteger('duration');
      const m = i.guild.members.cache.get(u.id); await m?.timeout(d*60*1000).catch(()=>{});
      return i.editReply(`🔇 تم إسكات ${u} لمدة ${d} دقيقة`);
    }
    if(['untimeout','فك_الاسكات'].includes(nameCmd)){
      const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id); await m?.timeout(null).catch(()=>{});
      return i.editReply(`🔊 تم إلغاء الإسكات عن ${u}`);
    }
    if(['clear','مسح'].includes(nameCmd)){
      const n = i.options.getInteger('amount'); await i.channel.bulkDelete(n, true).catch(()=>{});
      return i.editReply(`🧹 تم مسح ${n}`);
    }
    if(['lock','قفل'].includes(nameCmd)){
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:false});
      return i.editReply('🔒 تم قفل القناة');
    }
    if(['unlock','فتح'].includes(nameCmd)){
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:true});
      return i.editReply('🔓 تم فتح القناة');
    }
    if(['set-welcome','ترحيب'].includes(nameCmd)){
      const ch = i.options.getChannel('channel');
      if(!config[gid]) config[gid]={}; config[gid].welcomeChannel=ch.id; saveConfig();
      return i.editReply(`✅ تم تعيين قناة الترحيب في ${ch}`);
    }
    if(['help','مساعدة'].includes(nameCmd)){
      return i.editReply('📜 **الاوامر:** /توبيخ [السمية] [السبب] [دليل اختياري] - /التوبيخات - /ازالة_توبيخ - /مسح_التوبيخات');
    }

  }catch(e){ return i.editReply(`❌ خطأ: ${e.message}`); }
});

client.login(process.env.TOKEN); 
