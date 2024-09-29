module.exports = {
    name: 'claim',
    description: 'Permet de réclamer des pièces toutes les 5 minutes',
    execute(message, args, userData) {
        const userId = message.author.id;
        const currentTime = Date.now();
        const claimCooldown = 3600000;  // 60 minutes en millisecondes

        if (!userData[userId]) {
            userData[userId] = { money: 1000, lastClaim: 0,username:  message.author.username };
        }

        if (currentTime - userData[userId].lastClaim >= claimCooldown) {
            userData[userId].money += 200;
            userData[userId].lastClaim = currentTime;
            message.channel.send(`${message.author.username}, tu as produit 200 point de malveillance tu as désormais ${userData[userId].money} de malveillance.`);
        } else {
            const timeLeft = ((claimCooldown - (currentTime - userData[userId].lastClaim)) / 1000 / 60).toFixed(2);
            message.channel.send(`${message.author.username}, tu dois encore attendre ${timeLeft} minutes.`);
        }
    }
};
