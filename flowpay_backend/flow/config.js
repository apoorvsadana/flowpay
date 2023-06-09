const { config } = require("@onflow/fcl");

config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  // We will also specify the network as some of the FCL parts need it to properly do it's work
  "flow.network": "testnet",
  // This will be the title of our DApp
  "app.detail.title": "FlowPay",
  "app.detail.icon": "https://i.ibb.co/5kv5Lf6/New-Project.png",
  // Next two will define where Wallet Discovery is located
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
  "discovery.authn.endpoint":
    "https://fcl-discovery.onflow.org/api/testnet/authn",

  // We will also set aliases for the contracts we will use in this example
  "0xFLOW": "0x7e60df042a9c0868",
  "0xFT": "0x9a0766d93b6608b7",
});
