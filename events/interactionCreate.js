const { create } = require('sourcebin');

module.exports = class {

    constructor (client) {
        this.client = client;
    }

    async run (interaction) {

        if (interaction.isButton()) {
            await interaction.deferUpdate()
            switch(interaction.customId) {
                case 'ticketCreate':
                    const isAlreadyCreated = interaction.guild.channels.cache.find(channel => channel.topic?.includes(interaction.user.id));
                    if (isAlreadyCreated) {
                        return interaction.followUp({
                            content: `Vous avez déjà un ticket en cours. <#${isAlreadyCreated.id}>`,
                            ephemeral: true
                        })
                    }

                    const channel = await interaction.guild.channels.create({
                        name: `ticket-${interaction.user.username}`,
                        type: 0,
                        parent: '1090625294848774247',
                        topic: `${interaction.user.id}`,
                        permissionOverwrites: [
                            {
                                id: interaction.guild.id,
                                deny: ['ViewChannel']
                            },
                            {
                                id: interaction.user.id,
                                allow: ['ViewChannel', 'SendMessages']
                            },
                            {
                                id: '1031863811252162650',
                                allow: ['ViewChannel', 'SendMessages']
                            }
                        ]
                    });

                    const embed = {
                        color: '3447003',
                        description: 'Description'
                    };
                    const components = [{
                        type: 1,
                        components: [
                            {
                                type: 2,
                                customId: 'delete',
                                label: 'Supprimer le ticket',
                                style: 4
                            },
                            {
                                type: 2,
                                customId: 'add',
                                label: 'Ajouter quelqu\'un',
                                style: 3
                            },
                            {
                                type: 2,
                                customId: 'remove',
                                label: 'Enlever quelqu\'un',
                                style: 4
                            },
                        ]
                    }]

                    channel.send({
                        embeds: [embed],
                        components
                    }).then(interaction.followUp({
                        content: `Votre ticket a été créé ${channel}.`,
                        ephemeral: true
                    }))
                    break;
                case 'delete': {
                    const channel = interaction.guild.channels.cache.get(interaction.channelId);
                    channel.send(`> Le ticket va se supprimer dans **5 secondes**...`);
                    await this.client.utils.wait(5000);

                    const messages = [];
                    let lastMessageId;
                    let messageCount = 0;
                    const fetchOptions = { limit: 100 };

                    do {
                        const fetchedMessages = await interaction.channel.messages.fetch(lastMessageId ? { ...fetchOptions, before: lastMessageId } : fetchOptions);
                        const newMessageCount = fetchedMessages.size;
                        messageCount += newMessageCount;

                        for (const message of fetchedMessages.values()) {
                            const timestamp = new Date(message.createdAt).toLocaleString('fr-FR');
                            const content = message.attachments.size > 0 ? message.attachments.first().proxyURL : message.content || '[Embed]';
                            messages.push(`${timestamp} | ${message.author.tag} → ${content}`);
                        }

                        lastMessageId = fetchedMessages.lastKey();
                    } while (messageCount < 1000 && lastMessageId);
                    const content = messages.reverse().join('\n');

                    const logstickets = interaction.guild.channels.cache.get("992924930264023070");

                    await create({
                        title: channel.name,
                        description: 'Information concernant les conversations de ce ticket.',
                        files: [
                            {
                                content,
                                language: "javascript"
                            }
                        ]
                    }).then((value) => {

                        const components = [{
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: 'Transcript',
                                    url: value.url,
                                    style: 5
                                }
                            ]
                        }]

                        const embedLogs = {
                            color: 0x9b59b6,
                            description: `Le ticket se nommant **${channel.name}** a été supprimé par **${interaction.user}**`,
                            timestamp: new Date().toISOString()
                        }

                        logstickets.send({embeds: [embedLogs], components});
                        channel.delete();

                    })
                    break;
                }
                case 'add':
                    const modPosition = interaction.member.roles.highest.position;
                    const rolePosition = interaction.guild.roles.cache.get('1031850468437151795').position
                    if (!(modPosition > rolePosition) && interaction.guild.ownerId !== interaction.user.id) return;

                    const collected = await generateQuestion(`> ${interaction.user}, veuillez mentionner la personne que vous voulez ajouter.`);

                    const user = await interaction.guild.members.cache.get(collected);
                    if (interaction.channel.permissionsFor(collected).has('ViewChannel')) {
                        return await interaction.channel.send(`> Cette personne est déjà dans le ticket.`)
                            .then((msg) => setTimeout(() => msg.delete().catch(() => 0), 5000));
                    }
                    if (user) {
                        await interaction.channel.permissionOverwrites.create(user.id, {
                            ViewChannel: true,
                            SendMessages: true
                        });
                        await interaction.channel.send(`> ${user} a été ajouté au ticket.`);
                    } else {
                        await interaction.channel.send(`> Cette personne est introuvable.`)
                            .then((msg) => setTimeout(() => msg.delete().catch(() => 0), 5000));
                    }
                    break;
                case 'remove': {
                    const modPosition = interaction.member.roles.highest.position;
                    const rolePosition = interaction.guild.roles.cache.get('1031850468437151795').position
                    if (!(modPosition > rolePosition) && interaction.guild.ownerId !== interaction.user.id) return;

                    const collected = await generateQuestion(`> ${interaction.user}, veuillez mentionner la personne que vous voulez enlever.`);

                    const user = await interaction.guild.members.cache.get(collected);
                    if (!interaction.channel.permissionsFor(collected).has('ViewChannel')) {
                        return await interaction.channel.send(`> Cette personne n'est pas dans le ticket.`)
                            .then((msg) => setTimeout(() => msg.delete().catch(() => 0), 5000));
                    }
                    if (user) {
                        interaction.channel.permissionOverwrites.delete(user.id)
                        await interaction.channel.send(`> ${user} a été enlevé du ticket.`)
                    } else {
                        await interaction.channel.send(`> Cette personne est introuvable.`)
                            .then((msg) => setTimeout(() => msg.delete().catch(() => 0), 5000));
                    }
                    break;
                }
            }

        }

        async function generateQuestion(question) {
            const row = {
                type: 1,
                components: [
                    {
                        type: 5,
                        placeholder: 'Liste des membres',
                        customID: `users.${interaction.id}`,
                        maxValues: 1,
                        minValues: 1
                    }
                ]
            }

            const messageQuestion = await interaction.channel.send({ content: question, components: [row] })
            const collected = await interaction.channel.awaitMessageComponent({
                filter: i => i.customId.includes('users') && i.customId.includes(interaction.id) && i.user.id === interaction.user.id,
                time: 120000
            }).catch(() => {})
            await messageQuestion.delete().catch(() => {});
            return collected.values[0];
        }

        if (interaction.isCommand() && interaction.inGuild()) {
            const cmd = this.client.slashCommands.get(interaction.commandName);
            cmd.run(this.client, interaction);
        }

    }
}