import express from "express";
import User from "../models/userSchema.js";
import jwt from "jsonwebtoken";
import bcrypt, { compare } from "bcrypt";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";

import passport from "passport";
import multer from "multer";

const userRouter = express.Router();
//////////////////   User Register

userRouter.post("/user/register", async (req, res) => {
  try {
    let tokenGen;
    // User.find({}, async function (err, docs) {
    const userEnroll = new User({
      name: "UnknownName",
      picture: req.body.data.picture,
      email: req.body.data.email,
      password: req.body.data.password,
      token: "kkj",
      projects: [
        {
          task: [],
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
          email: req.body.data.email,
        },
        { $set: { token: tokenGen } },
        { new: true }
      );
      console.log("User enrolled");
      return res
        .status(201)
        .json({ status: 201, email: req.body.data.email, tokenGen: tokenGen });
    } else {
      return res.status(422).json({ message: "User not enroll", status: 422 });
    }

    // });
  } catch (e) {
    console.log("Error in Enrollment User 1 =>", e.message);
    return res.status(422).json({ message: "User not enroll", status: 422 });
  }
});

//////////////////////   User Login

userRouter.post("/user/login", async (req, res) => {
  try {
    const email = req.body.data.email;
    const password = req.body.data.password;
    const UserDetail = await User.findOne({ email: email });
    const isMatch = await bcrypt.compare(password, UserDetail.password);
    console.log("dsdsbdsbd", isMatch);
    if (isMatch)
      return res.status(201).json({ status: 201, userDetail: UserDetail });
    else {
      return res.status(422).json({ message: "User not Login", status: 422 });
    }
  } catch (e) {
    console.log("Error in User Login 2 =>", e.message);
    return res.status(422).json({ message: "User not Login", status: 422 });
  }
});
//////////////////////   User Project

userRouter.post("/user/project", async (req, res) => {
  try {
    let email, project, token;

    if (req.body.source === "google") {
      const userDetail = JSON.parse(req.cookies.userDetail);
      email = userDetail.Email;
      project = req.body.data.project;
      const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { $set: { "projects.0.projectName": project } },
        { new: true }
      );
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    } else {
      token = req.body.token;
      project = req.body.data.project;
      const updatedUser = await User.findOneAndUpdate(
        { token: token },
        { $push: { projects: { projectName: project } } },
        { new: true }
      );
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    }
  } catch (err) {
    console.log("Error in updating user project:1", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
////////////////////////////////////////////////////////   User MyTask

userRouter.post("/user/myTask", async (req, res) => {
  try {
    // console.log("HGgtt6726", updatedUser.projects.find((ele,ind)=>{
    //   if(ele.projectName==project)
    //   return ele
    // }).myTask.length == 0)

    let project, token, updatedUser;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;

    updatedUser = await User.findOneAndUpdate({ token: token });

    if (
      updatedUser.projects.find((ele, ind) => {
        if (ele.projectName == project) return ele;
      }).myTask.length == 0
    ) {
      let kanbanData = [
        {
          title: "All",
          cards: [],
        },
        {
          title: "Backlog",
          cards: [],
        },
        {
          title: "Assigned",
          cards: [],
        },
        {
          title: "Created",
          cards: [],
        },
        {
          title: "Completed",
          cards: [],
        },
      ];

      updatedUser = await User.findOneAndUpdate(
        {
          token: token,
          "projects.projectName": project,
        },
        { $push: { "projects.$.myTask": kanbanData } },
        {
          new: true,
        }
      );
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    }
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:2", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});

///////////////////////////////////////////////  Add ticket in Mytask

userRouter.post("/user/mytask/add/ticket", async (req, res) => {
  try {
    let project, token, ticketName;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    ticketName = req.body.ticketName;
    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
      },
      {
        $push: {
          "projects.$.myTask": ticketName,
        },
      },
      {
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});


///////////////////////////////////////////////  Add Mytask

userRouter.post("/user/mytask/add", async (req, res) => {
  try {
    let project, token, kanbanData, ticketName;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    kanbanData = req.body.tokenData.kanbanData.data;
    console.log("Trsd",kanbanData)
    ticketName = req.body.tokenData.kanbanData.ticketName;
    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.myTask.title": ticketName,
      },
      {
        $push: {
          "projects.$[proj].myTask.$[task].cards": {
            $each: [kanbanData],
            $position: 0,
          },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "task.title": ticketName },
        ],
        new: true,
      }
    );

    updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.myTask.title": "All",
      },
      {
        $push: {
          "projects.$[proj].myTask.$[task].cards": {
            $each: [kanbanData],
            $position: 0,
          },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "task.title": "All" },
        ],
        new: true,
      }
    );

    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
///////////////////////////////////////////////  Update  Mytask

userRouter.post("/user/mytask/update", async (req, res) => {
  try {
   
      let token = req.body.tokenData.token;
      let project = req.body.tokenData.project;
      let  kanbanData = req.body.tokenData.kanbanData.data;
      let  kanbanData1 = req.body.tokenData.kanbanData.data1;
      let  ticketName = req.body.tokenData.kanbanData.ticketName;
      // Drag and Drop
      let  migrationValue = req.body.tokenData.migrationState.value;
      let  migrationStateValue = req.body.tokenData.migrationState.state;

    

      let updatedUser,updatedUser1;
         updatedUser = await User.findOneAndUpdate(
        {
          token: token,
          "projects.projectName": project,
          "projects.myTask.title": ticketName,
        },
        {
          $set: {
            "projects.$[proj].myTask.$[task].cards": kanbanData.cards,
          },
        },
        {
          arrayFilters: [
            { "proj.projectName": project },
            { "task.title": ticketName },
          ],
          new: true,
        }
      );
      if (migrationStateValue==true) {
        console.log("as8yuy3u42112")

        updatedUser1=   await User.findOneAndUpdate(
          {
            token: token,
            "projects.projectName": project,
            "projects.myTask.title": migrationValue,
          },
          {
            $set: {
              "projects.$[proj].myTask.$[task].cards": kanbanData1.cards,
            },
          },
          {
            arrayFilters: [
              { "proj.projectName": project },
              { "task.title": migrationValue },
            ],
            new: true,
          }
        );
      } else {
     
        updatedUser1=  await User.findOneAndUpdate(
          {
            token: token,
            "projects.projectName": project,
            "projects.myTask.title": "All",
          },
          {
            $set: {
              "projects.$[proj].myTask.$[task].cards": kanbanData1.cards,
            },
          },
          {
            arrayFilters: [
              { "proj.projectName": project },
              { "task.title": "All" },
            ],
            new: true,
          }
        );
      }

      return res.status(201).json({ status: 201, updatedUser: updatedUser1 });
  } catch (err) {
    console.log("Error in updating user project:4", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
















///////////////////////////////////////////////  Add SubTask

userRouter.post("/user/mytask/add/subtask", async (req, res) => {
  try {
    let project, token, kanbanData, ticketName,taskNameId;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    kanbanData = req.body.tokenData.kanbanData.data;
    ticketName = req.body.tokenData.kanbanData.ticketName;
    taskNameId=req.body.tokenData.kanbanData.taskNameId;
    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.myTask.title": ticketName,
        "projects.myTask.cards._id": taskNameId,
      },
      {
        $push: {
          "projects.$[proj].myTask.$[task].cards.$[car].tasks.0.subtask": {
            $each:[kanbanData],
            $position: 0,

          }
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "task.title": ticketName },
          { "car._id": taskNameId },
        ],
        new: true,
      }
    );
    
    
    
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});

///////////////////////////////////////////////  Add SubTask in Domain Task

userRouter.post("/user/workspace/task/subtask", async (req, res) => {
  try {
    let token = req.body.tokenData.token;
    let project = req.body.tokenData.project;
    let workspaceName = req.body.tokenData.workspaceName;
    let kanbanData = req.body.tokenData.kanbanData.data;
    let domainName = req.body.tokenData.kanbanData.domainName;
    let ticketName = req.body.tokenData.kanbanData.ticketName1;
    let ticketName2 = req.body.tokenData.kanbanData.ticketName2;
   let taskNameId=req.body.tokenData.kanbanData.taskNameId;
    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": ticketName,
        "projects.workSpace.data.cards.name": domainName,
        "projects.workSpace.data.cards.tasks.title": ticketName2,
        "projects.workSpace.data.cards.tasks.cards._id": taskNameId,
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[ws].data.$[d].cards.$[c].tasks.$[t].cards.$[car].tasks.0.subtask":
            {
              $each: [kanbanData],
              $position: 0,
            },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "ws.name": workspaceName },
          { "d.title": ticketName },
          { "c.name": domainName },
          { "t.title": ticketName2 },
          { "car._id": taskNameId },
        ],
        new: true,
      }
    );
    
    
    
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});

///////////////////////////////////////////////  Update SubTask

userRouter.post("/user/mytask/update/subtask", async (req, res) => {
  try {
    let project, token, kanbanData, ticketName,taskNameId;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    kanbanData = req.body.tokenData.kanbanData.data;
    ticketName = req.body.tokenData.kanbanData.ticketName;
    taskNameId=req.body.tokenData.kanbanData.taskNameId;

    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.myTask.title": ticketName,
        "projects.myTask.cards._id": taskNameId,
      },
      {
        $set: {
          "projects.$[proj].myTask.$[task].cards.$[car].tasks.0.subtask": kanbanData
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "task.title": ticketName },
          { "car._id": taskNameId },
        ],
        new: true,
      }
    );
    
    
    
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});




////////////////////////////////////////////////////////   User WorkSpace

userRouter.post("/user/workspace", async (req, res) => {
  try {
    let project, token, workspaceName;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    workspaceName = req.body.data;
    let updatedUser = await User.findOneAndUpdate(
      { token: token, "projects.projectName": project },
      { $push: { "projects.$.workSpace": { name: workspaceName, data: [] } } },
      { new: true }
    );
    if (
      updatedUser.projects
        .find((ele, ind) => {
          if (ele.projectName == project) return ele;
        })
        .workSpace.find((ele, ind) => {
          if (ele.name === workspaceName) return ele;
        }).data.length == 0
    ) {
      let kanbanData = [
        {
          title: "All",
          cards: [],
        },
        {
          title: "Backlog",
          cards: [],
        },
        {
          title: "Assigned",
          cards: [],
        },
        {
          title: "Created",
          cards: [],
        },
        {
          title: "Completed",
          cards: [],
        },
      ];

      updatedUser = await User.findOneAndUpdate(
        {
          token: token,
          "projects.projectName": project,
          "projects.workSpace.name": workspaceName,
        },
        { $push: { "projects.$[proj].workSpace.$[t].data": kanbanData } },
        {
          arrayFilters: [
            { "proj.projectName": project },
            { "t.name": workspaceName },
          ],
          new: true,
        }
      );
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    }

    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:5", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});

///////////////////////////////////////////////  Add Domain in WorkSpace

userRouter.post("/user/workspace/domain", async (req, res) => {
  try {
    let project, token, workspaceName, kanbanData, ticketName;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    workspaceName = req.body.tokenData.workspaceName;
    // Object
    kanbanData = req.body.tokenData.kanbanData.data;
    ticketName = req.body.tokenData.kanbanData.ticketName;

    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": ticketName,
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[t].data.$[h].cards": {
            $each: [kanbanData],
            $position: 0,
          },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "t.name": workspaceName },
          { "h.title": ticketName },
        ],
        new: true,
      }
    );
    updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": "All",
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[t].data.$[h].cards": {
            $each: [kanbanData],
            $position: 0,
          },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "t.name": workspaceName },
          { "h.title": "All" },
        ],
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:6", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
////////////////////////////////////////////// Update workspace. Domain Section

