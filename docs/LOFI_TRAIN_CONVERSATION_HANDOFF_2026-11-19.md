# LOFI TRAIN — HỒ SƠ HỘI THOẠI & BÀN GIAO CHO AI TIẾP THEO

> Cập nhật: 2026-11-19 · Ngôn ngữ trao đổi: tiếng Việt · Repo: `thutrang0807hp-ux/th-vi-n`
>
> **Đây là bản tổng hợp chi tiết theo trình tự hội thoại, không phải bản export nguyên văn toàn bộ tin nhắn.** Nội dung phản ánh quyết định, phản hồi, prompt, ý tưởng và đường dẫn ảnh quan trọng đã xuất hiện trong cuộc trao đổi dài giữa chủ dự án và ChatGPT. Các hình ảnh AI đã gửi trong hội thoại **không tự động được lưu vào repository này**. Nếu một AI khác cần đánh giá trực quan, hãy yêu cầu người dùng đính kèm đúng ảnh gốc.
>
> **Dành cho AI/Codex mới:** Đọc mục 1–4 trước khi nhận việc. Đừng coi mọi ý tưởng dưới đây là tính năng đã triển khai hoặc được chốt. Phân biệt rõ **đã duyệt**, **đang thử**, **đã bác bỏ** và **chưa được kiểm chứng trên code hiện hành**.

## 1. Tổng quan & vai trò

**Lofi Train** là website 3D học tập/tập trung: người dùng ở trong toa tàu cổ điển ấm cúng, có thể đi lại, ngồi, đổi POV, nhìn phong cảnh 3D chuyển động qua cửa sổ, dùng Pomodoro, ghi chú/âm thanh và tương tác với mascot Mochi hồng.

- Chủ dự án thích trao đổi thân mật bằng tiếng Việt và phản hồi rất trực tiếp về thẩm mỹ. Muốn **ảnh concept đẹp theo phong cách Cozy Stylized 3D / Detailed Low-poly**, đủ chi tiết nghệ thuật, không phải prototype gồm các khối cơ bản.
- ChatGPT chủ yếu đóng vai trò **art direction/đặt tiêu chí/viết prompt**, Codex được giao code, kiểm thử Chromium, tối ưu, commit khi được phép.
- Cần **so ảnh render thực tế từ website với concept ở đúng góc camera**, lặp lại vòng chỉnh sửa; code build được không có nghĩa đã đạt thẩm mỹ.
- Chỉ triển khai từng **vertical slice**; chờ người dùng duyệt trước khi nhân rộng hay deploy.
- **Không tự ý thay đổi nội thất, camera, Mochi hoặc các tính năng đã chạy** khi công việc chỉ liên quan phong cảnh; ngược lại, khi sửa nhân vật thì không sửa phong cảnh.
- Người dùng hiện chủ yếu làm web **để chính mình dùng**; trước mắt không cần backend riêng. Local-first, sao lưu dữ liệu, kiến trúc đủ dễ bổ sung cloud sync về sau.

## 2. Repo & thực tế kỹ thuật đã từng được kiểm tra

Repo: https://github.com/thutrang0807hp-ux/th-vi-n

Trong một lần kiểm tra, `village-scene.js` nhập Three.js r164 từ `vendor/three-r164/three.module.min.js`. Một báo cáo Codex từng thử commit `18c8bed` trong Chromium và ghi nhận:

- Scene gồm cabin, mascot, camera, controls, renderer và external scenery.
- Chế độ camera theo sau/POV, đi/chạy/ngồi, Focus hoạt động trong lượt test đó.
- Nội thất tự dựng bằng geometry và vật liệu Three.js, một số texture tạo qua Canvas.
- Cảnh ngoài cửa sổ dùng đoạn lặp, `InstancedMesh` cho hoa, hiệu ứng gió và cánh hoa, parallax nhiều lớp.
- GLB/GLTF nạp thử thành công trên Three.js r164; đã xem KayKit/Quaternius/glTF sample assets, nhưng không nên bê asset trung cổ vào toa.
- Khi đó chưa cấu hình đầy đủ environment reflection và shadow map; đã có ánh sáng hemisphere/directional/point và ACES.
- Những mô tả này **là ảnh chụp thời điểm cũ**, không thể thay cho việc kiểm tra HEAD hiện tại.

