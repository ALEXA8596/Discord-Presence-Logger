const { ChannelType } = require("discord.js");

const userIdToCategory = {
  // Domino
  "807810074483490847": "1142564240968908830",
  // Alexa
  "926891992523374633": "967238139401883648"
}

module.exports = class ChannelCreator {
  constructor(client, guildId, userId) {
    this.client = client;
    this.guildId = guildId;
    this.userId = userId;
    // console.log(userId)
  }

  /**
   *
   * @returns {Promise<Object>}
   */
  async spotify() {
    /**
     * @type {Discord.Client}
     */
    const client = this.client;
    /**
     * @type {Discord.Guild}
     */
    const guild = client.guilds.cache.get(this.guildId);

    await guild.channels.fetch();

    /**
     * @type {Discord.CategoryChannel}
     */
    const category = guild.channels.cache.get(userIdToCategory[this.userId]);


    /**
     * @type {Discord.TextChannel}
     */
    const spotifyStatusChannel = category.children.cache.find(
      (channel) =>
        channel.name === "spotify-status-change" &&
        channel.type === ChannelType.GuildText
    );



    var spotifyStatusWebhooks = await spotifyStatusChannel.fetchWebhooks();
    /**
     * @type {Discord.Webhook}
     */
    var spotifyStatusWebhook;
    if (spotifyStatusWebhooks.size != 0) {
      spotifyStatusWebhook = spotifyStatusWebhooks.first();
    } else if (spotifyStatusWebhooks.size == 0) {
      spotifyStatusWebhook = await spotifyStatusChannel.createWebhook(

        {
          name: "spotify-status-change",
          avatar: client.user.displayAvatarURL(),
          reason: "spotify-status-change",
        }
      );
    }
    return {
      spotifyStatusChannel,
      spotifyStatusWebhook,
    };
  }

  /**
   * @returns {Promise<Discord.TextChannel>}
   */
  async custom() {
    /**
     * @type {Discord.Client}
     */
    const client = this.client;
    /**
     * @type {Discord.Guild}
     */
    const guild = client.guilds.cache.get(this.guildId);
    /**
     * @type {Discord.CategoryChannel}
     */
    const category = await guild.channels.cache.get(userIdToCategory[this.userId]);

    /**
     * @type {Discord.TextChannel}
     */
    var customStatusChannel = category.children.cache.find(
      (channel) =>
        channel.name === "status-change" && channel.type === ChannelType.GuildText
    );
    var customStatusWebhooks = await customStatusChannel.fetchWebhooks();
    /**
     * @type {Discord.Webhook}
     */
    var customStatusWebhook;
    if (customStatusWebhooks.size != 0) {
      customStatusWebhook = customStatusWebhooks.first();
    } else if (customStatusWebhooks.size == 0) {
      customStatusWebhook = await customStatusChannel.createWebhook(

        {
          name: "status-change",
          avatar: client.user.displayAvatarURL(),
          reason: "status-change",
        }
      );
    }
    return {
      customStatusChannel,
      customStatusWebhook,
    };
  }
  /**
   *
   * @returns {Promise<Object>}
   */
  async all() {
    return {
      spotify: await this.spotify(),
      custom: await this.custom(),
    };
  }
};
