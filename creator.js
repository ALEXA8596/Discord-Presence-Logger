module.exports = class ChannelCreator {
  constructor(client, guildId) {
    this.client = client;
    this.guildId = guildId;
  }

  /**
   *
   * @returns {Promise<Object>}
   */
  async spotify() {
    const client = this.client;
    const guild = client.guilds.cache.get(this.guildId);

    /**
     * @type {Discord.TextChannel}
     */
    const spotifyStatusChannel = guild.channels.cache.find(
      (channel) =>
        channel.name === "spotify-status-change" &&
        channel.type === "GUILD_TEXT"
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
        "spotify-status-change",
        {
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
    const client = this.client;
    const guild = client.guilds.cache.get(this.guildId);

    /**
     * @type {Discord.TextChannel}
     */
    var customStatusChannel = guild.channels.cache.find(
      (channel) =>
        channel.name === "status-change" && channel.type === "GUILD_TEXT"
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
        "status-change",
        {
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
