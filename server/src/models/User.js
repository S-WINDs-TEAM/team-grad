const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minlength: 6,
    },
    role: {
        type: String,
        enum: ['user', 'fleet_manager'],
        default: 'user',
    }, 
    vehicleType: {
        type: String,
        enum: ['car', 'motorcycle', 'truck'],
        default: 'car',
    },
    // refreshToken:{
    //     type: String,
    //     default: null,
    // },
    refreshToken: {
        token: {type: String, default: null},
        createdAt: {type: Date, default: null},
        expiresAt: {type: Date, default: null},
        deviceFingerprint: {type: String, default: null},
        lastIP: {type: String, default: null},
        countryCode: {type: String, default: null},
    },
}, {timestamps: true});

//save hashed password
// userSchema.pre('save',async function(next){
//     if (!this.isModified('password')) return next();
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// });

userSchema.pre('save', async function() {
    if (!this.isModified('password')) return; 
    this.password = await bcrypt.hash(this.password, 12);
    // if (this.isModified('password')) return this.password = await bcrypt.hash(this.password, 12); same logic but reverse
});



// compaire method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;




// pre('save') = "نفذ الكود ده قبل ما تحفظ المستخدم في الداتابيز".

// function() = لازم تكون دالة عادية (مش Arrow Function) عشان نحافظ على قيمة this (اللي هي المستخدم الحالي
// 8️⃣ مساحة التطور

// لو عايز تضيف "تسجيل دخول بجوجل"، هتضيف حقل googleId: String هنا، وتخلي password اختياري (required: false). ده تطوير سهل جداً.
// لو عايز تضيف تحقق بخطوتين (2FA): هتضيف حقل twoFactorSecret: String و isTwoFactorEnabled: Boolean.

// لو عايز تحسن أداء البحث: تقدر تضيف index على حقل email عشان البحث عنه يكون أسرع (مكتوب أوتوماتيك بسبب unique: true).

// لو عايز تضيف Soft Delete: بدل ما تحذف المستخدم نهائياً، تضيف حقل isDeleted: { type: Boolean, default: false } وتعدل الـ Queries عشان تجيب بس اللي isDeleted: false.
