import { Schema, model, type Document, type Model, type Types } from 'mongoose';
import type { UserResponse } from '../types/shared';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: 'hr' | 'admin';
  refreshToken: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject: () => UserResponse;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['hr', 'admin'], default: 'hr' },
    refreshToken: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.methods.toSafeObject = function toSafeObject(this: IUser): UserResponse {
  return {
    _id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt.toISOString(),
  };
};

export const User: Model<IUser> = model<IUser>('User', userSchema);
