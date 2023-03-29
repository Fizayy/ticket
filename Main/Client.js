const { Client, Collection } = require("discord.js");
const fs = require("fs");

class Main extends Client {

    constructor () {
        super({
            intents: ['Guilds', 'GuildMembers', 'MessageContent', 'GuildMessages'],
        });

        this.config = require("../config");
        this.slashCommands = new Collection();
        this.utils = require('../utils');

        this.initSlashs();
        this.initEvents();
        this.login(this.config.token).then(() => console.log(`Connecté au bot.`)).catch(() => {
            throw new Error('TOKEN INVALID OR INTENT INVALID');
        })
    }

    initEvents() {
        const eventsFiles = fs.readdirSync(`./events`).filter(file => file.endsWith('.js') && !file.endsWith('.disabled'));
        for (const eventFile of eventsFiles) {
            const eventName = eventFile.split(".")[0];
            const event = new (require(`../events/${eventFile}`))(this);
            this.on(eventName, (...args) => event.run(...args));
            delete require.cache[require.resolve(`../events/${eventFile}`)]
        }
        console.log('EventHandler chargé')
    }

    initSlashs() {
        const subFolders = fs.readdirSync('./SlashCommands')
        for (const category of subFolders) {
            const commandsFiles = fs.readdirSync(`./SlashCommands`).filter(file => file.endsWith('.js') && !file.endsWith('.disabled'));
            for (const commandFile of commandsFiles) {
                const command = new (require(`../SlashCommands/${commandFile}`))(this)
                this.slashCommands.set(command.name, command)
            }
        }
        console.log('SlashCommandHandler chargé')
    }
}

module.exports = Main;