# Neo Security Bot

A Discord bot focused on advanced server protection and anti-raid automation. It monitors suspicious activities (like mass bans, kicks, channel/role changes) and takes automated action to protect your server from malicious users.

---

## Features

- **Anti-Raid & Security Automation:**  
  Detects and mitigates suspicious actions such as mass bans, kicks, channel deletions/creations, and role removals.
- **Automated Response:**  
  When a user exceeds configurable thresholds for destructive actions, the bot:
  - Removes all their roles (except @everyone)
  - Removes Administrator from @everyone if present
  - Alerts the server owner via DM
  - Logs incidents to a configurable log channel
- **Customizable Protection:**  
  Per-server settings for action thresholds and time intervals.
- **Slash Command Interface:**  
  All configuration and status via `/protection` command.
- **Persistent Logging:**  
  Keeps a rolling log of the last 20 security alerts per server.

---

## How It Works

- The bot listens for key moderation events (channel create/delete, member ban/kick, role removal).
- It tracks user actions in real-time using an in-memory tracker.
- If a user exceeds the allowed number of actions within a set time window, the bot triggers automated countermeasures and logs the incident.
- All actions and settings are stored per-server using a lightweight database (`pro.db`).

---

## Commands

### `/protection`
Manage and configure the protection system.

**Subcommands:**
- `/protection enable`  
  Enable the protection system for your server.
- `/protection disable`  
  Disable the protection system.
- `/protection status`  
  View whether protection is currently enabled.
- `/protection logs`  
  View the latest 5 security alerts for your server.
- `/protection settings [threshold] [interval]`  
  Customize the number of actions (`threshold`) and time window (`interval`, e.g. `1m`, `60s`) before triggering protection.
- `/protection setlog <channel>`  
  Set the channel where security alerts will be posted.

---

## Event-Based Protections

| Event                | What’s Detected                | Automated Response                                                                 |
|----------------------|-------------------------------|------------------------------------------------------------------------------------|
| Channel Create       | Mass channel creation          | Remove roles, alert owner, log, remove admin from @everyone                        |
| Channel Delete       | Mass channel deletion          | Remove roles, alert owner, log, remove admin from @everyone                        |
| Member Ban           | Mass banning                   | Remove roles, alert owner, log, remove admin from @everyone                        |
| Member Kick          | Mass kicking                   | Remove roles, alert owner, log, remove admin from @everyone                        |
| Role Remove          | Mass role removals             | Remove roles, alert owner, log, remove admin from @everyone                        |

All actions are tracked per-user and per-action type, with customizable thresholds and intervals.

---

## Setup Instructions

### Prerequisites

- Node.js v16+
- A Discord bot token ([How to create a bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot))
- Permissions: The bot needs Administrator or at least all moderation permissions.

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Neoa3/DiscordSecurityBot.git
   cd DiscordSecurityBot
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root directory:
     ```
     BOT_TOKEN=your-bot-token-here
     CLIENT_ID=your-bot-client-id
     ```
   - Edit `config.json` to set your owner ID and default thresholds if needed.

4. **Register slash commands:**
   ```sh
   npm start
   ```
   This will register the `/protection` command globally.

5. **Run the bot:**
   ```sh
   node index.js
   ```

---

## Usage Guide

- **Enable protection:**  
  `/protection enable`
- **Set log channel:**  
  `/protection setlog #your-log-channel`
- **Customize thresholds:**  
  `/protection settings threshold:5 interval:1m`
- **Check status:**  
  `/protection status`
- **View recent alerts:**  
  `/protection logs`

**Note:** Only server administrators can use the `/protection` command.

---

## Configuration

- **config.json:**  
  Set default thresholds, intervals, log channel, and owner ID.
- **database.json:**  
  Stores per-server settings and alert logs (auto-managed).

---

## Tech Stack

- [discord.js v14](https://discord.js.org/)
- [pro.db](https://www.npmjs.com/package/pro.db) (for persistent storage)
- [dotenv](https://www.npmjs.com/package/dotenv) (for environment variables)
- [ms](https://www.npmjs.com/package/ms) (for time parsing)

---

## Contributing

Pull requests and suggestions are welcome! Please open an issue first to discuss any major changes.

---

## 🆘 Support

If you need help setting up or using the bot, feel free to reach out:

- 💬 **📩 Communication via email**: [neo@noonserv.com](mailto:neo@noonserv.com)
- 📧 **Contact the developer**: [neo.x8](https://discord.com/users/1316110658257031300)
