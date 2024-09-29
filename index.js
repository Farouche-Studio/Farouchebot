const fs = require('fs');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ] 
});

// Charger les configurations
const config = require('./config.json');
client.commands = new Collection();

// Charger les données des utilisateurs
let userData = {};
try {
    userData = JSON.parse(fs.readFileSync('./data/users.json', 'utf-8'));
} catch (err) {
    console.error('Erreur lors de la lecture du fichier users.json:', err);
}

// Charger les commandes
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// Charger les événements
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    const eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
}


// Lancer le bot
client.login(config.token);
