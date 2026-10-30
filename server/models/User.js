const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores']
    },
    displayName: {
      type: String,
      required: [true, 'Display name is required'],
      trim: true,
      maxlength: [50, 'Display name cannot exceed 50 characters']
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required']
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: 'Somewhere between hello and forever, I found my favourite person.'
    },
    relationshipStartDate: {
      type: Date,
      default: null
    },
    customQuote: {
      type: String,
      default: 'Somewhere between hello and forever, I found my favourite person.'
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    pushSubscriptions: [
      {
        endpoint: { type: String, required: true },
        keys: {
          p256dh: { type: String, required: true },
          auth: { type: String, required: true }
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Never return passwordHash in json output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
