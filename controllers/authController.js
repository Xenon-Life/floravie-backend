const jwt = require("jsonwebtoken");
const User = require("../models/users");
const moment = require("moment");
const CycleTracker = require("../models/cycleTracker");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const hasSendGridConfig =
  !!process.env.SENDGRID_API_KEY && !!process.env.EMAIL;

if (hasSendGridConfig) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn(
    "[authController] SendGrid email is disabled. Missing SENDGRID_API_KEY or EMAIL."
  );
}

const sendEmailIfConfigured = async (msg) => {
  if (!hasSendGridConfig) {
    return false;
  }

  await sgMail.send(msg);
  return true;
};
const getDatesInRange = (startDate, endDate) => {
  const start = moment(startDate);
  const end = moment(endDate);
  const dateArray = [];

  while (start.isSameOrBefore(end)) {
    dateArray.push(start.format("YYYY-MM-DD"));
    start.add(1, "day");
  }

  return dateArray;
};

exports.signup = async (req, res) => {
  console.log(req.body);
  const userInfo = req.body;
  try {
    const isUserExist = await User.findOne({ email: userInfo.email });
    if (isUserExist) {
      return res.status(400).json({ message: "User Already Exists!" });
    }
    const newUser = new User({
      username: userInfo.username,
      email: userInfo.email,
      password: userInfo.password,
      age: userInfo.age,
      number: userInfo.number,
      role: userInfo.isDoctor ? "doctor" : "user",
      country: userInfo.isDoctor ? userInfo.country : null,
      practice: userInfo.isDoctor ? userInfo.practice : null,
    });
    await newUser.save();

    // Send welcome email when SendGrid is configured.
    const msg = {
      to: userInfo.email,
      from: process.env.EMAIL,
      subject: "Welcome to Floravie!",
      html: `
        <p>Hi ${userInfo.username.split(" ")[0]},</p>
        <p>Welcome to Floravie!</p>
        <p>You're officially part of a community dedicated to enhancing both your physical and mental well-being. By joining us, you're taking a positive step toward improving your overall health with the support of our tools and resources.</p>
        <p>We’re thrilled to be part of your wellness journey and can't wait to help you achieve your goals. If you have any questions or need assistance along the way, feel free to reach out. We’re here for you!</p>
        <p>Wishing you a vibrant and fulfilling experience with Floravie. 💖</p>
        <p>Warm regards,</p>
        <p>The Floravie Team</p>
      `,
    };
    await sendEmailIfConfigured(msg);

    res.status(200).json({ message: "User Registered Successfully!" });
  } catch (err) {
    console.log("server error" + err);
    return res
      .status(500)
      .json({ message: "An error occurred while registering." });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(401).json({ message: "No such user found" });
    }

    const isPassword = password === existingUser.password;
    if (!isPassword) {
      return res.status(401).json({ message: "Invalid Password." });
    }
    const secret_key = process.env.SECRETKEY;
    if (!secret_key) {
      return res.status(500).json({ message: "Auth is not configured on the server." });
    }

    const payload = {
      _id: existingUser._id,
      role: existingUser.role,
      username: existingUser.username,
      isFirstTimeUser: existingUser.isFirstTimeUser,
    };
    const token = jwt.sign(payload, secret_key, { expiresIn: "2h" });
    console.log(payload);
    res.status(200).json({
      msg: "User is logged in",
      token: token,
      payload: payload,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "An error occurred during login" });
  }
};
exports.onboarding = async (req, res) => {
  const { userId, periodLength, cycleLength, startDate, endDate } = req.body;

  try {
    console.log("Period Length:", periodLength);
    console.log("Cycle Length:", cycleLength);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user status to indicate the onboarding is complete
    user.isFirstTimeUser = false;
    await user.save();

    // Generate cycleHistory entries for each date between startDate and endDate
    const dateRange = getDatesInRange(startDate, endDate);
    const cycleHistory = dateRange.map((date) => ({
      date,
      trackerType: "Period",
    }));

    const newCycleTracker = new CycleTracker({
      cycleHistory,
      averagePeriodLength: periodLength,
      averageCycleLength: cycleLength,
      postedBy: userId,
    });

    await newCycleTracker.save();

    res.status(200).json({
      message: "Onboarding completed successfully",
    });
  } catch (error) {
    console.error("Error during onboarding:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
// if (existingUser.verified === false) {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: "unifiedverify@gmail.com",
//       pass: "yqar udmg dhfr ifjn",
//     },
//   });

//   const mailOptions = {
//     from: "unifiedverify@gmail.com",
//     to: email,
//     subject: "Email Verification",
//     html: `<p>Please click the following link to verify your email: <a href="http://localhost:8080/verify/${existingUser.verificationToken}">Verify Email</a></p>`,
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log("Email sent: " + info.response);
//     }
//   });
//   return res
//     .status(401)
//     .json({ message: "Please verify your account first" });
// }
/*const isPasswordValid = await bcrypt.compare(password, existingUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'invalid password entered' });
      }*/

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!process.env.SECRETKEY) {
      return res.status(500).json({ message: "Password reset is not configured on the server." });
    }

    if (!hasSendGridConfig) {
      return res.status(503).json({
        message: "Email service is currently unavailable. Please contact support.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email does not exist!" });
    }

    // Generate a reset token
    const resetToken = jwt.sign({ userId: user._id }, process.env.SECRETKEY, {
      expiresIn: "1h",
    });

    const resetLink = `${process.env.FRONTEND_URL}/resetPassword?token=${resetToken}`;

    const msg = {
      to: email,
      from: process.env.EMAIL, // Your verified sender email address
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    };

    // Send the email
    await sendEmailIfConfigured(msg);

    res.status(200).json({ message: "Reset link sent to your email!" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
exports.resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  try {
    if (!process.env.SECRETKEY) {
      return res.status(500).json({ message: "Password reset is not configured on the server." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    user.password = password; // Ideally, hash the password using bcrypt
    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error in reset password:", error);
    res.status(500).json({ message: "Something went wrong!" });
  }
};
exports.getFirstTimeUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ isFirstTimeUser: user.isFirstTimeUser });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.allusers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting user" });
  }
};
exports.updateUser = async (req, res) => {
  try {
    const { username, email, number, country, age, practice, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, number, country, age, practice, role },
      { new: true, runValidators: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching user" });
  }
};
