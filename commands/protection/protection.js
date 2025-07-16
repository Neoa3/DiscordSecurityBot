const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('pro.db');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('protection')
        .setDescription('Manage the protection system')
        .addSubcommand(sub =>
            sub.setName('enable').setDescription('Enable the protection system')
        )
        .addSubcommand(sub =>
            sub.setName('disable').setDescription('Disable the protection system')
        )
        .addSubcommand(sub =>
            sub.setName('status').setDescription('View the current protection status')
        )
        .addSubcommand(sub =>
            sub.setName('logs').setDescription('View the latest alerts')
        )
        .addSubcommand(sub =>
            sub.setName('settings')
                .setDescription('Customize the time limit and number of actions')
                .addIntegerOption(opt =>
                    opt.setName('threshold').setDescription('Number of actions before alert').setRequired(false)
                )
                .addStringOption(opt =>
                    opt.setName('interval').setDescription('Time window in seconds').setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('setlog')
                .setDescription('Set the log channel for security alerts')
                .addChannelOption(opt =>
                    opt.setName('channel').setDescription('Log channel').setRequired(true)
                )
        ),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const sub = interaction.options.getSubcommand();

        if (sub === 'enable') {
            await db.set(`guilds.${guildId}.protection.enabled`, true);
            await interaction.reply({ content: '🟢 Protection system enabled for this server!', ephemeral: true });
        } else if (sub === 'disable') {
            await db.set(`guilds.${guildId}.protection.enabled`, false);
            await interaction.reply({ content: '🔴 Protection system disabled for this server!', ephemeral: true });
        } else if (sub === 'status') {
            const enabled = await db.get(`guilds.${guildId}.protection.enabled`);
            const status = enabled ? '🟢 Protection system is currently enabled for this server.' : '🔴 Protection system is currently disabled for this server.';
            await interaction.reply({ content: status, ephemeral: true });
        } else if (sub === 'logs') {
            const logs = (await db.get(`guilds.${guildId}.alerts`)) || [];
            if (!logs.length) {
                await interaction.reply({ content: '📋 No recent alerts.', ephemeral: true });
                return;
            }
            const latest = logs.slice(-5).reverse();
            const embed = new EmbedBuilder()
                .setTitle('🛡️ Recent Security Alerts')
                .setColor(0xffa500)
                .setDescription(latest.map((log, i) => `**${i + 1}.** ${log.message}\n<@${log.executorId}> | <t:${Math.floor(log.timestamp / 1000)}:R>`).join('\n\n'))
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else if (sub === 'settings') {
            const threshold = interaction.options.getInteger('threshold');
            const interval = interaction.options.getString('interval');
            const intervalMs = ms(interval);
            if (!intervalMs) return interaction.reply({ content: 'Invalid time interval. Please use a valid time format (e.g., 1m, 1h, 1d).', ephemeral: true });
            if (threshold !== null) await db.set(`guilds.${guildId}.protection.threshold`, threshold);
            if (interval !== null) await db.set(`guilds.${guildId}.protection.interval`, intervalMs);
            await interaction.reply({ content: `⚙️ Settings updated for this server. Threshold: ${threshold ?? 'unchanged'}, Interval: ${interval ?? 'unchanged'}`, ephemeral: true });
        } else if (sub === 'setlog') {
            const channel = interaction.options.getChannel('channel');
            await db.set(`guilds.${guildId}.logChannel`, channel.id);
            await interaction.reply({ content: `✅ Log channel set to <#${channel.id}>.`, ephemeral: true });
        }
    },
};