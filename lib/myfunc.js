const { proto, delay, getContentType } = require('@adiwajshing/baileys')
const chalk = require('chalk')
const fs = require('fs')
const Crypto = require('crypto')
const axios = require('axios')
const spin = require('spinnies')

const spinner = { 
"interval": 500,
"frames": [
"⏳"
]}


let globalSpinner;

const getGlobalSpinner = (disableSpins = false) => {
if(!globalSpinner) globalSpinner = new spin({ color: 'greenBright', succeedColor: 'greenBright', spinner, disableSpins});
return globalSpinner;
}

spins = getGlobalSpinner(false)

exports.start = (id, text) => {
spins.add(id, {text: text})
}

exports.success = (id, text) => {
spins.succeed(id, {text: text})

}

exports.smsg = (xd, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = xd.decodeJid(m.fromMe && xd.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = xd.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.m = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        
        m.body = m.message.conversation || m.m.caption || m.m.text || (m.mtype == 'listResponseMessage') && m.m.singleSelectReply.selectedRowId || (m.mtype == 'buttonsResponseMessage') && m.m.selectedButtonId || (m.mtype == 'viewOnceMessage') && m.m.caption || m.text
        let quoted = m.quoted = m.m.contextInfo ? m.m.contextInfo.quotedMessage : null
        m.mentionedJid = m.m.contextInfo ? m.m.contextInfo.mentionedJid : []
        if (m.quoted) {
            let type = getContentType(quoted)
			m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
				type = getContentType(m.quoted)
				m.quoted = m.quoted[type]
			}
            if (typeof m.quoted === 'string') m.quoted = {
				text: m.quoted
			}
            m.quoted.mtype = type
            m.quoted.id = m.m.contextInfo.stanzaId
			m.quoted.chat = m.m.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
			m.quoted.sender = xd.decodeJid(m.m.contextInfo.participant)
			m.quoted.fromMe = m.quoted.sender === (xd.user && xd.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
			m.quoted.mentionedJid = m.m.contextInfo ? m.m.contextInfo.mentionedJid : []
            m.getQuotedObj = m.getQuotedMessage = async () => {
			if (!m.quoted.id) return false
			let q = await store.loadMessage(m.chat, m.quoted.id, xd)
 			return exports.sm(xd, q, store)
            }
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.quoted.delete = () => xd.sendMessage(m.quoted.chat, { delete: vM.key })
            m.quoted.download = () => xd.downloadMediaMessage(m.quoted)
        }
    }
    if (m.m.url) m.download = () => xd.downloadMediaMessage(m.m)
    m.text = m.m.text || m.m.caption || m.message.conversation || m.m.contentText || m.m.selectedDisplayText || m.m.title || ''
    return m
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.greenBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})
