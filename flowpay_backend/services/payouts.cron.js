require("../flow/config");
const { query, mutate, tx, reauthenticate } = require("@onflow/fcl");
const { default: axios } = require("axios");

const getFlowBalance = async (address) => {
  const cadence = `
      import FlowToken from 0xFLOW
      import FungibleToken from 0xFT
      
      pub fun main(address: Address): UFix64{
        let account = getAccount(address)
        let path = /public/flowTokenBalance
  
        let vaultRef = account.getCapability(path)
          .borrow<&FlowToken.Vault{FungibleToken.Balance}>()
          ?? panic("Could not borrow Balance reference to the Vault")
  
        return vaultRef.balance
      }
    `;
  const args = (arg, t) => [arg(address, t.Address)];
  const balance = await query({ cadence, args });
  console.log({ balance });
  return balance;
};

let balance = 0;
async function cron() {
  let currentBalane = await getFlowBalance("0x6acd2720771f4738");
  if (currentBalane == balance) {
    setTimeout(cron, 1000);
    return;
  }
  let deposit = currentBalane - balance;
  let response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=inr`
  );
  let inrPrice = response.data.flow.inr;
  let amount = deposit * inrPrice;

  console.log("Making a payout of  - ", amount);
  try {
    var data = JSON.stringify({
      account_number: "2323230006094116",
      fund_account_id: "fa_LznMOcAmIEbVaW",
      amount: Math.round(amount * 100),
      currency: "INR",
      mode: "UPI",
      purpose: "refund",
      queue_if_low_balance: true,
      reference_id: "Hackathon payment",
      narration: "Hackathon payment",
      notes: {
        notes_key_1: "hackathon payment",
        notes_key_2: "hackathon payment",
      },
    });

    var config = {
      method: "post",
      url: "https://api.razorpay.com/v1/payouts",
      headers: {
        Authorization:
          "Basic cnpwX3Rlc3RfdmE2ekFNbFo3d2xqWks6bm5DakdXSDd5S3BpeUJCYWNDMGFUc09i",
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config);
  } catch (err) {
    console.error(err.response.data);
  }

  console.log("Payout succesful  - ", amount);
  balance = currentBalane;
  setTimeout(cron, 1000);
}

async function init() {
  let currentBalane = await getFlowBalance("0x6acd2720771f4738");
  balance = 2;
  cron();
}

init();
