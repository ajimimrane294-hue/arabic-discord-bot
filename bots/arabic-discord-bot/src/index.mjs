import { Client, EmbedBuilder, GatewayIntentBits, PermissionFlagsBits, REST, Routes, SlashCommandBuilder, ChannelType } from "discord.js";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const WELCOME = { channelId: "", title: "🎖️ مرحبا بك في الجيش 🎖️", description: "مرحبا {user} نورت {server} 👋\nالتزم بالقوانين واحترم الرتب.", color: 0x2b2d31, image: "", thumbnail: true, footer: "ترحيب تلقائي" };
const AUTO_REPLIES = [
  { trigger: ["سلام عليكم", "السلام عليكم"], reply: "وعليكم السلام ورحمة الله وبركاته {user} 👋" },
  { trigger: ["صباح الخير"], reply: "صباح النور {user} ☀️" },
  { trigger: ["مساء الخير"], reply: "مساء النور {user} 🌙" },
  { trigger: ["تحية عسكرية"], reply: "تحية عسكرية لك {user} 🫡" },
];

const commands = [
  new SlashCommandBuilder().setName("kick").setDescription("طرد عضو").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addStringOption(o=>o.setName("السبب").setDescription("السبب")),
  new SlashCommandBuilder().setName("ban").setDescription("بان عضو").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addStringOption(o=>o.setName("السبب").setDescription("السبب")),
  new SlashCommandBuilder().setName("unban").setDescription("فك البان").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addStringOption(o=>o.setName("id").setDescription("ID").setRequired(true)),
  new SlashCommandBuilder().setName("timeout").setDescription("ميوت مؤقت").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addIntegerOption(o=>o.setName("المدة").setDescription("دقائق").setRequired(true)).addStringOption(o=>o.setName("السبب").setDescription("السبب")),
  new SlashCommandBuilder().setName("untimeout").setDescription("فك الميوت").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)),
  new SlashCommandBuilder().setName("warn").setDescription("توبيخ عسكري").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addStringOption(o=>o.setName("السبب").setDescription("السبب").setRequired(true)).addStringOption(o=>o.setName("الدليل").setDescription("الدليل")),
  new SlashCommandBuilder().setName("clear").setDescription("مسح رسائل").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption(o=>o.setName("العدد").setDescription("1-100").setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName("lock").setDescription("قفل الروم").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("unlock").setDescription("فتح الروم").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("hide").setDescription("إخفاء الروم").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("unhide").setDescription("إظهار الروم").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("slowmode").setDescription("سلو مود").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addIntegerOption(o=>o.setName("الثواني").setDescription("0 لإلغاء").setRequired(true).setMinValue(0).setMaxValue(21600)),
  new SlashCommandBuilder().setName("addrole").setDescription("إعطاء رتبة").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addRoleOption(o=>o.setName("الرتبة").setDescription("الرتبة").setRequired(true)),
  new SlashCommandBuilder().setName("removerole").setDescription("سحب رتبة").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addRoleOption(o=>o.setName("الرتبة").setDescription("الرتبة").setRequired(true)),
  new SlashCommandBuilder().setName("role").setDescription("إنشاء رتبة").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addStringOption(o=>o.setName("الاسم").setDescription("اسم الرتبة").setRequired(true)),
  new SlashCommandBuilder().setName("nick").setDescription("تغيير الاسم").setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames).addUserOption(o=>o.setName("العضو").setDescription("منشن").setRequired(true)).addStringOption(o=>o.setName("الاسم").setDescription("الاسم الجديد").setRequired(true)),
  new SlashCommandBuilder().setName("say").setDescription("البوت يقول رسالة").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o=>o.setName("الرسالة").setDescription("شنو يقول").setRequired(true)),
  new SlashCommandBuilder().setName("embed").setDescription("رسالة إمبد").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o=>o.setName("العنوان").setDescription("العنوان").setRequired(true)).addStringOption(o=>o.setName("الوصف").setDescription("الوصف").setRequired(true)).addStringOption(o=>o.setName("اللون").setDescription("مثلا #FF0000").setRequired(false)),
  new SlashCommandBuilder().setName("announce").setDescription("إعلان رسمي").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o=>o.setName("العنوان").setDescription("عنوان الإعلان").setRequired(true)).addStringOption(o=>o.setName("الرسالة").setDescription("نص الإعلان").setRequired(true)).addChannelOption(o=>o.setName("الروم").setDescription("روم الإعلان").setRequired(false)),
  new SlashCommandBuilder().setName("poll").setDescription("تصويت").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addStringOption(o=>o.setName("السؤال").setDescription("سؤال التصويت").setRequired(true)),
  new SlashCommandBuilder().setName("avatar").setDescription("صورة عضو").addUserOption(o=>o.setName("العضو").setDescription("منشن")),
  new SlashCommandBuilder().setName("banner").setDescription("بانر عضو").addUserOption(o=>o.setName("العضو").setDescription("منشن")),
  new SlashCommandBuilder().setName("userinfo").setDescription("معلومات عضو").addUserOption(o=>o.setName("العضو").setDescription("منشن")),
  new SlashCommandBuilder().setName("serverinfo").setDescription("معلومات السيرفر"),
  new SlashCommandBuilder().setName("roles").setDescription("قائمة الرتب"),
  new SlashCommandBuilder().setName("members").setDescription("عدد الأعضاء"),
  new SlashCommandBuilder().setName("ping").setDescription("سرعة البوت"),
  new SlashCommandBuilder().setName("help").setDescription("كل الأوامر"),
  new SlashCommandBuilder().setName("set-welcome").setDescription("تحديد روم الترحيب").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addChannelOption(o=>o.setName("الروم").setDescription("روم").setRequired(true)),
].map(c=>c.toJSON());

