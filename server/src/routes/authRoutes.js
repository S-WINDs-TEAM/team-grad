
const express = require('express');
<<<<<<< HEAD
const {register, login, refresh, logout, getMe} = require('../controllers/authController');
const validate = require('../middlewares/validateMIddleware');
const {registerSchema, loginSchema} = require('../utils/validators');

const {protect} = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register',validate(registerSchema), register);
=======
const {register, registerCompany, login, refresh, logout, getMe, validateInviteToken, acceptInvite, uploadProfilePhoto} = require('../controllers/authController');
const validate = require('../middlewares/validateMIddleware');
const {registerSchema, registerCompanySchema,  loginSchema, acceptInviteSchema} = require('../utils/validators');

const {protect} = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.post('/register',validate(registerSchema), register); // individual driver
router.post('/register-company', validate(registerCompanySchema), registerCompany);
>>>>>>> origin/ElSayed
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
<<<<<<< HEAD

=======
router.post('/me/photo', protect, upload.single('photo'), uploadProfilePhoto);
// company_driver invite flow — token comes from the email link (see fleetRoutes.js drivers/invite)

router.get('/invite/:token', validateInviteToken);
router.post('/invite/:token/accept', validate(acceptInviteSchema), acceptInvite);
>>>>>>> origin/ElSayed

module.exports = router;


