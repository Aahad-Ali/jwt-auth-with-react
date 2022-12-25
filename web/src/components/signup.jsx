import { useState } from "react";
import axios from "axios";

function Signup() {
  const baseUrl = "http://localhost:5001";
  const [result, setResult] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signupHandler = async (e) => {
    e.preventDefault();

    try {
      const responce = await axios.post(`${baseUrl}/signup`,
        {
          firstName: name,
          email: email,
          password: password,
        },
        // {
        //   withCredentials: true,
        // }
      );
      console.log("signup successfully");
      setResult('signup successfully')
    } catch (e) {
      console.log("e:", e);
    }

    // e.reset();
  };

  return (
    <>
      <h4>This is Signup page</h4>

      <form onSubmit={signupHandler}>
        Name:{" "}
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <br />
        Email:{" "}
        <input
          type="email"
          name="username"
          placeholder="email"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
        <br />
        Password:{" "}
        <input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="password"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <br />
        Password:{" "}
        <input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="confirm password"
        />
        <br />
        <button type="submit">Signup</button>
      </form>
      <p>{result}</p>
    </>
  );
}

export default Signup;
