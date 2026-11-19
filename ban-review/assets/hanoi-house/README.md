# Nhà phố Hà Nội trong cảnh chợ

`model.glb` chứa atlas nguồn và khối hộp để xem ảnh. Cảnh chợ dùng atlas này cho tường vữa và các vùng cửa sổ, biển hiệu, cửa tiệm. UV tường chạy theo tọa độ của căn nhà để vân vữa liền qua các cột và dải tường. Ba kiểu nhà mới có hai ban công với sân thượng, tầng trên lùi dưới mái tôn, hoặc cửa vòm có gờ mái giật cấp. Dãy phố còn dùng lại ba mẫu cũ có mái ngói, nhà ống và mái tôn lệch. Tường và các chi tiết ảnh dùng chung một vật liệu và được gộp theo từng đoạn phố.

- `hang-gai-frontage.jpg` là hai mặt tiền liền nhau từ [Hang Gai Street (9753914924)](https://commons.wikimedia.org/wiki/File:Hang_Gai_Street_(9753914924).jpg) của Gary Todd, CC0.
- `hanoi-weathered-yellow-plaster.jpg` là vùng vữa vàng bong tróc trong ảnh [Heritage House in Hanoi](https://commons.wikimedia.org/wiki/File:Heritage_House_in_Hanoi.jpg) của Christophe95, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Cảnh chợ dùng vùng ảnh tường này trên các căn tông vàng.
- `hanoi-corner-frontage.jpg` lấy từ [Crossroad in Hanoi](https://commons.wikimedia.org/wiki/File:Crossroad_in_Hanoi.jpg) của Christophe95, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- `hanoi-bar-frontage.jpg` lấy từ [Hanoi shophouse](https://commons.wikimedia.org/wiki/File:Hanoi_shophouse.jpg) của Sgnpkd, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Các ảnh mặt tiền được cắt, nắn phối cảnh và đóng gói vào atlas. Các phần chuyển thể từ ảnh CC BY-SA dùng giấy phép CC BY-SA 4.0.

- Tường dùng [Damaged Plaster](https://polyhaven.com/a/damaged_plaster) của Poly Haven (CC0).

GLB nguồn có 12 tam giác, một mesh, một vật liệu và atlas JPEG 1024 × 1024. Dung lượng file khoảng 411 KiB. Ô vữa trong atlas chia đôi cho ảnh vữa vàng và vân vữa trung tính dùng ở các căn còn lại.

Mở `viewer.html` qua HTTP để xem khối nguồn. Để xem các mặt tiền đã ghép vào nhà 3D, mở `ban-review/market-preview.html` và ngồi ở góc POV hướng qua cửa sổ.

Để bake lại, chạy trong thư mục này với NumPy và Pillow:

```sh
python3 bake.py ../hanoi_old_town_house.glb --frontage textures/hang-gai-frontage.jpg
```

Chế độ bake model chi tiết cũ vẫn có thể chạy bằng cách bỏ `--frontage` và chỉ định `--output` đến một file khác.
