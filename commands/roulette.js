const fs = require('fs');

let userData = require('../data/users.json');  // Charger les données des utilisateurs

module.exports = {
    name: 'roulette',
    description: 'Jouer à la roulette russe avec plusieurs rounds de risque.',
    async execute(message, args) {
        const userId = message.author.id;
        const mise = parseInt(args[0]);

        // Vérification si la mise est valide
        if (!mise || mise <= 0 || mise > 500) {
            return message.channel.send('Ta mise doit être un nombre valide entre 1 et 500.');
        }

        // Vérifier si l'utilisateur a assez d'argent
        if (!userData[userId] || userData[userId].money < mise) {
            return message.channel.send('Tu n’as pas assez de malveillance pour miser cette somme.');
        }

        let round = 1;
        let gain = mise;
        let continuer = true;

        // Probabilités de survie pour chaque round
        const probabilites = [0.5, 0.33, 0.25, 0.15, 0.1, 0.05];

        // Débiter l'utilisateur de sa mise
        userData[userId].money -= mise;

        const filter = response => response.author.id === userId && ['tirer', 'encaisser'].includes(response.content.toLowerCase());

        while (round <= 6 && continuer) {
            await message.channel.send(`Round ${round}: Tu as une chance de ${Math.floor(probabilites[round - 1] * 100)}% de doubler ta mise. Veux-tu "tirer" ou "encaisser" tes gains (${gain} de malveillance) ?`);

            try {
                // Attendre la réponse du joueur (tirer ou encaisser)
                const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
                const response = collected.first().content.toLowerCase();

                if (response === 'encaisser') {
                    // Le joueur encaisse ses gains
                    userData[userId].money += gain;
                    fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
                    return message.channel.send(`Félicitations, tu as encaissé tes gains de ${gain} de malveillance !`);
                } else if (response === 'tirer') {
                    // Le joueur choisit de tirer
                    const survie = Math.random() <= probabilites[round - 1];

                    if (survie) {
                        // Le joueur a survécu, doubler ses gains
                        gain *= 2;
                        message.channel.send(`Tu as survécu au round ${round} ! Ton gain est maintenant de ${gain} de malveillance.`);
                    } else {
                        // Le joueur a perdu, fin du jeu
                        return message.channel.send(`Malheureusement, tu as perdu au round ${round}. Ton gain est de 0.`);
                    }
                }
            } catch (e) {
                // Si l'utilisateur ne répond pas à temps
                return message.channel.send(`${message.author.username}, tu n'as pas répondu à temps. Jeu terminé.`);
            }

            round++;
        }

        // Si le joueur survit à tous les rounds
        userData[userId].money += gain;
        fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
        return message.channel.send(`Incroyable ! Tu as survécu à tous les rounds et gagné ${gain} de malveillance.`);
    }
};
