# 🚀 Yayına Alma (Deployment)

Bu proje Next.js tabanlı olduğu için **Vercel** üzerinde barındırılması en kolay ve performanslı yöntemdir.

## 📦 Vercel ile Dağıtım

1.  Projenizi GitHub, GitLab veya Bitbucket'a yükleyin.
2.  [Vercel Dashboard](https://vercel.com/dashboard)'a gidin ve "Add New Project" deyin.
3.  Git reponuzu seçin ve "Import" butonuna tıklayın.

## ⚙️ Ortam Değişkenleri (Environment Variables)

Vercel proje ayarlarında **Environment Variables** bölümüne şu değerleri eklemelisiniz:

| Değişken Adı | Değer |
|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Proje URL'iniz |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Public/Anon Key |

Bu değerleri production (canlı) ortamı için Supabase panelinden alabilirsiniz. Development ve Production için farklı Supabase projeleri kullanmanız önerilir.

## ⚠️ Dikkat Edilmesi Gerekenler

-   **Build Hataları**: Deployment sırasında `npm run build` komutu çalıştırılır. Eğer kodunuzda TypeScript hataları varsa deploy başarısız olur. Yerelde `npm run build` ile test edin.
-   **Veritabanı Erişimi**: Production veritabanınızın (Supabase) çalıştığından ve RLS politikalarının doğru yapılandırıldığından emin olun.
-   **Domain**: Vercel size otomatik bir domain (`.vercel.app`) verir. Dilerseniz kendi özel domaininizi (Custom Domain) ayarlardan ekleyebilirsiniz.
