

const ngeohash = require('ngeohash');

const encodeGeohash = (lat, lng, precision = 5) => { //best precision for us is = 9, cause it = 5meter in ground but we use 5 here 5*5 km best for weather unite
    return ngeohash.encode(lat, lng, precision);
};

const roundToNearest30Min = (date)=> {  //every api call in 30 min grouped togather in on call - api limitation
    const ms = 30 * 60 *1000;
    return new Date(Math.round(date.getTime()/ms)*ms); // check for its 30 or not by mathing
};

const calculatemaxSafeSpeed = (weatherData, vehicleType) => {
    const {condition, windSpeed, visibility, precipitation} = weatherData; // get data condition from the wetherData by the destrctuer way of obj

    const baseSpeed = { car:120, motorcycle: 100, truck: 90} [vehicleType] || 120;
    let speedLimit = baseSpeed;

    if (condition === 'fog' || visibility < 0.2) speedLimit = Math.min(speedLimit, 40); // math.min(40) means 40 or less
    else if (visibility< 0.5) speedLimit = Math.min(speedLimit, 60);

    if (condition === 'sandstorm') speedLimit = Math.min(speedLimit, 30);

    if (precipitation>10) speedLimit = Math.min(speedLimit, 60);
    else if (precipitation >2) speedLimit = Math.min(speedLimit, 80);

    if (vehicleType === 'motorcycle' && windSpeed >40) speedLimit = Math.min(speedLimit, 60);
    if (vehicleType === 'truck' && windSpeed >50) speedLimit = Math.min(speedLimit, 70);
return speedLimit;
};

const calculateRiskLevel = (weatherData, vehicleType) => { // clac the safe speed and the risk level by the weather data and the vehicle type
    const maxSafeSpeed = calculatemaxSafeSpeed(weatherData, vehicleType);
    const {condition} = weatherData;
        // risk levels
        if (condition === 'sandstorm' || maxSafeSpeed <= 40) return 'high';
        if (condition === 'fog' || maxSafeSpeed <= 70) return 'medium';
        return 'low';
};

module.exports = {
    encodeGeohash,
    roundToNearest30Min,
    calculateRiskLevel,
    calculatemaxSafeSpeed,
};




// سيناريوهات الكوارث والـ Debugging
// الكارثة: الدالة بترجع NaN (Not a Number) أو undefined.
// العلامة: التطبيق يبوظ في منتصف الطريق.
// السبب: weatherData جاي فاضي (مفيش precipitation). لو الدالة حاولت تقارن undefined > 10، هترجع false وتكمل، بس ممكن تبوظ في حتة تانية.
// الحل: في بداية الدالة، نحط if (!weatherData) return 0; أو نضبط القيم الافتراضية.

// الكارثة: الموتوسيكل بياخد سرعة 100 في عاصفة رملية (لأن condition مكتوبة بحروف كبيرة Sandstorm).
// العلامة: المستخدمين بيبلغوا عن أخطاء.
// السبب: الـ API بيرجع condition بصيغة مختلفة (زي Sandstorm بدل sandstorm).
// الحل: في weatherService لما بنحول الـ WMO Code، نتأكد إن النص يكون toLowerCase().

// الكارثة: المستخدمين في المناطق الصحراوية دايمًا يشوفوا "خطر عالي" رغم إن الجو صافي.
// العلامة: شكاوى.
// التحليل: maxSafeSpeed <= 40 بترجع High. لو baseSpeed 90 (تريلا)، والجو صافي، السرعة هتفضل 90، يبقى آمن. المشكلة بتحصل لو في عاصفة. ده منطقي.

// 8️⃣ مساحة التطور والتوسعة (Scale & Extend)
// لو عايز تضيف أنواع عربيات جديدة (زي "bus" أو "bicycle"): هتضيفها في كائن baseSpeed بس. مش هتلمس أي حتة تانية في التطبيق. ده اسمه Open/Closed Principle (مفتوح للتوسعة، مغلق للتعديل).

// لو عايز تخلي الأرقام قابلة للتعديل من غير ما تلمس الكود (Dynamic Config): بدل ما تكتب 40 و 70 جامدة، هتخزنهم في ملف .env زي FOG_SPEED_LIMIT=40. وتقرأهم بـ process.env.FOG_SPEED_LIMIT. كده لو العميل قالك "خلي السرعة في الضباب 50 مش 40"، هتغيرها في .env من غير ما تلمس السطر ده.

// لو عايز تضيف عامل "الوقت" (الليل/النهار): هتضيف باراميتر isNight، وتخفض السرعة 10% في الليل. ده هيكون إضافة قوية جداً للأمان.