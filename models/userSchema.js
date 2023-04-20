import mongoose from "mongoose";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Unknown",
    },
    socialId: {
      type: String,
      default: "",
    },
    picture: {
      type: String,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      trim: true,
    },
    token: {
      type: String,
      required: true,
    },
    // Otp: String,
    projects: [
      {
        projectName: {
          type: String,
          default: "Unknown",
        },
        myTask: [{ title: String, cards: [{}] }],
        team: [
          {
            teamName: {
              type: String,
              default: "Unknown",
            },
            members: [
              {
                image: {
                  // data: Buffer,
                  type: String,
                },
                memberName: {
                  type: String,
                },
                memberEmail: {
                  type: String,
                },
                link: {
                  type: String,
                },
              },
            ],
          },
        ],
        workSpace: [
          {
            name: String,
            data: [
              {
                title: String,
                cards: [{}],
              },
            ],
          },
        ],

        AllMember: [
          {
            image: {
              // data: Buffer,
              type: String,
            },
            memberName: {
              type: String,
            },
            memberEmail: {
              type: String,
            },
            link: {
              type: String,
            },
          },
        ],
        Labels:[
          {
            name:{
              type:String,
       
            },
            value:{
              type:String,
    
            },
            status:String
          },
        ],
      },
    ],
   
    AllMember: [
      {
        image: {
          // data: Buffer,
          type: String,
        },
        memberName: {
          type: String,
        },
        memberEmail: {
          type: String,
        },
        link: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// userSchema.pre("save",async function(next){
//   if(this.isModified("password")){
//     this.password=await bcrypt.hash(this.password,10);
//   }
//   next()
// })
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (!this.email) {
    return next(new Error("Email is required"));
  }

  const user = await User.findOne({ email: this.email });
  if (user) {
    return next(new Error("Email already exists"));
  }

  next();
});

const User = mongoose.model("User", userSchema);
export default User;