userRouter.post("/user/domain/update", async (req, res) => {
  try {
   let token = req.body.tokenData.token;
  let  project = req.body.tokenData.project;
  let  kanbanData = req.body.tokenData.kanbanData.data;
   let kanbanData1 = req.body.tokenData.kanbanData.data1;
   let ticketName = req.body.tokenData.kanbanData.ticketName;
   let workspaceName = req.body.tokenData.workspaceName;
   let migrationValue = req.body.tokenData.migrationState.value;
   let migrationStateValue = req.body.tokenData.migrationState.state;

    if (kanbanData.cards.length >= 1 && kanbanData1.cards.length >= 1) {
      console.log("uypppq", project, workspaceName, ticketName);

      let updatedUser = await User.findOneAndUpdate(
        {
          token: token,
          "projects.projectName": project,
          "projects.workSpace.name": workspaceName,
          "projects.workSpace.data.title": ticketName,
        },
        {
          $set: {
            "projects.$[proj].workSpace.$[t].data.$[h].cards": kanbanData.cards,
          },
        },
        {
          arrayFilters: [
            { "proj.projectName": project },
            { "t.name": workspaceName },
            { "h.title": ticketName },
          ],
          new: true,
        }
      );

      if (migrationStateValue) {
        updatedUser = await User.findOneAndUpdate(
          {
            token: token,
            "projects.projectName": project,
            "projects.workSpace.name": workspaceName,
            "projects.workSpace.data.title": migrationValue,
          },
          {
            $set: {
              "projects.$[proj].workSpace.$[t].data.$[h].cards":
                kanbanData1.cards,
            },
          },
          {
            arrayFilters: [
              { "proj.projectName": project },
              { "t.name": workspaceName },
              { "h.title": migrationValue },
            ],
            new: true,
          }
        );
      } else {
        updatedUser = await User.findOneAndUpdate(
          {
            token: token,
            "projects.projectName": project,
            "projects.workSpace.name": workspaceName,
            "projects.workSpace.data.title": "All",
          },
          {
            $set: {
              "projects.$[proj].workSpace.$[t].data.$[h].cards":
                kanbanData1.cards,
            },
          },
          {
            arrayFilters: [
              { "proj.projectName": project },
              { "t.name": workspaceName },
              { "h.title": "All" },
            ],
            new: true,
          }
        );
      }

      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    }
  } catch (err) {
    console.log("Error in updating user project domain:4", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});

///////////////////////////////////////////////  Add Task in Domain Section

userRouter.post("/user/workspace/task", async (req, res) => {
  try {
    let token = req.body.tokenData.token;
    let project = req.body.tokenData.project;
    let workspaceName = req.body.tokenData.workspaceName;
    let kanbanData = req.body.tokenData.kanbanData.data;
    let domainName = req.body.tokenData.kanbanData.domainName;
    let ticketName = req.body.tokenData.kanbanData.ticketName1;
    let ticketName2 = req.body.tokenData.kanbanData.ticketName2;

    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": ticketName,
        "projects.workSpace.data.cards.name": domainName,
        "projects.workSpace.data.cards.tasks.title": ticketName2,
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[ws].data.$[d].cards.$[c].tasks.$[t].cards":
            {
              $each: [kanbanData],
              $position: 0,
            },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "ws.name": workspaceName },
          { "d.title": ticketName },
          { "c.name": domainName },
          { "t.title": ticketName2 },
        ],
        new: true,
      }
    );
    updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": ticketName,
        "projects.workSpace.data.cards.name": domainName,
        "projects.workSpace.data.cards.tasks.title": "All",
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[ws].data.$[d].cards.$[c].tasks.$[t].cards":
            {
              $each: [kanbanData],
              $position: 0,
            },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "ws.name": workspaceName },
          { "d.title": ticketName },
          { "c.name": domainName },
          { "t.title": "All" },
        ],
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedData: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:7", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
///////////////////////////////////////////////  Update Task in  Domain Section

