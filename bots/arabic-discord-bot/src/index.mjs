import { Client, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

const client = new Client({ intents: 3276799, partials: [Partials.Channel, Partials.GuildMember, Partials.Message] });

let warns = {}; let config = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json')); } catch { warns = {}; }
try { config = JSON.parse(fs.readFileSync('./config.json')); } catch { config = {}; }
const saveWarns = () => fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

const raw = [];

// --- التوبيخ الجديد فيه منشن + سمية ---
const tobi5Builder = (name, desc) => {
  return new SlashCommandBuilder().setName(name).setDescription(desc)
 .addUserOption(o=>o.setName('mention').setDescription('منشن العسكري (اختياري)').setRequired(false))
 .addStringOption(o=>o.setName('name').setDescription('اسم العسكري داخل اللعبة (اذا ما كاينش منشن)').setRequired(false))
 .addStringOption(o=>o.setName('reason').setDescription('سبب التوبيخ').setRequired(true))
 .addAttachmentOption(o=>o.setName('evidence').setDescription('دليل صورة اختياري').setRequired(false))
 .addStringOption(o=>o.setName('proof').setDescription('دليل رابط اختياري').setRequired(false))
}

raw.push(tobi5Builder('توبيخ', 'تسجيل توبيخ عسكري'));
raw.push(tobi5Builder('warn', 'تسجيل توبيخ عسكري'));

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

// فانكشن ديال الديزاين الجديد باش نستعملوها فكاع الكودات
function createNiceEmbed({title, color, fields, imageUrl}){
  const embed = new EmbedBuilder().setTitle(title).setColor(color).setTimestamp();
  if(fields) embed.addFields(fields);
  if(imageUrl) embed.setImage(imageUrl);
  return embed;
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

      if(!mentionUser &&!soldierNameInput) return i.editReply('❌ خاصك تدير منشن للعسكري ولا تكتب سميتو!');

      const displayName = mentionUser? mentionUser.username : soldierNameInput;
      const displayMention = mentionUser? `<@${mentionUser.id}>` : `**${soldierNameInput}**`;
      const key = displayName.toLowerCase();

      if(!warns[gid][key]) warns[gid][key] = [];
      warns[gid][key].push({ name: displayName, reason, mod: i.user.id, evidence: att?.url || link || null, date: Date.now() });
      saveWarns();

      const total = warns[gid][key].length;
      const dateText = getArabicDate();

      let evidenceText = '` لا يوجد دليل `';
      if(att?.url) evidenceText = `[اضغط للمشاهدة](${att.url})`;
      else if(link) evidenceText = link;

      const embed = createNiceEmbed({
        title: '🚨 السجل التأديبي للجيش 🦅',
        color: 0xFF0000,
        imageUrl: att?.url || null,
        fields: [
          { name: '🪖 العسكري المخالف', value: `${displayMention}\n\`${displayName}\``, inline: false },
          { name: '✍️ المسؤول', value: `<@${i.user.id}>`, inline: true },
          { name: '📜 التوبيخات', value: `\` [ ${total} / 3 ] \``, inline: true },
          { name: '📝 سبب التوبيخ', value: `\`\`\`${reason}\`\`\``, inline: false },
          { name: '🎥 دليل التوبيخ', value: evidenceText, inline: false },
          { name: '⏳ التاريخ والوقت', value: `\` ${dateText} \``, inline: false },
        ]
      });

      return i.editReply({ embeds: [embed] });
    }

    if(['التوبيخات'].includes(nameCmd)){
      const soldierName = i.options.getString('name');
      const key = soldierName.toLowerCase();
      const list = warns[gid][key]||[];
      if(!list.length) return i.editReply({ embeds: [createNiceEmbed({ title: `✅ سجل نظيف`, color: 0x00FF00, fields: [{name: `العسكري ${soldierName}`, value: 'ما عندو حتى توبيخ'}] })] });
      const desc = list.map((w,k)=>`**${k+1}.** ${w.reason} - <@${w.mod}> - <t:${Math.floor(w.date/1000)}:R>`).join('\n');
      return i.editReply({ embeds: [new EmbedBuilder().setTitle(`📋 سجل ${soldierName} [${list.length}/3]`).setDescription(desc).setColor(0x2b2d31)] });
    }

    if(['ازالة_توبيخ'].includes(nameCmd)){
      const soldierName = i.options.getString('name'); const n = i.options.getInteger('number')-1;
      const key = soldierName.toLowerCase();
      if(!warns[gid][key]?.[n]) return i.editReply('❌ لا يوجد توبيخ بهذا الرقم');
      warns[gid][key].splice(n,1); saveWarns();
      return i.editReply({ embeds: [createNiceEmbed({ title: '✅ تمت الإزالة', color: 0x00FF00, fields: [{name: 'العسكري', value: soldierName}, {name: 'رقم التوبيخ', value: `${n+1}`}] })] });
    }

    if(['مسح_التوبيخات'].includes(nameCmd)){
      const soldierName = i.options.getString('name'); const key = soldierName.toLowerCase();
      warns[gid][key]=[]; saveWarns();
      return i.editReply({ embeds: [createNiceEmbed({ title: '🗑️ تم المسح', color: 0xFF0000, fields: [{name: 'تم مسح جميع توبيخات', value: soldierName}] })] });
    }

    if(['ban','حظر'].includes(nameCmd)){
      const u = i.options.getUser('user'); await i.guild.members.ban(u.id).catch(()=>{});
      return i.editReply({ embeds: [createNiceEmbed({ title: '🔨 تم الحظر', color: 0xFF0000, fields: [{name: 'العضو', value: `${u}`}, {name: 'بواسطة', value: `<@${i.user.id}>`}] })] });
    }
    if(['kick','طرد'].includes(nameCmd)){
      const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id); await m?.kick().catch(()=>{});
      return i.editReply({ embeds: [createNiceEmbed({ title: '👢 تم الطرد', color: 0xFFA500, fields: [{name: 'العضو', value: `${u}`}, {name: 'بواسطة', value: `<@${i.user.id}>`}] })] });
    }
    if(['timeout','اسكات'].includes(nameCmd)){
      const u = i.options.getUser('user'); const d = i.options.getInteger('duration');
      const m = i.guild.members.cache.get(u.id); await m?.timeout(d*60*1000).catch(()=>{});
      return i.editReply({ embeds: [createNiceEmbed({ title: '🔇 تم الإسكات', color: 0xFFFF00, fields: [{name: 'العضو', value: `${u}`}, {name: 'المدة', value: `${d} دقيقة`}] })] });
    }
    if(['untimeout','فك_الاسكات'].includes(nameCmd)){
      const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id); await m?.timeout(null).catch(()=>{});
      return i.editReply({ embeds: [createNiceEmbed({ title: '🔊 تم فك الإسكات', color: 0x00FF00, fields: [{name: 'العضو', value: `${u}`}] })] });
    }
    if(['clear','مسح'].includes(nameCmd)){
      const n = i.options.getInteger('amount'); await i.channel.bulkDelete(n, true).catch(()=>{});
      return i.editReply({ embeds: [createNiceEmbed({ title: '🧹 تم المسح', color: 0x2b2d31, fields: [{name: 'العدد', value: `${n} رسالة`}] })] });
    }
    if(['lock','قفل'].includes(nameCmd)){
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:false});
      return i.editReply({ embeds: [createNiceEmbed({ title: '🔒 تم قفل القناة', color: 0xFF0000, fields: [{name: 'القناة', value: `${i.channel}`}] })] });
    }
    if(['unlock','فتح'].includes(nameCmd)){
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:true});
      return i.editReply({ embeds: [createNiceEmbed({ title: '🔓 تم فتح القناة', color: 0x00FF00, fields: [{name: 'القناة', value: `${i.channel}`}] })] });
    }
    if(['set-welcome','ترحيب'].includes(nameCmd)){
      const ch = i.options.getChannel('channel');
      if(!config[gid]) config[gid]={}; config[gid].welcomeChannel=ch.id; saveConfig();
      return i.editReply(`✅ تم تعيين قناة الترحيب في ${ch}`);
    }
    if(['help','مساعدة'].includes(nameCmd)){
      return i.editReply('📜 **الاوامر:** /توبيخ mention:@شخص name:سمية reason:السبب - /التوبيخات - /ازالة_توبيخ - /مسح_التوبيخات');
    }

  }catch(e){ return i.editReply(`❌ خطأ: ${e.message}`); }
});

client.login(process.env.TOKEN);
