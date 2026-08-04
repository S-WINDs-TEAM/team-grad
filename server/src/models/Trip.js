const mongoose = require('mongoose');

const waypointSchema = new mongoose.Schema({
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  eta: { type: Date, required: true },
  distanceFromStart: { type: Number },
  weather: {
    temperature: Number,
    feelslike: Number,
    windSpeed: Number,
    windDirection: Number,
    windGust: Number,
    precipitation: Number,
    pop: Number,
    humidity: Number,
    pressure: Number,
    visibility: Number,
    clouds: Number,
    uvIndex: Number,
    dewPoint: Number,
    condition: String,
    description: String,
    icon: String,
    riskLevel: String,
  },
  maxSafeSpeed: { type: Number },
}, { _id: false }); //no id for waypoint cause its part from the trip preformunce and data saved

//cause mongoose the mongodb libr is making a ._id field for every unique document in thd db so every new waypoint in the road will take ._id and we dont need it for any search so we disable it 

const tripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
<<<<<<< HEAD
=======
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FleetVehicle',
      default: null, // null for individual trips or if trip doesnot linked with vehical
    },
>>>>>>> origin/ElSayed
    origin: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: String,
    },
    destination: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: String,
    },
    vehicleType: {
      type: String,
      enum: ['car', 'motorcycle', 'truck'],
      default: 'car',
    },
    departureTime: {
      type: Date,
      default: Date.now,
    },
    totalDistanceKm: Number,
    totalDurationMin: Number,
    waypoints: [waypointSchema],
    routePolyline: [[Number]],
    overallRiskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed'],
      default: 'planned',
    },
  },
  { timestamps: true }
);

tripSchema.index({ userId: 1, createdAt: -1 });
<<<<<<< HEAD

=======
//dashboard indx one vehicle trips in one day
tripSchema.index({vehicleId: 1, departureTime: 1});
>>>>>>> origin/ElSayed
const Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;










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











// مشكلة تأثير الرياح على استهلاك الوقود
// المشكلة حقيقية ومعقدة، لأنها مش مجرد "نوع العربية" (Car/Truck). الفرق بين سيارة انسيابية (نيسان) وجيب مربع (Jeep) في استهلاك الوقود يمكن أن يصل إلى 30% في الطرق السريعة بسبب الرياح المعاكسة.

// المعادلة الفيزيائية الأساسية:

// text
// قوة السحب (F_drag) = 0.5 × كثافة الهواء × معامل السحب (Cd) × المساحة الأمامية (A) × (سرعة العربية + سرعة الرياح)²
// إنت مش محتاج تكون عالم فيزياء، انت محتاج تعرف إن Cd و A هما المفتاح لحل المشكلة.

// 🛠️ الحل على 3 مستويات (من الأسهل للأدق)
// المستوى 1 (الحل الفوري) – تصنيف ذكي بدون تعقيد المستخدم
// بدل ما تسأل المستخدم "معامل السحب بتاع عربيتك كام؟" (وهو مش هيعرف)، اسأله "شكل عربيتك إيه؟" واختار القيم التقريبية المناسبة:

// النوع	معامل السحب (Cd)	المساحة الأمامية (A) - م²
// سيارة صغيرة (Sedan)	0.28	2.2
// سيارة عائلية (SUV)	0.35	2.8
// شاحنة مغلقة (Box Truck)	0.60	8.0
// شاحنة مفتوحة (Flatbed)	0.50	7.0
// موتوسيكل	0.50	0.6
// التطبيق العملي:

// أضف حقل vehicleShape في نموذج المستخدم (زي ما عندك vehicleType).

// المستخدم يختار من قائمة (سيارة صغيرة، SUV، شاحنة، موتوسيكل).

// في الـ Backend، استخدم القيم التقريبية من الجدول ده لحساب تأثير الرياح.

// التأثير: هتحل 80% من المشكلة في أقل من يوم، وبدون أي تكاليف إضافية.

// المستوى 2 (الحل الاحترافي) – استخدام API خارجية لجلب البيانات الحقيقية
// لو عايز دقة عالية بدون ما تزعج المستخدم، استخدم APIs متخصصة في بيانات المركبات:

// NHTSA API (مجانية جزئياً): بتجيب بيانات المركبات المصنعة في أمريكا.

// CarInfo API (مدفوعة): قاعدة بيانات ضخمة لكل موديلات السيارات عالمياً، وتشمل Cd و A وأبعاد.

// التطبيق العملي:

// في صفحة التسجيل أو الإعدادات، اطلب من المستخدم ماركة وموديل وسنة عربيته (زي "نيسان صنى 2020").

// في الـ Backend، استخدم الـ API عشان تجيب Cd و A الحقيقيين.

// خزنهم في قاعدة البيانات (في حقل vehicleDetails في User Model).

// التأثير: هتوصل لدقة 95%، وهتكون ميزة تنافسية قوية جداً.

// المستوى 3 (الحل العبقري طويل المدى) – التعلم من المستخدمين (Machine Learning)
// لو التطبيق كبر وجمعت بيانات كافية (آلاف الرحلات مع استهلاك الوقود الفعلي)، تقدر تدرب نموذج تعلم آلي يتعلم العلاقة بين (السرعة، الرياح، نوع العربية) واستهلاك الوقود الحقيقي. وده هيحقق دقة خرافية، وهيكون صعب على المنافسين تقليده.

// timestamps: true: دي هدية من Mongoose. هتضيفلك حقلين أوتوماتيك: createdAt (وقت الإنشاء) و updatedAt (آخر تعديل).

// status: بنحطها عشان المستقبل. لو طورنا التطبيق وعملنا "Live Drive Mode"، هنقدر نعدل الحالة لـ active أو completed.