userRouter.post("/user/workspace/task/update", async (req, res) => {
  try {
    let token = req.body.tokenData.token;
    let project = req.body.tokenData.project;
    let workspaceName = req.body.tokenData.workspaceName;
    let kanbanData = req.body.tokenData.kanbanData.data;
    let kanbanData1 = req.body.tokenData.kanbanData.data1;
    let domainID = req.body.tokenData.kanbanData.domainName;
    let ticketName = req.body.tokenData.kanbanData.ticketName1;
    let ticketName2 = req.body.tokenData.kanbanData.ticketName2;
    // let  migrationValue=req.body.tokenData.migrationState.value;
    // let  migrationStateValue=req.body.tokenData.migrationState.state;
    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": ticketName,
        "projects.workSpace.data.cards._id": domainID,
        "projects.workSpace.data.cards.tasks.title": ticketName2,
      },
      {
        $set: {
          "projects.$[proj].workSpace.$[ws].data.$[d].cards.$[c].tasks.$[t].cards":
            kanbanData.cards,
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "ws.name": workspaceName },
          { "d.title": ticketName },
          { "c._id": domainID },
          { "t.title": ticketName2 },
        ],
        new: true,
      }
    );
    updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": ticketName,
        "projects.workSpace.data.cards._id": domainID,
        "projects.workSpace.data.cards.tasks.title": "All",
      },
      {
        $set: {
          "projects.$[proj].workSpace.$[ws].data.$[d].cards.$[c].tasks.$[t].cards":
            kanbanData1.cards,
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "ws.name": workspaceName },
          { "d.title": ticketName },
          { "c._id": domainID },
          { "t.title": "All" },
        ],
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedData: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:7", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});