Quy tắc kỹ thuật: giữ pipeline Three.js sẵn có; GLB khi giúp asset nhìn gần đẹp hơn, procedural cho địa hình/loop, instancing/LOD cho vật thể lặp. Tránh ép chuyển sang React Three Fiber chỉ vì một repo tham khảo dùng framework khác.

## 3. Những nguyên tắc hình ảnh đã học được (QUAN TRỌNG NHẤT)

### 3.1 Camera/POV

Đây là lỗi lặp đi lặp lại trong nhiều ảnh AI:

- Tàu di chuyển **dọc theo hướng ray**, nhưng camera ngồi trong toa **nhìn ngang 90° qua cửa sổ bên hông**.
- Cửa sổ **không** nhìn dọc ray, không có đường ray/đường hầm thu về điểm tụ ở giữa ảnh, không phải POV từ đầu tàu hay camera flycam.
- Ngoài cửa sổ, nhà/sạp/cây gần tàu lướt ngang; đối tượng xa parallax chậm hơn. Mỗi bên của toa nhìn ra bên tương ứng.
- Không được thay camera thật để làm ảnh đẹp. Kiểm tra từ camera ứng dụng hiện tại.
- Khi làm concept nhiều khung hình, mỗi hình phải cùng hướng camera; người dùng nhiều lần phát hiện hướng sai ở cảnh thủy cung, nhà ga, Hội An và khu chợ.

### 3.2 Chất lượng stylized low-poly

- **Low-poly không đồng nghĩa ít chi tiết/xấu.** Đẹp nhờ silhouette, tỷ lệ, art direction, vật liệu, màu, soft shadow, ánh sáng và phân lớp gần–giữa–xa.
- Ảnh AI là tham chiếu 2D, không phải mesh 3D có thể import. Tránh hứa giống 100% hoặc định lượng 80–90% khi chưa render kiểm chứng.
- Vật thể gần cửa sổ cần model đủ tinh tế: đừng cứ `BoxGeometry`, `LatheGeometry`, `IcosahedronGeometry` giản lược cho mọi thứ.
- Với cảnh đi ngang, thiết kế **nhịp thay đổi giữa các khu vực** để tránh cảm giác loop cùng một bố cục.
- Không làm phong cảnh trông như hình nền cuộn ngang.

### 3.3 Tính thẩm mỹ chủ dự án đã phản hồi

- Thích concept 3D low-poly ban đầu có ánh sáng điện ảnh nhẹ, màu sắc hài hòa, chi tiết đáng yêu.
- Không thích poster quá nhiều ô/chữ, không thích bố cục fantasy lặp lại lâu đài+nấm neon+núi+hồ; có lúc yêu cầu chỉ thảo luận, **khi đó không tự tạo ảnh**.
- Cần cảnh **gần gũi, có đời sống** nhưng cũng thú vị, không sáo mòn.
- Đặc biệt với chợ: không thích kiến trúc kiểu Nhật, Trung Hoa cổ trang hoặc Hong Kong cao tầng bị áp nguyên mẫu. Muốn **chợ dân sinh Việt Nam/Đông Nam Á**, gần gũi, đông hàng hóa, mái bạt, biển tiếng Việt, nhà phố cũ.
- Với cảnh biển: có lúc yêu cầu **chỉ biển, sóng, bờ cát, bầu trời**, không núi, hải đăng, nhà, nút UI.
- Với Iceland: sau thử không băng, cuối cùng quay lại **sông/hồ băng và cực quang**.

