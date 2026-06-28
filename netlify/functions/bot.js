const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE = "https://ai-trener-hrk.netlify.app";
const API = `https://api.telegram.org/bot${TOKEN}`;

async function sendMessage(chatId, text, keyboard) {
  const body = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };
  if (keyboard) body.reply_markup = keyboard;
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

const KEYBOARD = {
  inline_keyboard: [
    [{ text: "🎯 Открыть тренажёр", url: SITE }],
    [
      { text: "📋 Сценарии", callback_data: "scenarios" },
      { text: "💳 Тарифы", callback_data: "price" }
    ],
    [{ text: "❓ Помощь", callback_data: "help" }]
  ]
};

const MESSAGES = {
  start: `Привет! 👋

Я помогаю руководителям отрабатывать сложные разговоры — те самые, перед которыми не с кем порепетировать.

<b>Увольнения, конфликты, обратная связь, переговоры о повышении</b> — 34 сценария с живым ИИ-персонажем.

После каждого диалога — разбор от HRD Кристины Плетневой с баллом и точками роста.

<i>5 сценариев бесплатно. Без коучей. Без записи. Прямо сейчас.</i>`,

  scenarios: `📋 <b>34 сценария сложных разговоров</b>

Бесплатно (5 штук):
• «Я ухожу» — разговор об удержании
• Постановка амбициозной задачи
• Провал плана без потери мотивации
• Gen Z: «Мне скучно»
• Финальный разговор: увольнение

В полной версии ещё 29 сценариев:
Дисциплина · Карьера · Найм · Конфликты · Мотивация · Делегирование

Открой тренажёр и попробуй прямо сейчас 👇`,

  price: `💳 <b>Тарифы HRK</b>

<b>Бесплатно</b> — 5 сценариев навсегда

<b>Полный доступ — 990 ₽/мес</b>
• Все 34 сценария
• Разбор по 6 компетенциям
• История сессий

<b>Для команды — 9 900 ₽/мес</b>
• До 10 руководителей
• Общая аналитика

Чтобы получить доступ — напиши @HR_Pletneva`,

  help: `❓ <b>Помощь</b>

<b>Как работает тренажёр?</b>
Выбираешь сценарий → разговариваешь с ИИ-персонажем как руководитель → получаешь разбор с баллом

<b>Какой браузер использовать?</b>
Лучше всего Chrome или Яндекс Браузер. Safari на iPhone тоже работает.

<b>Вопросы и оплата:</b>
Пиши @HR_Pletneva — отвечу лично

<b>Сайт тренажёра:</b>
${SITE}`
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 200, body: "HRK Bot is running" };
  }

  try {
    const update = JSON.parse(event.body);

    // Обработка команд
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text || "";

      if (text.startsWith("/start")) {
        await sendMessage(chatId, MESSAGES.start, KEYBOARD);
      } else if (text.startsWith("/scenarios")) {
        await sendMessage(chatId, MESSAGES.scenarios, KEYBOARD);
      } else if (text.startsWith("/price")) {
        await sendMessage(chatId, MESSAGES.price, KEYBOARD);
      } else if (text.startsWith("/help")) {
        await sendMessage(chatId, MESSAGES.help, KEYBOARD);
      } else {
        // Любое другое сообщение
        await sendMessage(chatId, `Привет! Выбери что тебя интересует 👇`, KEYBOARD);
      }
    }

    // Обработка нажатий на кнопки
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message.chat.id;
      const data = cb.data;

      // Убираем "часики" на кнопке
      await fetch(`${API}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cb.id })
      });

      if (data === "scenarios") {
        await sendMessage(chatId, MESSAGES.scenarios, KEYBOARD);
      } else if (data === "price") {
        await sendMessage(chatId, MESSAGES.price, KEYBOARD);
      } else if (data === "help") {
        await sendMessage(chatId, MESSAGES.help, KEYBOARD);
      }
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("Bot error:", err);
    return { statusCode: 200, body: "ok" };
  }
};
