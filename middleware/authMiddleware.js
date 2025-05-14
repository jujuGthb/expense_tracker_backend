const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token, auth denied" });
  }

  const token = authHeader.split(" ")[1]; // ✅ Extract actual token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // sets req.user.id
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token is not valid" });
  }
};
