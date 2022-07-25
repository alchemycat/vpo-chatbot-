const axios = require("axios").default;

require("dotenv").config();

const {
  Telegraf,
  session,
  Scenes: { WizardScene, Stage },
} = require("telegraf");

const bot = new Telegraf(process.env.TOKEN);

const mainScene = new WizardScene(
  "candidate",
  (ctx) => {
    try {
      ctx.reply("Введіть ваше повне ім'я:");
      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      return ctx.scene.reenter();
    }
  },
  (ctx) => {
    try {
      if (ctx.message.text.length > 40) {
        throw new Error("Відповідь не може бути більше 40 символів");
      }

      ctx.wizard.state.name = ctx.message.text;

      ctx.reply("Чи є у вас довідка ВПО?", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Так", callback_data: "Так" },
              { text: "Ні", callback_data: "Ні" },
            ],
          ],
        },
      });
      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    let answer;

    try {
      if (ctx.message) {
        ctx.reply("Чи є у вас довідка ВПО?", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Так", callback_data: "Так" },
                { text: "Ні", callback_data: "Ні" },
              ],
            ],
          },
        });
        return;
      } else {
        answer = ctx.update.callback_query.data;
      }

      if (answer == "Ні") {
        ctx.reply(
          "Нажаль, на цей час ми маємо можливість допомогати тільки сім'ям ВПО"
        );
        ctx.scene.leave();
        return;
      }

      ctx.reply("Будь ласка завантажте копію довідки ВПО (фото)");

      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    try {
      let fileId;
      if (ctx.message.document) {
        fileId = ctx.message.document.file_id;
      }
      if (ctx.message.photo) {
        fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      }
      // ctx.wizard.state.photo = `https://api.telegram.org/file/bot${process.env.TOKEN}/${ctx.message.document.file_name}`;

      ctx.telegram
        .getFile(fileId)
        .then(
          (data) =>
            `https://api.telegram.org/file/bot${process.env.TOKEN}/${data.file_path}`
        )
        .then((url) => {
          ctx.wizard.state.photo = url;
        });
      ctx.reply("Чи є у вас діти віком до 16 років ?", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Так", callback_data: "Так" },
              { text: "Ні", callback_data: "Ні" },
            ],
          ],
        },
      });

      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply("Додайте фото вашої довідки");
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    let answer;
    try {
      if (ctx.message) {
        ctx.reply("Чи є у вас діти віком до 16 років ?", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Так", callback_data: "Так" },
                { text: "Ні", callback_data: "Ні" },
              ],
            ],
          },
        });
        ctx.wizard.selectStep(ctx.wizard.cursor);
        return;
      } else {
        answer = ctx.update.callback_query.data;
      }
      if (answer == "Ні") {
        ctx.reply(
          "Нажаль, на цей час ми маємо можливість допомогати тільки сім'ям з дітьми до 16 років"
        );
        ctx.scene.leave();
        return;
      }

      ctx.reply(
        "Будь ласка скажіть скільки дітей в вашій родині та скільки їм років ?"
      );

      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    try {
      if (ctx.message.text.length > 200) {
        throw new Error("Відповідь не може бути більше 200 символів");
      }
      ctx.wizard.state.childs = ctx.message.text;
      ctx.reply("З якого ви міста або села ?");
      return ctx.wizard.next();
    } catch (e) {
      console.error(e);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    try {
      if (ctx.message.text.length > 40) {
        throw new Error("Відповідь не може бути більше 40 символів");
      }
      ctx.wizard.state.city = ctx.message.text;
      ctx.reply("В якому районі м.Запоріжжя ви знаходитесь ?");
      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    try {
      if (ctx.message.text.length > 40) {
        throw new Error("Відповідь не може бути більше 40 символів");
      }
      ctx.wizard.state.area = ctx.message.text;
      ctx.reply("Яку саме допомогу потребуєте ?");
      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    try {
      if (ctx.message.text.length > 200) {
        throw new Error("Відповідь не може бути більше 200 символів");
      }
      ctx.wizard.state.helpDetails = ctx.message.text;
      ctx.reply("Ваш контактний телефон:", {
        reply_markup: {
          keyboard: [
            [
              {
                text: "Відправити мобільний номер",
                request_contact: true,
              },
            ],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
      return ctx.wizard.next();
    } catch (e) {
      console.error(e.message);
      ctx.reply(e.message);
      ctx.wizard.selectStep(ctx.wizard.cursor);
      return;
    }
  },
  (ctx) => {
    console.log(ctx.message);
    if (ctx.message.contact) {
      ctx.wizard.state.phone = ctx.message.contact.phone_number;

      axios
        .post(process.env.SCRIPT_URL, {
          body: [
            ctx.wizard.state.name,
            ctx.wizard.state.photo,
            ctx.wizard.state.childs,
            ctx.wizard.state.city,
            ctx.wizard.state.area,
            ctx.wizard.state.helpDetails,
            ctx.wizard.state.phone,
          ],
          url: process.env.SPREADSHEET_URL,
        })
        .then((response) => {
          if (response.status == 200) {
            ctx.reply("Ваша анкета додана");
          } else {
            ctx.reply(
              "Виникла помилка при збережені анкети, спробуйте пізніше"
            );
          }
          ctx.scene.leave();
        });
    } else {
      ctx.wizard.selectStep(ctx.wizard.cursor);
    }
  }
);

const stage = new Stage([mainScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
  await ctx.reply(
    "Привіт, надайте будь ласка відповідь на наступні запитання:"
  );
  ctx.scene.enter("candidate");
});

bot.help((ctx) => {
  ctx.reply("Введіть команду /start для заповнення анкети");
});

bot.launch();
