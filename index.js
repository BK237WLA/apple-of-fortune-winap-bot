const http = require("http");
const crypto = require("crypto");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://merry-babka-0d08ea.netlify.app/";
const REGISTER_URL = new URL("register.html", WEBAPP_URL).toString();
const PORT = Number(process.env.PORT || 10000);
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;

if (!BOT_TOKEN) {
  console.error("Erreur: BOT_TOKEN est obligatoire.");
  process.exit(1);
}

if (!WEBAPP_URL.startsWith("https://")) {
  console.error("Erreur: WEBAPP_URL doit commencer par https://");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const WEBHOOK_SECRET = crypto
  .createHash("sha256")
  .update(BOT_TOKEN)
  .digest("hex")
  .slice(0, 48);

const WELCOME_MESSAGE = `🍎🔥 <b>APPLE OF FORTUNE PREDICT — TON PARCOURS EN 1 CLIC !</b>

Tu joues à <b>Apple of Fortune</b> ? 🍏
Découvre notre bot Telegram <b>APPLE OF FORTUNE WINAP BOT</b> pour générer rapidement un parcours sur les <b>10 niveaux</b>.

⚡ <b>Comment ça marche ?</b>

🍎 Clique sur <b>PREDICT</b>
🎯 Obtiens instantanément un parcours sur les <b>10 niveaux</b>
✅ Une pomme sélectionnée par niveau
📱 Utilisable directement sur téléphone via Telegram
🔄 Génère un nouveau parcours quand tu le souhaites

🚨 <b>CONDITION IMPORTANTE — CODE PROMO WINAP</b>

Pour profiter pleinement de nos offres partenaires, bonus d’inscription et avantages promotionnels, ton compte doit être créé avec le <b>code promo WINAP</b>.

✅ Inscription avec <b>WINAP</b>
✅ Accès aux bonus et offres associés
✅ Accès à notre communauté et à nos contenus Apple of Fortune Predict

⚠️ Si ton compte est créé sans utiliser <b>WINAP</b>, les avantages liés à cette promotion peuvent ne pas être disponibles.

🎁 <b>CODE PROMO EXCLUSIF : WINAP</b>

🔵 <b>1XBET</b>
📲 https://reffpa.com/L?tag=d_3357974m_97c_&site=3357974&ad=97
👉 Code promo : <b>WINAP</b>

🟢 <b>BETWINNER</b>
📲 https://bwredir.com/2sIB
👉 Code promo : <b>WINAP</b>

🎯 <b>MEGAPARI</b>
📲 https://refpazitag.top/L?tag=d_3442168m_25437c_&site=3442168&ad=25437&r=registration
👉 Code promo : <b>WINAP</b>

⚡ <b>MELBET</b>
📲 https://refpa3665.com/L?tag=d_3357985m_45415c_&site=3357985&ad=45415
👉 Code promo : <b>WINAP</b>

🔥 <b>RÈGLE À RETENIR :</b> inscris-toi via nos liens et renseigne <b>WINAP</b> lors de la création de ton compte pour bénéficier des avantages associés à notre offre.

`;

async function telegram(method, payload = {}) {
  const response = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`${method}: ${data.description || "Erreur Telegram"}`);
  }

  return data.result;
}

async function sendWelcome(chatId) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text: WELCOME_MESSAGE,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🍎 OUVRIR PREDICT",
            web_app: { url: WEBAPP_URL },
          },
        ],
        [
          {
            text: "📝 S’INSCRIRE",
            web_app: { url: REGISTER_URL },
          },
        ],
        [
          {
            text: "🔵 1XBET",
            url: "https://reffpa.com/L?tag=d_3357974m_97c_&site=3357974&ad=97",
          },
          {
            text: "🟢 BETWINNER",
            url: "https://bwredir.com/2sIB",
          },
        ],
        [
          {
            text: "🎯 MEGAPARI",
            url: "https://refpazitag.top/L?tag=d_3442168m_25437c_&site=3442168&ad=25437&r=registration",
          },
          {
            text: "⚡ MELBET",
            url: "https://refpa3665.com/L?tag=d_3357985m_45415c_&site=3357985&ad=45415",
          },
        ],
      ],
    },
  });
}

async function handleUpdate(update) {
  const msg = update && update.message;
  if (!msg || !msg.chat) return;

  const text = (msg.text || "").trim();

  if (
    text === "/start" ||
    text === "/predict" ||
    text === "/app" ||
    text.toLowerCase() === "predict"
  ) {
    await sendWelcome(msg.chat.id);
  }
}

async function configureTelegram() {
  if (!RENDER_EXTERNAL_URL) {
    console.log("RENDER_EXTERNAL_URL absent. Le webhook sera configuré automatiquement sur Render.");
    return;
  }

  const webhookUrl = `${RENDER_EXTERNAL_URL.replace(/\/$/, "")}/telegram-webhook`;

  await telegram("setWebhook", {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });

  await telegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "📝 S’INSCRIRE",
      web_app: { url: REGISTER_URL }
    }
  });

  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Afficher l'accueil" },
      { command: "predict", description: "Ouvrir Apple of Fortune Predict" },
    ],
  });

  console.log("Webhook Telegram configuré :", webhookUrl);
  console.log("Mini App :", WEBAPP_URL);
}

const server = http.createServer(async (req, res) => {
  // Health page
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Apple of Fortune Predict Bot is running ✅");
    return;
  }

  // Telegram webhook
  if (req.method === "POST" && req.url === "/telegram-webhook") {
    const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];

    if (receivedSecret !== WEBHOOK_SECRET) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });

    req.on("end", async () => {
      try {
        const update = JSON.parse(body);
        await handleUpdate(update);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      } catch (err) {
        console.error("Webhook error:", err.message);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      }
    });

    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, "0.0.0.0", async () => {
  console.log(`Serveur démarré sur 0.0.0.0:${PORT}`);

  try {
    await configureTelegram();
  } catch (err) {
    console.error("Configuration Telegram:", err.message);
  }
});
