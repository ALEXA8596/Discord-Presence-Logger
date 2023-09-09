const Discord = require("discord.js");

var currentSpotifySong;
var currentSpotifySongTimestamp;
/**
 *
 * @param {Discord.Activity} presence
 * @param {Discord.TextChannel} spotifyStatusChannel
 * @param {Discord.Webhook} SpotifyStatusWebhook
 */
module.exports = async (
  client,
  presence,
  spotifyStatusChannel,
  SpotifyStatusWebhook
) => {
  // Details: "Song Name"
  // State: "Artists Names"
  // assets: RichPresenceAssets { largeImage: 'spotify', largeText: 'Album Name', smallImage: 'spotify', smallText: 'Spotify' }
  console.log(presence);
  console.log(spotifyStatusChannel.name);
  console.log(spotifyStatusChannel.constructor.name);
  await spotifyStatusChannel.fetch();
  var spotifyStatusChannelMessages = await spotifyStatusChannel.messages
    .fetch()
    .then((msgs) => {
      msgs = msgs.filter((msg) => msg.author.id === client.user.id || msg.author.id === SpotifyStatusWebhook.id);
      msgs.sort((a, b) => b.createdAt > a.createdAt);
      return msgs;
    });
  var message = spotifyStatusChannelMessages.first();
  for (var j = 0; j < message.embeds.length; j++) {
    console.log(message.embeds[j].data.description);
    currentSpotifySong = message.embeds[j].data.details;
    currentSpotifySongTimestamp = message.createdTimestamp;
    break;
  }

  if (
    currentSpotifySong === presence.details &&
    currentSpotifySongTimestamp - Date.now() < 180000
  )
    return;
  const Embed = new Discord.EmbedBuilder()
    .setTitle(presence.details)
    .setAuthor({ name: "Alexa's Presence Logger" })
    .addFields(
      {
        name: "Artist(s)",
        value: `${presence.state}`,
      },
      {
        name: "Album",
        value: `${presence.assets.largeText}`,
      },
      {
        name: "Song Length",
        value: `${new Date(presence.timestamps.end - presence.timestamps.start)
          .toISOString()
          .slice(14, 19)}`,
      }
    )
    .setThumbnail(`	https://i.scdn.co/image/${presence.assets.largeImage.slice(8)}`)
    .setFooter({ text: "Made By ALEXA#0114" })
    .setTimestamp();
  const webhook = await SpotifyStatusWebhook.send({ embeds: [Embed] });
  return;
};
