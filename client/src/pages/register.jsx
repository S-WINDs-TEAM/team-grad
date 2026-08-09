import { User, Mail, Lock, Eye, Car } from "lucide-react";

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-[#07111F] p-4">
      <div className="min-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-slate-800 flex">
        
        {/* Left Section */}
        <div className="hidden lg:flex flex-1 relative">
          <img
            src="https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200"
            alt="city"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-[#07111F]/80" />

          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 rounded-full bg-blue-500" />
              <h1 className="text-4xl font-bold">S-WINDS</h1>
            </div>

            <h2 className="text-6xl font-light leading-tight">
              Drive with
            </h2>

            <h2 className="text-7xl font-bold text-blue-500 mb-8">
              S-WINDS
            </h2>

            <p className="text-slate-300 text-xl max-w-md mb-12">
              Join our community of trusted drivers and
              start your journey today.
            </p>

            <div className="space-y-8">
              <Feature
                title="Trusted Platform"
                desc="Your safety and trust are our priority."
              />

              <Feature
                title="Better Earnings"
                desc="Competitive rates and timely payouts."
              />

              <Feature
                title="24/7 Support"
                desc="Always here when you need us."
              />
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-10 bg-[#091321]">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-700 bg-[#0D1628]/90 p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.15)]">
            
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full border border-blue-500 flex items-center justify-center">
                <User size={38} className="text-blue-500" />
              </div>
            </div>

            <h2 className="text-center text-white text-3xl font-bold">
              Create Your Driver Account
            </h2>

            <p className="text-center text-slate-400 mt-2 mb-8">
              Join the future of transportation
            </p>

            <form className="space-y-5">
              <InputField
                icon={<User size={18} />}
                placeholder="Full Name"
              />

              <InputField
                icon={<Mail size={18} />}
                placeholder="Email Address"
              />

              <PasswordField placeholder="Password" />

              <PasswordField placeholder="Confirm Password" />

              <div className="relative">
                <Car
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <select
                  className="
                    w-full
                    h-14
                    rounded-xl
                    border
                    border-slate-700
                    bg-transparent
                    pl-12
                    pr-4
                    text-slate-300
                    outline-none
                  "
                >
                  <option>Select Vehicle Type</option>
                  <option>Car</option>
                  <option>Van</option>
                  <option>Truck</option>
                </select>
              </div>

              <button
                type="submit"
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-500
                  to-blue-700
                  text-white
                  font-semibold
                  hover:scale-[1.01]
                  transition
                "
              >
                Create Account →
              </button>

              <p className="text-center text-slate-400">
                Already have an account?{" "}
                <span className="text-blue-500 cursor-pointer">
                  Sign In
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ icon, placeholder }) => {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
        {icon}
      </span>

      <input
        type="text"
        placeholder={placeholder}
        className="
          w-full
          h-14
          rounded-xl
          border
          border-slate-700
          bg-transparent
          pl-12
          pr-4
          text-white
          outline-none
          focus:border-blue-500
        "
      />
    </div>
  );
};

const PasswordField = ({ placeholder }) => {
  return (
    <div className="relative">
      <Lock
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
      />

      <input
        type="password"
        placeholder={placeholder}
        className="
          w-full
          h-14
          rounded-xl
          border
          border-slate-700
          bg-transparent
          pl-12
          pr-12
          text-white
          outline-none
          focus:border-blue-500
        "
      />

      <Eye
        size={18}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer"
      />
    </div>
  );
};

const Feature = ({ title, desc }) => {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500" />

      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-slate-400 text-sm">{desc}</p>
      </div>
    </div>
  );
};

export default RegisterPage;

// import {
//   User,
//   Mail,
//   Lock,
//   Eye,
//   Car,
//   Shield,
//   Wallet,
//   CircleUserRound,
// } from "lucide-react";

// const RegisterPage = () => {
//   return (
//     <div className="min-h-screen bg-[#07111F] p-4">
//       <div className="min-h-[calc(100vh-2rem)] overflow-hidden rounded-[32px] border border-slate-800 flex">

//         {/* LEFT SIDE */}
//         <div className="hidden lg:flex flex-1 relative overflow-hidden">

//           {/* Background */}
//           <img
//             src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600"
//             alt="city"
//             className="absolute inset-0 h-full w-full object-cover"
//           />

//           {/* Dark Overlay */}
//           <div className="absolute inset-0 bg-[#07111F]/90" />

//           {/* Blue Glow */}
//           <div className="absolute bottom-0 left-0 w-full h-56 bg-gradient-to-r from-blue-500/30 via-blue-400/10 to-transparent blur-3xl" />

//           <div className="relative z-10 flex flex-col justify-center px-16 py-12 text-white">

//             {/* Logo */}
//             <div className="flex items-center gap-4 mb-16">
//               <div className="w-14 h-14 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40" />

//               <h1 className="text-4xl font-bold tracking-wide">
//                 S-WINDS
//               </h1>
//             </div>

//             {/* Hero */}
//             <h2 className="text-6xl font-light leading-tight">
//               Drive with
//             </h2>

//             <h2 className="text-7xl xl:text-8xl font-bold text-blue-500 mb-8">
//               S-WINDs
//             </h2>

//             <p className="text-slate-300 text-xl max-w-md leading-relaxed">
//               Join our community of trusted drivers
//               and move the world forward.
//             </p>

//             {/* Features */}
//             <div className="mt-14 space-y-8">

//               <Feature
//                 icon={<Shield size={22} />}
//                 title="Trusted Platform"
//                 desc="Your safety and trust are our priority."
//               />

