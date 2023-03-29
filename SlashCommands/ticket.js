const Command = require("../Main/Command");

module.exports = class TicketGen extends Command {
    constructor (client) {
        super(client, {
            filename: __filename,
            description: 'Générer un message pour la création d\'un ticket.',
            memberPermissions: ['Administrator'],
            options: [
                {
                    name: 'channel',
                    description: 'Spécifie un channel',
                    channelTypes: [0],
                    type: 7,
                }
            ]
        });
    }

    async run (client, interaction) {

        const channel = interaction.options.getChannel('channel');

        const embed = {
            color: '3447003',
            description: 'Description'
        }
        const components = [{
            type: 1,
            components: [
                {
                    type: 2,
                    customId: 'ticketCreate',
                    label: 'Créer un ticket',
                    style: 3
                }
            ]
        }]

        if (!channel) interaction.channel.send({ embeds: [embed], components })
        else channel.send({ embeds: [embed], components })

        return interaction.reply({ content: 'Message créé.', ephemeral: true})

    }
}