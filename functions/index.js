const config = require('./config.json')
const project = process.env.GCLOUD_PROJECT.split('-')[2]
const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp({
  credential: admin.credential.applicationDefault()
})
const db = admin.firestore()
const settings = { timestampsInSnapshots: true }
db.settings(settings)
const bucket = admin.storage().bucket(config.bucket[project])
const { promisify } = require('util')
const fs = require('fs')
const readFile = promisify(fs.readFile)
const axios = require('axios')
const Canvas = require('canvas')
Canvas.registerFont(__dirname + '/assets/fonts/NotoSansJP-Regular.otf', {
  family: 'Noto Sans JP'
})
Canvas.registerFont(__dirname + '/assets/fonts/NotoSansJP-Bold.otf', {
  family: 'Noto Sans JP Bold',
  weight: 'bold'
})
const Web3 = require('web3')
const web3 = new Web3(config.node[project].https)
const bazaaar_v1 = new web3.eth.Contract(
  config.abi.bazaaar_v1,
  config.contract[project].bazaaar_v1
)
const twitter = require('twitter')
const tweet = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: config.TWITTER_CONSUMER_SECRET,
  access_token_key: config.TWITTER_ACCESSTOKEN_KEY,
  access_token_secret: config.TWITTER_ACCESSTOKEN_SECRET
})
const deactivateDocOGP = async doc => {
  const canvas = Canvas.createCanvas(1200, 630)
  const c = canvas.getContext('2d')
  const imagePromise = axios.get(doc.ogp, { responseType: 'arraybuffer' })
  const promises = [imagePromise, readFile('./assets/img/out_en.png')]
  const resolved = await Promise.all(promises)
  const bgImg = new Canvas.Image()
  bgImg.src = resolved[0].data
  const outImg = new Canvas.Image()
  outImg.src = resolved[1]
  c.clearRect(0, 0, 1200, 630)
  c.drawImage(bgImg, 0, 0)
  c.fillStyle = 'rgba(0,0,0,0.7)'
  c.fillRect(0, 0, 1200, 630)
  c.drawImage(outImg, 76, 145)
  const base64EncodedImageString = canvas.toDataURL().substring(22)
  const imageBuffer = Buffer.from(base64EncodedImageString, 'base64')
  const file = bucket.file(doc.id + '.png')
  file.save(imageBuffer, { metadata: { contentType: 'image/png' } })
}

