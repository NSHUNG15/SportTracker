module.exports = {
  content: ["./src/**/*.{html,js}"], // Đảm bảo quét đúng file
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")], // Thêm DaisyUI plugin
  daisyui: {
    themes: ["light", "dark", "cupcake"], // Chọn theme hoặc tự tạo
  },
};