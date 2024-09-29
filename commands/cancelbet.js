const fs = require('fs');
let parisData = require('../data/paris.json');  // Charger les paris existants
let userData = require('../data/users.json');    // Charger les utilisateurs existants

module.exports = {
    name: 'cancelbet',
    description: 'Annule un pari et rembourse les participants',
    async execute(message, args) {
        const pariId = args[0]; // ID du pari à annuler

        if (!pariId) {
            return message.channel.send('Veuillez fournir un ID de pari à annuler.');
        }

        // Vérifier si le pari existe
        if (!parisData[pariId]) {
            return message.channel.send('Le pari est introuvable.');
        }

        // Rembourser les participants
        const totalOui = Object.values(parisData[pariId].oui || {}).reduce((a, b) => a + b, 0);
        const totalNon = Object.values(parisData[pariId].non || {}).reduce((a, b) => a + b, 0);

        // Rembourser les utilisateurs qui ont parié "oui"
        for (const [userId, montant] of Object.entries(parisData[pariId].oui || {})) {
            userData[userId].money += montant; // Ajouter le montant parié au solde de l'utilisateur
        }

        // Rembourser les utilisateurs qui ont parié "non"
        for (const [userId, montant] of Object.entries(parisData[pariId].non || {})) {
            userData[userId].money += montant; // Ajouter le montant parié au solde de l'utilisateur
        }

        // Supprimer le pari des données
        delete parisData[pariId];
        await message.channel.send(`Le pari ID: ${pariId} a été annulé et les participants ont été remboursés.`);

        // Sauvegarder les données après annulation
        fs.writeFileSync('./data/paris.json', JSON.stringify(parisData, null, 2));
        fs.writeFileSync('./data/users.json', JSON.stringify(userData, null, 2));
    }
};
