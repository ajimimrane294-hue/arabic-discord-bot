import { Client, Partials, EmbedBuilder, PermissionsBitField, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

const client = new Client({ intents: 3276799, partials: [Partials.Channel, Partials.GuildMember, Partials.Message] });

let warns = {}; let config = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json')); } catch { warns = {}; }
try { config = JSON.parse(fs.readFileSync('./config.json')); } catch { config = {}; }
const saveWarns = () => fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

const commands = [
  new SlashCommandBuilder().setName('warn').setDescription('توبيخ عسكري').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)).addStringOption(o=>o.setName('السبب').setDescription('السبب').setRequired(true)).addStringOption(o=>o.setName('الدليل').setDescription('دليل').setRequired(false)),
  new SlashCommandBuilder().setName('unwarn').setDescription('إزالة تحذير').addUserOption(o=>o.setName('العضو').setRequired(true)).addIntegerOption(o=>o.setName('رقم').setDescription('رقم التحذير 1,2,3').setRequired(true)),
  new SlashCommandBuilder().setName('clearwarns').setDescription('مسح كل تحذيرات عضو').addUserOption(o=>o.setName('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('warnings').setDescription('عرض تحذيرات عضو').addUserOption(o=>o.setName('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('ban').setDescription('باند').addUserOption(o=>o.setName('العضو').setRequired(true)).addStringOption(o=>o.setName('السبب')),
  new SlashCommandBuilder().setName('kick').setDescription('طرد').addUserOption(o=>o.setName('العضو').setRequired(true)).addStringOption(o=>o.setName('السبب')),
  new SlashCommandBuilder().setName('timeout').setDescription('ميوت').addUserOption(o=>o.setName('العضو').setRequired(true)).addIntegerOption(o=>o.setName('المدة').setDescription('بالدقائق').setRequired(true)).addStringOption(o=>o.setName('السبب')),
  new SlashCommandBuilder().setName('untimeout').setDescription('فك الميوت').addUserOption(o=>o.setName('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('clear').setDescription('مسح رسائل').addIntegerOption(o=>o.setName('عدد').setDescription('1-100').setRequired(true)),
  new SlashCommandBuilder().setName('lock').setDescription('قفل الروم').addChannelOption(o=>o.setName('الروم')),
  new SlashCommandBuilder().setName('unlock').setDescription('فتح الروم').addChannelOption(o=>o.setName('الروم')),
  new SlashCommandBuilder().setName('set-welcome').setDescription('إعداد الترحيب').addChannelOption(o=>o.setName('channel').setDescription('روم الترحيب').setRequired(true)).addStringOption(o=>o.setName('message').setDescription('رسالة {user} {server} {count}')),
  new SlashCommandBuilder().setName('say').setDescription('قول رسالة باسم البوت').addStringOption(o=>o.setName('رسالة').setRequired(true)),
].map(c=>c.toJSON());

client.on('ready', async () => {
  console.log(`✅ الجيش شغال: ${client.user.tag}`);
  const rest = new REST({version:'10'}).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {body: commands});
});

client.on('guildMemberAdd', m => {
  const g = config[m.guild.id];
  if(!g?.welcomeChannel) return;
  const ch = m.guild.channels.cache.get(g.welcomeChannel);
  if(!ch) return;
  let msg = g.welcomeMsg || '💎 مرحبا {user} فـ {server} انت العضو رقم {count} 🫡';
  msg = msg.replaceAll('{user}', `<@${m.id}>`).replaceAll('{server}', m.guild.name).replaceAll('{count}', m.guild.memberCount);
  ch.send(msg).catch(()=>{});
});

client.on('interactionCreate', async i => {
  if(!i.isChatInputCommand()) return;
  await i.deferReply().catch(()=>{});
  const gid = i.guild.id;
  if(!warns[gid]) warns[gid] = {};

  try {
    if(i.commandName === 'warn'){
      const u = i.options.getUser('العضو'); const r = i.options.getString('السبب');
      if(!warns[gid][u.id]) warns[gid][u.id] = [];
      warns[gid][u.id].push({reason:r, mod:i.user.id});
      saveWarns();
      return i.editReply(`⚠️ تم توبيخ ${u} | السبب: ${r} | المجموع: ${warns[gid][u.id].length}`);
    }
    if(i.commandName === 'unwarn'){
      const u = i.options.getUser('العضو'); const n = i.options.getInteger('رقم')-1;
      if(!warns[gid][u.id]?.[n]) return i.editReply(`❌ معندوش هاد الرقم`);
      warns[gid][u.id].splice(n,1); saveWarns();
      return i.editReply(`✅ تم إزالة تحذير ${u} رقم ${n+1}`);
    }
    if(i.commandName === 'clearwarns'){
      const u = i.options.getUser('العضو'); warns[gid][u.id]=[]; saveWarns();
      return i.editReply(`🗑️ تم مسح كل تحذيرات ${u}`);
    }
    if(i.commandName === 'warnings'){
      const u = i.options.getUser('العضو'); const list = warns[gid][u.id]||[];
      if(!list.length) return i.editReply(`✅ ${u} نضيف معندوش تحذيرات`);
      const e = new EmbedBuilder().setTitle(`تحذيرات ${u.username}`).setDescription(list.map((w,k)=>`**${k+1} -** ${w.reason}`).join('\n')).setColor(0xff0000);
      return i.editReply({embeds:[e]});
    }
    if(i.commandName === 'ban'){
      const u = i.options.getUser('العضو'); const r = i.options.getString('السبب')||'بدون سبب';
      await i.guild.members.ban(u.id, {reason:r}).catch(()=>{});
      return i.editReply(`🔨 تم تبنيد ${u} | ${r}`);
    }
    if(i.commandName === 'kick'){
      const u = i.options.getUser('العضو'); const m = i.guild.members.cache.get(u.id);
      await m?.kick().catch(()=>{}); return i.editReply(`👢 تم طرد ${u}`);
    }
    if(i.commandName === 'timeout'){
      const u = i.options.getUser('العضو'); const d = i.options.getInteger('المدة'); const m = i.guild.members.cache.get(u.id);
      await m?.timeout(d*60*1000).catch(()=>{}); return i.editReply(`🔇 تم إسكات ${u} لمدة ${d} دقيقة`);
    }
    if(i.commandName === 'untimeout'){
      const u = i.options.getUser('العضو'); const m = i.guild.members.cache.get(u.id);
      await m?.timeout(null).catch(()=>{}); return i.editReply(`🔊 تم فك الميوت عن ${u}`);
    }
    if(i.commandName === 'clear'){
      const n = i.options.getInteger('عدد'); await i.channel.bulkDelete(n).catch(()=>{});
      return i.editReply(`🧹 تم مسح ${n} رسالة`);
    }
    if(i.commandName === 'lock'){
      const ch = i.options.getChannel('الروم')||i.channel;
      await ch.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:false});
      return i.editReply(`🔒 تم قفل ${ch}`);
    }
    if(i.commandName === 'unlock'){
      const ch = i.options.getChannel('الروم')||i.channel;
      await ch.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:true});
      return i.editReply(`🔓 تم فتح ${ch}`);
    }
    if(i.commandName === 'set-welcome'){
      const ch = i.options.getChannel('channel'); const msg = i.options.getString('message');
      if(!config[gid]) config[gid]={}; config[gid].welcomeChannel=ch.id; if(msg) config[gid].welcomeMsg=msg; saveConfig();
      return i.editReply(`✅ الترحيب تحط فـ ${ch} | الرسالة: ${msg||'افتراضية'}`);
    }
    if(i.commandName === 'say'){
      const msg = i.options.getString('رسالة'); await i.channel.send(msg); return i.editReply(`✅ تم الإرسال`);
    }
  } catch(e){ console.log(e); i.editReply(`❌ خطأ: ${e.message}`); }
});

client.login(process.env.TOKEN);
