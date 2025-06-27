import mongoose from "mongoose";
const { Schema } = mongoose;
const SignupSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  confirmpassword: { type: String,  },
  image: { type: String , default:null},
  role: { type: String, enum: ["user", "admin"],},
});
export default mongoose.model("Accounts", SignupSchema);