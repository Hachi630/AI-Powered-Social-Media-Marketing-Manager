import { Schema, model } from "mongoose";

const TwitterTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  twitterUserId: { type: String },
  accessToken: { type: String, required: true },
  accessSecret: { type: String, required: true },
  expiresAt: { type: Date }
});

export default model("TwitterToken", TwitterTokenSchema);

