const fs = require('fs');

// Charger les données des utilisateurs
let userData = require('../data/users.json');  // Assurez-vous que les données sont bien organisées et que chaque utilisateur a une clé 'money'.

module.exports = {
    name: 'voleur',
    description: 'Voler un joueur au hasard parmi les 3 plus riches, sauf celui qui lance la commande.',
    async execute(message, args) {
        const userId = message.author.id;

        // Filtrer les 3 plus riches joueurs (sauf l'utilisateur qui lance la commande)
        const richestPlayers = Object.entries(userData)
            .filter(([id]) => id !== userId)  // Exclure le voleur
            .sort(([, a], [, b]) => b.money - a.money)  // Trier par richesse
            .slice(0, 3);  // Prendre les 3 plus riches

        if (richestPlayers.length === 0) {
            return message.channel.send("Il n'y a pas assez de joueurs pour lancer un vol.");
        }

        // Sélectionner un joueur aléatoire parmi les 3 plus riches
        const randomIndex = Math.floor(Math.random() * richestPlayers.length);
        const [victimId, victimData] = richestPlayers[randomIndex];
        const victimUsername = await message.guild.members.fetch(victimId).then(member => member.user.username);

        message.channel.send(`🔪 ${message.author.username} tente de voler ${victimUsername} ! ${victimUsername}, tu as 5 heures pour répondre avec !defendre sinon tu perdras 500 malveillances.`);

        // Définir une variable pour suivre si la victime s'est défendue
        let defended = false;

        // Créer une attente de 5 heures pour la défense
        const filter = (response) => response.author.id === victimId && response.content.toLowerCase() === '!defendre';
        const collector = message.channel.createMessageCollector({ filter, time: 18000000 });  // 5 heures = 18000000 ms

        // Si la victime répond avec !defendre
        collector.on('collect', () => {
            defended = true;
            const attackerMoney = userData[userId].money;

            // Si le voleur n'a pas assez d'argent, il peut tomber en négatif
            userData[userId].money -= 600;
            userData[victimId].money += 600;

            message.channel.send(`⚔️ ${victimUsername} s'est défendu avec succès et prend 600 malveillances de ${message.author.username} !`);

            // Sauvegarder les changements dans les données
            fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
        });

        // Lorsque le temps est écoulé
        collector.on('end', () => {
            if (!defended) {
                // Si la victime ne s'est pas défendue, le voleur prend 500
                userData[userId].money += 500;
                userData[victimId].money -= 500;

                message.channel.send(`💰 ${message.author.username} a réussi à voler 500 malveillances à ${victimUsername} !`);

                // Sauvegarder les changements dans les données
                fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
            }
        });
    }
};
