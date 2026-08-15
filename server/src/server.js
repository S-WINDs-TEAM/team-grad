//the server operator file
//
console.log("server flow start");

require("dotenv").config();
console.log("server end calling .env");

const http = require("http"); // for socket.io
const app = require("./app");
const dpConnection = require("./config/db");
const { initSocket } = require("./socket/socketManager");

const PORT = process.env.PORT || 6000;

const startServer = async () => {
  await dpConnection(); // we make the server wait the db to start first if not then shut the server down no need to it to be runed

  // http.createServer wraps the express app so socket.io can attach to the SAME
  // server/port instead of needing a separate one. app.listen() alone can't do this.
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    // if db worked well then listen
    console.log(`server is running on port: ${PORT}`); // if all done well then output this msg
    console.log(`socket.io is attached and ready`);
  });
};

console.log("server end by calling itselfe()");
startServer();

//  سيناريوهات الكوارث والـ Debugging
// الكارثة: Error: connect ECONNREFUSED (الـ MongoDB مش شغال).
// العلامة: السيرفر مش هيبدأ، وهتظهر رسالة err: ....
// الحل: شغل الـ MongoDB أو غير الـ URI في .env.

// الكارثة: Error: Cannot find module './app'.
// العلامة: السيرفر يموت في الأول.
// الحل: تأكد إن app.js موجود في نفس المجلد.

//  مساحة التطور والتوسعة (Scalability)
// لو المشروع كبر، هنضيف هنا cluster module عشان يشغل أكتر من Core في الـ CPU،
//  أو نضيف graceful shutdown عشان يقفل السيرفر بشكل آمن لو حصل إشارة إيقاف.
