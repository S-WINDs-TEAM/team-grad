
const express = require('express');
const {register, registerCompany, login, refresh, logout, getMe, validateInviteToken, acceptInvite, uploadProfilePhoto} = require('../controllers/authController');
const validate = require('../middlewares/validateMIddleware');
const {registerSchema, registerCompanySchema,  loginSchema, acceptInviteSchema} = require('../utils/validators');

const {protect} = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/register',validate(registerSchema), register); // individual driver
router.post('/register-company', validate(registerCompanySchema), registerCompany);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/me/photo', protect, upload.single('photo'), uploadProfilePhoto);
// company_driver invite flow — token comes from the email link (see fleetRoutes.js drivers/invite)

router.get('/invite/:token', validateInviteToken);
router.post('/invite/:token/accept', validate(acceptInviteSchema), acceptInvite);

module.exports = router;


