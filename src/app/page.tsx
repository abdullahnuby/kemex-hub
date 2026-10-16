import Link from "next/link";
import { BrandLockup, Icon } from "@/components/Brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KEMEX-HUB | إدارة المحتوى والنشر من مكان واحد",
  description: "منصة عربية منظمة لإدارة مكتبة المحتوى والكابشنات ومتابعة النشر على Facebook.",
  robots: { index: true, follow: true },
};

const features = [
  { icon: "library", title: "مكتبة محتوى منظمة", text: "اجمع الصور والفيديوهات والريلز والكابشنات في مساحة واحدة سهلة الإدارة." },
  { icon: "clock", title: "نشر تلقائي مدروس", text: "جهّز المحتوى مسبقًا واترك الجدولة تنفّذ النشر وفق قواعدك المحددة." },
  { icon: "history", title: "سجل واضح لكل عملية", text: "تابع ما تم نشره، وافتح رابط المنشور، وراجع تفاصيل المحاولات التي لم تنجح." },
  { icon: "shield", title: "تحكم آمن في الوصول", text: "جلسات دخول محمية، وكلمات مرور مشفّرة، وإتاحة التسجيل برمز دعوة." },
];

export default function LandingPage() {
  return (
    <main className="marketing-site">
      <header className="marketing-header">
        <Link href="/" className="brand-link" aria-label="KEMEX-HUB الرئيسية"><BrandLockup subtitle /></Link>
        <nav className="marketing-nav" aria-label="التنقل الرئيسي">
          <a href="#features">المميزات</a>
          <a href="#workflow">طريقة العمل</a>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="button button-quiet">تسجيل الدخول</Link>
          <Link href="/register" className="button button-primary">إنشاء حساب <Icon name="arrow" size={17} /></Link>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-pulse" /> منصة واحدة. محتوى أوضح. نشر أسهل.</div>
          <h1>إدارة محتواك أصبحت<br /><span>أبسط من أي وقت.</span></h1>
          <p className="hero-description">KEMEX-HUB يجمع مكتبة المحتوى، والكابشنات، والنشر على فيسبوك وسجل العمليات في لوحة واحدة مصممة لتبقى مسيطرًا على كل خطوة.</p>
          <div className="hero-actions">
            <Link href="/register" className="button button-primary button-large">ابدأ باستخدام المنصة <Icon name="arrow" size={18} /></Link>
            <Link href="/login" className="button button-outline button-large"><Icon name="play" size={17} /> لديّ حساب بالفعل</Link>
          </div>
          <div className="hero-trust-row">
            <span><Icon name="check" size={16} /> إدارة محتوى مركزية</span>
            <span><Icon name="check" size={16} /> قاعدة بيانات Neon</span>
            <span><Icon name="check" size={16} /> واجهة عربية بالكامل</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="معاينة توضيحية للوحة التحكم">
          <div className="visual-glow" />
          <div className="dashboard-preview">
            <div className="preview-topbar">
              <div className="preview-window-dots"><i /><i /><i /></div>
              <span className="preview-title">نظرة عامة</span>
              <span className="preview-avatar">K</span>
            </div>
            <div className="preview-body">
              <div className="preview-greeting"><div><small>معاينة توضيحية · مساحة العمل</small><h3>أهلًا بعودتك 👋</h3></div><span className="preview-live"><i /> مباشر</span></div>
              <div className="preview-stat-grid">
                <div className="preview-stat"><span>إجمالي المحتوى</span><strong>128</strong><small className="positive">↗ مكتبتك في مكان واحد</small></div>
                <div className="preview-stat"><span>منشورات ناجحة</span><strong>94</strong><small className="positive">↗ سجل قابل للمراجعة</small></div>
                <div className="preview-stat"><span>جاهز للنشر</span><strong>12</strong><small>محتوى نشط</small></div>
              </div>
              <div className="preview-lower">
                <div className="preview-chart-card"><div className="preview-card-heading"><b>نشاط النشر</b><span>آخر 7 أيام</span></div><div className="fake-chart"><div style={{ height: "36%" }} /><div style={{ height: "52%" }} /><div style={{ height: "43%" }} /><div style={{ height: "74%" }} /><div style={{ height: "58%" }} /><div style={{ height: "88%" }} /><div style={{ height: "67%" }} /></div><div className="fake-chart-labels"><span>س</span><span>ح</span><span>ن</span><span>ث</span><span>ر</span><span>خ</span><span>ج</span></div></div>
                <div className="preview-activity"><div className="preview-card-heading"><b>آخر العمليات</b><span>عرض الكل</span></div><div className="preview-activity-row"><span className="mini-activity-icon"><Icon name="check" size={14} /></span><div><b>منشور جديد</b><small>تمت العملية بنجاح</small></div><span className="tiny-dot success-dot" /></div><div className="preview-activity-row"><span className="mini-activity-icon alternate"><Icon name="clock" size={14} /></span><div><b>محتوى في المكتبة</b><small>جاهز للمراجعة</small></div><span className="tiny-dot" /></div></div>
              </div>
            </div>
          </div>
          <div className="floating-chip chip-publishing"><span className="chip-icon"><Icon name="facebook" size={18} /></span><span><b>إدارة النشر</b><small>من مكان واحد</small></span><Icon name="check" size={17} className="chip-check" /></div>
          <div className="floating-chip chip-automation"><span className="automation-icon"><Icon name="spark" size={19} /></span><span><b>تنظيم أذكى</b><small>تفاصيل واضحة دائمًا</small></span></div>
        </div>
      </section>

      <section className="metric-strip" aria-label="ملخص المنصة">
        <div><strong>01</strong><span>مكتبة موحّدة للمحتوى</span></div>
        <div><strong>02</strong><span>كابشنات قابلة لإعادة الاستخدام</span></div>
        <div><strong>03</strong><span>متابعة للنشر والنتائج</span></div>
        <div><strong>24/7</strong><span>تنبيهات اختيارية للفريق</span></div>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading"><span className="section-kicker">كل الأدوات الأساسية في مكان واحد</span><h2>أقل تشتتًا. <span>تحكم أكبر.</span></h2><p>بدل التنقل بين الملفات والرسائل والجداول، تابع دورة المحتوى من التحضير وحتى النشر.</p></div>
        <div className="feature-grid">{features.map((feature, index) => <article className="feature-card" key={feature.title}><span className="feature-icon"><Icon name={feature.icon} size={23} /></span><span className="feature-number">0{index + 1}</span><h3>{feature.title}</h3><p>{feature.text}</p><span className="feature-arrow"><Icon name="arrow" size={17} /></span></article>)}</div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-copy"><span className="section-kicker">خطوات واضحة من البداية</span><h2>من تجهيز المحتوى<br />إلى <span>المنشور النهائي.</span></h2><p>صمّم سير عمل بسيطًا لفريقك: أضف المحتوى، حضّر أكثر من صياغة، ثم تابع عمليات النشر من لوحة التحكم.</p><Link href="/register" className="text-link">افتح مساحة العمل <Icon name="arrow" size={17} /></Link></div>
        <div className="workflow-steps"><div className="workflow-line" /><article><span className="step-number">01</span><div><h3>أضف المحتوى</h3><p>سجّل عنوانًا واضحًا ورابطًا مباشرًا للوسائط وحدّد النوع.</p></div><Icon name="library" size={21} /></article><article><span className="step-number">02</span><div><h3>جهّز الكابشنات</h3><p>احتفظ بصيغ متعددة مع المحتوى لتسهيل إدارة النشر.</p></div><Icon name="spark" size={21} /></article><article><span className="step-number">03</span><div><h3>انشر وراجع النتيجة</h3><p>استخدم النشر اليدوي أو الجدولة، وارجع إلى سجل العمليات عند الحاجة.</p></div><Icon name="history" size={21} /></article></div>
      </section>

      <section className="cta-section"><div className="cta-decoration" /><div><span className="section-kicker">مساحة عملك التالية تبدأ هنا</span><h2>خلّي إدارة المحتوى أكثر تنظيمًا.</h2><p>سجّل برمز الدعوة الخاص بفريقك وابدأ في إدارة المحتوى من لوحة واحدة.</p></div><Link href="/register" className="button button-light button-large">إنشاء حساب <Icon name="arrow" size={18} /></Link></section>

      <footer className="marketing-footer"><Link href="/" className="brand-link"><BrandLockup size={34} /></Link><span>© {new Date().getFullYear()} KEMEX-HUB. جميع الحقوق محفوظة.</span><div><Link href="/login">تسجيل الدخول</Link><Link href="/register">إنشاء حساب</Link></div></footer>
    </main>
  );
}
