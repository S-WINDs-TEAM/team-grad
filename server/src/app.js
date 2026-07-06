
// libs
console.log("server start calling app")

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const routeRoutes = require('./routes/routeRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

const geocodeRoutes = require('../src/routes/geocodeRoutes');

const app = express();

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin : 'http://localhost:5173',
    credentials: true,
}));

//endpoints routes here:
app.use('/api/auth', authRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/geocode', geocodeRoutes);




app.get('/', (req, res)=>{
    res.status(200).json({msg: "wind api is ruunnig"});

});

app.use(errorHandler);
console.log("server end calling app")

module.exports = app;



// const PORT = process.env.PORT || 6000;

// app.listen(PORT, ()=>{
//     console.log(`server is powerd on port: ${PORT}`);
// });


// الكارثة: المتصفح يطلعلك CORS error (الفرونت مش عارف يتواصل).
// العلامة: في الـ Network بقى blocked by CORS policy.
// الحل: تأكد إن origin في cors() مظبوط على الرابط اللي شغال عليه الفرونت بالظبط (من غير / في الآخر).

// الكارثة: req.body دايمًا فاضي (undefined) رغم إنك باعت بيانات.
// العلامة: الـ API بتاعك بيرجع undefined.
// الحل: تأكد إن الـ app.use(express.json()) مكتوب قبل الـ Routes، مش بعدها.


// مساحة التطور والتوسعة (Scale & Extend)
// لو المشروع كبر: هتحتاج تضيف helmet (يخفي هوية السيرفر للأمان) و express-rate-limit (يحدد عدد الطلبات لكل IP عشان محدش يضرب السيرفر). هتكتبهم كـ app.use قبل الـ Routes.

// لو عندك 50 Route: مش هتفضل تكتب app.use لكل واحد. هتعمل fs.readdirSync تقرأ مجلد routes وتضيفهم أوتوماتيكياً. لكن الوقت الحالي، الكتابة اليدوية أوضح للفهم.