///////////////////////////////////////////////  Add ticket in Domains

userRouter.post("/user/add/Domain/ticket", async (req, res) => {
  try {
    let project, token, ticketName;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    ticketName = req.body.ticketName;
   let workspaceName = req.body.workspaceName;
    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[t].data": ticketName,
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "t.name": workspaceName },
        ],
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
///////////////////////////////////////////////  Add ticket in Domains Tasks

userRouter.post("/user/add/Domain/task/ticket", async (req, res) => {
  try {
    let project, token, ticketName;
    token = req.body.tokenData.token;
    project = req.body.tokenData.project;
    ticketName = req.body.ticketName;
   let workspaceName = req.body.workspaceName;
   let domainName = req.body.domainName;
   let domainTicketName=req.body.domainTicketName
   

console.log("uyduy777",domainTicketName,domainName,workspaceName)

    let updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
        "projects.workSpace.name": workspaceName,
        "projects.workSpace.data.title": domainTicketName,
        "projects.workSpace.data.cards.name": domainName,
      },
      {
        $push: {
          "projects.$[proj].workSpace.$[t].data.$[d].cards.$[c].tasks": ticketName,
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": project },
          { "t.name": workspaceName },
          { "d.title": domainTicketName },
          { "c.name": domainName },
        ],
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:3", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});


//////////////////////   User Project

userRouter.post("/delete/project", async (req, res) => {
  let project, token;

  try {
    token = req.body.token;
    project = req.body.data.projectName;
    const updatedUser = await User.findOneAndUpdate(
      { token: token },
      { $pull: { projects: { projectName: project } } },
      { new: true }
    );
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:8", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});
//////////////////////   Fetch User Details

userRouter.post("/user/fetchDetail", async (req, res) => {
  try {
    let updatedUser, email, userDetail;

    if (req.body.source === "google") {
      const userDetail = JSON.parse(req.cookies.userDetail);
      email = userDetail.Email;
      const updatedUser = await User.findOne({ email: email });
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    } else {
      updatedUser = await User.findOne({ token: req.body.data });
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    }

    //  else{
    //    userDetail= JSON.parse(req.cookies.userDetail);
    //    email= userDetail.Email;
    //    updatedUser = await User.findOne(
    //     { email: email },
    //   );
    //  }
  } catch (err) {
    console.log("Error in Fetching User: 100", err.message);
    return res.status(422).json({ message: "User  not fetch", status: 422 });
  }
});
//////////////////////////////////////////////// ///////////////////////   Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });
///////    Add member in Project
userRouter.post("/member/upload", upload.single("image"), async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "extraemailsh1207@gmail.com",
        pass: "eylvvgrclnlilanw",
      },
    });

    const { memberName, token, projectName, memberEmail, link } = req.body;
    const member = {
      image: req.file.filename,
      memberName: memberName,
      memberEmail: memberEmail,
      link: link,
    };

    const updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": projectName,
      },
      { $push: { AllMember: member } },
      {
        new: true,
      }
    );
    let info = await transporter.sendMail({
      from: "extraemailsh1207@gmail.com",
      // to: "bar@example.com, baz@example.com", // list of receivers
      to: memberEmail,
      subject: "Invitation to Edit/View Document",
      text: `You have been invited to the document. Click on the following link to access the document: ${link}`,
      html: `<b>Click this link to verify your email: ${link}</b>`, // html body
    });

    res.status(200).json({
      message: "Member added successfully",
      status: 200,
      updatedUser: updatedUser,
    });
  } catch (e) {
    console.log("Error in adding member =>", e.message);
    return res
      .status(422)
      .json({ message: "Unable to add member", status: 422 });
  }
});
// //////////////////////   OTP Generator
const otpCache = {}; // Otp memory cache 
userRouter.post("/generate/otp", async (req, res) => {
  try {
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
    });
    const userEmail = req.body.data;
  // Store OTP in cache with a 5-minute expiry time
  otpCache[userEmail] = {
    otp,
    expiry: Date.now() + 5 * 60 * 1000, 
  };
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "extraemailsh1207@gmail.com",
        pass: "eylvvgrclnlilanw",
      },
    });
    // const updatedUser = await User.findOneAndUpdate(
    //   {
    //     email: userEmail,
    //   },
    //   {
    //     $set: { Otp: otp },
    //   },
    //   {
    //     new: true,
    //   }
    // );
    let info = await transporter.sendMail({
      from: "extraemailsh1207@gmail.com",
      // to: memberEmail,
      to: "siner22165@fectode.com",
      subject: "Invitation to Edit/View Document",
      text: `You have been invited to the document. Click on the following link to access the document: ${otp}`,
      html: `<b>Your OTP for Reset Password is: ${otp}</b>`, // html body
    });
    res.status(200).json({
      message: "Member added successfully",
      status: 200,
      updatedUser: updatedUser,
    });
  } catch (e) {
    console.log("Error in gernate otp =>", e.message);
    return res
      .status(422)
      .json({ message: "Unable to gernate otp", status: 422 });
  }
});

