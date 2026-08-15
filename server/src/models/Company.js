const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'company name is required'],
        trim: true,
    },
    industry: {
        type: String,
        trim: true,
        default: null,
    },
    // the company_admin user who created/owns this company
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

const Company = mongoose.model('Company', companySchema);
module.exports = Company;