//               <Feature
//                 icon={<Wallet size={22} />}
//                 title="Better Earnings"
//                 desc="Competitive rates and timely payouts."
//               />

//               <Feature
//                 icon={<CircleUserRound size={22} />}
//                 title="Always With You"
//                 desc="24/7 support when you need it."
//               />
//             </div>

//             {/* Quote */}
//             <div className="mt-14 max-w-lg rounded-3xl border border-slate-700 bg-white/5 p-6 backdrop-blur-md">

//               <div className="text-5xl text-blue-500 mb-2">
//                 "
//               </div>

//               <p className="text-slate-300 leading-relaxed">
//                 S-WINDs gives me the freedom to drive
//                 and the confidence that I'm supported.
//               </p>

//               <p className="mt-4 text-blue-500 font-medium">
//                 Happy Driver
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* RIGHT SIDE */}
//         <div className="flex flex-1 items-center justify-center bg-[#091321] p-6 lg:p-10">

//           <div
//             className="
//               w-full
//               max-w-[700px]
//               rounded-[36px]
//               border
//               border-blue-500/20
//               bg-[#0D1628]/90
//               backdrop-blur-xl
//               p-10
//               shadow-[0_0_60px_rgba(59,130,246,0.20)]
//             "
//           >
//             {/* Avatar */}
//             <div className="flex justify-center mb-8">
//               <div
//                 className="
//                   w-28
//                   h-28
//                   rounded-full
//                   border
//                   border-blue-500
//                   flex
//                   items-center
//                   justify-center
//                   shadow-lg
//                   shadow-blue-500/20
//                 "
//               >
//                 <User
//                   size={48}
//                   className="text-blue-500"
//                 />
//               </div>
//             </div>

//             <h2 className="text-center text-white text-4xl font-bold">
//               Create Your Driver Account
//             </h2>

//             <p className="text-center text-slate-400 mt-3 mb-10">
//               Let's get you started 👋
//             </p>

//             <form className="space-y-5">

//               <InputField
//                 icon={<User size={18} />}
//                 placeholder="Enter your full name"
//               />

//               <InputField
//                 icon={<Mail size={18} />}
//                 placeholder="Enter your email address"
//               />

//               <PasswordField
//                 placeholder="Enter your password"
//               />

//               <PasswordField
//                 placeholder="Confirm your password"
//               />

//               <div className="relative">

//                 <Car
//                   size={18}
//                   className="
//                     absolute
//                     left-4
//                     top-1/2
//                     -translate-y-1/2
//                     text-slate-500
//                   "
//                 />

//                 <select
//                   className="
//                     w-full
//                     h-16
//                     rounded-xl
//                     border
//                     border-slate-700
//                     bg-transparent
//                     pl-12
//                     pr-4
//                     text-slate-300
//                     outline-none
//                     focus:border-blue-500
//                   "
//                 >
//                   <option>
//                     Select vehicle type
//                   </option>

//                   <option>Car</option>
//                   <option>Van</option>
//                   <option>Truck</option>
//                 </select>
//               </div>

//               <button
//                 type="submit"
//                 className="
//                   w-full
//                   h-16
//                   rounded-xl
//                   text-lg
//                   font-semibold
//                   text-white
//                   bg-gradient-to-r
//                   from-blue-500
//                   to-blue-700
//                   hover:scale-[1.01]
//                   transition-all
//                 "
//               >
//                 Register →
//               </button>

//               <p className="text-center text-slate-400">
//                 Already have an account?{" "}
//                 <span className="text-blue-500 cursor-pointer hover:text-blue-400">
//                   Sign In
//                 </span>
//               </p>
//             </form>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// const InputField = ({ icon, placeholder }) => {
//   return (
//     <div className="relative">
//       <span
//         className="
//           absolute
//           left-4
//           top-1/2
//           -translate-y-1/2
//           text-slate-500
//         "
//       >
//         {icon}
//       </span>

//       <input
//         type="text"
//         placeholder={placeholder}
//         className="
//           w-full
//           h-16
//           rounded-xl
//           border
//           border-slate-700
//           bg-transparent
//           pl-12
//           pr-4
//           text-white
//           placeholder:text-slate-500
//           outline-none
//           focus:border-blue-500
//           transition
//         "
//       />
//     </div>
//   );
// };

// const PasswordField = ({ placeholder }) => {
//   return (
//     <div className="relative">

//       <Lock
//         size={18}
//         className="
//           absolute
//           left-4
//           top-1/2
//           -translate-y-1/2
//           text-slate-500
//         "
//       />

//       <input
//         type="password"
//         placeholder={placeholder}
//         className="
//           w-full
//           h-16
//           rounded-xl
//           border
//           border-slate-700
//           bg-transparent
//           pl-12
//           pr-12
//           text-white
//           placeholder:text-slate-500
//           outline-none
//           focus:border-blue-500
//         "
//       />

//       <Eye
//         size={18}
//         className="
//           absolute
//           right-4
//           top-1/2
//           -translate-y-1/2
//           text-slate-500
//           cursor-pointer
//         "
//       />
//     </div>
//   );
// };

// const Feature = ({ icon, title, desc }) => {
//   return (
//     <div className="flex gap-4">

//       <div
//         className="
//           w-14
//           h-14
//           rounded-full
//           border
//           border-blue-500/40
//           bg-blue-500/10
//           flex
//           items-center
//           justify-center
//           text-blue-400
//         "
//       >
//         {icon}
//       </div>

//       <div>
//         <h3 className="font-semibold text-xl">
//           {title}
//         </h3>

//         <p className="text-slate-400">
//           {desc}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;