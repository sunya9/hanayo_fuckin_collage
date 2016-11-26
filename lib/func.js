const fs = require('fs')
const gm = require("gm")
const Twitter = require('twitter')

const settings = require('../config.json')

const client = new Twitter(settings)

exports.getScreenName = getScreenName

function getScreenName() {
  return new Promise((resolve, reject) => {
    client.get('account/verify_credentials', (err, res) => {
      if (err) reject(err)
      resolve(res.screen_name)
    })
  })
}

function rotateIcon(iconUrl) {
  const iconFilename = 'icon.png'
  return new Promise((resolve, reject) => {
    const modifyIcon = gm(iconUrl)
      .resize(397.7)
      .rotate('transparent', 7.604)
      .write(iconFilename, err => {
        if (err) reject(err)
        resolve(iconFilename)
      })

  })
}

function hanayonize(iconFilename) {
  const resFilename = 'res.png'
  return new Promise((resolve, reject) => {
    gm('hanayo.png')
      .composite(iconFilename)
      .geometry('+350+182')
      .write(resFilename, function (err) {
        if (err) return reject(err)
        resolve(resFilename)
      })
  })
}

function createMedia(resFilename) {
  const media = fs.readFileSync(resFilename)
  return new Promise((resolve, reject) => {
    client.post('media/upload', { media }, (err, media) => {
      if (err) reject(err)
      resolve(media.media_id_string)
    })
  })
}

function reply(screenName, in_reply_to_status_id) {
  return media_ids => {
    const status = {
      status: `@${screenName} どうぞ！`,
      media_ids,
      in_reply_to_status_id
    }
    return new Promise((resolve, reject) => {
      client.post('statuses/update', status, (err, res) => {
        if (err) reject(err)
        resolve(res)
      })
    })
  }
}

exports.initStream = initStream

function initStream(me) {
  const receiver = createReceiver(me)
  client.stream('user', stream => {
    stream.on('data', receiver)
    // restart
    stream.on('error', () => {
      stream.destroy()
      initStream(me)
    })
  })
}

function createReceiver(me) {
  const regex = new RegExp(`^@${me}\\s+クソコラ.*$`, 'i')
  return status => {
    const passCases = status.text &&
      regex.test(status.text) &&
      !status.retweeted_status
    if (!passCases) return
    const { user, id_str } = status
    const iconUrl = user.profile_image_url.replace('_normal', '')
    const target = user.screen_name

    rotateIcon(iconUrl)
      .catch(console.error)
      .then(hanayonize)
      .catch(console.error)
      .then(createMedia)
      .catch(console.error)
      .then(reply(target, id_str))
      .catch(console.error)
  }
}