//////////////////////   OTP Verify
userRouter.post("/generate/otp/verify", async (req, res) => {
  try {
    const userEmail = req.body.userEmail;
    const otpValue = req.body.data;
    // let updatedUser;
    // if (userEmail != "") {
    //   updatedUser = await User.findOne({
    //     email: userEmail,
    //   });
    // } else {
    //   updatedUser = await User.findOne({
    //     Otp: OtpValue,
    //   });
    // }
    // if (updatedUser.Otp == OtpValue) {
    //   res.status(200).json({
    //     status: 200,
    //     otpStatus: true,
    //   });
    // } else {
    //   res.status(422).json({
    //     status: 422,
    //     otpStatus: false,
    //   });
    // }
     // Check if OTP exists in cache and has not expired
     if (otpCache[userEmail] && otpCache[userEmail].otp === otpValue && otpCache[userEmail].expiry > Date.now()) {
      res.status(200).json({
        status: 200,
        otpStatus: true,
      });
    } else {
      res.status(422).json({
        status: 422,
        otpStatus: false,
      });
    }
  } catch (e) {
    console.log("Error in gernate otp2 =>", e.message);
    return res
      .status(422)
      .json({ message: "Unable to gernate otp", status: 422 });
  }
});



////////////////////////   Reset Password