## 4. Trạng thái ưu tiên ở thời điểm bàn giao

**Mới nhất:** người dùng đang tìm một **phong cảnh mới đơn giản, đẹp, tránh trùng**. Đã nói rõ **cảnh lúa có rồi**. Gợi ý ven hồ sen/bến sông mới ở mức thảo luận, **chưa chọn**. Không mặc định họ đã duyệt nó.

**Các công việc lớn khác trong luồng này:**

1. Khu chợ Việt Nam theo kiểu *phố cà phê đường tàu*: là dự án scenery quan trọng, đang khó ở chất lượng **nhà phố**. Có prompt nâng cấp kiến trúc đã giao Codex.
2. Nội thất toa cổ điển: người dùng từng ưng layout hiện hành, đã bàn về nâng mesh/vải/ánh sáng nhẹ. Không thay đổi nếu task hiện tại không liên quan.
3. Mochi hồng: đã chọn một reference sheet cụ thể, đang nâng model và animation.
4. App focus: Pomodoro, task/notes, âm thanh, Mochi focus companion đã có master prompt chia phase, nhưng **không mặc định tất cả được code**.

## 5. Lịch sử các nhánh thiết kế

### A. Thung lũng tulip mùa xuân — khởi đầu

- Concept: tàu chạy qua biển tulip, đồng cỏ, hoa anh đào, đồi, suối, cối xay gió, nắng xuân.
- User thích **ảnh concept AI** nhưng chê render web quá thô.
- Nguyên nhân từng xác định từ `buildScenery()`: hoa `LatheGeometry` đơn nhất, tán anh đào gồm khối ghép, nước như dải phẳng, núi là sphere kéo giãn, màu và bố cục lỏng.
- Giải pháp: asset GLB chọn lọc + procedural geometry + instancing + lighting; dựng **một cảnh tĩnh chất lượng**, chụp POV, duyệt rồi mới nhân rộng/animate. Không cần bỏ Three.js.

### B. Việt Nam: Tri Tôn, Hội An, Hà Giang

- **Tri Tôn / An Giang mùa lúa vàng**: thốt nốt, ruộng lúa vàng, núi Bảy Núi, nhà quê, kênh nhỏ, nắng chiều. Đã tạo concept và một prompt rất chi tiết. Chủ dự án sau đó xác nhận đã có cảnh lúa.
- **Hội An**: nhà vàng, sông Hoài, đèn lồng, Chùa Cầu; ban đầu user chê ảnh chỉ lặp một khung phố. Sau đó thiết kế nhiều đoạn: nhà cổ, hẻm nghề thủ công, ven sông, phố đèn lồng, chợ đêm, phố khuya. Ý tưởng tuyến khoảng 12–15 phút trước loop là **đề xuất**, không phải mốc đã triển khai. Không bắt buộc bám địa lý/thời gian thực.
- **Hà Giang**: hoa tam giác mạch, núi đá, nhà trình tường. Đã tạo concept nhưng chưa có xác nhận triển khai.

### C. Fantasy/Harry Potter và chuyến tàu 4 giờ sáng — ý tưởng thăm dò

- Đã thử Hogwarts, Rừng Cấm, cầu đá, lâu đài ven biển, rừng cổ, hồ ngọc bích; nhiều ảnh bị chê và không được chốt.
- Có concept **“The Forgotten Line”**: tàu lúc 04:00, nhà ga không tên, đồng hồ đứng 04:00, vali, đèn vàng, sinh vật áo choàng bay trong sương (lấy cảm hứng Dementor nhưng nên tạo sinh vật nguyên bản).
- Nhà ga về lâu dài có thể chỉ hiện 45–60 phút/lần; **giai đoạn prototype rút còn khoảng 2 phút để test**. Lưu ý thời gian 45–60 phút CHƯA triển khai.
- Sau nhiều ảnh fail, user muốn khám phá ý tưởng khác. Đừng mặc định đây là hướng chính hiện hành.

