const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionsBitField, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [3276799], partials: [Partials.Channel, Partials.GuildMember, Partials.Message] });

let warns = {};
let config = {};
try { warns = JSON.parse(fs.readFileSync('./warns.json')); } catch { warns = {} }
try { config = JSON.parse(fs.readFileSync('./config.json')); } catch { config = {} }

function saveWarns(){ fs.writeFileSync('./warns.json', JSON.stringify(warns, null, 2)); }
function saveConfig(){ fs.writeFileSync('./config.json', JSON.stringify(config, null, 2)); }

// أوامر السلاش
const commands = [
  new SlashCommandBuilder().setName('warn').setDescription('إعطاء تحذير').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)).addStringOption(o=>o.setName('السبب').setDescription('السبب').setRequired(true)),
  new SlashCommandBuilder().setName('unwarn').setDescription('إزالة تحذير').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)).addIntegerOption(o=>o.setName('رقم').setDescription('رقم التحذير (1,2,3)').setRequired(true)),
  new SlashCommandBuilder().setName('clearwarns').setDescription('مسح كل تحذيرات عضو').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('warnings').setDescription('عرض تحذيرات عضو').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)),
  new SlashCommandBuilder().setName('set-welcome').setDescription('إعداد الترحيب').addChannelOption(o=>o.setName('channel').setDescription('روم الترحيب').setRequired(true)).addStringOption(o=>o.setName('message').setDescription('رسالة الترحيب - استعمل {user} {server} {count}').setRequired(false)),
  new SlashCommandBuilder().setName('ban').setDescription('باند').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)).addStringOption(o=>o.setName('السبب').setDescription('السبب')),
  new SlashCommandBuilder().setName('kick').setDescription('طرد').addUserOption(o=>o.setName('العضو').setDescription('العضو').setRequired(true)),
].map(c=>c.toJSON());

client.on('ready', async () => {
  console.log(`✅ بوت الجيش شغال: ${client.user.tag}`);
  const rest = new REST({version:'10'}).setToken(process.env.TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {body: commands});

  // رد تلقائي صباح الخير
  client.on('messageCreate', m => {
    if(m.author.bot) return;
    if(m.content.includes('صباح الخير')) m.reply(`☀️ صباح النور @${m.author.username} 🫡`);
  });

  // ترحيب فعلي
  client.on('guildMemberAdd', member => {
    const guildId = member.guild.id;
    if(!config[guildId] ||!config[guildId].welcomeChannel) return;
    const ch = member.guild.channels.cache.get(config[guildId].welcomeChannel);
    if(!ch) return;
    let msg = config[guildId].welcomeMsg || 'مرحبا {user} في {server} 💎 انت العضو رقم {count}';
    msg = msg.replace('{user}', `<@${member.id}>`).replace('{server}', member.guild.name).replace('{count}', member.guild.memberCount);
    ch.send(msg);
  });
});

client.on('interactionCreate', async i => {
  if(!i.isChatInputCommand()) return;
  await i.deferReply({ephemeral: false}).catch(()=>{});

  const guildId = i.guild.id;
  if(!warns[guildId]) warns[guildId] = {};

  if(i.commandName === 'warn'){
    const user = i.options.getUser('العضو');
    const reason = i.options.getString('السبب');
    if(!warns[guildId][user.id]) warns[guildId][user.id] = [];
    warns[guildId][user.id].push({reason, date: new Date().toLocaleString(), mod: i.user.id});
    saveWarns();
    i.editReply(`⚠️ تم تحذير ${user} | السبب: ${reason} | عنده الآن ${warns[guildId][user.id].length} تحذيرات`);
  }

  if(i.commandName === 'unwarn'){
    const user = i.options.getUser('العضو');
    const num = i.options.getInteger('رقم') - 1;
    if(!warns[guildId][user.id] ||!warns[guildId][user.id][num]) return i.editReply(`❌ ما عندوش التحذير رقم ${num+1}`);
    warns[guildId][user.id].splice(num, 1);
    saveWarns();
    i.editReply(`✅ تم إزالة التحذير رقم ${num+1} لـ ${user}`);
  }

  if(i.commandName === 'clearwarns'){
    const user = i.options.getUser('العضو');
    warns[guildId][user.id] = [];
    saveWarns();
    i.editReply(`🗑️ تم مسح كل تحذيرات ${user}`);
  }

  if(i.commandName === 'warnings'){
    const user = i.options.getUser('العضو');
    const list = warns[guildId][user.id] || [];
    if(list.length === 0) return i.editReply(`✅ ${user} ما عندوش حتى تحذير`);
    const embed = new EmbedBuilder().setTitle(`تحذيرات ${user.username}`).setDescription(list.map((w,idx)=>`**${idx+1} -** ${w.reason} | <t:${Math.floor(Date.now()/1000)}:R>`).join('\n')).setColor('Red');
    i.editReply({embeds:[embed]});
  }

  if(i.commandName === 'set-welcome'){
    const ch = i.options.getChannel('channel');
    const msg = i.options.getString('message');
    if(!config[guildId]) config[guildId] = {};
    config[guildId].welcomeChannel = ch.id;
    if(msg) config[guildId].welcomeMsg = msg;
    saveConfig();
    i.editReply(`✅ تم إعداد الترحيب في ${ch} \nالرسالة: ${msg || 'افتراضية'}`);
  }
});

client.login(process.env.TOKEN); 
