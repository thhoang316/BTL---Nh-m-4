const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/Img", express.static(path.join(__dirname, "Img")));
app.use(express.static(__dirname));

// 1. Cấu hình kết nối tới Microsoft SQL Server
const config = {
  user: "sa", // Tài khoản SQL Server của bạn
  password: "123", // Mật khẩu SQL Server
  server: "localhost", // Địa chỉ local chạy database
  database: "jysk_furniture", // Tên database của bạn
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// Kết nối thử tới SQL Server khi khởi động
sql
  .connect(config)
  .then((pool) => {
    if (pool.connecting) {
      console.log("Đang kết nối...");
    } else {
      console.log("-> Đã kết nối thành công tới Microsoft SQL Server.");
    }
  })
  .catch((err) => {
    console.error("Lỗi kết nối SQL Server:", err);
  });

// 2. API Xử lý ĐĂNG KÝ
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin!" });
  }

  try {
    const pool = await sql.connect(config);

    // Kiểm tra trùng email trước
    const checkEmail = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT id FROM users WHERE email = @email");

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    // Mã hóa mật khẩu bảo mật trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Chèn dữ liệu mới vào SQL Server
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.VarChar, email)
      .input("password", sql.VarChar, hashedPassword)
      .query(
        "INSERT INTO users (name, email, password) VALUES (@name, @email, @password)",
      );

    res.status(201).json({ message: "Đăng ký tài khoản thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi xử lý máy chủ." });
  }
});

// 3. API Xử lý ĐĂNG NHẬP
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập Email và Mật khẩu!" });
  }

  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM users WHERE email = @email");

    if (result.recordset.length === 0) {
      return res
        .status(400)
        .json({ message: "Tài khoản hoặc mật khẩu không chính xác!" });
    }

    const user = result.recordset[0];

    // Đối chiếu mật khẩu nhập vào với mật khẩu đã mã hóa trong DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Tài khoản hoặc mật khẩu không chính xác!" });
    }

    // Đăng nhập thành công -> Trả thông tin cơ bản về Client
    res.status(200).json({
      message: "Đăng nhập thành công!",
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi xử lý máy chủ." });
  }
});

app.listen(5000, () => {
  console.log("Server Backend đang chạy tại: http://localhost:5000");
});
