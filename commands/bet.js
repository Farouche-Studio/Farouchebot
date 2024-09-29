const fs = require('fs');
const { createCanvas } = require('canvas');

let parisData = require('../data/paris.json');  // Charger les paris existants
let userData = require('../data/users.json');  // Charger les données des utilisateurs

const leaderboard = require('./leaderboard'); // Importer le leaderboard

module.exports = {
    name: 'bet',
    description: 'Lance un pari ou parie sur un pari actif',
    async execute(message, args) {
        const userId = message.author.id;

        if (!args || args.length === 0) {
            return message.channel.send("Veuillez fournir une action pour le pari. Utilisez !bet create (nom du pari) ou !bet (oui/non) (id du pari) (montant) ou !bet status (id).");
        }
        const action = args[0].toLowerCase();

        // Si l'utilisateur veut voir l'état d'un pari
        if (action === 'status') {
            const pariId = args[1];

            if (!parisData[pariId]) {
                return message.channel.send('Le pari est introuvable.');
            }

            // Créer l'image du canvas
            const canvas = await createCanvasImage(pariId);
            const attachment = { files: [canvas.toBuffer()] };
            await message.channel.send(attachment);
            return; // Fin de l'exécution de la commande ici
        }

        if (action === 'leaderboard') {
            return leaderboard.execute(message); // Appeler la commande leaderboard
        }

        // Si l'utilisateur veut créer un pari
        if (action === 'create') {
            const pariName = args.slice(1).join(' ');  // Nom du pari
            const pariId = Object.keys(parisData).length + 1;  // ID unique pour le pari

            parisData[pariId] = {
                name: pariName,
                oui: {},
                non: {},
                totalPot: 0,
                status: "active"
            };

            const confirmationMessage = await message.channel.send(`Pari créé avec succès : **${pariName}** (ID : ${pariId})`);

            // Ajouter les réactions
            await confirmationMessage.react('✅'); // Emoji validé
            await confirmationMessage.react('❌'); // Emoji croix

            // Créer un collector pour écouter les réactions
            const filter = (reaction, user) => {
                return ['✅', '❌'].includes(reaction.emoji.name) && !user.bot;
            };

            const collector = confirmationMessage.createReactionCollector({ filter, time: 60000 }); // 60 secondes de délai

            collector.on('collect', async (reaction, user) => {
                // Vérifier si le pari existe avant de procéder
                if (!parisData[pariId]) {
                    return message.channel.send(`Le pari avec l'ID ${pariId} n'existe plus.`);
                }

                const pari = parisData[pariId];
                const choice = reaction.emoji.name === '✅' ? 'oui' : 'non';
                const oppositeChoice = choice === 'oui' ? 'non' : 'oui';

                // Vérifier si l'utilisateur a déjà parié sur ce pari
                if (pari[oppositeChoice][user.id]) {
                    // Si l'utilisateur a déjà parié sur l'autre choix, infliger une pénalité
                    userData[user.id].money -= 100;
                    await message.channel.send(`<@${user.id}>, tu as changé ton choix et perdu 100 pièces de malveillance.`);

                    // Supprimer le pari initial de l'utilisateur dans l'autre choix
                    pari[oppositeChoice][user.id] = 0;
                }

                // Demander le montant à parier
                const montant = await askForAmount(message, user);

                if (montant) {
                    // Vérifier si l'utilisateur a assez d'argent
                    if (!userData[user.id] || userData[user.id].money < montant) {
                        return message.channel.send(`<@${user.id}>, tu n’as pas assez de malveillance pour parier !`);
                    }

                    // Appeler la logique de pari
                    handleBet(message, user.id, pariId, montant, choice, user.username);
                }
            });

            collector.on('end', async collected => {
                console.log(`Collection des réactions terminée. ${collected.size} réactions collectées.`);

                if (!parisData[pariId]) {
                    return message.channel.send(`Le pari avec l'ID ${pariId} n'existe plus, donc nous ne pouvons pas afficher les résultats.`);
                }

                await message.channel.send(`Délai terminé pour le pari **${pariName}**. Voici les résultats :`);

                const canvas = await createCanvasImage(pariId);
                const attachment = { files: [canvas.toBuffer()] };
                await message.channel.send(attachment);

                // Sauvegarder les données après la distribution des gains
                fs.writeFileSync('./data/paris.json', JSON.stringify(parisData, null, 2));
                fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
            });

            // Sauvegarder les paris après la création du pari
            fs.writeFileSync('./data/paris.json', JSON.stringify(parisData, null, 2));

        } else if (action === 'oui' || action === 'non') {
            const pariId = args[1];  // ID du pari
            const montant = parseInt(args[2]);

            if (!parisData[pariId] || parisData[pariId].status !== 'active') {
                return message.channel.send('Le pari est introuvable ou est déjà terminé.');
            }

            // Vérifier si l'utilisateur a assez d'argent
            if (!userData[userId] || userData[userId].money < montant) {
                return message.channel.send('Tu n’as pas assez de malveillance pour parier.');
            }

            handleBet(message, userId, pariId, montant, action, message.author.username);
        } else {
            message.channel.send("Utilise !bet create (nom du pari) ou !bet (oui/non) (id du pari) (montant) ou !bet status (id)");
        }
    }
};

