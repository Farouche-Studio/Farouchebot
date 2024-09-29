const { MessageAttachment } = require('discord.js'); // Importez MessageAttachment
const fs = require('fs');
let userData = require('../data/users.json'); // Charger les données des utilisateurs

module.exports = {
    name: 'gamba',
    description: 'Faites un pari risqué avec une chance de 5% de gagner x20.',
    async execute(message, args) {
        const userId = message.author.id;

        // Vérifiez si un montant a été fourni
        if (!args[0] || isNaN(args[0]) || parseInt(args[0]) <= 0) {
            return message.channel.send('Veuillez spécifier un montant valide à parier.');
        }

        const montant = parseInt(args[0]);

        // Vérifiez si l'utilisateur a suffisamment d'argent
        if (!userData[userId] || userData[userId].money < montant) {
            return message.channel.send('Vous n\'avez pas assez de pièces pour parier ce montant.');
        }

        // Envoyer le GIF de début de jeu
        const initialGifPath = './gifs/gamba.gif'; // Chemin vers le GIF de début
        await message.channel.send(`🎲 Lancement de la roue de la malveillance...`);
        await message.channel.send({ files: [initialGifPath] }); // Envoyer le fichier

        // Délai de 2 secondes
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Tirage aléatoire pour déterminer le résultat
        const chance = Math.random();
        if (chance < 0.05) { // 5% de chance
            const gain = montant * 15;
            userData[userId].money += gain; // Ajouter les gains à l'utilisateur

            // Envoyer le GIF de victoire
            const winGifPath = './gifs/win.gif'; // Chemin vers le GIF de victoire
            await message.channel.send(`Grand respect ${message.author.username} ! tu as gagné **${gain}** malveillance en pariant **${montant}** !`);
            await message.channel.send({ files: [winGifPath] }); // Envoyer le fichier
        } else {
            userData[userId].money -= montant; // Retirer le montant du solde de l'utilisateur

            // Envoyer le GIF de perte
            const loseGifPath = './gifs/lose.gif'; // Chemin vers le GIF de perte
            await message.channel.send(` :index_pointing_at_the_viewer: :joy: : ${message.author.username}, t'as perdu **${montant}** malveillance.`);
            await message.channel.send({ files: [loseGifPath] }); // Envoyer le fichier
        }

        // Sauvegarder les données des utilisateurs après le pari
        fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
    }
};
