const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL =
  process.env.WEBAPP_URL || "https://merry-babka-0d08ea.netlify.app/";
const REGISTER_URL = new URL("register.html", WEBAPP_URL).toString();
const PORT = Number(process.env.PORT || 10000);
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
const VIDEO_PATH = path.join(__dirname, "guide-inscription.mp4");

if (!BOT_TOKEN) {
  console.error("Erreur : BOT_TOKEN est obligatoire.");
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

🎥 <b>NOUVEAU SUR LE BOT ?</b>
Utilise le bouton <b>GUIDE D’INSCRIPTION</b> ci-dessous pour regarder la vidéo explicative.

🚨 <b>CONDITION IMPORTANTE — CODE PROMO WINAP</b>

Pour profiter des offres partenaires, bonus d’inscription et avantages promotionnels associés, crée ton compte avec le <b>code promo WINAP</b>.

🎁 <b>CODE PROMO : WINAP</b>
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
            text: "🎥 GUIDE D’INSCRIPTION",
            callback_data: "guide_signup",
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

async function sendRegistration(chatId) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text:
      "📝 <b>INSCRIPTION PARTENAIRE</b>\n\n" +
      "Choisis ton bookmaker partenaire ci-dessous.\n" +
      "🎁 Code promo : <b>WINAP</b>",
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📝 OUVRIR LA PAGE D’INSCRIPTION",
            web_app: { url: REGISTER_URL },
          },
        ],
      ],
    },
  });
}

async function sendGuideVideo(chatId) {
  if (!fs.existsSync(VIDEO_PATH)) {
    throw new Error("Le fichier guide-inscription.mp4 est introuvable.");
  }

  const buffer = fs.readFileSync(VIDEO_PATH);
  const form = new FormData();

  form.append("chat_id", String(chatId));
  form.append(
    "video",
    new Blob([buffer], { type: "video/mp4" }),
    "guide-inscription.mp4"
  );
  form.append("supports_streaming", "true");
  form.append(
    "caption",
    "🎥 <b>GUIDE D’INSCRIPTION</b>\n\n" +
      "Regarde cette vidéo pour suivre les étapes d’inscription.\n\n" +
      "🎁 Code promo : <b>WINAP</b>"
  );
  form.append("parse_mode", "HTML");
  form.append(
    "reply_markup",
    JSON.stringify({
      inline_keyboard: [
        [
          {
            text: "📝 S’INSCRIRE MAINTENANT",
            web_app: { url: REGISTER_URL },
          },
        ],
      ],
    })
  );

  const response = await fetch(`${API}/sendVideo`, {
    method: "POST",
    body: form,
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`sendVideo: ${data.description || "Erreur Telegram"}`);
  }

  return data.result;
}

async function handleUpdate(update) {
  if (update.callback_query) {
    const callback = update.callback_query;

    try {
      await telegram("answerCallbackQuery", {
        callback_query_id: callback.id,
      });

      if (
        callback.data === "guide_signup" &&
        callback.message &&
        callback.message.chat
      ) {
        await sendGuideVideo(callback.message.chat.id);
      }
    } catch (err) {
      console.error("Callback error:", err.message);
    }

    return;
  }

  const msg = update.message;

  if (!msg || !msg.chat) return;

  const text = (msg.text || "").trim().toLowerCase();

  if (text === "/start") {
    await sendWelcome(msg.chat.id);
  } else if (text === "/guide") {
    await sendGuideVideo(msg.chat.id);
  } else if (text === "/inscription") {
    await sendRegistration(msg.chat.id);
  } else if (
    text === "/predict" ||
    text === "/app" ||
    text === "predict"
  ) {
    await sendWelcome(msg.chat.id);
  }
}

async function configureTelegram() {
  if (!RENDER_EXTERNAL_URL) {
    console.log(
      "RENDER_EXTERNAL_URL absent. Le webhook sera configuré automatiquement sur Render."
    );
    return;
  }

  const webhookUrl =
    `${RENDER_EXTERNAL_URL.replace(/\/$/, "")}/telegram-webhook`;

  await telegram("setWebhook", {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });

  // Permanent Telegram menu button = registration page.
  await telegram("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "📝 S’INSCRIRE",
      web_app: { url: REGISTER_URL },
    },
  });

  await telegram("setMyCommands", {
    commands: [
      { command: "start", description: "Afficher l’accueil" },
      { command: "predict", description: "Ouvrir Apple of Fortune Predict" },
      { command: "inscription", description: "S’inscrire" },
      { command: "guide", description: "Voir le guide vidéo d’inscription" },
    ],
  });

  console.log("Webhook Telegram configuré :", webhookUrl);
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    res.end("Apple of Fortune Predict Bot is running ✅");
    return;
  }

  if (req.method === "POST" && req.url === "/telegram-webhook") {
    const receivedSecret =
      req.headers["x-telegram-bot-api-secret-token"];

    if (receivedSecret !== WEBHOOK_SECRET) {
      res.writeHead(403, { "Content-Type": "text/plain" });
      res.end("Forbidden");
      return;
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk;

      if (body.length > 1_000_000) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const update = JSON.parse(body);
        await handleUpdate(update);
      } catch (err) {
        console.error("Webhook error:", err.message);
      }

      // Always acknowledge Telegram quickly.
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK");
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