userRouter.post("/resetPassword", async (req, res) => {
  try {
    const userEmail = req.body.userEmail;
    const newPassword = req.body.newPass;
    console.log("dshdhshdgs343", userEmail, newPassword);
    let updatedUser;
    if (userEmail != "") {
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      updatedUser = await User.findOneAndUpdate(
        {
          email: userEmail,
        },
        {
          $set: { password: newPasswordHash },
        },
        {
          new: true,
        }
      );
      return res.status(201).json({
        status: 201,
      });
    } else {
      return res.status(422).json({
        status: 422,
      });
    }
  } catch (e) {
    console.log("Error in gernate otp2 =>", e.message);
    return res
      .status(422)
      .json({ message: "Unable to gernate otp", status: 422 });
  }
});

////////////////////////////////    Selected Member

userRouter.post("/select/member", async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      {
        token: req.body.requireData.token,
        "projects.projectName": req.body.requireData.projectName,
        "projects.team._id": req.body.requireData.teamName._id,
      },
      {
        $addToSet: {
          "projects.$[proj].team.$[t].members": {
            $each: req.body.requireData.members,
          },
        },
      },
      {
        arrayFilters: [
          { "proj.projectName": req.body.requireData.projectName },
          { "t._id": req.body.requireData.teamName._id },
        ],
        new: true,
      }
    );

    res
      .status(200)
      .json({ message: "Member added successfully", updatedUser: updatedUser });
  } catch (e) {
    console.log("Error in adding member 101 =>", e.message);
    return res
      .status(422)
      .json({ message: "Unable to add member", status: 422 });
  }
});