### D. Biển/coast

- User thích phong cách low-poly tham chiếu nhưng yêu cầu biển bao la, bãi cát, sóng, trời; không thêm núi/công trình/nút.
- Đã tạo **asset breakdown** bốn lớp: Sky & Clouds, Open Ocean, Shore Waves, Sandy Beach. Có prompt Codex thực hiện Phase A static POV → Phase B animation → Phase C optimization.
- Cảnh biển trong screenshot sau đó được đánh giá tương đối ổn nhưng cần đồng nhất quality cabin.

### E. Aquarium train

- Ý tưởng tàu chạy xuyên đường hầm kính dưới nước; người xem **nhìn ngang ra toàn đại dương** qua cửa sổ toa hành khách, không nhìn thẳng đầu tàu.
- Động vật: cá mập voi, cá đuối, rùa biển, cá heo, cá hề/hải quỳ, hải cẩu, cá ngựa, bạch tuộc.
- User không thích công trình kỳ quái dưới nước, muốn sinh vật đáng yêu, thủy cung thoáng và tràn sức sống; cấu trúc vòm kính chỉ phụ trợ. Đã tạo nhiều ảnh concept.

### F. Bảo tàng, triển lãm, thế giới tí hon

- Thế giới thu nhỏ không được ưng.
- Bảo tàng châu Âu nhìn ngang: tranh cổ điển, khung vàng, tượng đá, hành lang gallery, các khu tuần tự để tàu đi qua, không nhìn dọc gallery.
- Vấn đề bản quyền: ưu tiên tranh gốc hoặc ảnh tác phẩm public domain/CC0 từ nguồn open access, kiểm tra quyền từng file.

### G. Iceland cực quang

- Đã tạo đêm Iceland, thử phong cảnh rêu không băng (không ưng), quay lại núi tuyết + hồ băng + băng trôi + nhà ven hồ + cực quang.
- Có bảng **asset phong cảnh riêng**, không phải nội thất: núi gần/xa, nhà/nhà thờ, đèn, hàng rào, đá, cây, băng trôi, nước, sky aurora shader.
- POV nhìn ngang; aurora gần cố định, foreground nhanh, núi xa chậm.

### H. Chợ đường tàu Việt Nam — mạch đã đi sâu nhất

Định hình từ ảnh user đưa về chợ dân sinh châu Á và kiểu **cà phê đường tàu Việt Nam**:

- **Đầu tàu chạy xuyên giữa hai dãy chợ**, nhưng hành khách ngồi nhìn ngang sang quầy bên hông.
- Sạp hàng áp sát đường tàu một cách trực quan (vẫn chừa envelope an toàn), không đặt xa ray qua một quảng trường trống.
- Bạt xanh/cam/đỏ, mái tôn cũ, dây điện, ghế nhựa, thúng/giỏ, thùng nhựa, biển tiếng Việt, quầy san sát. **Không Nhật Bản/Trung Hoa cổ trang**.
- Bốn section: rau củ; chợ hoa+cà phê đường tàu; vải+đồ gia dụng; ẩm thực (phở, bánh mì, đồ nướng). Có NPC bán hàng, nấu, ăn, sắp đồ, may, bó hoa.
- Đã tạo bộ ảnh 4 section và **Vietnamese Train-Station Market Asset Sheet**.
- Dự định làm asset modular: nhà phố, canopy, stall, props, signage, NPC, animation. Dựng 1 section static từ camera thật trước; sau duyệt mới loop/parallax và toàn tuyến.
- Vấn đề mới nhất lúc làm chợ: **nhà do Codex dựng xấu, đơn giản**. Gợi ý 3 prototype nhà Việt Nam:
  - A: nhà 2 tầng cũ, tường vàng, ngói, cửa chớp, shop tầng trệt.
  - B: nhà phố 3 tầng mặt tiền hẹp, lan can sắt, cục nóng điều hòa, chậu cây.
  - C: nhà hỗn hợp, mái tôn/mái lệch, shop rộng ở tầng trệt.
