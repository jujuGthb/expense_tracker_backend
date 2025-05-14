const Profile = require("../models/Profile");
const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.id });

    if (!profile) {
      // Create default profile if doesn't exist
      const user = await User.findById(req.user.id);
      profile = await Profile.create({
        userId: req.user.id,
        name: user.name,
        email: user.email,
        currency: "USD",
      });
    }

    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, currency, monthlyBudgetGoal } = req.body;
    const profilePicture = req.file
      ? `/uploads/${req.file.filename}`
      : undefined;

    const updateFields = { name, email, currency, monthlyBudgetGoal };
    if (profilePicture) updateFields.profilePicture = profilePicture;

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      updateFields,
      { new: true, upsert: true }
    );
    res.status(200).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};