exports.order = functions
  .region('asia-northeast1')
  .https.onCall(async (params, context) => {
    const order = params.order
    const hash = await bazaaar_v1.methods
      .requireValidOrder_(
        [
          order.proxy,
          order.maker,
          order.taker,
          order.creatorRoyaltyRecipient,
          order.asset
        ],
        [
          order.id,
          order.price,
          order.nonce,
          order.salt,
          order.expiration,
          order.creatorRoyaltyRatio,
          order.referralRatio
        ],
        order.v,
        order.r,
        order.s
      )
      .call()
    const response = await axios({
      method: 'get',
      url: config.api.ck.metadata + order.id,
      responseType: 'json'
    })
    const metadata = response.data
    const imagePromise = axios.get(metadata.image_url_png, {
      responseType: 'arraybuffer'
    })
    const promises = [readFile('./assets/img/template_en.png'), imagePromise]
    const resolved = await Promise.all(promises)
    const templateImg = new Canvas.Image()
    templateImg.src = resolved[0]
    const characterImg = new Canvas.Image()
    characterImg.src = resolved[1].data
    const canvas = Canvas.createCanvas(1200, 630)
    const c = canvas.getContext('2d')
    c.clearRect(0, 0, 1200, 630)
    c.drawImage(templateImg, 0, 0)
    c.drawImage(characterImg, 15, 90, 450, 450)
    c.textBaseline = 'top'
    c.textAlign = 'center'
    c.fillStyle = '#ffff00'
    c.font = "bold 60px 'Noto Sans JP'"
    if (!params.msg) {
      c.fillText('NOW ON SALE!', 840, 120, 720)
    } else {
      const msg = params.msg.replace(/\r?\n/g, '')
      c.fillText(msg.substr(0, 9), 840, 80, 720)
      c.fillText(msg.substr(9, 18), 840, 160, 720)
    }
    c.fillStyle = '#fff'
    c.font = "40px 'Noto Sans JP'"
    c.fillText(
      'ID.' + order.id + '/' + 'Gen.' + metadata.generation,
      840,
      255,
      720
    )
    c.fillText('Cooldown.' + metadata.status.cooldown_index, 840, 305, 720)
    c.font = "bold 75px 'Noto Sans JP Bold'"
    c.fillText(web3.utils.fromWei(order.price) + ' ETH', 840, 375, 720)
    const base64EncodedImageString = canvas.toDataURL().substring(22)
    const imageBuffer = Buffer.from(base64EncodedImageString, 'base64')
    const file = bucket.file(hash + '.png')
    const ogp =
      'https://firebasestorage.googleapis.com/v0/b/' +
      bucket.name +
      '/o/' +
      encodeURIComponent(hash + '.png') +
      '?alt=media'
    const now = new Date().getTime()
    order.hash = hash
    order.metadata = metadata
    order.ogp = ogp
    order.created = now
    order.valid = true
    const batch = db.batch()
    const snapshots = await db
      .collection('order')
      .where('maker', '==', order.maker)
      .where('asset', '==', order.asset)
      .where('id', '==', order.id)
      .where('valid', '==', true)
      .get()
    snapshots.forEach(function(doc) {
      const ref = db.collection('order').doc(doc.id)
      batch.update(ref, {
        result: { status: 'cancelled' },
        valid: false,
        modified: now
      })
      deactivateDocOGP(doc.data())
    })
    const ref = db.collection('order').doc(hash)
    batch.set(ref, order)
    const savePromises = [
      file.save(imageBuffer, { metadata: { contentType: 'image/png' } }),
      batch.commit()
    ]
    await Promise.all(savePromises)
    const msssage =
      'https://bazaaar.io/ck/order/' +
      result.hash +
      '&text=' +
      'NOW ON SALE! ' +
      '/ ID.' +
      order.id +
      '/ Gen.' +
      metadata.generation +
      '/ Cooldown.' +
      metadata.status.cooldown_index +
      '&hashtags=bazaaar, CryptoKitties'
    tweet.post('statuses/update', { status: msssage })
    const result = {
      ogp: ogp,
      hash: hash
    }
    return result
  })

exports.orderMatchedPubSub = functions
  .region('asia-northeast1')
  .pubsub.topic('orderMatched')
  .onPublish(async message => {
    const transactionHash = message.json.transactionHash
    const transaction = await web3.eth.getTransactionReceipt(transactionHash)
    const hash = transaction.logs[0].topics[1]
    const address = web3.utils.toChecksumAddress(transaction.logs[0].address)
    const maker = web3.utils.toChecksumAddress(
      web3.utils.toHex(transaction.logs[0].data.substring(26, 66))
    )
    const taker = web3.utils.toChecksumAddress(
      web3.utils.toHex(transaction.logs[0].data.substring(90, 130))
    )
    const asset = web3.utils.toChecksumAddress(
      web3.utils.toHex(transaction.logs[0].data.substring(154, 194))
    )
    const id = web3.utils
      .hexToNumber(transaction.logs[0].data.substring(194, 258))
      .toString()
    const now = new Date().getTime()
    if (address == bazaaar_v1.options.address) {
      const batch = db.batch()
      const promises = [
        db
          .collection('order')
          .where('hash', '==', hash)
          .where('valid', '==', true)
          .get(),
        db
          .collection('order')
          .where('maker', '==', maker)
          .where('asset', '==', asset)
          .where('id', '==', id)
          .where('valid', '==', true)
          .get()
      ]
      const resolved = await Promise.all(promises)
      resolved[0].forEach(function(doc) {
        let ref = db.collection('order').doc(doc.id)
        batch.update(ref, {
          result: { status: 'sold', taker: taker },
          valid: false,
          modified: now
        })
        deactivateDocOGP(doc.data())
      })
      resolved[1].forEach(function(doc) {
        if (doc.id != hash) {
          var ref = db.collection('order').doc(doc.id)
          batch.update(ref, {
            result: { status: 'cancelled' },
            valid: false,
            modified: now
          })
          deactivateDocOGP(doc.data())
        }
      })
      batch.commit()
    }
  })

