const express = require("express");
const path = require("path");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");
const P = require("pino");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ===== CONFIG =====
const HEHO_API_KEY = "heho_f1ccc91038e7d090bc3faa23";
const CHATBOT_ID = "1fe470b9-5370-4d08-8060-2a2536d4d196";
// ===================

let sock;
let currentNumber = null;

// 🤖 AI
async function askAI(message) {
    try {
        const res = await axios.post(
            "https://heho.vercel.app/api/aichat",
            {
                chatbotId: CHATBOT_ID,
                messages: [{ role: "user", content: message }]
            },
            {
                headers: {
                    Authorization: `Bearer ${HEHO_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return res.data.reply || "No response";
    } catch {
        return "⚠️ AI error";
    }
}

// 🚀 Initialize Bot
async function initBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["RailwayBot", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ WhatsApp Connected");
        }
        if (connection === "close") {
            console.log("❌ Disconnected");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;

            const sender = msg.key.remoteJid;
            if (!currentNumber || sender !== `${currentNumber}@s.whatsapp.net`) return;

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text;

            if (!text) return;

            const reply = await askAI(text);

            await sock.sendMessage(sender, { text: reply });

        } catch {}
    });
}

initBot();

// 🌐 Web page
app.get("/", (req, res) => {
    res.render("index", { code: null, error: null });
});

// 🌐 Generate pairing code
app.post("/pair", async (req, res) => {
    try {
        const { number } = req.body;
        if (!number) return res.render("index", { code: null, error: "Number required" });

        currentNumber = number;

        const code = await sock.requestPairingCode(number);

        return res.render("index", { code, error: null });
    } catch (err) {
        return res.render("index", { code: null, error: err.message });
    }
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
        );

        return res.data.reply || "No response";
    } catch {
        return "⚠️ AI error";
    }
}

// 🚀 Start socket
async function initBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["RailwayBot", "Chrome", "1.0"],
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;

        if (connection === "open") {
            console.log("✅ WhatsApp Connected");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;

            const sender = msg.key.remoteJid;

            // allow only linked number
            if (!currentNumber || sender !== `${currentNumber}@s.whatsapp.net`) return;

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text;

            if (!text) return;

            const reply = await askAI(text);

            await sock.sendMessage(sender, { text: reply });

        } catch {}
    });
}

initBot();


// 🌐 API: Get pairing code
app.post("/pair", async (req, res) => {
    try {
        const { number } = req.body;

        if (!number) {
            return res.json({ error: "Number required" });
        }

        currentNumber = number;

        const code = await sock.requestPairingCode(number);

        return res.json({
            success: true,
            code: code
        });

    } catch (err) {
        return res.json({
            error: err.message
        });
    }
});

// root
app.get("/", (req, res) => {
    res.send("🚀 WhatsApp HeHo Bot Running");
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));
