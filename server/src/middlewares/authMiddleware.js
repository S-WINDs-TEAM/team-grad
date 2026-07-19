const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try{
        const token = req.cookies.accessToken;
        if(!token) {
            return res.status(401).json({msg: "not authorized, no token"});
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!req.user) {
            return res.status(401).json({msg: "user not found"});
        }
        next();

    }catch (err) {
    res.status(401).json({ message: 'not authorized, token failed' });
  }
};


const restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return res.status(403).json({
                msg: 'you dont have premission to perform this action',
            });
        }
        next();
    };
};

module.exports = {protect, restrictTo};




