module.exports = {
    name: 'commands',
    description: 'Affiche la liste des commandes et leurs descriptions',
    execute(message) {
        const helpMessage = `
**Commandes disponibles :**

1. **!balance** - Affiche ton solde actuel de pièces.
   - *Exemple* : \`!balance\`

2. **!claim** - Récupère des pièces gratuites toutes les X minutes.
   - *Exemple* : \`!claim\`

3. **!bet create (nom du pari)** - Crée un nouveau pari.
   - *Exemple* : \`!bet create Faroucheur perds sa game ?\`

4. **!bet (oui/non) (id du pari) (montant)** - Parie sur "oui" ou "non" avec un certain montant pour un pari existant.
   - *Exemple* : \`!bet oui 1 50\`

5. **!end (id du pari) (oui/non)** - Termine le pari avec le résultat ("oui" ou "non") et distribue les gains aux gagnants.
   - *Exemple* : \`!end 1 oui\`

6. **!commands** - Affiche cette aide.

---

Pour plus de détails sur une commande spécifique, n'hésite pas à demander ! 
        `;

        // Envoyer le message d'aide
        message.channel.send(helpMessage);
    }
};
