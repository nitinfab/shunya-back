
import express from "express";
import passport from "passport";
const router = express.Router();
import dotenv from "dotenv";
import User from "../models/userSchema.js";

dotenv.config();


router.get("/login/success",(req,res)=>{
    var ttp=req.user;
 
    res.status(200).json({
      message:"success"
    })
  })
  // call from frontend to checked login or not.
  // router.get("/login/success",(req,res)=>{
  //   res.status(422).json({
  //     error:false,
  //     message:"Successfullt login in ",
  //     user:req.user
  //   })
  // })
  router.get("/login/failed",(req,res)=>{
    res.status(422).json({
      error:true,
      message:"something went wrong",
    })
  })

  ///Logout
  router.get("/logout",(req,res)=>{
   req.logout();
   res.redirect(process.env.CLIENT_URL)
  })
//////////////////////   Google Auth

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), function(req, res) {
  const userDetail = {
    Name: req.user.displayName,
    Email: req.user.emails[0].value,
    Status: req.user.emails[0].verified,
  };
  const cookieOptions = {
    httpOnly: true,
  };

  res.cookie('userDetail', JSON.stringify(userDetail), cookieOptions);
  User.findOne({ email: userDetail.Email }, function (err, user) {
    if (err) {
      return done(err);
    }
      if (req.authInfo==="userexist") {
        res.redirect(`http://localhost:3000/home/${user.projects[0].projectName}/0/home`);
      } else {
        res.redirect('http://localhost:3000/project/google');
      }
 
    } 
  );









 
});

 
  // router.get('/google/callback',
  // passport.authenticate('google', { failureRedirect: '/' }),
  // function(req, res) {
  //   const userDetail = {
  //     Name: req.user.displayName,
  //     Email: req.user.emails[0].value,
  //     Status: req.user.emails[0].verified,
  //   };
  //   console.log("Fitsyy2",req.user,res,userDetail)
  //   console.log("Fitsyy2ASdd",req.session.returnTo)
    
  //   const cookieOptions = {
  //     httpOnly: true,
  //   };

  //   res.cookie('userDetail', JSON.stringify(userDetail), cookieOptions);
  //   res.redirect('http://localhost:3000/project/google');


  // });

////////////////////   Linkdin Auth
// router.get('/linkedin/callback',
// passport.authenticate('linkedin', { failureRedirect: '/' }),
// function(req, res) {
//   // Successful authentication, set cookie and redirect
//   // const userDetail = {
//   //   Name: req.user.displayName,
//   //   Email: req.user.emails[0].value,
//   //   Status: req.user.emails[0].verified,
//   // };
//   const cookieOptions = {
//     httpOnly: true,
//     // other options as needed
//   };

//   // res.cookie('userDetail', JSON.stringify(userDetail), cookieOptions);
//   // res.redirect('http://localhost:3000/project/google');
// });



  // successRedirect:`http://localhost:3000/project`
   //   when start login
   router.get('/google', passport.authenticate('google', { scope: ['profile',`email`] }));
  
export default router;
