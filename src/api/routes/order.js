var express = require('express');
var bodyParser = require('body-parser');
const router = express.Router();
const axios = require('axios')
var url = require('url');
const admin = require('firebase-admin');
var serviceAccount = require('../.serviceAccountKey.json');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io"));
const web3ws = new Web3(new Web3.providers.HttpProvider("wss://rinkeby.infura.io/ws"));

// var bazaaarAddress = "0x19086ad22bd5b07a39EA6ae90378dCb7738F0e47"
// var bazaaarABI = [ { "constant": true, "inputs": [], "name": "referralRatio", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x18f9decf" }, { "constant": true, "inputs": [], "name": "asset", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x38d52e0f" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x3f4ba83a" }, { "constant": true, "inputs": [], "name": "feeRatio", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x41744dd4" }, { "constant": true, "inputs": [ { "name": "account", "type": "address" } ], "name": "isPauser", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x46fbf68e" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x5c975abb" }, { "constant": false, "inputs": [], "name": "renouncePauser", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x6ef8d66d" }, { "constant": true, "inputs": [ { "name": "account", "type": "address" } ], "name": "isSigner", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x7df73e27" }, { "constant": true, "inputs": [ { "name": "", "type": "bytes32" } ], "name": "cancelledOrFinalized", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x8076f005" }, { "constant": false, "inputs": [ { "name": "account", "type": "address" } ], "name": "addPauser", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x82dc1ec4" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x8456cb59" }, { "constant": true, "inputs": [], "name": "ratioBase", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xc2fa002e" }, { "constant": true, "inputs": [], "name": "assetRoyaltyRatio", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xd2a1c515" }, { "constant": false, "inputs": [], "name": "renounceSigner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xe5c8b03d" }, { "constant": false, "inputs": [ { "name": "account", "type": "address" } ], "name": "addSigner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xeb12d61e" }, { "inputs": [ { "name": "assetAddress", "type": "address" }, { "name": "assetRoyaltyRecipientAddress", "type": "address" }, { "name": "uints", "type": "uint256[4]" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor", "signature": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "hash", "type": "bytes32" } ], "name": "OrderCancelled", "type": "event", "signature": "0x5152abf959f6564662358c2e52b702259b78bac5ee7842a0f01937e670efcc7d" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "hash", "type": "bytes32" } ], "name": "OrdersMatched", "type": "event", "signature": "0x96d7baa6f920467d51c60293e0c5a942ec6f91956094de5ed0db2bdcfa10319b" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "account", "type": "address" } ], "name": "Paused", "type": "event", "signature": "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "account", "type": "address" } ], "name": "Unpaused", "type": "event", "signature": "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "PauserAdded", "type": "event", "signature": "0x6719d08c1888103bea251a4ed56406bd0c3e69723c8a1686e017e7bbe159b6f8" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "PauserRemoved", "type": "event", "signature": "0xcd265ebaf09df2871cc7bd4133404a235ba12eff2041bb89d9c714a2621c7c7e" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "SignerAdded", "type": "event", "signature": "0x47d1c22a25bb3a5d4e481b9b1e6944c2eade3181a0a20b495ed61d35b5323f24" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "SignerRemoved", "type": "event", "signature": "0x3525e22824a8a7df2c9a6029941c824cf95b6447f1e13d5128fd3826d35afe8b" }, { "constant": false, "inputs": [], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x3ccfd60b" }, { "constant": false, "inputs": [ { "name": "assetRoyaltyRecipientAddress", "type": "address" }, { "name": "uints", "type": "uint256[4]" } ], "name": "update", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xceda36d2" }, { "constant": false, "inputs": [ { "name": "addrs", "type": "address[4]" }, { "name": "uints", "type": "uint256[4]" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "name": "orderMatch_", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function", "signature": "0xd5efe843" }, { "constant": false, "inputs": [ { "name": "addrs", "type": "address[3]" }, { "name": "uints", "type": "uint256[4]" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "name": "orderCancell_", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xc11bf16c" }, { "constant": true, "inputs": [ { "name": "addrs", "type": "address[3]" }, { "name": "uints", "type": "uint256[4]" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "name": "requireValidOrder_", "outputs": [ { "name": "", "type": "bytes32" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x4faf028a" }];
const tokenURIPrefix = process.env.MCHAPI + "hero/"
var bazaaarAddress = "0x6Fb94A83aE9ad4dD24f9117d5617A771B8C0b4F2"
var bazaaarABI = [{"constant": true, "inputs": [], "name": "referralRatio", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x18f9decf" }, { "constant": true, "inputs": [], "name": "asset", "outputs": [ { "name": "", "type": "address" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x38d52e0f" }, { "constant": true, "inputs": [], "name": "artEditRoyaltyRatioLimit", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x3b117de0" }, { "constant": false, "inputs": [], "name": "unpause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x3f4ba83a" }, { "constant": true, "inputs": [], "name": "feeRatio", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x41744dd4" }, { "constant": true, "inputs": [ { "name": "account", "type": "address" } ], "name": "isPauser", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x46fbf68e" }, { "constant": true, "inputs": [], "name": "paused", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x5c975abb" }, { "constant": false, "inputs": [], "name": "renouncePauser", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x6ef8d66d" }, { "constant": true, "inputs": [ { "name": "account", "type": "address" } ], "name": "isSigner", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x7df73e27" }, { "constant": true, "inputs": [ { "name": "", "type": "bytes32" } ], "name": "cancelledOrFinalized", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x8076f005" }, { "constant": false, "inputs": [ { "name": "account", "type": "address" } ], "name": "addPauser", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x82dc1ec4" }, { "constant": false, "inputs": [], "name": "pause", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x8456cb59" }, { "constant": true, "inputs": [], "name": "ratioBase", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xc2fa002e" }, { "constant": true, "inputs": [], "name": "assetRoyaltyRatio", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0xd2a1c515" }, { "constant": false, "inputs": [], "name": "renounceSigner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xe5c8b03d" }, { "constant": false, "inputs": [ { "name": "account", "type": "address" } ], "name": "addSigner", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xeb12d61e" }, { "inputs": [ { "name": "assetAddress", "type": "address" }, { "name": "assetRoyaltyRecipientAddress", "type": "address" }, { "name": "uints", "type": "uint256[5]" } ], "payable": false, "stateMutability": "nonpayable", "type": "constructor", "signature": "constructor" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "hash", "type": "bytes32" } ], "name": "OrderCancelled", "type": "event", "signature": "0x5152abf959f6564662358c2e52b702259b78bac5ee7842a0f01937e670efcc7d" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "hash", "type": "bytes32" } ], "name": "OrderMatched", "type": "event", "signature": "0x35b4c219d61b411cbcda25b59ea2313eb60754000b7047cf1659ef1176cdf95e" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "account", "type": "address" } ], "name": "Paused", "type": "event", "signature": "0x62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a258" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "account", "type": "address" } ], "name": "Unpaused", "type": "event", "signature": "0x5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "PauserAdded", "type": "event", "signature": "0x6719d08c1888103bea251a4ed56406bd0c3e69723c8a1686e017e7bbe159b6f8" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "PauserRemoved", "type": "event", "signature": "0xcd265ebaf09df2871cc7bd4133404a235ba12eff2041bb89d9c714a2621c7c7e" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "SignerAdded", "type": "event", "signature": "0x47d1c22a25bb3a5d4e481b9b1e6944c2eade3181a0a20b495ed61d35b5323f24" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "account", "type": "address" } ], "name": "SignerRemoved", "type": "event", "signature": "0x3525e22824a8a7df2c9a6029941c824cf95b6447f1e13d5128fd3826d35afe8b" }, { "constant": false, "inputs": [], "name": "withdraw", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0x3ccfd60b" }, { "constant": false, "inputs": [ { "name": "assetRoyaltyRecipientAddress", "type": "address" }, { "name": "uints", "type": "uint256[4]" } ], "name": "update", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xceda36d2" }, { "constant": false, "inputs": [ { "name": "addrs", "type": "address[4]" }, { "name": "uints", "type": "uint256[4]" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "name": "orderMatch_", "outputs": [], "payable": true, "stateMutability": "payable", "type": "function", "signature": "0xd5efe843" }, { "constant": false, "inputs": [ { "name": "addrs", "type": "address[3]" }, { "name": "uints", "type": "uint256[4]" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "name": "orderCancell_", "outputs": [], "payable": false, "stateMutability": "nonpayable", "type": "function", "signature": "0xc11bf16c" }, { "constant": true, "inputs": [ { "name": "addrs", "type": "address[3]" }, { "name": "uints", "type": "uint256[4]" }, { "name": "v", "type": "uint8" }, { "name": "r", "type": "bytes32" }, { "name": "s", "type": "bytes32" } ], "name": "requireValidOrder_", "outputs": [ { "name": "", "type": "bytes32" } ], "payable": false, "stateMutability": "view", "type": "function", "signature": "0x4faf028a"}]
const bazaaar = new web3.eth.Contract(bazaaarABI, bazaaarAddress);
const bazaaarWs = new web3ws.eth.Contract(bazaaarABI, bazaaarAddress);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();

router.post('/set', async function(req, res) {
  
  const param = req.body;
  console.log(param)

  var uri = tokenURIPrefix + param.id
  var response = await axios.get(uri)
  var metadata = response.data;
  console.log(metadata)
  var date = new Date();
  var time = date.getTime();

  var data = {
    proxy: param.proxy,
    maker: param.maker,
    artEditRoyaltyRecipient: param.artEditRoyaltyRecipient,
    id: param.id,
    price: param.price,
    artEditRoyaltyRatio: param.artEditRoyaltyRatio,
    salt: param.salt,
    v:param.v,
    r:param.r,
    s:param.s,
    hash:param.hash,
    metadata: metadata,
    status: true,
    timestamp: time,
  };
  
  console.log(data)


  orderid = String(param.hash)
  var setDoc = db.collection('order').doc(orderid).set(data);
  res.json({status: true})
  

});

bazaaarWs.events.OrderCancelled(null, function(error, result) {
  if (error) return
  console.log(result);
});

router.post('/cancel', async function(req, res) {


  
  const param = req.body;
  console.log(param.hash)
  
  var orderid = String(param.hash)
  var updateOrder = db.collection("order").doc(orderid);

  // Set the "capital" field of the city 'DC'
  return updateOrder.update({
      status: false
  })
  .then(function() {
      console.log("Document successfully updated!");
  })
  .catch(function(error) {
      // The document probably doesn't exist.
      console.error("Error updating document: ", error);
  });
  

});

router.get('/get', async function(req, res) {
  
    var urlParts = url.parse(req.url, true);
    var parameters = urlParts.query;
    console.log(parameters)
    var id = parameters.id;
    id = String(id)

    var cityRef = db.collection('order').doc(id);
    var getDoc = cityRef.get()
      .then(doc => {
        if (!doc.exists) {
          console.log('No such document!');
        } else {
          console.log('Document data:', doc.data());
        }
      })
      .catch(err => {
        console.log('Error getting document', err);
      });
});

router.get('/getAll', async function(req, res) {
  
  var urlParts = url.parse(req.url, true);
  var parameters = urlParts.query;
  var id = parameters.id;

  db.collection('order').get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
    });
  })
  .catch((err) => {
    console.log('Error getting documents', err);
  });

});


// var web3ws = new Web3("wss://rinkeby.infura.io/ws");


var contractAddress = "0xdd1669e93a023c45c7e72dc64b07295f814f83ea";
var contractABI = [
	{
		"constant": false,
		"inputs": [
			{
				"name": "_content",
				"type": "string"
			}
		],
		"name": "alert",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": false,
				"name": "content",
				"type": "string"
			}
		],
		"name": "Alert",
		"type": "event"
	}
]

var contractTest = new web3ws.eth.Contract(contractABI, contractAddress);

console.log("Start Listening Event")

contractTest.events.Alert(null, function(error, result) {
    if (error) return
    //console.log(result)
    console.log(result);
});



module.exports = router;