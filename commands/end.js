const fs = require('fs');

let parisData;

// Charger les paris existants si ce n'est pas déjà fait
try {
    parisData = require('../data/paris.json');
} catch (error) {
    parisData = {};  // Initialiser si le fichier n'existe pas encore ou est vide
}

module.exports = {
    name: 'end',
    description: 'Termine un pari et distribue les gains',
    execute(message, args, userData) {
        try {
            // Vérifier si les arguments sont fournis
            if (!args[0]) {
                return message.channel.send("Veuillez fournir l'ID du pari à terminer.");
            }
            if (!args[1]) {
                return message.channel.send("Veuillez fournir le résultat du pari (oui ou non).");
            }

            const pariId = args[0];  // ID du pari
            const resultat = args[1].toLowerCase();  // "oui" ou "non"

            // Vérifier si le pari existe et est actif
            if (!parisData[pariId] || parisData[pariId].status !== 'active') {
                return message.channel.send('Le pari est introuvable ou est déjà terminé.');
            }

            const pari = parisData[pariId];
            let gagnants = [];
            let totalGains = 0;

            // Déterminer les gagnants en fonction du résultat
            if (resultat === 'oui') {
                gagnants = Object.keys(pari.oui);
                totalGains = Object.values(pari.oui).reduce((acc, curr) => acc + curr, 0);
            } else if (resultat === 'non') {
                gagnants = Object.keys(pari.non);
                totalGains = Object.values(pari.non).reduce((acc, curr) => acc + curr, 0);
            } else {
                return message.channel.send('Résultat invalide, utilise "oui" ou "non".');
            }

            // Calculer la part de gains pour chaque gagnant
            const totalPot = pari.totalPot;
            const partageGains = totalPot / totalGains;

            // Distribuer les gains aux gagnants
            gagnants.forEach(gagnantId => {
                const gain = pari[resultat][gagnantId] * partageGains;
                userData[gagnantId].money += gain;
                message.channel.send(`<@${gagnantId}> a gagné ${gain} pièces.`);
            });

            // Marquer le pari comme terminé
            parisData[pariId].status = 'finished';

            message.channel.send(`Le pari **${pari.name}** (ID : ${pariId}) est terminé. Résultat : **${resultat.toUpperCase()}**`);

            // Sauvegarder les données après la fin du pari
            fs.writeFileSync('./data/paris.json', JSON.stringify(parisData, null, 2));
            fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));

        } catch (error) {
            console.error("Erreur dans la commande end:", error);
            message.reply("Une erreur est survenue lors de la fin du pari.");
        }
    }
};
