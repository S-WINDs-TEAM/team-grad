
const errorHandler = (err, req, res, next)=> {
    let statusCode = err.statusCode || 500;
    let msg = err.message || 'internal server error';

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        msg = `${field} already exists`;
    }
    if (err.name === 'ValidationError') {
        statusCode = 400;
        msg = Object.values(err.errors)
        .map((e)=> e.message)
        .join(', ');
    }

    if(err.name === 'JsonWebTokenError') {
        statusCode = 401;
        msg = 'invalid token';
    }
    if(err.name === 'TokenExpiredError') {
        statusCode = 401;
        msg = 'token expired';
    }

    // multer errors (file too large, wrong field name, etc.) — see uploadMiddleware.js
    if (err.name === 'MulterError') {
        statusCode = 400;
        msg = err.code === 'LIMIT_FILE_SIZE' ? 'file is too large (max 5MB)' : err.message;
    }
    
    res.status(statusCode).json({
        success: false,
        msg,
        ...(process.env.NODE_ENV === 'development' && {stack: err.stack}),
    });

};

module.exports = errorHandler;