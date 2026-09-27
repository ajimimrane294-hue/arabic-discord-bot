import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  AttachmentBuilder,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import sharp from "sharp";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  throw new Error("المتغير السري DISCORD_BOT_TOKEN غير موجود.");
}

const dataDirectory = path.resolve("data");
const settingsFile = path.join(dataDirectory, "guild-settings.json");
const levelsFile = path.join(dataDirectory, "levels.json");

const defaultSettings = {
  welcomeChannelId: null,
  welcomeMessage: "مرحباً بك في خادمنا! نتمنى لك وقتاً ممتعاً ومفيداً.",
  autoRoleId: null,
};

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
    return fallback;
  }
}

async function writeJson(file, value) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const settings = await readJson(settingsFile, {});
const levels = await readJson(levelsFile, {});

function guildSettings(guildId) {
  settings[guildId] = { ...defaultSettings, ...settings[guildId] };
  return settings[guildId];
}

function log(message, details = "") {
  const suffix = details ? ` ${details}` : "";
  process.stdout.write(`[arabic-discord-bot] ${message}${suffix}\n`);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function avatarDataUri(member) {
  try {
    const response = await fetch(
      member.user.displayAvatarURL({ extension: "png", size: 256 }),
    );
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

async function createWelcomeCard(member) {
  const avatar = await avatarDataUri(member);
  const avatarMarkup = avatar
    ? `<image href="${avatar}" x="76" y="122" width="256" height="256" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)" />`
    : `<circle cx="204" cy="250" r="128" fill="#334155" /><text x="204" y="275" text-anchor="middle" font-size="88" fill="#e2e8f0">${escapeXml(member.user.username.slice(0, 1).toUpperCase())}</text>`;

  const svg = `
    <svg width="1200" height="500" viewBox="0 0 1200 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="background" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#111827" />
          <stop offset="100%" stop-color="#1e3a5f" />
        </linearGradient>
        <clipPath id="avatarClip"><circle cx="204" cy="250" r="128" /></clipPath>
      </defs>
      <rect width="1200" height="500" rx="28" fill="url(#background)" />
      <circle cx="1030" cy="34" r="210" fill="#38bdf8" opacity="0.08" />
      <circle cx="1110" cy="470" r="230" fill="#a78bfa" opacity="0.09" />
      <circle cx="204" cy="250" r="142" fill="#0f172a" stroke="#38bdf8" stroke-width="5" />
      ${avatarMarkup}
      <text x="420" y="190" fill="#bae6fd" font-family="Arial, sans-serif" font-size="34" font-weight="700">مرحباً بك في خادمنا</text>
      <text x="420" y="270" fill="#f8fafc" font-family="Arial, sans-serif" font-size="54" font-weight="700">${escapeXml(member.displayName)}</text>
      <text x="420" y="330" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="25">نتمنى لك وقتاً ممتعاً ومفيداً معنا</text>
      <rect x="420" y="372" width="250" height="5" rx="3" fill="#38bdf8" />
    </svg>
  `;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function getLevelRecord(guildId, userId) {
  const key = `${guildId}:${userId}`;
  levels[key] ??= { xp: 0, level: 0, messages: 0 };
  return levels[key];
}

function levelFromXp(xp) {
  return Math.floor(Math.sqrt(xp / 100));
}

function xpToNextLevel(level) {
  return (level + 1) ** 2 * 100;
}

function mentionOrName(user) {
  return `<@${user.id}>`;
}

const commandDefinitions = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض قائمة أوامر البوت باللغة العربية"),
  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("تحديد قناة ورسالة الترحيب")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("قناة إرسال رسائل الترحيب")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("رسالة إضافية اختيارية")
        .setMaxLength(500)
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("autorole")
    .setDescription("تحديد رتبة تلقائية للأعضاء الجدد")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption((option) =>
      option.setName("role").setDescription("الرتبة التلقائية").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("level")
    .setDescription("عرض مستوى وخبرة عضو")
    .addUserOption((option) =>
      option.setName("user").setDescription("العضو المطلوب").setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو من الخادم")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("العضو المطلوب حظره").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("سبب الحظر")
        .setMaxLength(500)
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو من الخادم")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName("user").setDescription("العضو المطلوب طرده").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("سبب الطرد")
        .setMaxLength(500)
        .setRequired(false),
    ),if (interaction.commandName === "warn") {
    const target = interaction.options.getUser("العسكري");
    const reason = interaction.options.getString("السبب");
    const proof = interaction.options.getString("الدليل") || "لا يوجد دليل مرفق";

    const date = new Date().toLocaleString('ar-MA', { timeZone: 'Africa/Casablanca', dateStyle: 'full', timeStyle: 'short' });

    const embed = new EmbedBuilder()
     .setColor(0x8B0000)
     .setTitle('🚨 توبيخ عسكري رسمي 🚨')
     .setThumbnail(target.displayAvatarURL({ dynamic: true }))
     .addFields(
        { name: '🎖️ اسم العسكري', value: `> ${target}`, inline: false },
        { name: '📅 التاريخ والوقت', value: `> ${date}`, inline: false },
        { name: '📝 السبب', value: `> ${reason}`, inline: false },
        { name: '📎 الدليل', value: `> ${proof}`, inline: false },
      )
     .setFooter({ text: `تم التوبيخ بواسطة: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
     .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
                    }
].map((command) => command.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function registerCommands(userId) {
  const rest = new REST({ version: "10" }).setToken(token);
  const guildId = process.env.DISCORD_GUILD_ID;
  const route = guildId
    ? Routes.applicationGuildCommands(userId, guildId)
    : Routes.applicationCommands(userId);

  await rest.put(route, { body: commandDefinitions });
  log(
    guildId
      ? "تم تسجيل الأوامر في الخادم المحدد."
      : "تم تسجيل الأوامر العامة. قد يستغرق ظهورها بعض الوقت.",
  );
}

client.once("ready", async (readyClient) => {
  log(`تم تسجيل الدخول باسم ${readyClient.user.tag}.`);
  try {
    await registerCommands(readyClient.user.id);
  } catch (error) {
    log("تعذر تسجيل أوامر التفاعل.", error.message);
  }
});

client.on("guildMemberAdd", async (member) => {
  const config = guildSettings(member.guild.id);

  if (config.autoRoleId) {
    const role = member.guild.roles.cache.get(config.autoRoleId);
    if (role && role.editable) {
      await member.roles.add(role, "رتبة تلقائية للعضو الجديد").catch((error) => {
        log("تعذر إضافة الرتبة التلقائية.", error.message);
      });
    }
  }

  if (!config.welcomeChannelId) return;
  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel?.isTextBased()) return;

  try {
    const image = await createWelcomeCard(member);
    const attachment = new AttachmentBuilder(image, {
      name: "welcome.png",
      description: "بطاقة ترحيب بالعضو الجديد",
    });
    await channel.send({
      content: `${mentionOrName(member.user)}\n${config.welcomeMessage}`,
      files: [attachment],
    });
  } catch (error) {
    log("تعذر إرسال رسالة الترحيب.", error.message);
  }
});

client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const record = getLevelRecord(message.guild.id, message.author.id);
  const oldLevel = record.level;
  record.xp += 5 + Math.floor(Math.random() * 8);
  record.messages += 1;
  record.level = levelFromXp(record.xp);
  await writeJson(levelsFile, levels);

  if (record.level > oldLevel) {
    await message.channel
      .send(
        `${mentionOrName(message.author)} تهانينا! وصلت إلى المستوى **${record.level}**.`,
      )
      .catch(() => {});
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || !interaction.guild) return;

  try {
    if (interaction.commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x38bdf8)
        .setTitle("مساعدة البوت")
        .setDescription("إليك الأوامر المتاحة:")
        .addFields(
          {
            name: "/welcome",
            value: "تحديد قناة ورسالة الترحيب المصورة. يتطلب صلاحية إدارة الخادم.",
          },
          {
            name: "/autorole",
            value: "تحديد رتبة تلقائية للأعضاء الجدد. يتطلب صلاحية إدارة الرتب.",
          },
          { name: "/level", value: "عرض مستوى وخبرة عضو." },
          { name: "/ban", value: "حظر عضو مع سبب اختياري." },
          { name: "/kick", value: "طرد عضو مع سبب اختياري." },
        )
        .setFooter({ text: "جميع رسائل البوت باللغة العربية الفصحى" });
      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    if (interaction.commandName === "welcome") {
      const channel = interaction.options.getChannel("channel", true);
      const message =
        interaction.options.getString("message") || defaultSettings.welcomeMessage;
      if (!channel.isTextBased()) {
        await interaction.reply({
          content: "يرجى اختيار قناة نصية صالحة.",
          ephemeral: true,
        });
        return;
      }
      const config = guildSettings(interaction.guild.id);
      config.welcomeChannelId = channel.id;
      config.welcomeMessage = message;
      await writeJson(settingsFile, settings);
      await interaction.reply({
        content: `تم تفعيل الترحيب المصور في ${channel}.`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "autorole") {
      const role = interaction.options.getRole("role", true);
      const botMember = interaction.guild.members.me;
      if (!botMember || role.position >= botMember.roles.highest.position) {
        await interaction.reply({
          content: "لا أستطيع إدارة هذه الرتبة. ارفع رتبة البوت أعلى منها أولاً.",
          ephemeral: true,
        });
        return;
      }
      const config = guildSettings(interaction.guild.id);
      config.autoRoleId = role.id;
      await writeJson(settingsFile, settings);
      await interaction.reply({
        content: `تم تعيين ${role} رتبة تلقائية للأعضاء الجدد.`,
        ephemeral: true,
      });
      return;
    }

    if (interaction.commandName === "level") {
      const user = interaction.options.getUser("user") || interaction.user;
      const record = getLevelRecord(interaction.guild.id, user.id);
      const nextLevelXp = xpToNextLevel(record.level);
      await interaction.reply(
        `المستوى: **${record.level}**\nالخبرة: **${record.xp} / ${nextLevelXp}**\nعدد الرسائل المحتسبة: **${record.messages}**\nالعضو: ${mentionOrName(user)}`,
      );
      return;
    }

    if (interaction.commandName === "ban" || interaction.commandName === "kick") {
      const user = interaction.options.getUser("user", true);
      const reason =
        interaction.options.getString("reason") || "لم يتم تحديد سبب.";
      const target = await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

      if (!target) {
        await interaction.reply({
          content: "لم أجد هذا العضو في الخادم.",
          ephemeral: true,
        });
        return;
      }

      if (
        target.id === interaction.user.id ||
        target.id === interaction.client.user.id
      ) {
        await interaction.reply({
          content: "لا يمكن تنفيذ هذا الإجراء على هذا العضو.",
          ephemeral: true,
        });
        return;
      }

      if (interaction.commandName === "ban") {
        await target.ban({ reason });
        await interaction.reply(`تم حظر ${mentionOrName(user)}.\nالسبب: ${reason}`);
      } else {
        await target.kick(reason);
        await interaction.reply(`تم طرد ${mentionOrName(user)}.\nالسبب: ${reason}`);
      }
    }
  } catch (error) {
    log(`فشل تنفيذ الأمر ${interaction.commandName}.`, error.message);
    const content = "حدث خطأ أثناء تنفيذ الأمر. تحقق من صلاحيات البوت وحاول مجدداً.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content, ephemeral: true }).catch(() => {});
    }
  }
});

client.on("error", (error) => log("حدث خطأ في اتصال Discord.", error.message));

process.on("SIGINT", () => {
  client.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  client.destroy();
  process.exit(0);
});

await client.login(token);
