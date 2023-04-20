// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import userRouter from "./routes/User.js";
// import passport from "passport";
// import * as passportSetup from "./passport.js";
// import cookieSession from "cookie-session"
// import session from 'express-session';

// import router from "./routes/auth.js";
// const app = express();
// const PORT = process.env.PORT || 8000;
// dotenv.config();
// app.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));




// // Set the strictQuery option to false
// mongoose.set("strictQuery", false);
// const Connection = async (url) => {
//   try {
//      mongoose.connect(url, {
//       useUnifiedTopology: true,
//       useNewUrlParser: true,
//     });
//     console.log("Database Connected Successfully");
//   } catch (error) {
//     console.log("Error During DB Connection:- ", error.message);
//   }
// };
// const url = process.env.MONGODB_URI;
// Connection(url);
// app.use(userRouter);
// app.use("/auth",router);
// app.use(session({
//   secret: 'your-secret-key',
//   resave: false,
//   saveUninitialized: true
// }));

// app.use(
//   cookieSession({ name: "session", keys: ["lama"], maxAge: 24 * 60 * 60 * 100 })
// );
// app.use(passport.initialize());
// app.use(passport.session());

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });







import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRouter from "./routes/User.js";
import passport from "passport";
import * as passportSetup from "./passport.js";
import session from 'express-session';
import cookieParser from "cookie-parser";

import router from "./routes/auth.js";
import path from 'path';
const app = express();
const PORT = process.env.PORT || 8000;
dotenv.config();
// const __dirname = path.dirname("");
// const buildPath = path.join(__dirname, "../FrontE/build");

// app.use(express.static(buildPath));

// app.get("/*", function (req, res) {
//   const filePath = path.join(__dirname, "../FrontE/build/index.html");
//   res.sendFile(path.resolve(filePath), function (err) {
//     if (err) {
//       res.status(500).send(err);
//     }
//   });
// });

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use("/", express.static("uploads"))
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(session({

  name: 'mskdjsamedddd',
  secret: 'keyboard cat', resave: true, saveUninitialized: true
}));

// Set the strictQuery option to false
mongoose.set("strictQuery", false);

const Connection = async (url) => {
  try {
    mongoose.connect(url, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log("Error During DB Connection:- ", error.message);
  }
};
const url = process.env.MONGODB_URI;
Connection(url);








app.use(userRouter);
app.use("/auth", router);
app.use(session({
  name: 'mskdjsame',
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    name: 'mskdjsameaaaa',

    secure: true, // make sure the cookie is only sent over HTTPS
    maxAge: 3600000 // expire the cookie after 1 hour (in milliseconds)
  }
}));

app.use(passport.initialize());
app.use(passport.session());


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



