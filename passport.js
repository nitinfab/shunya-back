import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import express from "express";
import passport from "passport";
import User from "./models/userSchema.js";
import jwt from "jsonwebtoken";
import bcrypt, { compare } from "bcrypt";
import dotenv from "dotenv";

dotenv.config();
const userRouter = express.Router();

// profile -> user Information.like user id,photoand username.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/auth/google/callback",
      scope: ["profile", "email"],
    },
    function (accessToken, refreshToken, profile, done) {
      User.findOne({ socialId: profile.id }, function (err, user) {
        console.log("Second");
        if (err) {
          return done(err);
        }
        if (!user) {
          const userDetail = {
            Name: profile.displayName,
            Id: profile.id,
            Picture: profile.photos[0].value,
            Email: profile.emails[0].value,
            Status: profile.emails[0].verified,
            created: true,
          };
          googleUser(userDetail);

          done(null, profile,"usernotexist");
        } else {
          done(null, profile,"userexist");
        }
      });
    }
  )
);
/////////    Linkdin
// passport.use(new LinkedInStrategy({
//   clientID: process.env.LINKEDIN_API_ID,
//   clientSecret: process.env.LINKEDIN_SECRET_KEY,
//   callbackURL: "http://localhost:8000/auth/linkedin/callback",
//   scope:["profile","email"],
//   // scope: ['r_emailaddress', 'r_liteprofile'],
// },
// function(accessToken, refreshToken, profile, done) {
//   console.log("djfjsjde332",profile)
//   // const userDetail={
//   //   Name:profile.displayName,
//   //   Picture:profile.photos[0].value,
//   //   Email:profile.emails[0].value,
//   //   Status:profile.emails[0].verified,
//   // }
//   // googleUser(userDetail);

//   done(null,profile)
// }
// ));

// Session for serialize and deserialize
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});

const googleUser = async (userDetail) => {
  try {
    let tokenGen;

    const userEnroll = new User({
      name: userDetail.Name,
      socialId: userDetail.Id,
      picture: userDetail.Picture,
      email: userDetail.Email,
      password: "Mohan@123",
      token: "kkj",
      projects: [
        {
          task: [
            {
              week: [],
              month: [],
              year: [],
            },
          ],
        },
      ],
    });

    let registerID = await userEnroll.save();

    if (registerID) {
      tokenGen = jwt.sign(
        { _id: userEnroll._id.toString() },
        "mysnameisankitsharmaiamafullstack"
      );

      await User.findOneAndUpdate(
        {
          email: userDetail.Email,
        },
        { $set: { token: tokenGen } },
        { new: true }
      );

      console.log("User enrolled");

      return true;
    } else {
      return false;
    }
  } catch (e) {
    console.log("Error in Enrollment User =>", e);
    return false;
  }
};
