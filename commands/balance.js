module.exports = {
    name: 'balance',
    description: 'Affiche la balance de l\'utilisateur',
    execute(message, args, userData) {
        const userId = message.author.id;
        if (!userData[userId]) {
            message.channel.send(`${message.author.username}, tu n'as pas encore de malveillance.`);
        } else {
            message.channel.send(`${message.author.username}, tu as ${userData[userId].money} de malveillance.`);
        }
    }
};
