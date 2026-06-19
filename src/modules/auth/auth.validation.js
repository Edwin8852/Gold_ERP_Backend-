const { z } = require('zod');

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  mobile: z.string().min(10, 'Invalid mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'CUSTOMER']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  mobile: z.string().min(10).optional(),
  customerCode: z.string().optional(),
  password: z.string().min(1, 'Password is required')
}).refine(data => data.email || data.mobile || data.customerCode, {
  message: "Either email, mobile, or customer code must be provided",
  path: ["email"]
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').regex(/^[A-Za-z\s]+$/, 'First name can only contain letters'),
  lastName: z.string().min(1, 'Last name is required').regex(/^[A-Za-z\s]+$/, 'Last name can only contain letters'),
  email: z.string().email('Invalid email address format').min(1, 'Email is required'),
  mobile: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  profileImage: z.string().optional().nullable().or(z.literal(''))
});

exports.validateRegister = (req, res, next) => {
  try {
    req.body = registerSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

exports.validateLogin = (req, res, next) => {
  try {
    req.body = loginSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

exports.validateChangePassword = (req, res, next) => {
  try {
    req.body = changePasswordSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

exports.validateUpdateProfile = (req, res, next) => {
  try {
    req.body = updateProfileSchema.parse(req.body);
    next();
  } catch (error) {
    // Format the first Zod error nicely for the frontend toast
    const firstError = error.errors && error.errors.length > 0 ? error.errors[0].message : 'Invalid profile data';
    return res.status(400).json({
      success: false,
      message: firstError,
      errors: error.errors
    });
  }
};

