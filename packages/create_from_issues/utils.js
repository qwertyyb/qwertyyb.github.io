const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone') 

dayjs.extend(utc)
dayjs.extend(timezone)

const formatDate = (dateTime) => {
  return dayjs(dateTime).tz('Asia/Shanghai').format('YYYY年MM月DD日 HH:mm')
}

module.exports = {
  formatDate
}