# Nhà phố Hà Nội trong cảnh chợ

`model.glb` là khối hộp 3D theo kích thước của mẫu cũ `../hanoi_old_town_house.glb`. Mặt hướng về toa (+Z) phủ ảnh mặt tiền đã nắn phối cảnh. Các mặt còn lại dùng ảnh vật liệu tường. Cảnh chợ thay đổi chiều rộng và chiều cao của 16 căn trên bốn đoạn phố, dùng ba ảnh mặt tiền trong cùng một atlas. Mỗi đoạn phố gộp bốn căn thành một mesh dùng chung vật liệu.

- `hang-gai-frontage.jpg` là hai mặt tiền liền nhau từ [Hang Gai Street (9753914924)](https://commons.wikimedia.org/wiki/File:Hang_Gai_Street_(9753914924).jpg) của Gary Todd, CC0.
- `hanoi-corner-frontage.jpg` lấy từ [Crossroad in Hanoi](https://commons.wikimedia.org/wiki/File:Crossroad_in_Hanoi.jpg) của Christophe95, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- `hanoi-bar-frontage.jpg` lấy từ [Hanoi shophouse](https://commons.wikimedia.org/wiki/File:Hanoi_shophouse.jpg) của Sgnpkd, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Các ảnh mặt tiền được cắt, nắn phối cảnh và đóng gói vào atlas. Các phần chuyển thể từ ảnh CC BY-SA dùng giấy phép CC BY-SA 4.0.

- Tường dùng [Damaged Plaster](https://polyhaven.com/a/damaged_plaster) của Poly Haven (CC0).

GLB có 12 tam giác, một mesh, một vật liệu và atlas JPEG 1024 × 1024. Dung lượng file khoảng 449 KiB.

Mở `viewer.html` qua HTTP để xoay và zoom. Trong cảnh chợ, mở `ban-review/market-preview.html` và ngồi ở góc POV hướng qua cửa sổ.

Để bake lại, chạy trong thư mục này với NumPy và Pillow:

```sh
python3 bake.py ../hanoi_old_town_house.glb --frontage textures/hang-gai-frontage.jpg
```

Chế độ bake model chi tiết cũ vẫn có thể chạy bằng cách bỏ `--frontage` và chỉ định `--output` đến một file khác.
