require('dotenv').config()

module.exports = {
    accessKeyID: process.env.SHIFTBOARD_ACCESS_KEY_ID,
    secretKey: process.env.SHIFTBOARD_SECRET_KEY,
    host: 'api.shiftdata.com',
    path: '/servola/api/api.cgi'
}