- Học modular facade/asset assembly từ các repo tham khảo, **không copy nguyên kiến trúc quốc gia khác**:
  - https://github.com/achrefelouafi/BuildingGeneratorThreeJS
  - https://github.com/achrefelouafi/ProceduralBuildingsThreeJS
  - https://github.com/hec-ovi/glb-buildings-skill
  - https://github.com/jstrait/city-tour
- Các repo chỉ là **nguồn kỹ thuật**, phải tự kiểm tra LICENSE/code/asset chính xác. Tránh tuyên bố chúng đã được tích hợp thành công.
- Prompt cuối đã khóa: audit trước, chỉ sửa kiến trúc nhà phía sau sạp, giữ cabin/camera/Mochi/market stalls/NPC/gameplay, làm 3 mẫu và screenshot từ camera thật; chờ duyệt trước khi thay cả phố.

## 6. Mascot Mochi & hoạt động

- Người dùng **rất ưng character sheet Mochi hồng do ChatGPT tạo**, không ưng phiên bản Codex màu kem “bánh mì”.
- Character chuẩn: hồng pastel; đầu vuông bo tròn **mềm, hơi phồng** (không sphere, không box cứng); mắt oval nhỏ nâu đậm, miệng bé, má ửng hồng; thân và tay chân ngắn, có hai bàn chân tách.
- Trang phục ưa thích: mũ phi công nâu có kính, khăn burgundy, túi đeo chéo; có thể tháo phụ kiện.
- Biểu cảm: bình thường, vui, cười, buồn ngủ, tò mò, ngạc nhiên, buồn, giận.
- Hoạt động: đọc, viết, học, laptop, uống trà, ăn bánh, ăn uống, ngủ gật, vẫy, nhìn cửa sổ; **speech/thought bubble** nhỏ tim/sao/sách/đồ ăn/dấu hỏi.
- Codex từng gửi bản model hồng tiến bộ hơn bản kem, nhưng người dùng/ChatGPT còn cần chỉnh **tay chân/thân và các góc nhìn**. Không khẳng định bản cuối đã đạt.
- Animation bị nhận xét cứng. Đã bàn repo học kỹ thuật: `giaBaoJS/procedural-3d-characters`, Theatre.js, các repo animation khác. Nên kiểm tra license và rig; không import tùy tiện.
- Quy trình: preview base model front/side/back/3/4 trên nền trống → duyệt → phụ kiện → biểu cảm/animation → tích hợp. Không đổi silhouette đã duyệt khi chỉ làm animation.

## 7. Productivity features & backend

Chủ dự án mong Lofi Train là **ứng dụng tập trung làm việc** có thể dùng hằng ngày.

Đã soạn master prompt 4 hệ thống:

1. Pomodoro 25/5/15, bốn focus sessions rồi long break; timer dựa timestamps, pause/resume/reload/background/không double-award.
2. To-do & notes local-first, task active cho phiên focus, autosave, IndexedDB/localStorage phù hợp, JSON export/import.
3. Lofi music & ambient mixer: train, rain, ocean, café, birds, fireplace; volume/fades/presets; kiểm tra riêng license audio.
4. Mochi tập trung: idle, đọc/viết khi focus, giãn người khi break, ăn mừng khi complete, ngáp/ngủ; state machine nhận event, không spam bubble trong lúc tập trung.

Repo để nghiên cứu, **không copy nguyên UI/mã nguồn/nhạc**:
- https://github.com/anvarg1802-ops/focusflow
- https://github.com/adityak74/focusbox.dev
- https://github.com/remvze/moodist
- https://github.com/sajdakabir/meow

