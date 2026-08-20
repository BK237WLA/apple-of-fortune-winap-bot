# Apple of Fortune Predict Bot — Render

Bot Telegram en mode webhook, adapté à un Render Web Service.

## Variables
- BOT_TOKEN : nouveau token privé fourni par BotFather
- WEBAPP_URL : https://merry-babka-0d08ea.netlify.app/

## Render
Build Command:
npm install

Start Command:
npm start

Le serveur écoute automatiquement sur process.env.PORT et configure le webhook
avec RENDER_EXTERNAL_URL fourni automatiquement par Render.

Ne mets jamais BOT_TOKEN dans GitHub.
