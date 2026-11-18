# Lofi Train — 3D Focus Workspace

Dự án thử nghiệm không gian làm việc 3D trên toa tàu, với nhân vật mascot màu hồng và phong cảnh núi rừng.

> **Trạng thái:** Prototype cơ chế tương tác. Đồ họa hiện vẫn dùng hình học đơn giản dựng bằng Three.js; **chưa** phải phiên bản Semi-Stylized chất lượng cao như concept đã thống nhất.

## Chạy thử

Mở trang bằng một local web server:

```bash
python3 -m http.server 8000
```

Sau đó truy cập `http://localhost:8000` để đi lại trong toa lounge 3D. Cần Internet để tải Three.js từ CDN.

## Điều khiển

- `W A S D`: Di chuyển
- `Shift`: Chạy
- Kéo chuột: Xoay góc nhìn
- Con lăn: Zoom
- Nhấp đúp vào cảnh hoặc nhấn `V`: Chuyển giữa camera theo sau / POV
- `E`: Thử ngồi / đứng
- `F`: Mở đồng hồ tập trung

## Hướng phát triển

1. Thiết kế mô hình toa tàu Semi-Stylized chất lượng cao, thống nhất với mascot.
2. Làm nội thất có vật liệu gỗ, vải, ánh sáng và cửa sổ đẹp hơn.
3. Thêm cảnh ngoài cửa sổ có chuyển động khi tàu chạy.
4. Hoàn thiện va chạm, animation ngồi/đứng và điều khiển camera.
5. Tối ưu đồ họa sau khi chốt chất lượng hình ảnh.

Cảnh lounge và phần điều khiển nằm trong `village-scene.js`. `prototype.html` lưu bản thử nghiệm ban đầu.
