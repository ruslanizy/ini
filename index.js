require(`./setting.js`)
const { default: makeWASocket, DisconnectReason, downloadContentFromMessage, useSingleFileAuthState, jidDecode, areJidsSameUser, makeInMemoryStore } = require('@adiwajshing/baileys')
const { state } = useSingleFileAuthState(`./conection/${sessionNama}.json`)
const PhoneNumber = require('awesome-phonenumber')
const fs = require('fs')
const pino = require('pino')
const FileType = require('file-type')
const { Boom } = require('@hapi/boom')
const { smsg, start, success } = require('./lib/myfunc')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const chalk = require('chalk')
const color = (text, color) => { return !color ? chalk.green(text) : chalk.keyword(color)(text) }
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })

const connectToWhatsApp = () => {
const xd = makeWASocket({ logger: pino ({ level: 'silent' }), printQRInTerminal: true, auth: state, browser: ["SanXd", "Firefox", "3.0"]})
console.log(color(`Hallo Masbro 👋\n`, `yellow`))

store.bind(xd.ev)

xd.ev.on('messages.upsert', async chatUpdate => {
try {
m = chatUpdate.messages[0]
if (!m.message) return
m.message = (Object.keys(m.message)[0] === 'ephemeralMessage') ? m.message.ephemeralMessage.message : m.message
if (!xd.public && !m.key.fromMe && chatUpdate.type === 'notify') return
if (m.key.id.startsWith('BAE5') && m.key.id.length === 16) return
m = smsg(xd, m, store)
require('./sann')(xd, m, chatUpdate, store)
} catch (err) {
console.log(err)}})

xd.ev.on("connection.update", async (update) => {
const { connection, lastDisconnect } = update
if (connection === "connecting") {
start(`1`, `Connecting...`)
} else if (connection === "open") {
success(`1`, `Tersambung`)
} else if (connection === "close") {
let reason = new Boom(lastDisconnect?.error)?.output.statusCode
if (reason === DisconnectReason.badSession) { 
console.log(`Bad Session File, Please Delete Session and Scan Again`); xd.logout(); 
} else if (reason === DisconnectReason.connectionClosed) { 
console.log("Connection closed, reconnecting...."); process.exit() 
} else if (reason === DisconnectReason.connectionLost) { 
console.log("Connection Lost from Server, reconnecting..."); process.exit() 
} else if (reason === DisconnectReason.connectionReplaced) { 
console.log("Connection Replaced, Another New Session Opened, Please Close Current Session First"); xd.logout(); 
} else if (reason === DisconnectReason.loggedOut) { 
console.log(`Device Logged Out, Please Scan Again And Run.`); xd.logout(); 
} else if (reason === DisconnectReason.restartRequired) { 
console.log("Restart Required, Restarting..."); await connectToWhatsApp() 
} else if (reason === DisconnectReason.timedOut) { 
console.log("Connection TimedOut, Reconnecting..."); connectToWhatsApp() 
} else xd.end(`Unknown DisconnectReason: ${reason}|${connection}`)
}
})

xd.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

xd.ev.on('contacts.update', update => {
for (let contact of update) {
let id = xd.decodeJid(contact.id)
if (store && store.contacts) store.contacts[id] = { id, name: contact.notify }
}
})

xd.getName = (jid, withoutContact  = false) => {
id = xd.decodeJid(jid)
withoutContact = xd.withoutContact || withoutContact 
let v
if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
v = store.contacts[id] || {}
if (!(v.name || v.subject)) v = xd.groupMetadata(id) || {}
resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
})
else v = id === '0@s.whatsapp.net' ? {
id,
name: 'WhatsApp'
} : id === xd.decodeJid(xd.user.id) ?
xd.user :
(store.contacts[id] || {})
return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
}

xd.public = true

xd.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.m ? message.m : message
let mime = (message.m || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
await fs.writeFileSync(trueFileName, buffer)
return trueFileName
}

xd.downloadMediaMessage = async (message) => {
let mime = (message.m || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])
}
return buffer
}

const { getImg } = require('./lib/functions')

xd.sendImage = async (jid, path, caption = '', quoted = '', options) => {
let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getImg(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
return await xd.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
}

xd.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getImg(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)
}
await xd.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer
}

xd.sendButMessage = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
let buttonMessage = {
text,
footer,
buttons,
headerType: 2,
...options
}
xd.sendMessage(jid, buttonMessage, { quoted, ...options })
}

}

connectToWhatsApp()
require("http").createServer((_, res) => res.end("Uptime!")).listen(8080)