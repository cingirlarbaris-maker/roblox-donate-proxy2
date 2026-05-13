const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
    res.send("Donate proxy çalışıyor");
});

app.get("/passes/:userId", async (req, res) => {
    const userId = req.params.userId;
    const debug = {
        userId,
        gamesFound: 0,
        games: [],
        passes: [],
        errors: []
    };

    try {
        const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`;

        const gamesResponse = await fetch(gamesUrl);
        const gamesData = await gamesResponse.json();

        debug.gamesRaw = gamesData;
        debug.gamesFound = gamesData.data ? gamesData.data.length : 0;

        for (const game of gamesData.data || []) {
            const universeId = game.id;

            const gameInfo = {
                name: game.name,
                universeId,
                passResults: []
            };

            const urls = [
                `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`,
                `https://develop.roblox.com/v1/universes/${universeId}/game-passes?limit=100&sortOrder=Asc`,
                `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes?limit=100&passView=Full`
            ];

            for (const url of urls) {
                try {
                    const passResponse = await fetch(url);
                    const passData = await passResponse.json();

                    gameInfo.passResults.push({
                        url,
                        status: passResponse.status,
                        data: passData
                    });

                    const list =
                        passData.data ||
                        passData.gamePasses ||
                        passData.passes ||
                        [];

                    for (const pass of list) {
                        const id = pass.id || pass.gamePassId;
                        const name = pass.name || pass.displayName || "Donate";
                        const price =
                            pass.price ||
                            pass.priceInRobux ||
                            pass.product?.priceInRobux;

                        if (id && price) {
                            debug.passes.push({
                                id,
                                name,
                                price
                            });
                        }
                    }
                } catch (err) {
                    gameInfo.passResults.push({
                        url,
                        error: err.message
                    });
                }
            }

            debug.games.push(gameInfo);
        }

        debug.passes.sort((a, b) => a.price - b.price);

        res.json({
            success: true,
            count: debug.passes.length,
            passes: debug.passes,
            debug
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
            debug
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server çalışıyor. Port:", PORT);
});