const Discord = require("discord.js");
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildPresences],
  partials: [Partials.Message],
});

// Load config / env file
require("dotenv").config();
var userId = process.env.USER_ID;
var token = process.env.TOKEN;
var guildId = process.env.GUILD_ID;

// Load modules
const SpotifyHandler = require("./webhookHandlers/spotifyStatus");
const CustomHandler = require("./webhookHandlers/customStatus");

// Start API
require("./modules/express-app")(process.env.PORT || 3000);

// Array of all the activities that have already been logged
client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}!`);

  /**
   * @type {Discord.Guild}
   */
  var guild = client.guilds.cache.get(guildId);


  // ALEXA
  /**
   * @type {Discord.GuildMember}
   */
  var member = guild.members.cache.get("926891992523374633");

  var ChannelCreator = new (require("./utils/creator"))(client, guildId, member.id);


  var presence = member.presence;
  var { spotifyStatusWebhook, spotifyStatusChannel } = await ChannelCreator.spotify();

  var { customStatusWebhook, customStatusChannel } = await ChannelCreator.custom();

  if (presence && presence.hasOwnProperty("activities")) {
    for (var i in presence.activities) {
      let activity = presence.activities[i];
      if (activity.type && activity.type === 4) {
        const res = await CustomHandler(client, activity, customStatusChannel, customStatusWebhook);
        continue;
      }
      if (activity.name.includes("Spotify")) {
        const res = await SpotifyHandler(client, activity, spotifyStatusChannel, spotifyStatusWebhook);
        continue;
      }
    }
  }

  // DOMINO
  /**
   * @type {Discord.GuildMember}
   */
  var member = guild.members.cache.get("807810074483490847");

  var ChannelCreator = new (require("./utils/creator"))(client, guildId, member.id);


  var presence = member.presence;
  var { spotifyStatusWebhook, spotifyStatusChannel } = await ChannelCreator.spotify();

  var { customStatusWebhook, customStatusChannel } = await ChannelCreator.custom();

  if (presence && presence.hasOwnProperty("activities")) {
    console.log(presence.activities)

    for (var i in presence.activities) {
      let activity = presence.activities[i];
      if (activity.type && activity.type === 4) {
        const res = await CustomHandler(client, activity, customStatusChannel, customStatusWebhook);
        continue;
      }
      if (activity.name.includes("Spotify")) {
        const res = await SpotifyHandler(client, activity, spotifyStatusChannel, spotifyStatusWebhook);
        continue;
      }
    }
  }
});

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (newPresence.userId != "926891992523374633" && newPresence.userId != "807810074483490847") return;

  var ChannelCreator = new (require("./utils/creator"))(client, guildId, newPresence.userId);

  const { spotifyStatusWebhook, spotifyStatusChannel } = await ChannelCreator.spotify();

  const { customStatusWebhook, customStatusChannel } = await ChannelCreator.custom();

  for (var i in newPresence.activities) {
    var presence = newPresence.activities[i];
    // console.log(presence);
    console.log(newPresence.activities);
    if (presence.type && presence.type === 4) {
      const res = await CustomHandler(client, presence, customStatusChannel, customStatusWebhook);
      continue;
    }
    if (presence.name.includes("Spotify")) {
      const res = await SpotifyHandler(client, presence, spotifyStatusChannel, spotifyStatusWebhook);
      continue;
    }
  }
});

client.login(token);

module.exports = {
  client,
};
