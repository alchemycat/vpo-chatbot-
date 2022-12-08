const axios = require('axios').default;

require('dotenv').config();

const {
    Telegraf,
    session,
    Scenes: { WizardScene, Stage },
} = require('telegraf');

const bot = new Telegraf(process.env.TOKEN);

console.log('Бот працює...');

const firstScene = new WizardScene(
    'first',
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
            console.log(`Ім'я: ${JSON.stringify(ctx.message.text)}`);

            if (!ctx.message.text || ctx.message.text.length > 40) {
                throw new Error('Відповідь не може бути більше 40 символів');
            }

            ctx.wizard.state.name = ctx.message.text;

            ctx.reply('Чи є у вас довідка ВПО?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Так', callback_data: 'Так' },
                            { text: 'Ні', callback_data: 'Ні' },
                        ],
                    ],
                },
            });
            return ctx.wizard.next();
        } catch (e) {
            console.error(e.message);
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    },
    (ctx) => {
        let answer;
        try {
            if (ctx.message) {
                throw new Error('Відповідь у неправильному форматі');
            } else {
                answer = ctx.update.callback_query.data;
            }

            if (answer == 'Ні') {
                ctx.reply(
                    "Нажаль, на цей час ми маємо можливість допомогати тільки сім'ям ВПО"
                );

                ctx.scene.leave();
                return;
            }

            console.log(
                `Чи є довідка впо: ${JSON.stringify(
                    ctx.update.callback_query.data
                )}`
            );

            ctx.reply(
                'Будь ласка завантажте копію довідки ВПО (фото, до 20 мегабайт)'
            );

            return ctx.wizard.next();
        } catch (e) {
            console.error(e.message);
            ctx.reply('Виберіть так або ні');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    },
    async (ctx) => {
        try {
            let fileId;
            if (ctx.message.document) {
                fileId = ctx.message.document.file_id;
            }
            if (ctx.message.photo) {
                fileId =
                    ctx.message.photo[ctx.message.photo.length - 1].file_id;
            }

            if (!fileId) {
                throw new Error('Додайте фото');
            }

            await ctx.telegram
                .getFile(fileId)
                .then(
                    (data) =>
                        `https://api.telegram.org/file/bot${process.env.TOKEN}/${data.file_path}`
                )
                .then((url) => {
                    ctx.wizard.state.photo = url;
                });

            // console.log(state);
            ctx.scene.leave();
            ctx.scene.enter('second', ctx.wizard.state);
        } catch (e) {
            console.log(e);
            ctx.reply('Помилка, відправте файл до 20 мегабайт.');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    }
);

const secondScene = new WizardScene(
    'second',
    (ctx) => {
        try {
            ctx.reply('Чи є у вас діти віком до 14 років ?', {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Так', callback_data: 'Так' },
                            { text: 'Ні', callback_data: 'Ні' },
                        ],
                    ],
                },
            });
            return ctx.wizard.next();
        } catch (err) {
            console.log(err);
            return ctx.scene.reenter();
        }
    },
    (ctx) => {
        try {
            let answer;

            if (ctx.message) {
                throw new Error('Відповідь у неправильному форматі');
            } else {
                answer = ctx.update.callback_query.data;
            }

            if (answer == 'Ні') {
                ctx.reply(
                    'Нажаль, на цей час ми маємо можливість організувати розважальну програму для дітей до 14 років'
                );
                ctx.scene.leave();
                return;
            }

            ctx.reply(
                'Будь ласка скажіть скільки дітей в вашій родині та скільки їм років ?'
            );
            return ctx.wizard.next();
        } catch (e) {
            console.error(e.message);
            ctx.reply('Виберіть так або ні');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    },
    (ctx) => {
        try {
            console.log(`Інфо про дітей: ${JSON.stringify(ctx.message.text)}`);
            if (!ctx.message.text || ctx.message.text.length > 200) {
                throw new Error('Відповідь не може бути більше 200 символів');
            }

            ctx.wizard.state.childs = ctx.message.text;

            if (!ctx.wizard.state.childs) {
                throw new Error();
            }

            ctx.reply(
                'Скільки фото ви хочете завантажити, копії довідки ВПО або свідотцтво про народження ваших дітей (вкажіть цифру від 1 до 3) '
            );
            return ctx.wizard.next();
        } catch (e) {
            console.error(e);
            ctx.reply(
                'Будь ласка скажіть скільки дітей в вашій родині та скільки їм років ?'
            );
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    },
    (ctx) => {
        try {
            if (!ctx.message.text) {
                throw new Error();
            }
            if (
                ctx.message.text.length > 1 ||
                !/(1|2|3)/.test(ctx.message.text)
            ) {
                throw new Error();
            }

            ctx.wizard.state.photoCount = ctx.message.text;
            ctx.reply(
                'Будь ласка завантажте копії довідки ВПО або свідотцтво про народження ваших дітей (потрібно додати ту кількість фото яку ви вказали (кожен файл або фото не повинен перевищувати 20 мегабайт))'
            );
            return ctx.wizard.next();
        } catch (e) {
            ctx.reply('Вкажіть цифру від 1-го до 3-х');
            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }
    },
    async (ctx) => {
        try {
            let fileId;
            if (ctx.message.document) {
                fileId = ctx.message.document.file_id;
            }
            if (ctx.message.photo) {
                fileId =
                    ctx.message.photo[ctx.message.photo.length - 1].file_id;
            }

            if (!fileId) {
                throw new Error('Додайте фото');
            }

            let data = await ctx.telegram.getFile(fileId);
            let url = `https://api.telegram.org/file/bot${process.env.TOKEN}/${data.file_path}`;
            if (!url) {
                throw new Error();
            }
            ctx.wizard.state.childsPhoto.push(url);
            console.log(`Photo count: ${ctx.wizard.state.photoCount}`);
            console.log(
                `Photos length: ${ctx.wizard.state.childsPhoto.length}`
            );

            if (
                ctx.wizard.state.photoCount ==
                ctx.wizard.state.childsPhoto.length
            ) {
                ctx.scene.leave();
                ctx.scene.enter('third', ctx.wizard.state);
            }
        } catch (e) {
            console.error(e.message);
            ctx.reply('Додайте фото довідки');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    }
);

const thirdScene = new WizardScene(
    'third',
    (ctx) => {
        ctx.reply('З якого ви міста або села ?');
        return ctx.wizard.next();
    },
    (ctx) => {
        try {
            if (!ctx.message.text || ctx.message.text.length > 40) {
                throw new Error('Відповідь не може бути більше 40 символів');
            }

            ctx.wizard.state.city = ctx.message.text;

            if (!ctx.wizard.state.city) {
                throw new Error();
            }

            ctx.reply('В якому районі м.Запоріжжя ви знаходитесь ?');
            return ctx.wizard.next();
        } catch (e) {
            console.error(e.message);
            ctx.reply('Вкажіть назву міста або села');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    },
    (ctx) => {
        try {
            console.log(`Район міста: ${JSON.stringify(ctx.message.text)}`);

            if (!ctx.message.text || ctx.message.text.length > 40) {
                throw new Error('Відповідь не може бути більше 40 символів');
            }

            ctx.wizard.state.area = ctx.message.text;

            if (!ctx.wizard.state.area) {
                throw new Error();
            }

            //         ctx.reply('Яку саме допомогу потребуєте ?');
            //         return ctx.wizard.next();
            //     } catch (e) {
            //         console.error(e.message);

            //         ctx.wizard.selectStep(ctx.wizard.cursor);
            //         return;
            //     }
            // },
            // (ctx) => {
            //     try {
            //         console.log(
            //             `Яка саме допомога потрібна: ${JSON.stringify(
            //                 ctx.message.text
            //             )}`
            //         );
            //         if (!ctx.message.text || ctx.message.text.length > 200) {
            //             throw new Error('Відповідь не може бути більше 200 символів');
            //         }

            //         ctx.wizard.state.helpDetails = ctx.message.text;

            //         if (!ctx.wizard.state.helpDetails) {
            //             throw new Error();
            //         }

            ctx.reply('Ваш контактний телефон:', {
                reply_markup: {
                    keyboard: [
                        [
                            {
                                text: 'Відправити мобільний номер',
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

            ctx.reply('Вкажіть правильний район міста');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    },
    (ctx) => {
        try {
            if (ctx.message.contact) {
                ctx.wizard.state.phone = ctx.message.contact.phone_number;
            }
            if (ctx.message.text) {
                ctx.wizard.state.phone = ctx.message.text;
            }

            if (!ctx.wizard.state.phone) {
                throw new Error();
            }
            console.log(`Телефон: ${JSON.stringify(ctx.wizard.state.phone)}`);
            ctx.reply('Ваші дані додаються зачекайте');
            axios
                .post(process.env.SCRIPT_URL, {
                    body: [
                        ctx.wizard.state.name,
                        ctx.wizard.state.photo,
                        ctx.wizard.state.childs,
                        ctx.wizard.state.childsPhoto.join('\n'),
                        ctx.wizard.state.city,
                        ctx.wizard.state.area,
                        ctx.wizard.state.helpDetails,
                        ctx.wizard.state.phone,
                    ],
                    url: process.env.SPREADSHEET_URL,
                })
                .then((response) => {
                    if (response.status == 200) {
                        ctx.reply('Ваша анкета додана');
                    } else {
                        ctx.reply(
                            'Виникла помилка при збережені анкети, спробуйте пізніше'
                        );
                    }
                    ctx.scene.leave();
                })
                .catch((err) => {
                    ctx.reply(
                        'Виникла помилка при збережені анкети, спробуйте пізніше'
                    );
                    console.log(err);
                });
        } catch (e) {
            console.error(e.message);
            ctx.reply('Вкажіть телефон');
            ctx.wizard.selectStep(ctx.wizard.cursor);
            return;
        }
    }
);

const stage = new Stage([firstScene, secondScene, thirdScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(async (ctx) => {
    await ctx.reply(
        'Привіт, організувуємо розважальну програму для дітей в передноворічні свята. Щоб ми добавили вашу дитину в список, надайте будь ласка відповідь на наступні запитання:'
    );
    ctx.scene.enter('first', { photo: null, childsPhoto: [] });
});

bot.help((ctx) => {
    ctx.reply('Введіть команду /start для заповнення анкети');
});

bot.launch();
