const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Company = require("../models/Company");
const UAParser = require("ua-parser-js"); // a library to analyze the user-agent coplix text to get the brwoser name
const geoIp = require("geoip-lite"); // getting regin
//generate AccessToken
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
};
//generate RefreshToken
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
// token-cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", //better to be lax
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", //better to be lax
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
};

//adding security lair to protect the refreash token if h4ck3r access from another device
// dry function for gitting device and ip data
const getSecurityData = (req) => {
  const parser = new UAParser(req.headers["user-agent"]);
  const browserName = parser.getBrowser().name || "unknown"; // version will rest every update
  const osName = parser.getOS().name || "unknown";
  const deviceType = parser.getDevice().type || "desktop";
  //dynamic identfires
  const cleanFingerprint =
    `${osName}-${deviceType}-${browserName}`.toLowerCase();

  const ip =
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "127.0.0.1"; // get ip locations from proxy or load balancer like aws locations

  //get countrycode
  const geo = geoIp.lookup(ip);
  const countryCode = geo ? geo.country : "unknown"; // eg, usa, us, etc.
  return { cleanFingerprint, ip, countryCode };
};

//endpoints controllers

const register = async (req, res, next) => {
  try {
    const { name, email, password, vehicleType } = req.body;
    // checkout user existnas
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: "email already in use" });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: "individual",
      vehicleType,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    //save refreshtoken in the db so we can checked it out any time we want
    // user.refreshToken = refreshToken;
    //more security date save
    const { cleanFingerprint, ip, countryCode } = getSecurityData(req);

    //create the refreshtoken for the regisered user
    user.refreshToken = {
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceFingerprint: cleanFingerprint,
      lastIP: ip,
      countryCode: countryCode,
    };

    await user.save();
    // set time and credentails for each token
    setTokenCookies(res, accessToken, refreshToken);

    //res data
    res.status(201).json({
      msg: "user registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vehicleType: user.vehicleType,
        vehicleHeight: user.vehicleHeight,
      },
    });
  } catch (err) {
    next(err);
  }
};

// company registration — creates the Company doc + the company_admin user together.
// the admin is admin-only: manages/monitors the fleet, never drives themselves.
const registerCompany = async (req, res, next) => {
  try {
    const { companyName, industry, adminName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: "email already in use" });
    }

    // create the admin user first, link companyId right after the company exists
    const admin = await User.create({
      name: adminName,
      email,
      password,
      role: "company_admin",
    });

    let company;
    try {
      company = await Company.create({
        name: companyName,
        industry: industry || null,
        ownerId: admin._id,
      });
    } catch (companyErr) {
      // rollback: don't leave an orphan admin user with no company if this fails
      await User.findByIdAndDelete(admin._id);
      throw companyErr;
    }

    admin.companyId = company._id;

    const accessToken = generateAccessToken(admin._id);
    const refreshToken = generateRefreshToken(admin._id);
    const { cleanFingerprint, ip, countryCode } = getSecurityData(req);

    admin.refreshToken = {
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceFingerprint: cleanFingerprint,
      lastIP: ip,
      countryCode: countryCode,
    };
    await admin.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      msg: "company registered successfully",
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        companyId: company._id,
        companyName: company.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

