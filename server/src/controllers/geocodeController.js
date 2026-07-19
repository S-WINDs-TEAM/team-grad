const {searchLocation}= require('../services/geocodeService');

const search = async (req, res, next)=>{
    try{
        const {q} = req.query;
        if(!q|| q.trim().length< 2) return res.status(400).json({msg: "query too short", success: false});
        const results = await searchLocation(q);
        res.status(200).json({success: true, results});

    }catch(error){
        next(error)
    }
};

module.exports = { search };