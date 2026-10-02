# Hastane Dönüşüm ve Komuta Merkezi

GitHub Pages üzerinde çalışan, hash yönlendirmeli ve çevrimdışı kullanılabilen statik hastane yönetim paneli.

## GitHub Pages ile yayınlama

1. Bu projenin ZIP dosyasını açıp tüm dosyaları GitHub repository köküne yükleyin.
2. GitHub'da **Settings → Pages** bölümünü açın.
3. **Build and deployment → Source** alanında **GitHub Actions** seçin.
4. `main` dalına gönderilen her değişiklik otomatik olarak yayınlanır.
5. Yayın adresi genellikle `https://KULLANICI_ADI.github.io/REPO_ADI/` olur.

`.github/workflows/deploy-pages.yml` workflow'u yayınlama sırasında repository içindeki dosyaları otomatik tarar ve `project-files.json` oluşturur. Böylece yeni eklenen HTML, CSS, JavaScript, JSON, Markdown ve diğer dosyalar ayrıca elle listeye yazılmadan proje arşivine dahil edilir. GitHub Pages'in gizli klasörleri yayınlamadığı durumlarda workflow bu dosyalar için geçici bir kaynak aynası da oluşturur; ZIP içinde özgün yollar korunur.

İsterseniz Pages bölümünde kaynak olarak **Deploy from a branch → main → / (root)** seçeneğini de kullanabilirsiniz; `index.html` kökte hazırdır. Ancak tam dosya manifesti ve otomatik ZIP arşivi için **GitHub Actions** seçeneği önerilir.

## Projeyi ZIP olarak indirme

Panelin sağ üst köşesindeki **Projeyi indir** düğmesi, yayınlanan `project-files.json` manifestinde bulunan bütün dosyaları tek ZIP dosyasına alır. Arşiv oluşturulurken herhangi bir dosya alınamazsa işlem kısmi ZIP üretmek yerine durur ve alınamayan dosya yollarını gösterir. Böylece eksik dosya sessizce atlanmaz.

## Veri ve güvenlik notu

GitHub Pages yalnızca statik dosya yayınlar. Bu nedenle uygulama GitHub üzerinde çalışırken kullanıcı verileri tarayıcının yerel depolamasında tutulur; GitHub repository'sine veya ortak bir bulut veritabanına otomatik gönderilmez. Gerçek hasta/personel verilerini herkese açık bir repository'ye koymayın.

Tarayıcı verisini taşımak için paneldeki yedekleme/dışa aktarma araçlarını kullanın. Ortak ve güvenli veri senkronizasyonu için ileride kimlik doğrulamalı bir backend veya Firebase/Supabase gibi erişim kuralları olan bir servis eklenmelidir.

## Test

- Masaüstü ve mobil görünümde giriş, personel listesi ve personel detayını kontrol edin.
- Sağ üstteki **Projeyi indir** düğmesiyle ZIP içindeki dosya sayısını kontrol edin.
- Yönetim menüsündeki modülleri hash adresleriyle açın.
- Tarayıcıyı çevrimdışı moda alıp sayfayı yenileyerek temel ekranı test edin.
- GitHub Pages Actions günlüklerinden manifestte yazan toplam dosya sayısını ve yayınlama durumunu kontrol edin.

## Giriş

Demo yönetici hesabı uygulamanın mevcut giriş ekranında tanımlıdır. Gerçek kullanım öncesi demo parolalarını ve statik seed verilerini kaldırıp güvenli bir sunucu tarafı kimlik doğrulaması kullanın.
