fx_version 'cerulean'
game 'gta5'

dependency 'oxmysql'
server_script '@oxmysql/lib/MySQL.lua'

ui_page 'html/dist/index.html'

files {
    'html/dist/index.html',
    'html/dist/assets/*',
    'html/dist/icons/*.png',
    'html/dist/images/*.png',
}

client_script "client/**/*"
server_script "server/**/*"