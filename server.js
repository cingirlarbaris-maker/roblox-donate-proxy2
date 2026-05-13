const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
    res.send("Proxy çalışıyor");
});

app.get("/passes/:userId", async (req, res) => {
    const userId = req.params.userId;

    try {
        const gamesResponse = await fetch(
            `https://games.roblox.com/v2/users/${userId}/games?accessFilter=Public&limit=50`
        );

        const gamesData = await gamesResponse.json();

        let allPasses = [];

        for (const game of gamesData.data || []) {
            const universeId = game.id;

            const passesResponse = await fetch(
                `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`
            );

            const passesData = await passesResponse.json();

            for (const pass of passesData.data || []) {
                if (pass.price && pass.id) {
                    allPasses.push({
                        id: pass.id,
                        name: pass.name,
                        price: pass.price
                    });
                }
            }
        }

        allPasses.sort((a, b) => a.price - b.price);

        res.json({
            success: true,
            passes: allPasses
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server çalışıyor");
});