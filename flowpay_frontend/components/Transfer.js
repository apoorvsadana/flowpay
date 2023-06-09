import { useEffect, useState } from "react";
import styled from "styled-components";
import { query, mutate, tx, reauthenticate } from "@onflow/fcl";
import { useAuth } from "../contexts/AuthContext";
import flowLogo from "../public/flow-logo.svg";
import indiaFlag from "../public/india_flag.png";
import Image from "next/image";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBackspace, faExchange } from "@fortawesome/free-solid-svg-icons";
import dynamic from "next/dynamic";
import Swal from "sweetalert2";

const QrReader = dynamic(() => import("react-qr-reader"), {
  ssr: false,
});

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

const sendFlow = async (recepient, amount) => {
  const cadence = `
    import FungibleToken from 0xFT
    import FlowToken from 0xFLOW

    transaction(recepient: Address, amount: UFix64){
      prepare(signer: AuthAccount){
        let sender = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
          ?? panic("Could not borrow Provider reference to the Vault")

        let receiverAccount = getAccount(recepient)

        let receiver = receiverAccount.getCapability(/public/flowTokenReceiver)
          .borrow<&FlowToken.Vault{FungibleToken.Receiver}>()
          ?? panic("Could not borrow Receiver reference to the Vault")
 
        receiver.deposit(from: <- sender.withdraw(amount: amount))
      }
    }
  `;
  const args = (arg, t) => [arg(recepient, t.Address), arg(amount, t.UFix64)];
  const limit = 500;

  const txId = await mutate({
    cadence,
    args,
    limit,
  });
  console.log("Waiting for transaction to be sealed...");
  const txDetails = await tx(txId).onceSealed();
  console.log({ txDetails });
  return txDetails;
};

const Container = styled.div`
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const MyBalanceText = styled.div`
  color: grey;
`;

const Balance = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-bottom: 20px;
`;

const BalanceNumber = styled.div`
  font-weight: 600;
  font-size: 4rem;
`;

const BalanceCurrency = styled.div`
  font-size: 1.3rem;
  color: grey;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const BalanceCurrencyText = styled.div`
  margin-left: 5px;
`;

const InrPriceCard = styled.div`
  background: linear-gradient(white 0 0) padding-box,
    /*this is your grey background*/ linear-gradient(to right, #fd9d3c, #00ef8b)
      border-box;
  color: #313149;
  padding-left: 15px;
  padding-right: 15px;
  border: 3px solid transparent;
  border-radius: 8px;
  display: inline-block;
  margin-top: 50px;
  width: 78vw;
  padding-top: 15px;
  padding-bottom: 15px;
  margin-bottom: 40px;
`;

const InrPriceCardHeading = styled.div`
  font-weight: 400;
  font-size: 1.1rem;
  color: grey;
  text-decoration: underline;
`;

const ConversionCurrencies = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
  margin-top: 40px;
`;

const ConversionCurrency = styled.div`
  display: flex;
  flex-direction: column;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const ConversionCurrencyNumber = styled.div`
  font-weight: 600;
  font-size: 1.5rem;
`;

const ConversionCurrencyName = styled.div`
  font-weight: 400;
  font-size: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-top: 5px;
`;

const Button = styled.button`
  background-color: blue;
  font-family: Inter;
  background-color: #00d47b;
  font-family: Inter;
  border: 0;
  padding-left: 12%;
  padding-right: 12%;
  font-size: 1.3rem;
  color: white;
  padding-top: 2%;
  padding-bottom: 2%;
  border-radius: 10px;
  width: 100%;
`;

const QRScanner = styled.video`
  position: fixed;
  top: 0;
  left: 0;
`;

const TransferScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
  align-items: center;
  /* height: 60vh; */
`;

const TransferScreenBanalce = styled.div`
  font-size: 3rem;
  font-weight: 600;
  color: #00d47b;
  position: fixed;
  top: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TransferScreenINRBalance = styled.div`
  color: grey;
  font-size: 1.3rem;
`;

const NumPadContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100vw;
  position: fixed;
  bottom: 0%;
`;

const NumPadRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const NumPadDigit = styled.div`
  display: flex;
  flex-direction: row;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  width: -webkit-fill-available;
  padding: 5%;
  font-size: 2rem;
`;

const UpiDisplay = styled.div`
  position: fixed;
  top: 10%;
  color: grey;
`;

const EnterTransferAmountScreen = ({ rate, close, upiId }) => {
  const [amount, setAmount] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const appendToAmount = (digit) => {
    let a = amount;
    if (!a) {
      a = "";
    }
    setAmount(a + digit);
  };

  const backspace = () => {
    // delete last letter of amount
    let a = amount;
    if (!a) {
      a = "";
    }
    setAmount(a.slice(0, -1));
  };

  const transfer = async () => {
    setLoading(true);
    let a = Number(amount).toFixed(2);
    const result = await sendFlow("0x6acd2720771f4738", a);
    Swal.fire({
      title: "Sent!",
      text: `${2} Flow tokens have been sent to the merchant`,
      icon: "success",
      confirmButtonText: "Awesome!",
      confirmButtonColor: "#00d47b",
    });
    close();
  };

  return (
    <TransferScreenContainer>
      <UpiDisplay>{upiId}</UpiDisplay>
      <TransferScreenBanalce>
        {amount ? amount : "0"}
        <br></br>
        <TransferScreenINRBalance>
          Rs {Number(Number(amount ? amount : "0") * rate).toFixed(2)}
        </TransferScreenINRBalance>
      </TransferScreenBanalce>
      {loading && (
        <div className="horizontal-bar-wrap">
          <div className="bar1 bar"></div>
        </div>
      )}
      <NumPadContainer>
        <NumPadRow>
          <NumPadDigit onClick={() => appendToAmount("1")}>1</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("2")}>2</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("3")}>3</NumPadDigit>
        </NumPadRow>
        <NumPadRow>
          <NumPadDigit onClick={() => appendToAmount("4")}>4</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("5")}>5</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("6")}>6</NumPadDigit>
        </NumPadRow>
        <NumPadRow>
          <NumPadDigit onClick={() => appendToAmount("7")}>7</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("8")}>8</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("9")}>9</NumPadDigit>
        </NumPadRow>
        <NumPadRow>
          <NumPadDigit onClick={() => appendToAmount(".")}>.</NumPadDigit>
          <NumPadDigit onClick={() => appendToAmount("0")}>0</NumPadDigit>
          <NumPadDigit onClick={backspace}>
            <FontAwesomeIcon icon={faBackspace} />
          </NumPadDigit>
        </NumPadRow>
        <Button
          style={{ borderRadius: "0", paddingBottom: "5%", paddingTop: "5%" }}
          onClick={transfer}
        >
          Pay
        </Button>
      </NumPadContainer>
    </TransferScreenContainer>
  );
};

