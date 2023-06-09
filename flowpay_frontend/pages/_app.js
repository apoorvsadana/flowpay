import AuthProvider from "../contexts/AuthContext";
import styled from "styled-components";
import logo from "../public/logo.png";
import "../styles/globals.css";
import Image from "next/image";

const Navbar = styled.div`
  display: flex;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25));
  width: 100vw;
  left: 0;
  padding: 3%;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: white;
`;

const BrandName = styled.div`
  font-family: Inter;
  font-size: 1.2rem;
  font-weight: 500;
  margin-left: 10px;
`;

function MyApp({ Component, pageProps }) {
  return (
    <div>
      <main className="container">
        <AuthProvider>
          <Navbar>
            <Image width={30} src={logo}></Image>
            <BrandName>Flow Pay</BrandName>
          </Navbar>
          <Component {...pageProps} />
        </AuthProvider>
      </main>
    </div>
  );
}

export default MyApp;