// Fonction pour gérer le pari
function handleBet(message, userId, pariId, montant, action, username) {
    if (action === 'oui') {
        if (!parisData[pariId].oui[userId]) parisData[pariId].oui[userId] = 0;
        parisData[pariId].oui[userId] += montant;
    } else {
        if (!parisData[pariId].non[userId]) parisData[pariId].non[userId] = 0;
        parisData[pariId].non[userId] += montant;
    }

    // Débiter l'utilisateur de son solde
    userData[userId].money -= montant; // Mettre à jour le solde de l'utilisateur

    parisData[pariId].totalPot += montant; // Mettre à jour le pot total

    message.channel.send(`${username} a parié ${montant} de malveillance sur ${action}.`);

    // Sauvegarder les données mises à jour
    fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
    fs.writeFileSync('./data/paris.json', JSON.stringify(parisData, null, 2));
}

// Fonction pour dessiner le canvas
async function createCanvasImage(pariId) {
    if (!parisData[pariId]) {
        throw new Error(`Le pari avec l'ID ${pariId} n'existe pas.`);
    }

    const canvas = createCanvas(800, 400); // Dimension du canvas
    const ctx = canvas.getContext('2d');

    const totalOui = Object.values(parisData[pariId].oui || {}).reduce((a, b) => a + b, 0);
    const totalNon = Object.values(parisData[pariId].non || {}).reduce((a, b) => a + b, 0);
    const totalPot = totalOui + totalNon;

    const pariName = parisData[pariId].name;

    const coteOui = totalOui > 0 ? (totalPot / totalOui).toFixed(2) : 0;
    const coteNon = totalNon > 0 ? (totalPot / totalNon).toFixed(2) : 0;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`Montants Pariés pour le Pari ID: ${pariId}`, 50, 50);

    ctx.font = 'italic 20px sans-serif'; 
    ctx.fillText(`Nom du Pari: ${pariName}`, 50, 90);

    const totalBarWidth = 700;
    const ouiWidth = totalPot > 0 ? (totalOui / totalPot) * totalBarWidth : 0;
    const nonWidth = totalPot > 0 ? (totalNon / totalPot) * totalBarWidth : 0;

    ctx.fillStyle = '#f44336'; // Couleur pour "Non"
    ctx.fillRect(50, 100, nonWidth, 50);

    ctx.fillStyle = '#4caf50'; // Couleur pour "Oui"
    ctx.fillRect(50 + nonWidth, 100, ouiWidth, 50);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px sans-serif';

    const nonLabel = `Non: ${totalNon} pièces`;
    const ouiLabel = `Oui: ${totalOui} pièces`;
    const coteOuiLabel = `Cote Oui: ${coteOui}`;
    const coteNonLabel = `Cote Non: ${coteNon}`;

    ctx.fillText(nonLabel, 50, 180);
    ctx.fillText(ouiLabel, 400, 180);
    ctx.fillText(coteNonLabel, 50, 220);
    ctx.fillText(coteOuiLabel, 400, 220);

    return canvas;
}

// Fonction pour demander le montant
async function askForAmount(message, user) {
    const promptMessage = await message.channel.send(`${user.username}, combien veux-tu parier ? Réponds avec un nombre.`);

    const filter = response => {
        return response.author.id === user.id && !isNaN(response.content);
    };

    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] }).catch(() => null);

    promptMessage.delete();

    if (!collected || collected.size === 0) {
        await message.channel.send(`${user.username}, tu n'as pas répondu à temps.`);
        return null;
    }

    const montant = parseInt(collected.first().content);
    if (isNaN(montant) || montant <= 0) {
        await message.channel.send(`${user.username}, le montant doit être un nombre valide supérieur à 0.`);
        return null;
    }
    collected.first().delete();  // Supprimer la réponse de l'utilisateur
    return montant;
}

// Fonction pour distribuer les gains
function distributeWinnings(pariId) {
    const pari = parisData[pariId];

    if (!pari) {
        throw new Error(`Le pari avec l'ID ${pariId} n'existe pas.`);
    }

    const totalOui = Object.values(pari.oui).reduce((a, b) => a + b, 0);
    const totalNon = Object.values(pari.non).reduce((a, b) => a + b, 0);
    const totalPot = totalOui + totalNon;

    const gagnants = totalOui > totalNon ? pari.oui : pari.non;
    const totalGagnant = totalOui > totalNon ? totalOui : totalNon;

    if (Object.keys(gagnants).length === 0) {
        return; // Pas de gagnants, donc rien à distribuer
    }

    for (let userId in gagnants) {
        const part = gagnants[userId] / totalGagnant; // Part de chaque gagnant
        const gain = Math.floor(part * totalPot); // Répartition du pot total

        userData[userId].money += gain;
    }

    // Marquer le pari comme terminé
    pari.status = "finished";
}
