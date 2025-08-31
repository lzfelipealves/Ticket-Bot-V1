/**
 * Bot de Tickets para Discord
 * Autor: Luis Felipe Alves
 * GitHub/Twitch/Discord: github.com/lzfelipealves
 * Obs: Não apague!*
*/

const fs = require("fs");
const path = require("path");

module.exports = async (channel) => {
  let messages = await channel.messages.fetch({ limit: 100 });
  
  messages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const content = messages.map(msg => {
    const time = new Date(msg.createdTimestamp).toLocaleString();
    return `[${time}] ${msg.author.tag}: ${msg.content}`;
  }).join("\n");

  return content;
};
