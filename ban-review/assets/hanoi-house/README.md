# Nhà phố Hà Nội

`model.glb` dùng hình khối từ file `../hanoi_old_town_house.glb` do người dùng gửi. Mặt tiền mở về +Z, trục đứng +Y. Tường, ban công, hốc cửa, nan mái và cột vẫn là mesh. Mặt cửa sổ gồm hai tam giác đặt trong hốc, dùng texture ghép từ ảnh vân gỗ và các lớp màu cho nan chớp, khung và kính. Mô hình giữ các mặt bên và phía sau của GLB nguồn.

Atlas màu 2048 × 2048 dùng ảnh bề mặt CC0 của Poly Haven, đã cân lại màu theo các ảnh nhà phố trong chat. Các ảnh tham chiếu trong chat dùng để đối chiếu, vì workspace không có file ảnh gốc để nắn phối cảnh. Texture mặt bên và sau dùng cùng bảng vật liệu, mang tính suy luận.

- [Damaged Plaster](https://polyhaven.com/a/damaged_plaster)
- [Wood Planks Grey](https://polyhaven.com/a/wood_planks_grey)
- [Clay Roof Tiles 02](https://polyhaven.com/a/clay_roof_tiles_02)
- [Worn Corrugated Iron](https://polyhaven.com/a/worn_corrugated_iron)
- [Giấy phép tài nguyên Poly Haven](https://polyhaven.com/license)

GLB có 3.576 tam giác, một vật liệu và ba nhóm mesh. File khoảng 1,60 MiB. Chuyển các chi tiết cửa sổ từ mesh sang texture giảm từ 5.292 xuống 3.576 tam giác. Atlas JPEG được nhúng trong GLB, dự kiến dùng khoảng 21,3 MiB trên GPU khi giải mã thành RGBA8 có mipmaps. Trong cảnh chợ chỉ giữ nhóm `Architecture` để ghép với bạt, quầy và nền phố hiện có.

Mở `viewer.html` qua HTTP để xoay, dịch, zoom hoặc đặt lại camera. Trang dùng Three.js và OrbitControls r164.1 theo [giấy phép MIT](../../vendor/three-r164/LICENSE). Trong Lofi Train, mở `ban-review/market-preview.html` hoặc `toa-tau/lang-3d.html?scene=market-preview`, rồi nhìn qua cửa sổ phía quầy vải và đồ gia dụng.

Để bake lại, chạy `python3 bake.py ../hanoi_old_town_house.glb` trong thư mục này với NumPy và Pillow. Các ảnh nguồn nằm trong `textures/`.
