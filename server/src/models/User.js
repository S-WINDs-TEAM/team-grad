const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // company_driver accounts are created by the company_admin WITHOUT a password —
      // the driver sets their own password later through the invite link.
      required: function () {
        return this.accountStatus !== "invited";
      },
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["individual", "company_admin", "company_driver"],
      default: "individual",
    },
    vehicleType: {
      type: String,
      enum: ["car", "motorcycle", "truck"],
      default: "car",
    },
    // في User.js, أضف الحقل ده في الـ Schema
    vehicleHeight: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    // only set for company_admin and company_driver accounts. null for individual.
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
    // 'invited' = company_driver created by an admin but hasn't set a password yet.
    // 'active' = normal, can log in.
    accountStatus: {
      type: String,
      enum: ["active", "invited"],
      default: "active",
    },
    // relative path served via express.static, e.g. /uploads/171234-abc.jpg — see uploadMiddleware.js
    profilePhoto: {
      type: String,
      default: null,
    },
    // invite token is stored HASHED (same idea as a password-reset token) —
    // the raw token only ever lives in the email link, never in the DB.
    inviteToken: { type: String, default: null, select: false },
    inviteTokenExpiry: { type: Date, default: null, select: false },

    refreshToken: {
      token: { type: String, default: null },
      createdAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
      deviceFingerprint: { type: String, default: null },
      lastIP: { type: String, default: null },
      countryCode: { type: String, default: null },
    },
    workStatus: {
      type: String,
      enum: ["available", "resting", "on_break", "on_leave", "deactivated"],
      default: "available",
    },
    mobile: { type: String, default: null },
    nationalId: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    currentBreak: {
      startedAt: { type: Date, default: null },
      requestedMin: { type: Number, default: null },
      status: { type: String, default: null }, // 'active' | 'completed' | 'overrun'
    },
    breakOverruns: { type: Number, default: 0 },
  },
  { timestamps: true },
);

//save hashed password

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  if (!this.password) return; // invited driver with no password set yet — nothing to hash
  this.password = await bcrypt.hash(this.password, 12);
});

// compaire method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // invited driver hasn't set a password yet
  return await bcrypt.compare(candidatePassword, this.password);
};

// generates a raw invite token for a company_driver, stores its HASH on this document,
// and returns the RAW token so the caller can put it in the invite link/email.
userSchema.methods.generateInviteToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.inviteToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.inviteTokenExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days to accept
  return rawToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;

// pre('save') = "نفذ الكود ده قبل ما تحفظ المستخدم في الداتابيز".

// function() = لازم تكون دالة عادية (مش Arrow Function) عشان نحافظ على قيمة this (اللي هي المستخدم الحالي
// 8️⃣ مساحة التطور

// لو عايز تضيف "تسجيل دخول بجوجل"، هتضيف حقل googleId: String هنا، وتخلي password اختياري (required: false). ده تطوير سهل جداً.
// لو عايز تضيف تحقق بخطوتين (2FA): هتضيف حقل twoFactorSecret: String و isTwoFactorEnabled: Boolean.

// لو عايز تحسن أداء البحث: تقدر تضيف index على حقل email عشان البحث عنه يكون أسرع (مكتوب أوتوماتيك بسبب unique: true).

// لو عايز تضيف Soft Delete: بدل ما تحذف المستخدم نهائياً، تضيف حقل isDeleted: { type: Boolean, default: false } وتعدل الـ Queries عشان تجيب بس اللي isDeleted: false.
