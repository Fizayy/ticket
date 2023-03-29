const { REST, Routes} = require('discord.js');

module.exports = class {
    constructor (client) {
        this.client = client;
    }
    async run () {

        if (this.client.config.deploySlashs) {
            const rest = new REST({version: '10'}).setToken(this.client.config.token);
            const commands = this.client.slashCommands.map(command => command.commandBody);

            await rest.put(Routes.applicationGuildCommands(this.client.user.id, '908133746123882546'), {body: commands});
        }

    }
}