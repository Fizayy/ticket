const path = require("path");
const { PermissionsBitField } = require("discord.js");

module.exports = class BaseCommand {
    constructor(client, {
        filename = '',
        type = 1,
        description = '',
        memberPermissions = [],
        options = [],
    })
    {
        this.name = path.parse(filename).name;

        const bitPermission = memberPermissions.map(p => PermissionsBitField.Flags[p]);
        const bit = bitPermission.reduce((a, b) => a | b, 0n).toString();

        this.commandBody = {
            name: this.name,
            description,
            type,
            dm_permission: true,
            options,
        };
        if (bit !== '0') {
            this.commandBody.default_member_permissions = bit;
        }
    }
};