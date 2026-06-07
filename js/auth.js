document.addEventListener("DOMContentLoaded", function () {
  const API_URL = "http://localhost:5000/api";

  // ==========================================================================
  // 0. XỬ LÝ ĐỔI TÊN ĐĂNG NHẬP & CHỨC NĂNG ĐĂNG XUẤT TRÊN CÁC TRANG HTML
  // ==========================================================================
  const accountText = document.getElementById("accountText");
  const accountBtn = document.getElementById("accountBtn");
  const accountContainer = document.getElementById("accountContainer");
  const accountDropdownMenu = document.getElementById("accountDropdownMenu");

  // Lấy thông tin người dùng đang đăng nhập từ LocalStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  if (accountText && accountDropdownMenu) {
    if (currentUser) {
      // TÌNH TRẠNG: ĐÃ ĐĂNG NHẬP SUCCESS
      accountText.innerText = currentUser.name; // Đổi chữ "Tài khoản" thành Tên thật
      accountBtn.href = "javascript:void(0);"; // Ngắt không cho nhảy sang trang login.html khi click vào icon nữa

      if (accountContainer) {
        accountContainer.classList.add("is-logged"); // Bật class cho phép hover hiện menu theo CSS
      }

      // Cập nhật giao diện menu thả xuống bao gồm nút Đăng xuất
      accountDropdownMenu.innerHTML = `
          <div style="padding: 10px 18px; font-size: 13px; color: #777; border-bottom: 1px solid #eee; background: #fafafa; font-weight: 500;">
              Xin chào, <strong>${currentUser.name}</strong>
          </div>
          <a href="javascript:void(0);" id="logoutBtn" style="color: #dc3545 !important; font-weight: 600;">🚪 Đăng xuất</a>
      `;
      accountDropdownMenu.style.display = ""; // Để CSS tự quản lý việc ẩn hiện khi hover

      // Xử lý sự kiện khi bấm vào nút Đăng xuất
      document
        .getElementById("logoutBtn")
        .addEventListener("click", function () {
          if (confirm("Bạn có chắc chắn muốn đăng xuất tài khoản?")) {
            localStorage.removeItem("currentUser"); // Xóa dữ liệu phiên đăng nhập
            alert("Đã đăng xuất thành công!");
            window.location.reload(); // Tải lại trang để cập nhật giao diện về ban đầu
          }
        });
    } else {
      // TÌNH TRẠNG: CHƯA ĐĂNG NHẬP
      accountText.innerText = "Tài khoản";
      accountBtn.href = "page/login.html"; // Giữ nguyên link dẫn sang trang login

      if (accountContainer) {
        accountContainer.classList.remove("is-logged"); // Tắt trạng thái đăng nhập
      }

      accountDropdownMenu.innerHTML = `
          <a href="page/login.html">Đăng nhập</a>
          <a href="page/register.html">Đăng ký tài khoản</a>
      `;
      accountDropdownMenu.style.display = "";
    }
  }

  // ==========================================================================
  // 1. XỬ LÝ ĐĂNG KÝ TÀI KHOẢN (Gửi dữ liệu lưu vào SQL Server)
  // ==========================================================================
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("register-name").value.trim();
      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          window.location.href = "page/login.html";
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("Không thể kết nối đến máy chủ Backend!");
      }
    });
  }

  // ==========================================================================
  // 2. XỬ LÝ ĐĂNG NHẬP TÀI KHOẢN (Đối chiếu SQL Server & Lưu trạng thái)
  // ==========================================================================
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
          alert(`Chào mừng trở lại, ${data.user.name}!`);

          // Lưu thông tin USER nhận từ Database vào LocalStorage
          localStorage.setItem("currentUser", JSON.stringify(data.user));

          // 🌟 ĐÃ ĐỒNG BỘ: Đăng nhập xong quay trở lại chuẩn trang chủ home.html
          window.location.href = "../index.html";
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("Không thể kết nối đến máy chủ Backend!");
      }
    });
  }
});
