const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
var admin = require("firebase-admin");
const { google } = require("googleapis");
const nodemailer = require("nodemailer");
const OAuth2 = google.auth.OAuth2;
const app = express();

const port = process.env.PORT || 5001; // Set the port to listen on

const oauth2Client = new OAuth2(
  "YOUR_CLIENT_ID",
  "YOUR_CLIENT_SECRET",
  "YOUR_REDIRECT_URL"
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "natarajan.rayi@gmail.com",
    clientId: "aYF7wOEDOwR9BAbKox1HHPmZtGhvs7zW",
    clientSecret:
      "YOUuVyOzIpxQvCTyNVtXmy1b-ZkTCP1MMbChTPCe_BD90j_8qgW5uNJTsoV3skP06Vj",
    refreshToken:
      "1//04JzHI38xtPUICgYIARAAGAQSNwF-L9Ir7cSnhTplt3y62FvmtIYPAX-8tQWFl5jl38euX-HrIQPwCG1_CocdOF7xZcIl8lDzZCI",
    accessToken:
      "ya29.a0AWY7Ckl7f_gCdc0EfkMKLd7-6wsLXoDBWo66x0a9R2JU22IvcMIxvpLYK_TrZri6Qm_LQK9sVFAQhSqJYvznBsXHoRRif6UbotT5aELXD2BOsLdyHLdh6xu51_prJM6FNDBUxsjniX5dxRMFcWoKGPuJT_boaCgYKAR4SARESFQG1tDrpCgKQgvr0a-o94_u1dcV9rA0163",
  },
});

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./cred"));
var serviceAccount = require("./cred/med4us-website.json");
const { userInfo } = require("os");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
// Configure CORS middleware
const allowedOrigins = ["http://localhost:3000", "*"]; // Add your allowed origins
const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "null");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(cors(corsOptions));
// Define routes and middleware
app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// submission detail store
app.post("/submit-form", (req, res) => {
  const data = req.body;
  console.log(data);

  admin
    .firestore()
    .collection("submit_form_messages")
    .doc()
    .set(data)
    .then(() => {
      res.status(200).json({ message: "Data stored successfully" });
    })
    .catch((error) => {
      res.status(500).json({ message: error });
    });
});

// mail notification send
app.get("/notification-send", (req, res) => {
  const mailOptions = {
    from: "natarajan.rayi@gmail.com",
    to: "natarajan.rayi@gmail.com",
    subject: "Email Subject",
    text: "Email Content",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // Handle error
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  res.send("mail send");
});

app.get("/lead-msg", (req, res) => {
  let messageData = [];
  admin
    .firestore()
    .collection("submit_form_messages")
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        console.log(doc.id, " => ", doc.data());
        messageData.push(doc.data());
      });
      res.status(200).json({ message: messageData });
    })
    .catch((error) => {
      res.status(500).json({ message: error });
    });
});

app.get("/user-activity", (req, res) => {
  admin
    .auth()
    .listUsers()
    .then((userInfo) => {
      {
        console.log(userInfo);
        res.status(200).json({ user: userInfo });
      }
    });
});

app.get("/dashboard-count", (req, res) => {
  let countMsg = 0;
  let countUsers = 0;

  const collectionRef = admin.firestore().collection("submit_form_messages");

  // Get the count of documents in "submit_form_messages" collection
  collectionRef
    .get()
    .then((querySnapshot) => {
      countMsg = querySnapshot.size;

      const collectionRefUser = admin
        .firestore()
        .collection("admin_users_login");

      // Get the count of documents in "admin_users_login" collection
      collectionRefUser
        .get()
        .then((querySnapshot) => {
          countUsers = querySnapshot.size;

          res
            .status(200)
            .json({ lead_count: countMsg, admin_count: countUsers });
        })
        .catch((error) => {
          console.log("Error getting documents:", error);
          res
            .status(500)
            .json({ error: "An error occurred while fetching user count." });
        });
    })
    .catch((error) => {
      console.log("Error getting documents:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching message count." });
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
