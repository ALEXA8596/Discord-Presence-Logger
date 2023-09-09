const Discord = require("discord.js");
const Search = require("../search/search.js").search;

const userIdToCategory = {
  // Domino
  "807810074483490847": "1142564240968908830",
  // Alexa
  "926891992523374633": "967238139401883648"
}

var currentCustomStatus;
/**
 * @param {Discord.Client} client
 * @param {Discord.Activity} presence
 * @param {Discord.TextChannel} customStatusChannel
 * @param {Discord.Webhook} CustomStatusWebhook
 */
module.exports = async (
  client,
  presence,
  customStatusChannel,
  CustomStatusWebhook
) => {
  // id: 'custom'
  // name: 'Custom Status'
  // type: 'CUSTOM'
  // state: 'THE ACTUAL STATUS'
  // emoji: Emoji { animated: null | true, name: '', id: 'undefined | Snowflake'}
  // if (presence.emoji  && presence.emoji.name) console.log(currentCustomEmoji + " " + presence.emoji.name)

  // Fetch the messages in the custom status channel and find the first message from the bot that has a custom status
  // Then save that custom status in currentCustomStatus

  // console.log(presence);

  var customStatusChannelMessages = await customStatusChannel.messages
    .fetch()
    .then((msgs) => {
      msgs = msgs.filter(
        (msg) =>
          msg.author.id === client.user.id ||
          msg.author.id === CustomStatusWebhook.id
      );
      msgs.sort((a, b) => b.createdAt > a.createdAt);
      return msgs;
    });
  var message = customStatusChannelMessages.first();

  if (message) {
    for (var j = 0; j < message.embeds.length; j++) {
      var embed = message.embeds[j];
      // Parse embed into an object
      embed = new Discord.EmbedBuilder(embed);
      console.log(embed);
      console.log(embed.data.description);
      if (embed.data.title === "Custom Status")
        currentCustomStatus = embed.data.description;
      break;
    }
    presence.emoji
      ? console.log(presence.emoji.toString())
      : console.log("no emoji");
    console.log(presence.state);
    console.log(currentCustomStatus);
  }
  if (
    presence.emoji &&
    currentCustomStatus === presence.emoji.toString() + " " + presence.state
  )
    return;
  if (!presence.emoji && currentCustomStatus === presence.state) return;
  var state;
  if (presence.emoji && presence.emoji.name) {
    state = presence.emoji.toString() + " " + presence.state;
  } else {
    state = presence.state;
  }
  console.log("hi"); //
  var getFromBetween = {
    results: [],
    string: "",
    getFromBetween: function (sub1, sub2) {
      if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
        return false;
      var SP = this.string.indexOf(sub1) + sub1.length;
      var string1 = this.string.substr(0, SP);
      var string2 = this.string.substr(SP);
      var TP = string1.length + string2.indexOf(sub2);
      return this.string.substring(SP, TP);
    },
    removeFromBetween: function (sub1, sub2) {
      if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
        return false;
      var removal = sub1 + this.getFromBetween(sub1, sub2) + sub2;
      this.string = this.string.replace(removal, "");
    },
    getAllResults: function (sub1, sub2) {
      // first check to see if we do have both substrings
      if (this.string.indexOf(sub1) < 0 || this.string.indexOf(sub2) < 0)
        return;

      // find one result
      var result = this.getFromBetween(sub1, sub2);
      // push it to the results array
      this.results.push(result);
      // remove the most recently found one from the string
      this.removeFromBetween(sub1, sub2);

      // if there's more substrings
      if (this.string.indexOf(sub1) > -1 && this.string.indexOf(sub2) > -1) {
        this.getAllResults(sub1, sub2);
      } else return;
    },
    get: function (string, sub1, sub2) {
      this.results = [];
      this.string = string;
      this.getAllResults(sub1, sub2);
      return this.results;
    },
  };

  const Embed = new Discord.EmbedBuilder()
    .setTitle("Custom Status")
    .setDescription(state)
    .setTimestamp();
    console.log(Embed)
  /**
   * @type {import('../search/Structures/Track').Track}
   */
  if (getFromBetween.get(state, "[", "]")[0]) {
  const track = await Search(getFromBetween.get(state, "[", "]")[0]).then(
    (track) => track.tracks[0]
  );
  const InspiredEmbed = new Discord.EmbedBuilder();
  InspiredEmbed.setTitle("Inspired by: " + track.title).setAuthor({
    name: "Alexa's Presence Logger",
  });
  if (track.author)
    InspiredEmbed.addFields({ name: "Artist(s)", value: track.author });
  InspiredEmbed.setURL(track.url).setImage(track.thumbnail);

  console.log(CustomStatusWebhook);

  return await CustomStatusWebhook.send({ embeds: [Embed, InspiredEmbed] });
}else {
  return await CustomStatusWebhook.send({ embeds: [Embed] });
}
  // console.log(`Done sending custom status for ${presence.user.username}`)
};
