const fs = require('fs');
const userData = require('../data/users.json'); // Charger les données des utilisateurs

module.exports = {
    name: 'chifoumi',
    description: 'Joue au jeu Pierre-Papier-Ciseaux',
    async execute(message) {
        const playerId = message.author.id;
        const choices = ['rock', 'page_facing_up', 'scissors'];  // Les 3 choix possibles

        // Vérifier que l'utilisateur existe dans la base de données
        if (!userData[playerId]) {
            userData[playerId] = { money: 1000 };  // Ajouter un utilisateur par défaut avec 1000 malveillance
        }

        // Envoyer le message initial
        const gameMessage = await message.channel.send(`${message.author}, choisis quel main tu veux faire :`);

        // Ajouter les réactions (pierre, papier, ciseaux)
        await gameMessage.react('🪨'); // :rock:
        await gameMessage.react('📄'); // :roll_of_paper:
        await gameMessage.react('✂️'); // :scissors:

        // Filtrer pour s'assurer que seul l'utilisateur ayant envoyé la commande puisse réagir
        const filter = (reaction, user) => {
            return ['🪨', '📄', '✂️'].includes(reaction.emoji.name) && user.id === playerId;
        };

        // Créer un collecteur de réactions
        const collector = gameMessage.createReactionCollector({ filter, max: 1, time: 30000 });  // Temps de 30 secondes

        collector.on('collect', (reaction) => {
            let playerChoice;
            switch (reaction.emoji.name) {
                case '🪨':
                    playerChoice = 'rock';
                    break;
                case '📄':
                    playerChoice = 'page_facing_up';
                    break;
                case '✂️':
                    playerChoice = 'scissors';
                    break;
            }

            // Choix aléatoire du bot
            const botChoice = choices[Math.floor(Math.random() * choices.length)];

            // Déterminer le résultat
            let resultMessage = `Tu as choisi :${playerChoice}: et le bot a choisi :${botChoice}:. `;
            let playerWon = false;

            if (playerChoice === botChoice) {
                resultMessage += "C'est un match nul!";
            } else if (
                (playerChoice === 'rock' && botChoice === 'scissors') ||
                (playerChoice === 'page_facing_up' && botChoice === 'rock') ||
                (playerChoice === 'scissors' && botChoice === 'paper')
            ) {
                playerWon = true;
                resultMessage += "Tu as gagné!";
            } else {
                resultMessage += "Tu as perdu!";
            }

            // Mettre à jour l'argent du joueur en fonction du résultat
            if (playerWon) {
                userData[playerId].money += 100;  // Gagner 100 malveillance
            } else if (playerChoice !== botChoice) {  // Perdre 100 malveillance seulement si pas égalité
                userData[playerId].money -= 100;
            }

            // Sauvegarder les données des utilisateurs
            fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));

            // Envoyer le message final avec le résultat et le nouveau solde
            message.channel.send(resultMessage + ` Ton solde actuel de malveillance est de ${userData[playerId].money}.`);
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                message.channel.send("Tu n'as pas réagi à temps! Jeu annulé.");
            }
        });
    }
};
