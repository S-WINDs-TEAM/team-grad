const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UAParser = require('ua-parser-js'); // a library to analyze the user-agent coplix text to get the brwoser name
const geoIp = require('geoip-lite'); // getting regin
//generate AccessToken
const generateAccessToken = (userId)=>{ 
    return jwt.sign({id: userId}, 
        process.env.JWT_ACCESS_SECRET,
        {expiresIn: '15m'});
};
//generate RefreshToken
const generateRefreshToken = (userId)=>{ 
return jwt.sign ({id: userId},
    process.env.JWT_REFRESH_SECRET,
    {expiresIn: "7d"});
};
// token-cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', //better to be lax
        maxAge: 15 * 60 *1000 // 15 minutes
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', //better to be lax
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7d

    });

};

//adding security lair to protect the refreash token if h4ck3r access from another device
// dry function for gitting device and ip data
const getSecurityData= (req) => {
    const parser = new UAParser(req.headers['user-agent']);
    const browserName = parser.getBrowser().name || 'unknown'; // version will rest every update
    const osName = parser.getOS().name || 'unknown';
    const deviceType = parser.getDevice().type || 'desktop';
    //dynamic identfires 
    const cleanFingerprint = `${osName}-${deviceType}-${browserName}`.toLowerCase();

    const ip = req.ip ||
     req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      '127.0.0.1'; // get ip locations from proxy or load balancer like aws locations

      //get countrycode
      const geo = geoIp.lookup(ip);
      const countryCode = geo ? geo.country: 'unknown'; // eg, usa, us, etc.
    return {cleanFingerprint, ip, countryCode};

    // return {
    //     userAgent: req.headers['user-agent'] || 'unknown',
    //     ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
    // };
};

//endpoints controllers

const register = async (req, res)=>{
    try{
        const {name, email, password, role, vehicleType}= req.body;
        // checkout user existnas
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(409).json({msg: "email already in use"});
        }
        const user = await User.create({name, email, password, role, vehicleType});

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        //save refreshtoken in the db so we can checked it out any time we want
        // user.refreshToken = refreshToken;
        //more security date save
        // const {userAgent, ip} = getSecurityData(req);
        const {cleanFingerprint, ip, countryCode} = getSecurityData(req);

        //create the refreshtoken for the regisered user
        user.refreshToken = {
            token: refreshToken,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7*24*60*60*1000),
            // deviceFingerprint: userAgent,
            deviceFingerprint: cleanFingerprint,
            lastIP: ip,
            countryCode: countryCode,
        }

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
            },
        });

    }catch(err){
            res.status(500).json({ message: err.message });
    }
};

//login endpoint 
const login = async (req, res)=>{
    try{
        console.log(req.body);
        const {email, password} =req.body;
        const user = await User.findOne({email});
        if (!user) return res.status(401).json({msg: 'invalid credntials'});

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({msg: 'invalid credentials'});

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        //save refreshtoken in the db so we can checked it out any time we want
        // user.refreshToken = refreshToken;
        const {cleanFingerprint, ip, countryCode} = getSecurityData(req);

        user.refreshToken = {
            token: refreshToken,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 7*24*60*60*1000),
            deviceFingerprint: cleanFingerprint,
            lastIP: ip,
            countryCode: countryCode,
        }
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
            },
        });

    }catch (err) {
    res.status(500).json({ message: err.message });
  }
}


// recreate the accesstoken by the refreshtoken 
//and security traps 
const refresh = async (req, res)=> {
    try{
        const token = req.cookies.refreshToken;
        if (!token) return res.status(401).json({msg: "no refresh token"})
            //deocd the refreshtoken
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

            //security traps and checkers
            const user = await User.findById(decoded.id);
            // if (!user || user.refreshToken !== token) return res.status(401).json({msg: "invalid refresh token"});
            if(!user) return res.status(401).json({msg: "user not found"});
            // if old token try to register get all out 

            //token reuse
            if (user.refreshToken && user.refreshToken.token !== token) {
                user.refreshToken = {token: null, createdAt: null, expiresAt: null, deviceFingerprint: null, lastIP: null};
                await user.save();
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                return res.status(403).json({msg: "security alert! Token reUse detected, please login againg "});

            }

            const {countryCode,cleanFingerprint, ip} = getSecurityData(req);
            const now = new Date();

            // device fingerprint 
            if(user.refreshToken.deviceFingerprint !== cleanFingerprint){
                return res.status(401).json({msg: "security violation: device mismatch"});
            }
            
            
            // conuntry cheker
            // if (user.refreshToken.lastIP !== ip) return res.status(401).json({msg: "suspicious location/ network changed sedenly"});
            if (user.refreshToken.countryCode && user.refreshToken.countryCode!== countryCode) return res.status(401).json({msg: "suspicious location/ country network changed sedenly"});

            //72 lifetime no activemove token ended
            const inactivePeriod = 72*60*60*1000;
            if (now - user.refreshToken.createdAt> inactivePeriod) {
                return res.status(401).json({msg: "session expired due to inactivity"});
            }
            // 7d lifetime token ended
            if(now>user.refreshToken.expiresAt) return res.status(401).json({msg: "long session date expired (lifetime), please login again"})

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
                countryCode: countryCode
            }
            await user.save();
            setTokenCookies(res, newAccessToken, newRefreshToken)

            res.status(200).json({msg: 'token refreshed'});

    } catch (err) {
    res.status(401).json({ message: 'invalid or expired refresh token' });
  }
}
//logout endpoint
const logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
        //delete token from the db
        await User.findOneAndUpdate(
        {'refreshToken.token': token },
        { refreshToken: { 
            token: null,
            createdAt: null,
            expiresAt: null,
            deviceFingerprint: null,
            lastIP: null,
            countryCode: null }}
      );
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
    try{ 
        res.status(200).json({
            success: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                vehicleType: req.user.vehicleType,
            },
        });

    }catch(err){
        res.status(500).json({msg: err.message});
    }
};


module.exports = { register, login, refresh, logout, getMe };



