const { trackAction } = require('../../utils/tracker');
const config = require('../../config.json');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const db = require('pro.db');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, client) {
    const guild = ban.guild;
    const guildId = guild.id;
    const enabled = await db.get(`guilds.${guildId}.protection.enabled`);
    if (!enabled) return;
    // Get per-guild settings or fallback to config
    const threshold = await db.get(`guilds.${guildId}.protection.threshold`) ?? config.protection.guildBanAdd.threshold;
    const interval = await db.get(`guilds.${guildId}.protection.interval`) ?? config.protection.guildBanAdd.interval;
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });
    const log = fetchedLogs.entries.first();
    if (!log) return;
    const { executor } = log;
    if (!executor || executor.bot || executor.id === config.ownerId) return;
    const count = trackAction(executor.id, 'guildBanAdd', interval);
    if (count >= threshold) {
      // Remove all roles from executor except @everyone
      const member = await guild.members.fetch(executor.id).catch(() => null);
      if (member) {
        const rolesToRemove = member.roles.cache.filter(role => role.id !== guild.id);
        await member.roles.remove(rolesToRemove).catch(() => { });
      }
      // Ensure @everyone does not have Administrator
      const everyoneRole = guild.roles.everyone;
      if (everyoneRole.permissions.has('Administrator')) {
        await everyoneRole.setPermissions(everyoneRole.permissions.remove('Administrator')).catch(() => { });
      }
      // Alert owner
      const owner = await guild.fetchOwner();
      const embed = new EmbedBuilder()
        .setTitle('🚨 Suspicious Activity Detected')
        .setDescription(`User <@${executor.id}> has **banned members** ${count} times within one minute.`)
        .setThumbnail(executor.displayAvatarURL())
        .addFields(
          { name: 'Action', value: 'Ban', inline: true },
          { name: 'Count', value: String(count), inline: true },
          { name: 'Executor', value: `<@${executor.id}> (${executor.tag})`, inline: false }
        )
        .setColor(0xff0000)
        .setTimestamp();
      owner.send({ embeds: [embed] }).catch(() => { });
      // Log to db
      const alert = {
        message: `User <@${executor.id}> banned members ${count} times within one minute.`,
        executorId: executor.id,
        timestamp: Date.now(),
      };
      const logs = (await db.get(`guilds.${guildId}.alerts`)) || [];
      logs.push(alert);
      await db.set(`guilds.${guildId}.alerts`, logs.slice(-20)); // keep last 20
      // Send to log channel if set
      const logChannelId = await db.get(`guilds.${guildId}.logChannel`);
      if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel && logChannel.isTextBased()) {
          logChannel.send({ embeds: [embed] }).catch(() => { });
        }
      }
    }
  },
};