Master prompt yêu cầu Phase 0 audit/licenses/architecture trước, rồi từng Phase 1–4 chờ duyệt. Không được kết luận tất cả đã hoàn thành.

Bàn về “xây server”: user nói **trước mắt dùng cho chính mình**. Khuyến nghị **chưa cần server**; local-first, sao lưu JSON, có abstraction để sau này gắn account/Supabase nếu thực sự cần sync, bạn bè, multiplayer. Không xây multiplayer bây giờ.

Ý tưởng có thể thêm sau: focus journey (phút học = đường tàu), vé hành trình, nhật ký Mochi, thời tiết, cá nhân hóa bàn, học chung, Deep Focus, ảnh lưu niệm — **chưa chốt**, tránh tự triển khai.

## 8. Thư viện/nguồn asset đã được nhắc

- Quaternius Stylized Nature MegaKit / Ultimate Stylized Nature Pack: cây, đá, nature stylized, có thể thử glTF; xem giấy phép từng gói.
- KayKit asset sets: tham khảo workflow GLB, phong cách trung cổ không nhất thiết khớp.
- Khronos glTF Sample Assets / SheenChair: tham khảo cách làm PBR vải, sheen; kiểm tra extension.
- glTF-Transform: tối ưu mô hình/texture.
- pmndrs/postprocessing: tham khảo hậu kỳ; phải kiểm tra tương thích Three.js hiện có.
- Drei chủ yếu dùng React Three Fiber: **không được migrate chỉ vì muốn helper**.
- Kenney: tìm asset phù hợp nếu giấy phép/visual match.
- Các repo generator nhà Trung Quốc/Hong Kong chỉ dùng kỹ thuật, không dùng mặc định kiểu dáng.

## 9. Kho ảnh tham chiếu — tên & Library ID

Ảnh là tài liệu **tham chiếu thị giác**, chưa chắc repo có file. Có thể hỏi người dùng upload lại vào Codex khi cần. Các ID dưới là metadata từng xuất hiện trong chat, không phải URL truy cập công khai.

| Chủ đề | Tên ảnh | Library ID |
|---|---|---|
| Chợ — bản gốc user đưa | image(20261119-003601).png | libfile_c5e386733c8c8191a01359037e38f478 |
| Chợ — bảng asset | Vietnamese Train-Station Market Asset Sheet.png | libfile_be5047a32fd881919a5ccbc0d4b89771 |
| Chợ — quầy vải/đồ gia dụng | Cozy Train Window Market View(1).png | libfile_0e4c5685d6b48191b52b3d790a52d288 |
| Chợ — cà phê | Train Window Café in Vietnam.png | libfile_724a29dd80508191b10993a8edc209a6 |
| Chợ — tổng hợp | Train Window Market in Vietnam.png | libfile_cc0cfafc509881918cf437708b89d65c |
| Chợ — ẩm thực | Cinematic Train Window Over Vietnamese Street Food.png | libfile_1c993157ca8881919476f5388018bcb9 |
| Chợ — ảnh close POV | Window Seat at the Vietnamese Market.png | libfile_77bb1b30b9a081918a854776a42b6787 |
| Chợ — POV | Cozy Train Window Over a Vietnamese Market.png | libfile_0165ee4d505c8191965f41c9e52aa990 |
| Hội An ven sông | Cozy Lanternlit Riverside Train Café.png | libfile_a04210c065148191bb9e997150ab48a3 |
| Hội An phố cổ | Cozy Train Journey Through Hoi An.png | không có ID trong metadata |
| Iceland — bảng asset | Iceland Aurora Low-Poly Asset Board.png | libfile_9435819a53088191a9cf4a36c6eb1601 |
| Iceland — POV | Cozy Aurora Train Cabin.png | libfile_b301edf47e348191a35ef3a81e1c4c88 |
| Biển — bảng asset | Seaside Train Scene Asset Breakdown.png | libfile_83b7a3bc9fa481919bc084464f967b12 |
| Biển — concept chọn lọc | Sunlit Ocean View from a Cozy Train.png | libfile_fe8d57d48fac8191a44ee67887095e6f |
| Aquarium dễ thương | Cozy Train Aquarium Adventure.png | libfile_710c15d33964819181ef0369d3b46d7d |
| Mascot — concept board | Lofi Train Mascot Design Board.png | libfile_0a4f78f900908191b695c1dbc1b84c65 |
| Mascot — character sheet | Vietnamese Chibi Character Design Sheet.png | libfile_9b80ce9573288191b159b23f00319bbe |
| Mascot — hoạt động/bubbles | Cozy Chibi Aviator Activity Sheet.png | libfile_5d26bca1d5788191ae529c8fdc9c2898 |
| Tulip concept | Golden Tulip Fields from the Train.png | libfile_1443373089708191a7b2d06a43a56973 |
| Tri Tôn lúa vàng | Golden Train Through Vietnamese Rice Fields.png | libfile_fbd7bae4b0688191b9248ee509e35639 |

