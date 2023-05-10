const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes } = require("ethereum-cryptography/utils");

const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

function hashMessage(message) {
  const bytes = utf8ToBytes(message);
  const hash = keccak256(bytes);

  return hash;
}

function verifySignature(sender, recipient, amount, signature) {
  const message = sender + '-' + amount + '-' + recipient + '-' + nonces[sender];
  const msgHash = hashMessage(message);

  isVerified = secp256k1.verify(signature, msgHash, sender);

  return isVerified;
}

const balances = [];
const nonces = [];

let i = 0;
while (i < 3) {
  const privKey = secp256k1.utils.randomPrivateKey();
  const pubKey = secp256k1.getPublicKey(privKey);
  console.log('privateKey:', toHex(privKey));
  console.log('publicKey:', toHex(pubKey));
  balances[toHex(pubKey)] = 100;
  nonces[toHex(pubKey)] = 0;

  i++;
}

console.log(balances);

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});
app.get("/nonce/:address", (req, res) => {
  const { address } = req.params;
  const nonce = nonces[address] || 0;
  res.send({ nonce });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature} = req.body;
  console.log(req.body);

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {

    const isVerified = verifySignature(sender, recipient, amount, signature);
    if (!isVerified) {
      res.status(400).send({ message: "Wrong Signature"});
    } else {
      balances[sender] -= amount;
      balances[recipient] += amount;
      nonces[sender] += 1;
      res.send({ balance: balances[sender], nonce: nonces[sender] });
    }

  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
  if (!nonces[address]) {
    nonces[address] = 0;
  }
}
