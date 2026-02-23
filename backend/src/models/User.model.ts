import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  walletAddress: string;
  username?: string;
  email?: string;
  tradeCount: number;   // fix: was missing — $inc silently failed
  totalVolume: number;  // fix: was missing — $inc silently failed
  nonce?: string;       // security fix: replay protection
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema: Schema = new Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  username: { type: String },
  email: { type: String },
  tradeCount:  { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 },
  nonce:       { type: String }, // Store current login challenge
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', UserSchema);