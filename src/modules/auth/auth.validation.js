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

