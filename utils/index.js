const axios = require("axios");
const fs = require("fs/promises");
const { copy } = require("./copy");

exports.createAccount = async () => {
  // get the available email domains
  const { data } = await axios.get("https://api.mail.tm/domains?page=1");

  // get the first domain
  const domain = data["hydra:member"][0].domain;

  console.log(domain);
  // generate a random email address
  const email = `${Math.random().toString(36).substring(7)}@${domain}`;

  // generate a random password
  const password = Math.random().toString(36).substring(7);

  try {
    const { data } = await axios.post("https://api.mail.tm/accounts", {
      address: email,
      password,
    });

    // add password to the data object
    data.password = password;

    // copy the email to the clipboard
    await copy(email);

    // get Jwt token
    const { data: token } = await axios.post("https://api.mail.tm/token", {
      address: email,
      password,
    });

    // write token to a data object
    data.token = token;

    // write the data to file using the fs module
    await fs.writeFile("./account.json", JSON.stringify(data, null, 2));

    console.log(`Account created: ${email}`);
  } catch (error) {
    console.error(error.message);
  }
};

exports.fetchMessages = async () => {
  // read the account data from file
  const account = JSON.parse(await fs.readFile("./account.json"));

  // get the messages
  const { data } = await axios.get("https://api.mail.tm/messages", {
    headers: {
      Authorization: `Bearer ${account.token.token}`,
    },
  });
  // get the emails
  const emails = data["hydra:member"];

  // if there are no emails, exit
  if (!emails.length) {
    console.log("No emails");
    return;
  }

  // display the from and subject of the emails
  emails.forEach((email) => {
    console.log(`From: ${email.from.name} (${email.from.address})`);
    console.log(`Subject: ${email.subject}`);
  });
};

exports.deleteAccount = async () => {
  try {
    const account = JSON.parse(await fs.readFile("./account.json"));

    await axios.delete(`https://api.mail.tm/accounts/${account.id}`, {
      headers: {
        Authorization: `Bearer ${account.token.token}`,
      },
    });

    console.log("Account deleted");
  } catch (error) {
    console.error(error.message);
  }
};