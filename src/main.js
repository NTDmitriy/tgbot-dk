import { Telegraf, session } from 'telegraf'
// import { initCommand, processTextToChat, INITIAL_SESSION } from './logic.js'
import { message  } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

const bot = new Telegraf(config.get('TG_TOKEN'))

console.log(config.get('TEST_ENV'))

const INITIAL_SESSION = {
  messages: [],
}

bot.use(session())

bot.command('new', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx) => {
  ctx.session = INITIAL_SESSION
  await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.on(message('voice'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение обрабатывается'))
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
    const userId = String(ctx.message.from.id)
    const oggPath = await ogg.create(link.href, userId)
    const mp3Path = await ogg.toMp3(oggPath, userId)

    const text = await openai.transcription(mp3Path)
    await ctx.reply(code(`Ваш запрос: ${text}`))

		ctx.session.messages.push({role: openai.roles.USER, content: text})

    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})

    await ctx.reply(response.content)
  } catch (error) {
    console.log('Error while voice message', error.message)
  }
  
})

bot.on(message('text'), async ctx => {
  ctx.session ??= INITIAL_SESSION
  try {
    await ctx.reply(code('Сообщение обрабатывается'))

		ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text})

    const response = await openai.chat(ctx.session.messages)

    ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})

    await ctx.reply(response.content)
  } catch (error) {
    console.log('Error while voice message', error.message)
  }
  
})


bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))