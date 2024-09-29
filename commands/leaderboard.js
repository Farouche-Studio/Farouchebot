const fs = require('fs');
const { createCanvas } = require('canvas');

let userData = require('../data/users.json'); // Charger les données utilisateur

module.exports = {
    name: 'leaderboard',
    description: 'Affiche le leaderboard des utilisateurs avec leur montant d\'argent',
    async execute(message) {
        try {
            // Essayer de créer le canvas pour le leaderboard
            const canvas = await createLeaderboardImage(userData);
            const attachment = { files: [canvas.toBuffer()] };

            // Envoyer l'image du leaderboard
            await message.channel.send(attachment);
        } catch (error) {
            // En cas d'erreur, envoyer les résultats en texte
            await message.channel.send(createTextLeaderboard(userData));
        }
    }
};

// Fonction pour créer le canvas du leaderboard
async function createLeaderboardImage(userData) {
    const canvas = createCanvas(800, 400); // Dimension du canvas
    const ctx = canvas.getContext('2d');

    // Remplir le fond
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Titre du leaderboard
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Leaderboard des Utilisateurs', 50, 50);

    // Dessiner les données des utilisateurs
    ctx.font = '18px sans-serif';
    const users = Object.entries(userData).sort((a, b) => b[1].money - a[1].money); // Trier par argent
    let y = 100; // Position de départ pour le texte

    users.forEach(([userId, user]) => {
        const username = user.username || 'Utilisateur inconnu'; // Valeur par défaut
        ctx.fillText(`${username}: ${user.money} pièces`, 50, y);
        y += 30; // Espacer les lignes
    });

    return canvas;
}

// Fonction pour créer un leaderboard en texte
function createTextLeaderboard(userData) {
    const users = Object.entries(userData).sort((a, b) => b[1].money - a[1].money); // Trier par argent

    let leaderboardText = '🏆 **Leaderboard des Utilisateurs** 🏆\n\n';

    users.forEach(([userId, user], index) => {
        const username = user.username || 'Utilisateur inconnu'; // Valeur par défaut
        leaderboardText += `**${index + 1}. ${username}** - ${user.money} pièces\n`;
    });

    return leaderboardText;
}
