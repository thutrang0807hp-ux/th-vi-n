# Nhà phố Hà Nội trong cảnh chợ

`model.glb` là khối hộp 3D theo kích thước của mẫu cũ `../hanoi_old_town_house.glb`. Mặt hướng về toa (+Z) phủ ảnh mặt tiền đã nắn phối cảnh. Các mặt còn lại dùng ảnh vật liệu tường. Cảnh chợ thay đổi chiều rộng và chiều cao của 16 căn trên bốn đoạn phố, dùng ba ảnh mặt tiền trong cùng một atlas. Mỗi đoạn phố gộp bốn căn thành một mesh dùng chung vật liệu.

- `ta-hien-frontage.jpg` lấy từ ảnh [Hanoi, Vietnam 2019-09 01](https://commons.wikimedia.org/wiki/File:Hanoi,_Vietnam_2019-09_01.jpg) của Pasztilla (Attila Terbócs), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Bản crop và bản biến đổi trong atlas nhúng dùng cùng giấy phép.
- `ma-may-shop.jpg` lấy từ ảnh [Hanoi (9654796243)](https://commons.wikimedia.org/wiki/File:Hanoi_(9654796243).jpg) của Jorge Cancela, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- `ma-may-old-shop.jpg` lấy từ ảnh [Ma May](https://commons.wikimedia.org/wiki/File:Ma_May.jpg) của piotrr, [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- Tường dùng [Damaged Plaster](https://polyhaven.com/a/damaged_plaster) của Poly Haven (CC0).

GLB có 12 tam giác, một mesh, một vật liệu và atlas JPEG 1024 × 1024. Dung lượng file khoảng 471 KiB.

Mở `viewer.html` qua HTTP để xoay và zoom. Trong cảnh chợ, mở `ban-review/market-preview.html` và ngồi ở góc POV hướng qua cửa sổ.

Để bake lại, chạy trong thư mục này với NumPy và Pillow:

```sh
python3 bake.py ../hanoi_old_town_house.glb --frontage textures/ta-hien-frontage.jpg
```

Chế độ bake model chi tiết cũ vẫn có thể chạy bằng cách bỏ `--frontage` và chỉ định `--output` đến một file khác.
