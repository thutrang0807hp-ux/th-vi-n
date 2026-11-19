# Nhà phố Hà Nội trong cảnh chợ

`model.glb` là khối hộp 3D theo kích thước của mẫu cũ `../hanoi_old_town_house.glb`. Mặt hướng về toa (+Z) dùng một vùng ảnh mặt tiền quán ở góc phố Tạ Hiện – Lương Ngọc Quyến. Vùng ảnh được cắt, nắn phối cảnh và trải trực tiếp lên mặt hộp. Cửa chớp, phào và biển quán nằm trong ảnh. Các mặt còn lại dùng ảnh vật liệu tường hoặc ngói.

Ảnh mặt tiền của Pasztilla (Attila Terbócs), [Hanoi, Vietnam 2019-09 01](https://commons.wikimedia.org/wiki/File:Hanoi,_Vietnam_2019-09_01.jpg), giấy phép [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Bản crop và phần ảnh biến đổi trong atlas nhúng dùng cùng giấy phép. Tường và ngói lấy từ [Damaged Plaster](https://polyhaven.com/a/damaged_plaster) và [Clay Roof Tiles 02](https://polyhaven.com/a/clay_roof_tiles_02) của Poly Haven (CC0).

GLB có 12 tam giác, một mesh, một vật liệu và atlas JPEG 1024 × 1024. Dung lượng file khoảng 345 KiB.

Mở `viewer.html` qua HTTP để xoay và zoom. Trong cảnh chợ, mở `ban-review/market-preview.html` và ngồi ở góc POV hướng qua cửa sổ.

Để bake lại, chạy trong thư mục này với NumPy và Pillow:

```sh
python3 bake.py ../hanoi_old_town_house.glb --frontage textures/ta-hien-frontage.jpg
```

Chế độ bake model chi tiết cũ vẫn có thể chạy bằng cách bỏ `--frontage` và chỉ định `--output` đến một file khác.