//login endpoint
const login = async (req, res, next) => {
  try {
    // console.log(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "invalid credntials" });

    if (user.accountStatus === "invited") {
      return res
        .status(403)
        .json({
          msg: "account not activated yet — please use your invite link first",
        });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ msg: "invalid credentials" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    //save refreshtoken in the db so we can checked it out any time we want
    // user.refreshToken = refreshToken;
    const { cleanFingerprint, ip, countryCode } = getSecurityData(req);

    user.refreshToken = {
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      deviceFingerprint: cleanFingerprint,
      lastIP: ip,
      countryCode: countryCode,
    };
    await user.save();

    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      msg: "Logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        vehicleType: user.vehicleType,
        companyId: user.companyId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// recreate the accesstoken by the refreshtoken
//and security traps
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ msg: "no refresh token" });
    //deocd the refreshtoken
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    //security traps and checkers
    const user = await User.findById(decoded.id);
    // if (!user || user.refreshToken !== token) return res.status(401).json({msg: "invalid refresh token"});
    if (!user) return res.status(401).json({ msg: "user not found" });
    // if old token try to register get all out

    //token reuse
    if (user.refreshToken && user.refreshToken.token !== token) {
      user.refreshToken = {
        token: null,
        createdAt: null,
        expiresAt: null,
        deviceFingerprint: null,
        lastIP: null,
      };
      await user.save();
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res
        .status(403)
        .json({
          msg: "security alert! Token reUse detected, please login againg ",
        });
    }

    const { countryCode, cleanFingerprint, ip } = getSecurityData(req);
    const now = new Date();

    // device fingerprint
    if (user.refreshToken.deviceFingerprint !== cleanFingerprint) {
      return res
        .status(401)
        .json({ msg: "security violation: device mismatch" });
    }

    // conuntry cheker
    // if (user.refreshToken.lastIP !== ip) return res.status(401).json({msg: "suspicious location/ network changed sedenly"});
    if (
      user.refreshToken.countryCode &&
      user.refreshToken.countryCode !== countryCode
    )
      return res
        .status(401)
        .json({ msg: "suspicious location/ country network changed sedenly" });

    //72 lifetime no activemove token ended
    const inactivePeriod = 72 * 60 * 60 * 1000;
    if (now - user.refreshToken.createdAt > inactivePeriod) {
      return res.status(401).json({ msg: "session expired due to inactivity" });
    }
    // 7d lifetime token ended
    if (now > user.refreshToken.expiresAt)
      return res
        .status(401)
        .json({
          msg: "long session date expired (lifetime), please login again",
        });

    //end of security traps

    // refresh token Rotation
    // new refresh token for the access token //  hard to be hacked
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    // reassign the old refresh token with the newRefresh token
    // user.refreshToken = newRefreshToken;
    user.refreshToken = {
      token: newRefreshToken,
      createdAt: now,
      expiresAt: user.refreshToken.expiresAt,
      deviceFingerprint: cleanFingerprint,
      lastIP: ip,
      countryCode: countryCode,
    };
    await user.save();
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({ msg: "token refreshed" });
  } catch (err) {
    next(err);
  }
};
//logout endpoint
const logout = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      //delete token from the db
      await User.findOneAndUpdate(
        { "refreshToken.token": token },
        {
          refreshToken: {
            token: null,
            createdAt: null,
            expiresAt: null,
            deviceFingerprint: null,
            lastIP: null,
            countryCode: null,
          },
        },
      );
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ message: "logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        vehicleType: req.user.vehicleType,
        companyId: req.user.companyId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/invite/:token — used by the "set your password" page to check the
// link is valid BEFORE showing the form, and to show the driver's/company's name.
const validateInviteToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const driver = await User.findOne({
      inviteToken: hashedToken,
      inviteTokenExpiry: { $gt: new Date() },
      accountStatus: "invited",
    })
      .select("+inviteToken +inviteTokenExpiry")
      .populate("companyId", "name");

    if (!driver) {
      return res
        .status(400)
        .json({ success: false, msg: "invite link is invalid or expired" });
    }

    res.status(200).json({
      success: true,
      driver: {
        name: driver.name,
        email: driver.email,
        companyName: driver.companyId ? driver.companyId.name : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/invite/:token/accept — driver sets their own password, account goes 'active'
const acceptInvite = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const driver = await User.findOne({
      inviteToken: hashedToken,
      inviteTokenExpiry: { $gt: new Date() },
      accountStatus: "invited",
    }).select("+inviteToken +inviteTokenExpiry");

    if (!driver) {
      return res
        .status(400)
        .json({ success: false, msg: "invite link is invalid or expired" });
    }

    driver.password = password; // hashed automatically by the pre('save') hook
    driver.accountStatus = "active";
    driver.inviteToken = null;
    driver.inviteTokenExpiry = null;
    await driver.save();

    res
      .status(200)
      .json({ success: true, msg: "account activated — you can now log in" });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/me/photo — any logged-in user (individual/company_admin/company_driver)
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, msg: "no file uploaded" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: photoUrl },
      { new: true },
    );

    res.status(200).json({ success: true, profilePhoto: user.profilePhoto });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  registerCompany,
  login,
  refresh,
  logout,
  getMe,
  validateInviteToken,
  acceptInvite,
  uploadProfilePhoto,
};
