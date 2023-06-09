import styled from "styled-components";
import { useEffect } from "react";
import Transfer from "../components/Transfer";
import * as fcl from "@onflow/fcl";
import { useAuth } from "../contexts/AuthContext";
import LandingPage from "../public/landing_image.png";
import Image from "next/image";

const Container = styled.div`
  background-color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
`;

const Heading = styled.div``;

const LoginButton = styled.button`
  background-color: #00d47b;
  font-family: Inter;
  font-family: Inter;
  border: 0;
  padding-left: 12%;
  padding-right: 12%;
  font-size: 1.3rem;
  color: white;
  padding-top: 2%;
  padding-bottom: 2%;
  border-radius: 50px;
  width: 80%;
`;

const DescriptionText = styled.div`
  font-size: 1.2rem;
  font-weight: 400;
  width: 80%;
  text-align: center;
  margin-bottom: 30px;
`;

export default function User() {
  const { currentUser, logOut, logIn } = useAuth();

  useEffect(() => {
    // logOut();
  }, []);
  return (
    <Container>
      {!currentUser?.loggedIn ? (
        <>
          <Image
            width={500}
            style={{ marginBottom: "50px" }}
            src={LandingPage}
          ></Image>
          <DescriptionText>
            Pay in INR using your Flow tokens, anywhere and everywhere!
          </DescriptionText>
          <LoginButton onClick={logIn}>Login</LoginButton>
        </>
      ) : (
        <Transfer />
      )}
    </Container>
  );
}
