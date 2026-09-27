import { Client, Partials, EmbedBuilder, REST, Routes, SlashCommandBuilder } from 'discord.js';
import fs from 'fs';

const client = new Client({ intents: 3276799, partials: [Partials.Channel, Partials.GuildMember, Partials.Message] });

let warns = {}; let config = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json')); } catch { warns = {}; }
try { config = JSON.parse(fs.readFileSync('./config.json')); } catch { config = {}; }
const saveWarns = () => fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2));
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

const commands = [
  new SlashCommandBuilder().setName('warn').setDescription('تحذير عضو').addUserOption(o=>o.setName('user').setDescription('العضو المراد تحذيره').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('سبب التحذير').setRequired(true)),
  new SlashCommandBuilder().setName('unwarn').setDescription('ازالة تحذير').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)).addIntegerOption(o=>o.setName('number').setDescription('رقم التحذير').setRequired(true)),
  new SlashCommandBuilder().setName('clearwarns').setDescription('مسح جميع التحذيرات').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('warnings').setDescription('عرض سجل التحذيرات').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('ban').setDescription('حظر عضو نهائيا').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('السبب').setRequired(false)),
  new SlashCommandBuilder().setName('kick').setDescription('طرد عضو من السيرفر').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)).addStringOption(o=>o.setName('reason').setDescription('السبب').setRequired(false)),
  new SlashCommandBuilder().setName('timeout').setDescription('اسكات عضو').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)).addIntegerOption(o=>o.setName('duration').setDescription('المدة بالدقائق').setRequired(true)),
  new SlashCommandBuilder().setName('untimeout').setDescription('الغاء الاسكات').addUserOption(o=>o.setName('user').setDescription('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('clear').setDescription('مسح الرسائل').addIntegerOption(o=>o.setName('amount').setDescription('عدد الرسائل').setRequired(true)),
  new SlashCommandBuilder().setName('lock').setDescription('قفل القناة').addStringOption(o=>o.setName('reason').setDescription('سبب القفل').setRequired(false)),
  new SlashCommandBuilder().setName('unlock').setDescription('فتح القناة'),
  new SlashCommandBuilder().setName('set-welcome').setDescription('اعداد نظام الترحيب').addChannelOption(o=>o.setName('channel').setDescription('قناة الترحيب').setRequired(true)).addStringOption(o=>o.setName('message').setDescription('رسالة الترحيب {user} {server} {count}').setRequired(false)),
  new SlashCommandBuilder().setName('say').setDescription('ارسال رسالة باسم البوت').addStringOption(o=>o.setName('message').setDescription('نص الرسالة').setRequired(true)),
].map(c=>c.toJSON());

client.on('ready', async () => {
  console.log(`✅ ${client.user.tag} جاهز`);
  const rest = new REST({version:'10'}).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {body: commands});
  console.log('✅ تم تحديث جميع الاوامر');
});

client.on('guildMemberAdd', m => {
  const g = config[m.guild.id];
  if(!g?.welcomeChannel) return;
  const ch = m.guild.channels.cache.get(g.welcomeChannel);
  if(!ch) return;
  let msg = g.welcomeMsg || '🎖️ اهلا وسهلا {user} في {server} انت العضو رقم {count}';
  msg = msg.replaceAll('{user}', `<@${m.id}>`).replaceAll('{server}', m.guild.name).replaceAll('{count}', m.guild.memberCount);
  ch.send(msg).catch(()=>{});
});