exports.orderCancelledPubSub = functions
  .region('asia-northeast1')
  .pubsub.topic('orderCancelled')
  .onPublish(async message => {
    const transactionHash = message.json.transactionHash
    const transaction = await web3.eth.getTransactionReceipt(transactionHash)
    const address = web3.utils.toChecksumAddress(transaction.logs[0].address)
    const maker = web3.utils.toChecksumAddress(
      web3.utils.toHex(transaction.logs[0].data.substring(26, 66))
    )
    const asset = web3.utils.toChecksumAddress(
      web3.utils.toHex(transaction.logs[0].data.substring(90, 130))
    )
    const id = web3.utils
      .hexToNumber(transaction.logs[0].data.substring(130, 194))
      .toString()
    const now = new Date().getTime()
    if (address == bazaaar_v1.options.address) {
      const batch = db.batch()
      const snapshots = await db
        .collection('order')
        .where('maker', '==', maker)
        .where('asset', '==', asset)
        .where('id', '==', id)
        .where('valid', '==', true)
        .get()
      snapshots.forEach(function(doc) {
        var ref = db.collection('order').doc(doc.id)
        batch.update(ref, {
          result: { status: 'cancelled' },
          valid: false,
          modified: now
        })
        deactivateDocOGP(doc.data())
      })
      await batch.commit()
    }
  })

exports.orderPeriodicUpdatePubSub = functions
  .region('asia-northeast1')
  .pubsub.topic('orderPeriodicUpdate')
  .onPublish(async message => {
    const eventPromises = [
      bazaaar_v1.getPastEvents('OrderMatched', {
        fromBlock: (await web3.eth.getBlockNumber()) - 150,
        toBlock: 'latest'
      }),
      bazaaar_v1.getPastEvents('orderCancelled', {
        fromBlock: (await web3.eth.getBlockNumber()) - 150,
        toBlock: 'latest'
      })
    ]
    const eventResolved = await Promise.all(eventPromises)
    const batch = db.batch()
    const takers = []
    const soldPromises = []
    const cancelledPromises = []
    for (var i = 0; i < eventResolved[0].length; i++) {
      takers.push(eventResolved[0][i].returnValues.taker)
      soldPromises.push(
        db
          .collection('order')
          .where('hash', '==', eventResolved[0][i].returnValues.hash)
          .where('valid', '==', true)
          .get()
      )
      cancelledPromises.push(
        db
          .collection('order')
          .where('asset', '==', eventResolved[0][i].returnValues.asset)
          .where('id', '==', eventResolved[0][i].returnValues.id)
          .where('maker', '==', eventResolved[0][i].returnValues.maker)
          .where('valid', '==', true)
          .get()
      )
    }
    for (var i = 0; i < eventResolved[1].length; i++) {
      cancelledPromises.push(
        db
          .collection('order')
          .where('id', '==', eventResolved[1][i].returnValues.id)
          .where('maker', '==', eventResolved[1][i].returnValues.maker)
          .where('asset', '==', eventResolved[1][i].returnValues.asset)
          .where('valid', '==', true)
          .get()
      )
    }
    const promiseArray = [soldPromises, cancelledPromises]
    const orderResolved = await Promise.all(
      promiseArray.map(function(innerPromiseArray) {
        return Promise.all(innerPromiseArray)
      })
    )
    for (let i = 0; i < orderResolved[0].length; i++) {
      orderResolved[0][i].forEach(function(doc) {
        let ref = db.collection('order').doc(doc.id)
        batch.update(ref, {
          result: { status: 'sold', taker: takers[i] },
          valid: false,
          modified: now
        })
        deactivateDocOGP(doc.data())
      })
    }
    for (let i = 0; i < orderResolved[1].length; i++) {
      orderResolved[1][i].forEach(function(doc) {
        let ref = db.collection('order').doc(doc.id)
        batch.update(ref, {
          result: { status: 'cancelled' },
          valid: false,
          modified: now
        })
        deactivateDocOGP(doc.data())
      })
    }
    await batch.commit()
  })
