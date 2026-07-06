const mongoose = require('mongoose');
console.log("server start calling db");
const dbConnection = async ()=>{
    try{
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`db connected seccussfuly ${connect.connection.host}`)
    }catch(err){
        console.log(`err: ${err.message}`);
        process.exit(1); // if the connect faild the server shutdawn
    }
};

console.log("server end calling db");

// now we export it like any endpoint 
module.exports = dbConnection;
// we will catch it in the app file 


// مساحة التطور والتوسعة (Scale & Extend)
// لو المشروع كبر وبقى عندك 10,000 مستخدم: الاتصال الواحد هيكون بطيء. هنا بنضيف إعدادات إضافية في mongoose.connect زي { maxPoolSize: 10 } عشان يسمح بعشر عمليات قراءة وكتابة في نفس الوقت بدل واحدة.

// لو عايز تراقب الأداء: تقدر تضيف أحداث (Events) زي mongoose.connection.on('connected', ...) و mongoose.connection.on('disconnected', ...) عشان تعرف لو النت اتقطع من غير ما السيرفر يموت.

// لو عايز تستخدم Redis مع MongoDB: مش هنغير في الملف ده، بس هنضيف ملف تاني اسمه redis.js ونستدعيه في server.js جنب db.js.