export default function Transfer() {
  const { currentUser } = useAuth();
  const [balance, setBalance] = useState("");
  const [inrPrice, setInrPrice] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [upiId, setUpiId] = useState(undefined);

  useEffect(() => {
    (async () => {
      let promises = [
        getFlowBalance(currentUser.addr),
        axios.get(
          `https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=inr`
        ),
      ];
      const [balance, flowPrice] = await Promise.all(promises);
      setBalance(balance);
      setInrPrice(flowPrice.data.flow.inr);
    })();
  }, [upiId]);

  const handleScan = async (scanData) => {
    console.log(`loaded data data`, scanData);
    if (scanData) {
      // read query param from url
      const url = new URL(scanData);
      const recepient = url.searchParams.get("pa");
      setScannerOpen(false);
      console.log("this is upiId - ", recepient);
      setUpiId(recepient);
    }
  };

  // fetch price of flow token from coingecko in usd

  return (
    <Container>
      {!upiId ? (
        <>
          <Balance>
            {" "}
            <MyBalanceText>My Balance</MyBalanceText>
            <BalanceNumber>{Number(balance).toFixed(2)}</BalanceNumber>
            <BalanceCurrency>
              <Image width={30} src={flowLogo}></Image>
              <BalanceCurrencyText>Flow Tokens</BalanceCurrencyText>
            </BalanceCurrency>
          </Balance>
          <InrPriceCard className="box">
            <InrPriceCardHeading>Conversion Rate</InrPriceCardHeading>
            <ConversionCurrencies>
              <ConversionCurrency style={{ marginRight: "30px" }}>
                <ConversionCurrencyNumber>1</ConversionCurrencyNumber>
                <ConversionCurrencyName>
                  <Image
                    width={25}
                    style={{ marginRight: "5px" }}
                    src={flowLogo}
                  ></Image>
                  Flow
                </ConversionCurrencyName>
              </ConversionCurrency>
              <FontAwesomeIcon icon={faExchange} color="grey" />
              <ConversionCurrency style={{ marginLeft: "30px" }}>
                <ConversionCurrencyNumber>{inrPrice}</ConversionCurrencyNumber>
                <ConversionCurrencyName>
                  <Image
                    width={25}
                    style={{ marginRight: "5px" }}
                    src={indiaFlag}
                  ></Image>
                  INR
                </ConversionCurrencyName>
              </ConversionCurrency>
            </ConversionCurrencies>

            {/* <InrPriceCardText>1 Flow = Rs {inrPrice}</InrPriceCardText> */}
          </InrPriceCard>
          <Button
            onClick={() => setScannerOpen(true)}
            style={{
              marginTop: "40px",
              bottom: "0",
              position: "fixed",
              borderRadius: "0",
              paddingTop: "4%",
              paddingBottom: "4%",
            }}
          >
            Scan QR Code
          </Button>
          <QRScanner width={10} id="qr_scanner"></QRScanner>
          {scannerOpen && (
            <QrReader
              onScan={handleScan}
              facingMode="environment"
              videoId="qr_scanner"
              style={{
                width: "90%",
                position: "fixed",
              }}
            />
          )}
        </>
      ) : (
        <EnterTransferAmountScreen
          close={() => setUpiId(undefined)}
          rate={inrPrice}
          upiId={upiId}
        />
      )}
    </Container>
  );
}