const rest = new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN);
async function registerCommands(){try{await rest.put(Routes.applicationCommands(process.env.CLIENT_ID),{body:commands});console.log("OK")}catch(e){console.error(e)}}
client.on("ready",()=>{console.log(client.user.tag);registerCommands();});
client.on("guildMemberAdd", async (m)=>{try{let id=WELCOME.channelId||process.env.WELCOME_CHANNEL_ID;if(!id)return;const ch=m.guild.channels.cache.get(id);if(!ch)return;let d=WELCOME.description.replace("{user}",`${m}`).replace("{server}",m.guild.name);const e=new EmbedBuilder().setTitle(WELCOME.title).setDescription(d).setColor(WELCOME.color).setFooter({text:WELCOME.footer}).setTimestamp();if(WELCOME.thumbnail)e.setThumbnail(m.user.displayAvatarURL({dynamic:true}));if(WELCOME.image?.startsWith("http"))e.setImage(WELCOME.image);ch.send({content:`مرحبا ${m} 👋`,embeds:[e]});}catch{}});
client.on("messageCreate", async (msg)=>{if(msg.author.bot)return;const c=msg.content.toLowerCase().trim();for(const a of AUTO_REPLIES){for(const t of a.trigger){if(c.includes(t.toLowerCase())){let txt=a.reply.replace("{user}",`${msg.author}`).replace("{server}",msg.guild?.name||"");await msg.reply(txt);return;}}}});
client.on("interactionCreate", async (i)=>{
if(!i.isChatInputCommand()) return;
const R=(c)=>i.reply(c);
try{
if(i.commandName==="kick"){const t=i.options.getMember("العضو");const r=i.options.getString("السبب")||"بدون";if(!t)return R({content:"ما لقيتوش",ephemeral:true});await t.kick(r);return R(`✅ تم طرد ${t.user.tag}`);}
if(i.commandName==="ban"){const t=i.options.getMember("العضو");const r=i.options.getString("السبب")||"بدون";if(!t)return R({content:"ما لقيتوش",ephemeral:true});await t.ban({reason:r});return R(`✅ تم باند ${t.user.tag}`);}
if(i.commandName==="unban"){const id=i.options.getString("id");await i.guild.bans.remove(id);return R(`✅ تم فك البان لـ ${id}`);}
if(i.commandName==="timeout"){const t=i.options.getMember("العضو");const mins=i.options.getInteger("المدة");const r=i.options.getString("السبب")||"بدون";if(!t)return R({content:"ما لقيتوش",ephemeral:true});await t.timeout(mins*60*1000,r);return R(`✅ ميوت ${t.user.tag} ${mins}د`);}
if(i.commandName==="untimeout"){const t=i.options.getMember("العضو");await t.timeout(null);return R(`✅ فك ميوت ${t.user.tag}`);}
if(i.commandName==="warn"){const target=i.options.getUser("العضو");const reason=i.options.getString("السبب");const proof=i.options.getString("الدليل")||"لا يوجد";const date=new Date().toLocaleString('ar-EG',{timeZone:'Africa/Cairo',dateStyle:'full',timeStyle:'short'});const emb=new EmbedBuilder().setColor(0x8B0000).setTitle('🚨 توبيخ عسكري رسمي 🚨').setThumbnail(target.displayAvatarURL({dynamic:true})).addFields({name:'🎖️ العسكري',value:`> ${target}`,inline:false},{name:'📅 التاريخ',value:`> ${date}`,inline:false},{name:'📝 السبب',value:`> ${reason}`,inline:false},{name:'📎 الدليل',value:`> ${proof}`,inline:false}).setFooter({text:`بواسطة: ${i.user.tag}`,iconURL:i.user.displayAvatarURL()}).setTimestamp();return R({embeds:[emb]});}
if(i.commandName==="clear"){const n=i.options.getInteger("العدد");await i.channel.bulkDelete(n,true);return R({content:`✅ مسح ${n}`,ephemeral:true});}
if(i.commandName==="lock"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:false});return R(`🔒 قفل ${i.channel}`);}
if(i.commandName==="unlock"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{SendMessages:null});return R(`🔓 فتح ${i.channel}`);}
if(i.commandName==="hide"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{ViewChannel:false});return R(`👁️‍🗨️ تم إخفاء ${i.channel}`);}
if(i.commandName==="unhide"){await i.channel.permissionOverwrites.edit(i.guild.roles.everyone,{ViewChannel:null});return R(`👁️ تم إظهار ${i.channel}`);}
if(i.commandName==="slowmode"){const s=i.options.getInteger("الثواني");await i.channel.setRateLimitPerUser(s);return R(`✅ سلو مود ${s} ثانية`);}
if(i.commandName==="addrole"){const m=i.options.getMember("العضو");const r=i.options.getRole("الرتبة");await m.roles.add(r);return R(`✅ إعطاء ${r} لـ ${m}`);}
if(i.commandName==="removerole"){const m=i.options.getMember("العضو");const r=i.options.getRole("الرتبة");await m.roles.remove(r);return R(`✅ سحب ${r} من ${m}`);}
if(i.commandName==="role"){const name=i.options.getString("الاسم");const r=await i.guild.roles.create({name:name});return R(`✅ تم إنشاء رتبة ${r}`);}
if(i.commandName==="nick"){const m=i.options.getMember("العضو");const n=i.options.getString("الاسم");await m.setNickname(n);return R(`✅ تغيير اسم ${m.user.tag} إلى ${n}`);}
if(i.commandName==="say"){const t=i.options.getString("الرسالة");await i.reply({content:"تم ✅",ephemeral:true});await i.channel.send(t);return;}
if(i.commandName==="embed"){const title=i.options.getString("العنوان");const desc=i.options.getString("الوصف");const color=i.options.getString("اللون")||"#2b2d31";const e=new EmbedBuilder().setTitle(title).setDescription(desc).setColor(color).setTimestamp().setFooter({text:`بواسطة ${i.user.tag}`,iconURL:i.user.displayAvatarURL()});return R({embeds:[e]});}
if(i.commandName==="announce"){const title=i.options.getString("العنوان");const msg=i.options.getString("الرسالة");const ch=i.options.getChannel("الروم")||i.channel;const e=new EmbedBuilder().setTitle(`📢 ${title}`).setDescription(msg).setColor(0xFF0000).setTimestamp().setFooter({text:`إعلان رسمي - ${i.guild.name}`});await ch.send({content:"@everyone",embeds:[e]});return R({content:`✅ تم إرسال الإعلان في ${ch}`,ephemeral:true});}
if(i.commandName==="poll"){const q=i.options.getString("السؤال");const e=new EmbedBuilder().setTitle("📊 تصويت").setDescription(q).setColor(0x5865F2).setFooter({text:`بواسطة ${i.user.tag}`}).setTimestamp();const m=await i.reply({embeds:[e],fetchReply:true});await m.react("✅");await m.react("❌");return;}
if(i.commandName==="avatar"){const u=i.options.getUser("العضو")||i.user;const e=new EmbedBuilder().setTitle(u.tag).setImage(u.displayAvatarURL({dynamic:true,size:1024})).setColor(0x2b2d31);return R({embeds:[e]});}
if(i.commandName==="banner"){const u=i.options.getUser("العضو")||i.user;const fetched=await client.users.fetch(u.id,{force:true});const b=fetched.bannerURL({dynamic:true,size:1024});const e=new EmbedBuilder().setTitle(`بانر ${u.tag}`).setColor(0x2b2d31);if(b)e.setImage(b);else e.setDescription("ما عندوش بانر");return R({embeds:[e]});}
if(i.commandName==="userinfo"){const m=i.options.getMember("العضو")||i.member;const e=new EmbedBuilder().setTitle(m.user.tag).setThumbnail(m.user.displayAvatarURL({dynamic:true})).addFields({name:"ID",value:m.id},{name:"دخل",value:`<t:${Math.floor(m.joinedTimestamp/1000)}:R>`},{name:"أنشأ حسابه",value:`<t:${Math.floor(m.user.createdTimestamp/1000)}:R>`},{name:"الرتب",value:m.roles.cache.map(r=>r.toString()).join(", ").slice(0,1000)||"لا يوجد"}).setColor(0x2b2d31);return R({embeds:[e]});}
if(i.commandName==="serverinfo"){const g=i.guild;const e=new EmbedBuilder().setTitle(g.name).setThumbnail(g.iconURL({dynamic:true})).addFields({name:"المالك",value:`<@${g.ownerId}>`},{name:"الأعضاء",value:`${g.memberCount}`},{name:"الرتب",value:`${g.roles.cache.size}`},{name:"الرومات",value:`${g.channels.cache.size}`},{name:"تاريخ الإنشاء",value:`<t:${Math.floor(g.createdTimestamp/1000)}:D>`}).setColor(0x2b2d31);return R({embeds:[e]});}
if(i.commandName==="roles"){const g=i.guild;return R({content:`**الرتب (${g.roles.cache.size}):**\n${g.roles.cache.map(r=>r.toString()).join(", ").slice(0,1900)}`,ephemeral:true});}
if(i.commandName==="members"){return R(`👥 الأعضاء: **${i.guild.memberCount}**`);}
if(i.commandName==="ping"){return R(`🏓 البينغ: **${client.ws.ping}ms**`);}
if(i.commandName==="help"){const e=new EmbedBuilder().setTitle("📜 كل أوامر الجيش").setDescription(`
**🔨 حماية:** /kick /ban /unban /timeout /untimeout /warn
**🧹 إدارة الرومات:** /clear /lock /unlock /hide /unhide /slowmode
**🎖️ رتب:** /addrole /removerole /role /roles /nick
**💬 رسائل:** /say /embed /announce /poll
**ℹ️ معلومات:** /avatar /banner /userinfo /serverinfo /members /ping
**👋 ترحيب:** /set-welcome
**🤖 تلقائي:** سلام عليكم / صباح الخير...
`).setColor(0x2b2d31);return R({embeds:[e],ephemeral:true});}
if(i.commandName==="set-welcome"){const ch=i.options.getChannel("الروم");WELCOME.channelId=ch.id;return R({content:`✅ روم الترحيب هو ${ch}`,ephemeral:true});}
}catch(e){console.error(e);if(!i.replied) i.reply({content:"❌ خطأ: "+e.message,ephemeral:true});}
});
client.login(process.env.DISCORD_TOKEN);
