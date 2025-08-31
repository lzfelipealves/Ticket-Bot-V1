/**
 * Bot de Tickets para Discord
 * Autor: Luis Felipe Alves
 * GitHub/Twitch/Discord: github.com/lzfelipealves
 * Obs: Não apague!*
*/

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("clientReady", () => {
  console.log(`✅ Logado como ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (
    !interaction.isChatInputCommand() &&
    !interaction.isButton() &&
    !interaction.isStringSelectMenu()
  )
    return;

  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) {
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao executar este comando!",
          ephemeral: true
        });
      }
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_select") {
    const type = interaction.values[0];
    const ticketCategory = config.categories[type];

    if (!ticketCategory) {
      return interaction.reply({
        content: "❌ Categoria inválida ou não configurada!",
        ephemeral: true
      });
    }

    const existingChannel = interaction.guild.channels.cache.find(ch => {
      if (ch.parentId !== ticketCategory) return false;
      const perm = ch.permissionOverwrites.cache.get(interaction.user.id);
      return perm && perm.allow.has("ViewChannel");
    });

    if (existingChannel) {
      return interaction.reply({
        content: `❌ Você já possui um ticket aberto: ${existingChannel}`,
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9\-]/g, ""),
      type: 0,
      parent: ticketCategory,
      permissionOverwrites: [
        { id: interaction.guild.id, deny: ["ViewChannel"] },
        {
          id: interaction.user.id,
          allow: ["ViewChannel", "SendMessages", "AttachFiles"]
        }
      ]
    });

    await channel.send({
      embeds: [
        {
          title: config.ticketEmbed.title.replace("{type}", type),
          description: config.ticketEmbed.description,
          color: parseInt(config.ticketEmbed.color.replace("#", ""), 16)
        }
      ],
      components: [
        {
          type: 1,
          components: config.buttons.map(btn => ({
            type: 2,
            label: btn.label,
            style: btn.style,
            customId: btn.customId
          }))
        }
      ]
    });

    await interaction.reply({
      content: `✅ Ticket criado em: ${channel}`,
      ephemeral: true
    });
  }


  if (interaction.isButton()) {
    const { customId } = interaction;

    if (customId === "claim_ticket") {
      if (!interaction.member.permissions.has("ManageChannels")) {
        return interaction.reply({
          content: "❌ Apenas administradores podem assumir tickets!",
          ephemeral: true
        });
      }

      const embed = interaction.message.embeds[0];

      if (embed?.footer?.text?.startsWith("Assumido por")) {
        return interaction.reply({
          content: "❌ Este ticket já foi assumido!",
          ephemeral: true
        });
      }

      const newEmbed = EmbedBuilder.from(embed).setFooter({ text: `Assumido por ${interaction.user.tag}` });

      const row = interaction.message.components;

      await interaction.update({ embeds: [newEmbed], components: row });
      await interaction.followUp({
        content: `🔑 Ticket assumido por ${interaction.user}`,
        ephemeral: true
      });
    }

    if (customId === "delete_ticket") {
      if (!interaction.member.permissions.has("ManageChannels")) {
        return interaction.reply({
          content: "❌ Apenas administradores podem deletar tickets!",
          ephemeral: true
        });
      }

      await interaction.reply("🗑️ Este ticket será deletado em 5 segundos...");

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 5000);
    }

    if (customId === "transcript_ticket") {
      const logChannel = interaction.guild.channels.cache.get(config.logChannelId);

      if (!logChannel) {
        return interaction.reply({
          content: "❌ Canal de log não configurado!",
          ephemeral: true
        });
      }

      if (config.transcript.generateFile) {
        const transcriptBuffer = await require("./utils/transcript")(interaction.channel);

        const logsDir = path.join(__dirname, "logs");
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

        const filePath = path.join(logsDir, `${interaction.channel.name}-transcript.html`);

        fs.writeFileSync(filePath, transcriptBuffer);

        await logChannel.send({
          content: `📑 Transcript do ticket: **${interaction.channel.name}**`,
          files: [filePath]
        });
      } else {
        await logChannel.send({
          content: `📑 Transcript do ticket: **${interaction.channel.name}** foi registrado no log.`
        });
      }

      await interaction.reply({
        content: "📑 Transcript processado com sucesso!",
        ephemeral: true
      });
    }
  }
});

client.login(config.token);
