const { trackAction } = require('../../utils/tracker');
const config = require('../../config.json');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('pro.db');

module.exports = {
  name: 'channelDelete',
  async execute(channel, client) {
    if (!channel.guild) return;
    const guildId = channel.guild.id;
    const enabled = await db.get(`guilds.${guildId}.protection.enabled`);
    if (!enabled) return;
    // Get per-guild settings or fallback to config
    const threshold = await db.get(`guilds.${guildId}.protection.threshold`) ?? config.protection.channelDelete.threshold;
    const interval = await db.get(`guilds.${guildId}.protection.interval`) ?? config.protection.channelDelete.interval;
    const fetchedLogs = await channel.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.ChannelDelete,
    });
    const log = fetchedLogs.entries.first();
    if (!log) return;
    const { executor } = log;
    if (!executor || executor.bot || executor.id === config.ownerId) return;
    // Remove all roles from executor except @everyone
    const member = await channel.guild.members.fetch(executor.id).catch(() => null);
    if (member) {
      const rolesToRemove = member.roles.cache.filter(role => role.id !== channel.guild.id);
      await member.roles.remove(rolesToRemove).catch(() => {});
    }
    // Ensure @everyone does not have Administrator
    const everyoneRole = channel.guild.roles.everyone;
    if (everyoneRole.permissions.has('Administrator')) {
      await everyoneRole.setPermissions(everyoneRole.permissions.remove('Administrator')).catch(() => {});
    }
    const count = trackAction(executor.id, 'channelDelete', interval);
    if (count >= threshold) {
      // Alert owner
      const owner = await channel.guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle('🚨 Suspicious Activity Detected')
        .setDescription(`User <@${executor.id}> has **deleted channels** ${count} times within one minute.`)
        .setThumbnail(executor.displayAvatarURL())
        .addFields(
          { name: 'Action', value: 'Channel Delete', inline: true },
          { name: 'Count', value: String(count), inline: true },
          { name: 'Executor', value: `<@${executor.id}> (${executor.tag})`, inline: false }
        )
        .setColor(0xff0000)
        .setTimestamp();
      owner.send({ embeds: [embed] }).catch(() => {});
      // Log to db
      const alert = {
        message: `User <@${executor.id}> deleted channels ${count} times within one minute.`,
        executorId: executor.id,
        timestamp: Date.now(),
      };
      const logs = (await db.get(`guilds.${guildId}.alerts`)) || [];
      logs.push(alert);
      await db.set(`guilds.${guildId}.alerts`, logs.slice(-20)); // keep last 20
      // Send to log channel if set
      const logChannelId = await db.get(`guilds.${guildId}.logChannel`);
      if (logChannelId) {
        const logChannel = channel.guild.channels.cache.get(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          logChannel.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  },
};
