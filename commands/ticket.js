/**
 * Bot de Tickets para Discord
 * Autor: Luis Felipe Alves
 * GitHub/Twitch/Discord: github.com/lzfelipealves
 * Obs: Não apague!*
*/

const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require("discord.js");
const config = require("../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Cria um painel de tickets"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(config.menuEmbed.title)
      .setDescription(config.menuEmbed.description)
      .setColor(config.menuEmbed.color)
      .setThumbnail(config.menuEmbed.thumbnail?.url)
      .setImage(config.menuEmbed.image?.url)
      .setFooter({
        text: config.menuEmbed.footer?.text || "",
        iconURL: config.menuEmbed.footer?.icon_url || null
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder(config.menu.placeholder)
      .addOptions(config.menu.options);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