**Quan trọng:** ID metadata không đồng nghĩa AI trong GitHub/Codex có khả năng đọc ảnh. Để thực thi, yêu cầu người dùng đính kèm trực tiếp ảnh gốc tương ứng hoặc thêm vào repo với giấy phép/quyền phù hợp.

## 10. Prompt/acceptance workflow cho AI mới

Khi tiếp tục dự án, AI cần:

1. **Hỏi đúng việc đang làm:** concept/ảnh, review, prompt cho Codex, hay code trực tiếp. User thường muốn **prompt để Codex code**, không muốn ChatGPT tự sửa repo trừ khi nói rõ.
2. Đọc HEAD hiện tại, không giả định báo cáo cũ còn đúng.
3. Xác định **các file sẽ thay**, ràng buộc những phần giữ nguyên.
4. Dùng hình reference user đã chọn, mô tả asset/scale/PBR/lighting/POV chính xác.
5. Chỉ làm **một vertical slice tĩnh** trước; ảnh chụp thật từ POV cabin.
6. So sánh bằng tiêu chí cụ thể: silhouette, bố cục, góc camera, màu, vật liệu, chất Việt, hoạt động, hiệu năng, đường nối scene.
7. Yêu cầu **người dùng duyệt** rồi mới animate/mở rộng/deploy.
8. Không đưa ra ảnh mới khi người dùng chỉ muốn **thảo luận**.
9. Không sửa bản chính/commit/deploy nếu chưa có yêu cầu cụ thể và phạm vi rõ ràng.
10. Không khẳng định “đã đạt đẹp như concept” nếu không có screenshot và đối chiếu thật.

## 11. Tóm tắt ngắn cho lần chat tiếp theo

**Một câu mô tả:** “Lofi Train là web Three.js phong cách cozy detailed low-poly, toa tàu gỗ nâu/ghế xanh/rèm kem/thảm đỏ, mascot Mochi hồng, ứng dụng focus local-first; điểm khó nhất là biến concept AI đẹp thành cảnh 3D chạy ngang cửa sổ đúng POV, nhất là khu chợ đường tàu Việt Nam.”

**Nhớ ba điều:**

- Camera **nhìn ngang**, tàu chạy **dọc**, cửa sổ không được nhìn dọc ray.
- User trọng **chất lượng art direction và sự thân thuộc**, không muốn nhà hộp/chợ Nhật/lâu đài fantasy chung chung.
- **Kiểm chứng bản render** rồi mới nhân rộng. Đừng nhầm ý tưởng đã bàn với việc đã được code hoặc đã duyệt.

---

*Tệp này được soạn theo nội dung hội thoại đến 2026-11-19 để bàn giao ngữ cảnh cho AI khác. Khi có quyết định mới, nên cập nhật tài liệu, không sửa lịch sử thành điều đã hoàn thành.*
