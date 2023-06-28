const chalk = require("chalk")
const fs = require("fs")

global.ownerNomer = ['6285793433348']
global.ownerNama = 'SanXd'
global.botNama = 'SanBot'
global.packname = 'Sticker By'
global.author = 'SanXd'
global.sessionNama = 'zession'

global.y = '».'
global.c = '120363158958971811@g.us'
global.email = 'sanxdbot123@gmail.com'
global.linkgc = 'https://chat.whatsapp.com/KtUDsW1WwBALQaa1INn85k'
global.thumb = fs.readFileSync('./media/gambar/thumb.jpg') 
global.qris = fs.readFileSync('./media/gambar/qris.jpg') 
global.jumlahbug = '25'

global.mess = {
  succes: 'Done', 
  group: 'Hanya Bisa Di Gunakan Di Group', 
  botAdmin: 'Jadiin Bot Admin Dong Biar Bisa', 
  admin: 'Fitur Khusus Admin', 
  bot: 'Fitur Khusus Nomer Bot', 
  owner: 'Fitur Khusus Owner', 
  wait: 'Loading...', 
  prem: 'Fitur Khusus User Premium', 
} 

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.greenBright(`Update ${__filename}`))
delete require.cache[file]
require(file)
})