//////////////////////////////////////////////////    Team
userRouter.post("/create/team", async (req, res) => {
  try {
    const teamData = req.body.data.teamName;
    const team = { teamName: teamData };
    const updatedUser = await User.findOneAndUpdate(
      {
        token: req.body.extraData.token,
        "projects.projectName": req.body.extraData.projectName,
      },
      { $push: { "projects.$.team": team } },
      { new: true }
    );

    res.status(200).json({
      message: "Team added successfully",
      userData: updatedUser,
    });
  } catch (e) {
    console.log("Error in adding team =>", e.message);
    return res.status(422).json({ message: "Unable to add team", status: 422 });
  }
});

///// Add Member in Particular Team
userRouter.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const { memberName, token, projectName, teamName } = req.body;
    const { filename } = req.file;
    const file = req.file ? req.file.filename : null;
    const member = { image: filename, memberName: memberName };

    const updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": projectName,
        "projects.team.teamName": teamName,
      },
      { $push: { "projects.$[proj].team.$[t].members": member } },
      {
        arrayFilters: [
          { "proj.projectName": projectName },
          { "t.teamName": teamName },
        ],
        new: true,
      }
    );

    res.status(200).json({ message: "Member added successfully" });
  } catch (e) {
    console.log("Error in adding member =>", e.message);
    return res
      .status(422)
      .json({ message: "Unable to add member", status: 422 });
  }
});



////////////////////////////////////////////////////////  Add Label

userRouter.post("/user/Labels", async (req, res) => {
  try {
    // console.log("HGgtt6726", updatedUser.projects.find((ele,ind)=>{
    //   if(ele.projectName==project)
    //   return ele
    // }).myTask.length == 0)

    let token = req.body.tokenData.token;
   let project = req.body.tokenData.project;
   let addNewOne=req.body.tokenData.newLabel;
   let labelDetail=req.body.labelDetail;

    

   let updatedUser = await User.findOneAndUpdate({ token: token });
  if(addNewOne==false){
    if (
      updatedUser.projects.find((ele, ind) => {
        if (ele.projectName == project) return ele;
      }).Labels.length == 0
    ) {
      let labelData = [
        {
          name:"Feature",
          value:"#D9D9D9",
          status:"",
        },
        {
          name:"Bug",
          value:"#FA4F57",
          status:"",

        },
        {
          name:"To Improve",
          value:"#055FFC",
          status:"",

        },
        {
          name:"Important",
          value:"#0EC478",
          status:"",

        },
      ];

      updatedUser = await User.findOneAndUpdate(
        {
          token: token,
          "projects.projectName": project,
        },
        { $push: { "projects.$.Labels": labelData } },
        {
          new: true,
        }
      );
      return res.status(201).json({ status: 201, updatedUser: updatedUser });
    }
  }
  else{
    updatedUser = await User.findOneAndUpdate(
      {
        token: token,
        "projects.projectName": project,
      },
      { $push: { "projects.$.Labels": labelDetail } },
      {
        new: true,
      }
    );
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  }
   
    return res.status(201).json({ status: 201, updatedUser: updatedUser });
  } catch (err) {
    console.log("Error in updating user project:2", err.message);
    return res
      .status(422)
      .json({ message: "User project not updated", status: 422 });
  }
});

// userRouter.post('/create/team', async (req, res) => {
//   try {
//     const teamData = req.body.data.teamName;
//     const team = { teamName: teamData };
//     console.log("sajkh72374",team,req.body.extraData.projectName,req.body.extraData.token)
//     const updatedUser = await User.findOne({ token: req.body.extraData.token }, (err, user) => {
//       if (err) throw err;
//       if (!user) {
//         console.log('User not found');
//         return;
//       }
//       const projectName = req.body.extraData.projectName;
//       const project = user.projects.find(p => p.projectName === projectName);
//       if (!project) {
//         console.log(`Project ${projectName} not found for user ${user.name}`);
//         return;
//       }
//       console.log(`Found project ${projectName} for user ${user.name}`);
//       console.log(project);
//     });
//     console.log("8776743473",updatedUser)

//     res.status(200).json({ message: 'Team added successfully' });
//   } catch (e) {
//     console.log('Error in adding team =>', e.message);
//     return res.status(422).json({ message: 'Unable to add team', status: 422 });
//   }
// });

export default userRouter;
