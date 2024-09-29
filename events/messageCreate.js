const fs = require('fs');
let userData = require('../data/users.json');

module.exports = (client, message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        command.execute(message, args, userData);
        fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));  // Sauvegarder les données après chaque commande
    } catch (error) {
        console.error(error);
        message.reply('Il y a eu une erreur lors de l\'exécution de la commande.');
    }
};