client.on('interactionCreate', async i => {
  if(!i.isChatInputCommand()) return;
  await i.deferReply().catch(()=>{});
  const gid = i.guild.id;
  if(!warns[gid]) warns[gid] = {};

  try{
    // WARN - كاريزما
    if(i.commandName === 'warn'){
      const u = i.options.getUser('user'); const r = i.options.getString('reason');
      if(!warns[gid][u.id]) warns[gid][u.id] = [];
      warns[gid][u.id].push({reason: r, mod: i.user.id, date: Date.now()});
      saveWarns();
      const embed = new EmbedBuilder()
       .setTitle('⚠️ تنبيه إداري')
       .setDescription(`تم اتخاذ إجراء تأديبي بحق أحد الأعضاء`)
       .addFields(
          { name: '👤 العضو المخالف', value: `${u}`, inline: true },
          { name: '🛡️ المشرف المسؤول', value: `${i.user}`, inline: true },
          { name: '📝 السبب', value: `**${r}**`, inline: false },
          { name: '📊 مجموع التحذيرات', value: `**${warns[gid][u.id].length}** تحذير`, inline: true }
        )
       .setColor(0xFF0000)
       .setThumbnail(u.displayAvatarURL())
       .setFooter({ text: `نظام الحماية - ${i.guild.name}`, iconURL: i.guild.iconURL() })
       .setTimestamp();
      return i.editReply({ embeds: [embed] });
    }

    if(i.commandName === 'unwarn'){
      const u = i.options.getUser('user'); const n = i.options.getInteger('number')-1;
      if(!warns[gid][u.id]?.[n]) return i.editReply({ embeds: [new EmbedBuilder().setDescription('❌ لا يوجد تحذير بهذا الرقم').setColor(0xFF0000)] });
      warns[gid][u.id].splice(n,1); saveWarns();
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('✅ تمت إزالة التحذير').setDescription(`تمت إزالة التحذير رقم **${n+1}** للعضو ${u}`).setColor(0x00FF00)] });
    }

    if(i.commandName === 'clearwarns'){
      const u = i.options.getUser('user'); warns[gid][u.id]=[]; saveWarns();
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('🗑️ تم المسح').setDescription(`تم مسح جميع تحذيرات العضو ${u} وعودة سجله نقياً`).setColor(0x00FF00)] });
    }

    if(i.commandName === 'warnings'){
      const u = i.options.getUser('user'); const list = warns[gid][u.id]||[];
      if(!list.length) return i.editReply({ embeds: [new EmbedBuilder().setDescription(`✅ العضو ${u} سجله نظيف ليس لديه أي تحذيرات`).setColor(0x00FF00)] });
      const embed = new EmbedBuilder().setTitle(`📋 سجل تحذيرات ${u.username}`).setDescription(list.map((w,k)=>`**${k+1}.** ${w.reason} - <@${w.mod}>`).join('\n')).setColor(0x2b2d31).setThumbnail(u.displayAvatarURL());
      return i.editReply({embeds:[embed]});
    }

    if(i.commandName === 'ban'){
      const u = i.options.getUser('user'); const r = i.options.getString('reason') || 'لا يوجد سبب';
      await i.guild.members.ban(u.id, {reason: r}).catch(()=>{});
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('🔨 تم الحظر').setDescription(`${u} تم حظره نهائياً`).addFields({name:'السبب', value:r}).setColor(0x000000)] });
    }

    if(i.commandName === 'kick'){
      const u = i.options.getUser('user'); const r = i.options.getString('reason') || 'لا يوجد سبب';
      const m = i.guild.members.cache.get(u.id); await m?.kick(r).catch(()=>{});
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('👢 تم الطرد').setDescription(`${u} تم طرده من السيرفر`).setColor(0xFFA500)] });
    }

    if(i.commandName === 'timeout'){
      const u = i.options.getUser('user'); const d = i.options.getInteger('duration');
      const m = i.guild.members.cache.get(u.id); await m?.timeout(d*60*1000).catch(()=>{});
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('🔇 تم الإسكات').setDescription(`تم إسكات ${u} لمدة **${d}** دقيقة`).setColor(0xFFFF00)] });
    }

    if(i.commandName === 'untimeout'){
      const u = i.options.getUser('user'); const m = i.guild.members.cache.get(u.id);
      await m?.timeout(null).catch(()=>{}); return i.editReply({ embeds: [new EmbedBuilder().setTitle('🔊 تم إلغاء الإسكات').setDescription(`تم إلغاء الإسكات عن ${u}`).setColor(0x00FF00)] });
    }

    if(i.commandName === 'clear'){
      const n = i.options.getInteger('amount'); await i.channel.bulkDelete(n).catch(()=>{});
      return i.editReply({ embeds: [new EmbedBuilder().setDescription(`🧹 تم مسح **${n}** رسالة`).setColor(0x00FF00)] });
    }

    if(i.commandName === 'lock'){
      const r = i.options.getString('reason') || 'لا يوجد سبب';
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:false});
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('🔒 تم قفل القناة').setDescription(`القناة مقفلة حالياً\nالسبب: ${r}`).setColor(0xFF0000)] });
    }

    if(i.commandName === 'unlock'){
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {SendMessages:true});
      return i.editReply({ embeds: [new EmbedBuilder().setTitle('🔓 تم فتح القناة').setDescription('يمكنكم التحدث الآن').setColor(0x00FF00)] });
    }

    if(i.commandName === 'set-welcome'){
      const ch = i.options.getChannel('channel'); const msg = i.options.getString('message');
      if(!config[gid]) config[gid]={}; config[gid].welcomeChannel=ch.id; if(msg) config[gid].welcomeMsg=msg; saveConfig();
      return i.editReply({ embeds: [new EmbedBuilder().setDescription(`✅ تم تعيين قناة الترحيب في ${ch}`).setColor(0x00FF00)] });
    }

    if(i.commandName === 'say'){
      const msg = i.options.getString('message'); await i.channel.send(msg);
      return i.editReply({ content: `✅ تم الإرسال`, ephemeral: true });
    }

  }catch(e){ return i.editReply(`❌ خطأ: ${e.message}`); }
});

client.login(process.env.TOKEN);
