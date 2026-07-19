const mongoose = require('mongoose');

const weatherCacheSchema = new mongoose.Schema({
    geohash: {
        type: String,
        required: true,
    },
    forecastTime: {
        type: Date,
        required: true,
    },
   weatherData: {
        // Core temperature metrics
        temperature: Number,          // Actual temperature
        feelsLike: Number,            // Apparent (feels like) temperature
        
        // Wind & Precipitation
        windSpeed: Number,            // Wind speed
        windDirection: Number,        // Wind direction in degrees
        windGust: Number,             // Sudden wind gusts
        precipitation: Number,        // Precipitation amount (mm)
        pop: Number,                  // Probability of Precipitation (%)
        
        // Atmosphere & Visibility
        humidity: Number,             // Humidity percentage %
        pressure: Number,             // Atmospheric pressure (hPa)
        visibility: Number,           // Visibility range (meters or km)
        clouds: Number,               // Cloudiness percentage %
        uvIndex: Number,              // UV Index
        dewPoint: Number,             // Dew point
        
        // Descriptions & Assets
        condition: String,            // Main weather group (e.g., Rain, Clear, Clouds)
        description: String,          // Detailed weather description
        icon: String,                 // Icon code from the API provider for frontend rendering

        // System risk assessment
        // weatherData: mongoose.Schema.Types.Mixed, flix data apis
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 1800,// delete the doc automically after 30mins
    },
});

weatherCacheSchema.index({geohash: 1, forecastTime:1}, {unique: true});

const WeatherCache =  mongoose.model('WeatherCache', weatherCacheSchema);
module.exports = WeatherCache;






//  سيناريوهات الكوارث والـ Debugging
// الكارثة: ValidationError:waypoints.0.location.latis required.
// العلامة: السيرفر يرد بـ 400 Bad Request.
// السبب: الـ routeController حاول يحفظ نقطة من غير lat (مثلاً جايب بيانات فاضية من الـ API).
// الحل: اطبع الـ rawWaypoints في التيرمينال وتأكد إن كل نقطة فيها lat و lng.

// الكارثة: CastError: Cast to ObjectId failed for value "abc".
// العلامة: لما تجيب الرحلة بـ findById.
// السبب: الـ ID اللي جاي من الـ Frontend مش صالح (مش 24 حرف Hexa).
// الحل: في الـ Controller، قبل ما تعمل findById، تأكد إن الـ ID صحيح.

// الكارثة: الأداء بطيء في صفحة التاريخ.
// العلامة: الـ Request ياخد 5 ثواني.
// السبب: نسيت تضيف tripSchema.index({ userId: 1, createdAt: -1 })، أو في الـ Controller بتجيب كل الحقول (بما فيها routePolyline الكبيرة) بدل ما تستخدم .select('-waypoints -routePolyline').
// الحل: موجود في الـ Controller عندنا بيستخدم .select، حلو.

// 8️⃣ مساحة التطور والتوسعة (Scale & Extend)
// لو المشروع كبر وبقى في مليون رحلة: هنضيف التقسيم (Sharding) في MongoDB على أساس userId، عشان كل مستخدم بياناته تكون في شارد منفصل. الـ Index اللي عملناه (userId, createdAt) هيكون مفيد جداً في نظام التقسيم.

// لو عايز تضيف "مشاركة الرحلة": هتضيف حقل shareToken جوه الـ Schema، وتعمله index: { unique: true }، عشان لو حد فتح الرابط، نقدر نجيب الرحلة من غير ما نبعت الـ userId.

// لو عايز تتعامل مع مسارات أطول: النقطة الضعيفة هنا هي routePolyline، لو المسافة 1000 كيلو، هتخزن آلاف النقاط. ممكن تضيف ضغط (Compression) أو تقلل عدد النقاط بـ (Simplify) قبل الحفظ.


