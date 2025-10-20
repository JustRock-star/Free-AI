const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

admin.initializeApp();

const TELEGRAM_CHAT_ID = functions.config().telegram.chat_id;
const TELEGRAM_TOKEN = functions.config().telegram.token;

exports.notifyTelegramOnMessage = functions.firestore
  .document('conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    if(!data) return;
    // Если это системный typing или from === ai, можно пропустить
    if(data.from === 'ai' || data.from === 'typing') return;
    const convId = context.params.convId;
    const name = data.name || 'User';
    const text = data.text || '';
    const message = `Новый запрос от ${name} (conv ${convId}):\n${text}`;
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    try {
      await fetch(url, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({chat_id: TELEGRAM_CHAT_ID, text: message})
      });
    } catch(e){
      console.error('Telegram send failed', e);
    }
});
